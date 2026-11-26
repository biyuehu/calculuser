import { type Accessor, createMemo, createSignal } from "solid-js";
import { playFailSound, playPassSound, playPopExplosionSound } from "../audio/synth";
import {
	BUILTIN_COUNT,
	COMBINATORS,
	LEVELS,
	type OrderLevel,
	getOrderUnlockedTools,
	isToolAvailableForOrder,
	unlockAchievement,
} from "../content";
import {
	type DraftTerm,
	type GadgetId,
	type Registry,
	type Term,
	checkTypeBuild,
	draftToTerm,
	findFirstHole,
	judgeNormalize,
	judgeOrder,
} from "../engine";
import { loadSettings } from "../storage";
import type { RejectedInfo } from "../ui/workbench/panels/OrderSlip";

const JUDGE_MAX_STEPS = 300;

const ORDER_ACHIEVEMENTS: Readonly<Record<string, string>> = {
	build_s: "ch2_self_s",
	pair: "ch3_product_pair",
	tb_either_right: "ch4_sum_types",
	pred: "ch5_church_pred",
	tree_sum: "ch6_tree_fold",
	fix_y: "ch7_fixpoint_y",
	rec_fib: "turing_complete",
};

function collectUsedGadgets(term: Term): readonly GadgetId[] {
	switch (term.kind) {
		case "var":
		case "atom":
			return [];
		case "gad":
			return [term.id];
		case "lam":
		case "ann":
			return collectUsedGadgets(term.kind === "lam" ? term.body : term.term);
		case "app":
			return [...collectUsedGadgets(term.fn), ...collectUsedGadgets(term.arg)];
	}
}

function termHasLam(term: Term): boolean {
	switch (term.kind) {
		case "lam":
			return true;
		case "ann":
			return termHasLam(term.term);
		case "app":
			return termHasLam(term.fn) || termHasLam(term.arg);
		default:
			return false;
	}
}

interface UseOrderDeliveryOptions {
	readonly order: Accessor<OrderLevel>;
	readonly registry: Registry;
	readonly judgeMode: Accessor<boolean>;
	readonly clearedStars: Accessor<ReadonlyMap<string, number>>;
	readonly onRecordStars: (orderId: string, stars: number) => void;
	readonly xRayMode: Accessor<boolean>;
}

interface OrderDelivery {
	readonly rejected: Accessor<RejectedInfo | null>;
	readonly typeError: Accessor<string | null>;
	readonly deliveredStars: Accessor<number | null>;
	readonly shelfUnlockedIds: Accessor<readonly GadgetId[]>;
	readonly shelfLockedCount: Accessor<number>;
	readonly deliverBuildOrder: (draft: DraftTerm, partCount: number) => void;
	readonly deliverRunSuccess: () => void;
	readonly deliverRunExceeded: () => void;
	readonly resetDelivery: () => void;
	readonly setDeliveredStars: (stars: number | null) => void;
	readonly syncInitialDelivery: (initialDraft: DraftTerm, recordedStars?: number) => void;
}

export function useOrderDelivery(options: UseOrderDeliveryOptions): OrderDelivery {
	const [rejected, setRejected] = createSignal<RejectedInfo | null>(null);
	const [typeError, setTypeError] = createSignal<string | null>(null);
	const [deliveredStars, setDeliveredStars] = createSignal<number | null>(null);
	let triedNonEmptyUninhabited = false;

	const recordOrderClear = (order: OrderLevel, stars: number): void => {
		setDeliveredStars(stars);
		options.onRecordStars(order.id, stars);
		unlockAchievement("first_order");
		if (order.id === "identity" && stars === 1) unlockAchievement("one_star_identity");
		if (options.xRayMode()) unlockAchievement("xray_inspector");
		const audioSettings = loadSettings();
		if (audioSettings.volume === 0 && audioSettings.bgmVolume === 0) unlockAchievement("silent_craft");
		const orderAchievement = ORDER_ACHIEVEMENTS[order.id];
		if (orderAchievement !== void 0) unlockAchievement(orderAchievement);
		const clearedIds = new Set(options.clearedStars().keys());
		clearedIds.add(order.id);
		if (LEVELS.every((lvl) => clearedIds.has(lvl.id))) unlockAchievement("all_orders_cleared");
		const unlockedTools = new Set<string>(["I", "K", "S"]);
		for (const lvl of LEVELS)
			if (clearedIds.has(lvl.id)) for (const id of getOrderUnlockedTools(lvl)) unlockedTools.add(id);
		if (COMBINATORS.every((tool) => unlockedTools.has(tool.id))) unlockAchievement("full_compendium");
	};

	const shelfUnlockedIds = createMemo((): readonly GadgetId[] => {
		const stars = options.clearedStars();
		const isJudge = options.judgeMode();
		const order = options.order();
		if (order.mode === "sandbox") return COMBINATORS.map((tool) => tool.id);
		if (order.mode !== "build") return [];
		const forbiddenSet = new Set(order.forbidden);
		return COMBINATORS.filter(
			(tool) => !forbiddenSet.has(tool.id) && isToolAvailableForOrder(tool.id, order.id, stars, isJudge),
		).map((tool) => tool.id);
	});

	const shelfLockedCount = createMemo((): number => {
		const stars = options.clearedStars();
		const isJudge = options.judgeMode();
		const order = options.order();
		if (order.mode !== "build") return 0;
		const currentIdx = LEVELS.findIndex((item) => item.id === order.id);
		return COMBINATORS.slice(BUILTIN_COUNT).filter((tool) => {
			const sourceIdx = LEVELS.findIndex((item) => getOrderUnlockedTools(item).includes(tool.id));
			return sourceIdx >= 0 && sourceIdx < currentIdx && !isToolAvailableForOrder(tool.id, order.id, stars, isJudge);
		}).length;
	});

	const deliverBuildOrder = (draft: DraftTerm, partCount: number): void => {
		const order = options.order();
		if (order.mode === "build") {
			const candidate = draftToTerm(draft, []);
			const results = judgeOrder(candidate, order.tests, options.registry, JUDGE_MAX_STEPS);
			const firstFailIndex = results.findIndex((item) => !item.passed);
			if (firstFailIndex >= 0) {
				playFailSound();
				if (results.some((item) => !item.terminated)) unlockAchievement("omega_paradox");
				setRejected({ testCase: order.tests[firstFailIndex], result: results[firstFailIndex] });
				return;
			}
			playPassSound();
			setRejected(null);
			const stars = partCount <= order.parSize ? 3 : partCount <= order.parSize + 2 ? 2 : 1;
			recordOrderClear(order, stars);
			if (partCount < order.parSize) unlockAchievement("code_golf");
			const usedGadgets = collectUsedGadgets(candidate);
			if ((order.chapter ?? 1) >= 2 && usedGadgets.length === 0) unlockAchievement("pure_lambda");
			else if ((order.chapter ?? 1) >= 2 && usedGadgets.every((id) => id === "I" || id === "K" || id === "S")) {
				unlockAchievement("ski_purist");
				if (!termHasLam(candidate) && usedGadgets.every((id) => id === "S" || id === "K"))
					unlockAchievement("sk_purist");
			}
			if (usedGadgets.some((id) => id === "Y" || id === "Z" || id === "Theta")) unlockAchievement("fixpoint_tamer");
			return;
		}
		if (order.mode === "typebuild") {
			if (order.uninhabited === true && draft.kind === "hole") {
				playPassSound();
				setTypeError(null);
				recordOrderClear(order, 3);
				unlockAchievement("uninhabited_proof");
				if (triedNonEmptyUninhabited) unlockAchievement("stubborn_prover");
				return;
			}
			try {
				const candidate = draftToTerm(draft, []);
				checkTypeBuild(candidate, order.targetTy, options.registry);
				const norm = judgeNormalize(candidate, options.registry, JUDGE_MAX_STEPS);
				if (!norm.terminated) {
					playFailSound();
					unlockAchievement("omega_paradox");
					setTypeError("求值超时或产生发散循环");
					return;
				}
				playPassSound();
				setTypeError(null);
				const stars = partCount <= order.parSize ? 3 : partCount <= order.parSize + 2 ? 2 : 1;
				recordOrderClear(order, stars);
				if (partCount < order.parSize) unlockAchievement("code_golf");
				unlockAchievement("first_typebuild");
			} catch (err) {
				playFailSound();
				if (order.uninhabited === true) triedNonEmptyUninhabited = true;
				setTypeError(err instanceof Error ? err.message : String(err));
			}
		}
	};

	const evaluateDraftPassed = (draft: DraftTerm): boolean => {
		const order = options.order();
		if (order.mode === "typebuild" && order.uninhabited === true && draft.kind === "hole") return true;
		if (findFirstHole(draft, "") !== null) return false;
		if (order.mode === "build") {
			return judgeOrder(draftToTerm(draft, []), order.tests, options.registry, JUDGE_MAX_STEPS).every(
				(item) => item.passed,
			);
		}
		if (order.mode === "typebuild") {
			try {
				checkTypeBuild(draftToTerm(draft, []), order.targetTy, options.registry);
				return true;
			} catch {
				return false;
			}
		}
		return false;
	};

	const syncInitialDelivery = (initialDraft: DraftTerm, recordedStars?: number): void => {
		triedNonEmptyUninhabited = false;
		setRejected(null);
		setTypeError(null);
		setDeliveredStars(recordedStars !== void 0 && evaluateDraftPassed(initialDraft) ? recordedStars : null);
	};

	const deliverRunSuccess = (): void => {
		playPassSound();
		recordOrderClear(options.order(), 3);
	};

	const deliverRunExceeded = (): void => {
		playPopExplosionSound();
	};

	const resetDelivery = (): void => {
		setRejected(null);
		setTypeError(null);
		setDeliveredStars(null);
	};

	return {
		rejected,
		typeError,
		deliveredStars,
		shelfUnlockedIds,
		shelfLockedCount,
		deliverBuildOrder,
		deliverRunSuccess,
		deliverRunExceeded,
		resetDelivery,
		setDeliveredStars,
		syncInitialDelivery,
	};
}
