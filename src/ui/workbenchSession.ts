import { type Accessor, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import {
	playBetaReductionMelody,
	playDropSound,
	playFailSound,
	playMoveSound,
	playPassSound,
	playPopExplosionSound,
	playSnapSound,
	playSplitSound,
	playUndoSound,
} from "../audio/synth";
import {
	type DraftTerm,
	countDraftSize,
	draftToTerm,
	findFirstHole,
	getScopeAt,
	setDraftAtPath,
} from "../engine/draft";
import { type Registry, registerGadget } from "../engine/gadget";
import { judgeOrder } from "../engine/judge";
import { PRINT_NAMES, printXRayTerm } from "../engine/parse";
import { type StepEvent, redexes, stepAt, stepLeftmost } from "../engine/reduce";
import { type GadgetId, type Path, type Term, termsEqual } from "../engine/term";
import { type BuildOrder, ORDERS, type OrderLevel, type RunOrder } from "../levels/orders";
import { ORDER_TOOLS, type ToolDefinition, getToolDefinition } from "../theme/world";
import type { RejectedInfo } from "./OrderSlip";

function playStepEventSound(event: StepEvent, stepCount: number): void {
	const count = event.kind === "beta" ? event.copies : event.copies.length > 0 ? event.copies[0] : 1;
	if (count === 0) playDropSound();
	else if (count >= 2) playSplitSound();
	else {
		playMoveSound();
		playBetaReductionMelody(stepCount);
	}
}

export interface WorkbenchSessionOptions {
	readonly order: Accessor<OrderLevel>;
	readonly registry: Registry;
	readonly gadgetNames: Accessor<ReadonlyMap<string, string>>;
	readonly judgeMode: Accessor<boolean>;
	readonly clearedStars: Accessor<ReadonlyMap<string, number>>;
	readonly onRecordStars: (orderId: string, stars: number) => void;
	readonly onUnlockCanonicalTool: (tool: ToolDefinition, def: Term) => void;
}

export interface WorkbenchSession {
	readonly draft: Accessor<DraftTerm>;
	readonly selectedPath: Accessor<Path | null>;
	readonly playTerm: Accessor<Term | null>;
	readonly tape: Accessor<readonly Term[]>;
	readonly tapeIndex: Accessor<number>;
	readonly activeRedexes: Accessor<readonly Path[]>;
	readonly isXRay: Accessor<boolean>;
	readonly xRayText: Accessor<string>;
	readonly shelfUnlockedIds: Accessor<readonly GadgetId[]>;
	readonly shelfLockedCount: Accessor<number>;
	readonly currentScope: Accessor<readonly string[]>;
	readonly rejected: Accessor<RejectedInfo | null>;
	readonly deliveredStars: Accessor<number | null>;
	readonly partCount: Accessor<number>;
	readonly runSteps: Accessor<number>;
	readonly runFailed: Accessor<boolean>;
	readonly canUndo: Accessor<boolean>;
	readonly hasHoles: Accessor<boolean>;
	readonly applyReplacement: (replacement: DraftTerm) => void;
	readonly dismantleAtPath: (path: Path) => void;
	readonly fillLam: () => void;
	readonly jumpToTapeIndex: (targetIndex: number) => void;
	readonly undo: () => void;
	readonly clearBench: () => void;
	readonly startOrStepPlay: () => void;
	readonly fastForwardPlay: () => void;
	readonly stepRedexAt: (path: Path) => void;
	readonly stopPlay: () => void;
	readonly toggleXRay: () => void;
	readonly selectHole: (path: Path) => void;
	readonly deliverOrder: () => void;
}

export function createWorkbenchSession(options: WorkbenchSessionOptions): WorkbenchSession {
	const [draft, setDraft] = createSignal<DraftTerm>({ kind: "hole" });
	const [selectedPath, setSelectedPath] = createSignal<Path | null>("");
	const [history, setHistory] = createSignal<readonly DraftTerm[]>([]);
	const [combo, setCombo] = createSignal<number>(0);
	const [rejected, setRejected] = createSignal<RejectedInfo | null>(null);
	const [deliveredStars, setDeliveredStars] = createSignal<number | null>(null);
	const [isXRay, setIsXRay] = createSignal<boolean>(false);
	const [playTerm, setPlayTerm] = createSignal<Term | null>(null);
	const [tape, setTape] = createSignal<readonly Term[]>([]);
	const [tapeIndex, setTapeIndex] = createSignal<number>(0);

	const currentScope = createMemo(() => (selectedPath() !== null ? getScopeAt(draft(), selectedPath() as Path) : []));
	const hasHoles = createMemo(() => findFirstHole(draft(), "") !== null);
	const partCount = createMemo(() => countDraftSize(draft()));
	const runSteps = createMemo(() => tapeIndex());
	const runFailed = createMemo(
		() =>
			options.order().mode === "run" &&
			deliveredStars() === null &&
			tapeIndex() >= (options.order() as RunOrder).stepBudget,
	);

	const shelfUnlockedIds = createMemo((): readonly GadgetId[] => {
		const order = options.order();
		if (order.mode !== "build") return [];
		const forbiddenSet = new Set(order.forbidden);
		const judgeAll = options.judgeMode();
		const currentOrderIndex = ORDERS.findIndex((item) => item.id === order.id);
		const rawCandidates =
			order.toolbox === "all"
				? [
						"I",
						"K",
						"S",
						...ORDER_TOOLS.filter((tool) => {
							if (tool.orderId === order.id || tool.id === order.id) return false;
							if (judgeAll || tool.orderId === null) return true;
							const toolOrderIndex = ORDERS.findIndex((item) => item.id === tool.orderId);
							return (
								(toolOrderIndex >= 0 && toolOrderIndex < currentOrderIndex) || options.clearedStars().has(tool.orderId)
							);
						}).map((tool) => tool.id),
					]
				: order.toolbox;
		const seen = new Set<string>();
		const unique: GadgetId[] = [];
		for (const id of rawCandidates) {
			if (forbiddenSet.has(id) || seen.has(id) || getToolDefinition(id) === null) continue;
			seen.add(id);
			unique.push(id);
		}
		return unique;
	});

	const shelfLockedCount = createMemo(() => {
		const order = options.order();
		return order.mode === "build" && (order as BuildOrder).toolbox === "all"
			? Math.max(0, ORDER_TOOLS.length - options.clearedStars().size)
			: 0;
	});

	const applyReplacement = (replacement: DraftTerm): void => {
		const path = selectedPath();
		if (path === null) return;
		playSnapSound(combo());
		setCombo(combo() + 1);
		setHistory([...history(), draft()]);
		const updated = setDraftAtPath(draft(), path, replacement);
		setDraft(updated);
		setSelectedPath(findFirstHole(updated, ""));
		setRejected(null);
		setDeliveredStars(null);
		setPlayTerm(null);
		setTape([]);
		setTapeIndex(0);
	};

	const dismantleAtPath = (path: Path): void => {
		playUndoSound();
		setCombo(0);
		setHistory([...history(), draft()]);
		setDraft(setDraftAtPath(draft(), path, { kind: "hole" }));
		setSelectedPath(path);
		setRejected(null);
		setDeliveredStars(null);
		setPlayTerm(null);
		setTape([]);
		setTapeIndex(0);
	};

	const fillLam = (): void => {
		const available = PRINT_NAMES.find((candidate) => !currentScope().includes(candidate));
		if (available !== undefined) applyReplacement({ kind: "lam", param: available, body: { kind: "hole" } });
	};

	const jumpToTapeIndex = (targetIndex: number): void => {
		const currentTape = tape();
		if (targetIndex < 0 || targetIndex >= currentTape.length) return;
		playMoveSound();
		setTapeIndex(targetIndex);
		setPlayTerm(currentTape[targetIndex]);
	};

	const undo = (): void => {
		if (options.order().mode === "run" || playTerm() !== null) {
			if (tapeIndex() > 0) jumpToTapeIndex(tapeIndex() - 1);
			return;
		}
		const past = history();
		if (past.length === 0) return;
		playUndoSound();
		setCombo(0);
		const previous = past[past.length - 1];
		setHistory(past.slice(0, past.length - 1));
		setDraft(previous);
		setSelectedPath(findFirstHole(previous, ""));
		setRejected(null);
		setDeliveredStars(null);
	};

	const clearBench = (): void => {
		playUndoSound();
		setCombo(0);
		const order = options.order();
		if (order.mode === "run") {
			setPlayTerm(order.initialTerm);
			setTape([order.initialTerm]);
			setTapeIndex(0);
			setDeliveredStars(null);
			return;
		}
		setDraft({ kind: "hole" });
		setSelectedPath("");
		setHistory([]);
		setRejected(null);
		setDeliveredStars(null);
		setPlayTerm(null);
		setTape([]);
		setTapeIndex(0);
	};

	const stepRedexAt = (path: Path): void => {
		const active = playTerm();
		if (active === null) return;
		const order = options.order();
		const stepped = stepAt(active, path, options.registry, "");
		if (stepped === null) return;
		playStepEventSound(stepped.event, tapeIndex() + 1);
		const updatedTape = [...tape().slice(0, tapeIndex() + 1), stepped.next];
		setTape(updatedTape);
		setTapeIndex(updatedTape.length - 1);
		setPlayTerm(stepped.next);
		if (order.mode === "run") {
			if (
				updatedTape.length - 1 <= order.stepBudget &&
				termsEqual(stepped.next, order.targetTerm) &&
				redexes(stepped.next, options.registry, "").length === 0
			) {
				playPassSound();
				setDeliveredStars(3);
				options.onRecordStars(order.id, 3);
			} else if (updatedTape.length - 1 >= order.stepBudget) playPopExplosionSound();
		}
	};

	const activeRedexes = createMemo(() =>
		playTerm() !== null ? redexes(playTerm() as Term, options.registry, "") : [],
	);

	const startOrStepPlay = (): void => {
		const order = options.order();
		if (order.mode === "run") {
			const paths = activeRedexes();
			if (paths.length > 0) stepRedexAt(paths[0]);
			return;
		}
		if (hasHoles()) return;
		const active = playTerm();
		if (active === null) {
			const applied = order.tests[0].args.reduce<Term>(
				(fn, arg) => ({ kind: "app", fn, arg }),
				draftToTerm(draft(), []),
			);
			playMoveSound();
			setPlayTerm(applied);
			setTape([applied]);
			setTapeIndex(0);
			return;
		}
		const stepped = stepLeftmost(active, options.registry, "");
		if (stepped === null) {
			playPassSound();
			return;
		}
		playStepEventSound(stepped.event, tapeIndex() + 1);
		const updatedTape = [...tape().slice(0, tapeIndex() + 1), stepped.next];
		setTape(updatedTape);
		setTapeIndex(updatedTape.length - 1);
		setPlayTerm(stepped.next);
	};

	const fastForwardPlay = (): void => {
		const order = options.order();
		if (order.mode === "run" || hasHoles()) return;
		let current =
			playTerm() !== null
				? (playTerm() as Term)
				: order.tests[0].args.reduce<Term>((fn, arg) => ({ kind: "app", fn, arg }), draftToTerm(draft(), []));
		const recorded = tape().length > 0 ? [...tape().slice(0, tapeIndex() + 1)] : [current];
		for (let step = 0; step < 80; step += 1) {
			const stepped = stepLeftmost(current, options.registry, "");
			if (stepped === null) break;
			current = stepped.next;
			recorded.push(current);
		}
		playSnapSound(4);
		setTape(recorded);
		setTapeIndex(recorded.length - 1);
		setPlayTerm(current);
	};

	const deliverOrder = (): void => {
		const order = options.order();
		if (order.mode !== "build" || hasHoles()) return;
		const candidate = draftToTerm(draft(), []);
		const results = judgeOrder(candidate, order.tests, options.registry, 300);
		const firstFailIndex = results.findIndex((item) => !item.passed);
		if (firstFailIndex >= 0) {
			playFailSound();
			setRejected({ testCase: order.tests[firstFailIndex], result: results[firstFailIndex] });
			return;
		}
		playPassSound();
		setRejected(null);
		const stars = partCount() <= order.parSize ? 3 : partCount() <= order.parSize + 2 ? 2 : 1;
		setDeliveredStars(stars);
		const canonicalTool = ORDER_TOOLS.find((tool) => tool.orderId === order.id);
		if (canonicalTool !== undefined && !options.registry.has(canonicalTool.id)) {
			registerGadget(options.registry, canonicalTool.id, candidate, "level");
			options.onUnlockCanonicalTool(canonicalTool, candidate);
		}
		options.onRecordStars(order.id, stars);
	};

	const xRayText = createMemo((): string => {
		try {
			return printXRayTerm(playTerm() !== null ? (playTerm() as Term) : draftToTerm(draft(), []), options.registry, 0);
		} catch {
			return "装置尚有空槽未填满";
		}
	});

	createEffect(() => {
		const order = options.order();
		setRejected(null);
		setDeliveredStars(null);
		setCombo(0);
		if (order.mode === "run") {
			setPlayTerm(order.initialTerm);
			setTape([order.initialTerm]);
			setTapeIndex(0);
		} else {
			setDraft({ kind: "hole" });
			setSelectedPath("");
			setHistory([]);
			setPlayTerm(null);
			setTape([]);
			setTapeIndex(0);
		}
	});

	const handleKeyDown = (event: KeyboardEvent): void => {
		if ((event.key === "z" || event.key === "Z") && (event.ctrlKey || !event.metaKey)) undo();
		if (event.key === "x" || event.key === "X") setIsXRay(!isXRay());
		if (event.key === " " && options.order().mode === "build") {
			event.preventDefault();
			startOrStepPlay();
		}
	};

	onMount(() => window.addEventListener("keydown", handleKeyDown));
	onCleanup(() => window.removeEventListener("keydown", handleKeyDown));

	return {
		draft,
		selectedPath,
		playTerm,
		tape,
		tapeIndex,
		activeRedexes,
		isXRay,
		xRayText,
		shelfUnlockedIds,
		shelfLockedCount,
		currentScope,
		rejected,
		deliveredStars,
		partCount,
		runSteps,
		runFailed,
		canUndo: () => (playTerm() !== null ? tapeIndex() > 0 : history().length > 0),
		hasHoles,
		applyReplacement,
		dismantleAtPath,
		fillLam,
		jumpToTapeIndex,
		undo,
		clearBench,
		startOrStepPlay,
		fastForwardPlay,
		stepRedexAt,
		stopPlay: () => {
			setPlayTerm(null);
			setTape([]);
			setTapeIndex(0);
		},
		toggleXRay: () => setIsXRay(!isXRay()),
		selectHole: (path: Path) => {
			playSnapSound(0);
			setSelectedPath(path);
		},
		deliverOrder,
	};
}
