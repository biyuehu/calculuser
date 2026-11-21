import { type Accessor, createMemo, createSignal } from "solid-js";
import { playFailSound, playPassSound, playPopExplosionSound } from "../audio/synth";
import { BUILTIN_COUNT, COMBINATORS, type OrderLevel, getToolDefinition, isToolUnlocked } from "../content";
import { type DraftTerm, draftToTerm, findFirstHole } from "../engine/draft";
import type { Registry } from "../engine/gadget";
import { judgeOrder } from "../engine/judge";
import type { GadgetId } from "../engine/term";
import type { RejectedInfo } from "../ui/workbench/panels/OrderSlip";

const JUDGE_MAX_STEPS = 300;

interface UseOrderDeliveryOptions {
	readonly order: Accessor<OrderLevel>;
	readonly registry: Registry;
	readonly judgeMode: Accessor<boolean>;
	readonly clearedStars: Accessor<ReadonlyMap<string, number>>;
	readonly onRecordStars: (orderId: string, stars: number) => void;
}

interface OrderDelivery {
	readonly rejected: Accessor<RejectedInfo | null>;
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
	const [deliveredStars, setDeliveredStars] = createSignal<number | null>(null);

	const shelfUnlockedIds = createMemo((): readonly GadgetId[] => {
		const stars = options.clearedStars();
		const isJudge = options.judgeMode();
		const order = options.order();
		if (order.mode !== "build") return [];
		const forbiddenSet = new Set(order.forbidden);
		return Array.from(options.registry.keys()).filter(
			(id) =>
				!forbiddenSet.has(id) &&
				id !== order.unlocksToolId &&
				getToolDefinition(id) !== null &&
				isToolUnlocked(id, stars, isJudge),
		);
	});

	const shelfLockedCount = createMemo((): number => {
		const stars = options.clearedStars();
		const isJudge = options.judgeMode();
		const order = options.order();
		return order.mode === "build"
			? COMBINATORS.slice(BUILTIN_COUNT).filter(
					(tool) =>
						!options.registry.has(tool.id) &&
						tool.id !== order.unlocksToolId &&
						!isToolUnlocked(tool.id, stars, isJudge),
				).length
			: 0;
	});

	const deliverBuildOrder = (draft: DraftTerm, partCount: number): void => {
		const order = options.order();
		if (order.mode !== "build") return;
		const candidate = draftToTerm(draft, []);
		const results = judgeOrder(candidate, order.tests, options.registry, JUDGE_MAX_STEPS);
		const firstFailIndex = results.findIndex((item) => !item.passed);
		if (firstFailIndex >= 0) {
			playFailSound();
			setRejected({ testCase: order.tests[firstFailIndex], result: results[firstFailIndex] });
			return;
		}
		playPassSound();
		setRejected(null);
		const stars = partCount <= order.parSize ? 3 : partCount <= order.parSize + 2 ? 2 : 1;
		setDeliveredStars(stars);
		options.onRecordStars(order.id, stars);
	};

	const evaluateDraftPassed = (draft: DraftTerm): boolean => {
		const order = options.order();
		return (
			order.mode === "build" &&
			findFirstHole(draft, "") === null &&
			judgeOrder(draftToTerm(draft, []), order.tests, options.registry, JUDGE_MAX_STEPS).every((item) => item.passed)
		);
	};

	const syncInitialDelivery = (initialDraft: DraftTerm, recordedStars?: number): void => {
		setRejected(null);
		setDeliveredStars(recordedStars !== void 0 && evaluateDraftPassed(initialDraft) ? recordedStars : null);
	};

	const deliverRunSuccess = (): void => {
		playPassSound();
		setDeliveredStars(3);
		options.onRecordStars(options.order().id, 3);
	};

	const deliverRunExceeded = (): void => {
		playPopExplosionSound();
	};

	const resetDelivery = (): void => {
		setRejected(null);
		setDeliveredStars(null);
	};

	return {
		rejected,
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
