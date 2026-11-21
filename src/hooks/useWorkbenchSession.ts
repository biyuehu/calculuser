import { type Accessor, createEffect, createMemo, onCleanup, onMount } from "solid-js";
import type { OrderLevel } from "../content";
import { type DraftTerm, draftToTerm } from "../engine/draft";
import type { Registry } from "../engine/gadget";
import { printXRayTerm } from "../engine/parse";
import type { PRINT_NAMES } from "../engine/parse";
import { loadLevelDrafts } from "../engine/storage";
import type { GadgetId, Path, Term } from "../engine/term";
import type { RejectedInfo } from "../ui/workbench/panels/OrderSlip";
import { useDraftWorkbench } from "./useDraftWorkbench";
import { useOrderDelivery } from "./useOrderDelivery";
import { useTapePlayback } from "./useTapePlayback";

interface WorkbenchSessionOptions {
	readonly order: Accessor<OrderLevel>;
	readonly registry: Registry;
	readonly judgeMode: Accessor<boolean>;
	readonly clearedStars: Accessor<ReadonlyMap<string, number>>;
	readonly onRecordStars: (orderId: string, stars: number) => void;
	readonly xRayMode: Accessor<boolean>;
	readonly onToggleXRay: () => void;
}

interface WorkbenchSession {
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
	readonly currentScope: Accessor<readonly (typeof PRINT_NAMES)[number][]>;
	readonly rejected: Accessor<RejectedInfo | null>;
	readonly deliveredStars: Accessor<number | null>;
	readonly partCount: Accessor<number>;
	readonly runSteps: Accessor<number>;
	readonly runFailed: Accessor<boolean>;
	readonly canUndo: Accessor<boolean>;
	readonly draftNotice: Accessor<string | null>;
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

export function useWorkbenchSession(options: WorkbenchSessionOptions): WorkbenchSession {
	const delivery = useOrderDelivery({
		order: options.order,
		registry: options.registry,
		judgeMode: options.judgeMode,
		clearedStars: options.clearedStars,
		onRecordStars: options.onRecordStars,
	});

	const draftBench = useDraftWorkbench({
		orderId: () => options.order().id,
		onDraftMutated: () => {
			delivery.resetDelivery();
			tapePlay.stopPlay();
		},
	});

	const getExecutableTerm = (): Term | null => {
		if (draftBench.hasHoles()) return null;
		const order = options.order();
		if (order.mode !== "build") return null;
		return order.tests[0].args.reduce<Term>(
			(fn, arg) => ({ kind: "app", fn, arg }),
			draftToTerm(draftBench.draft(), []),
		);
	};

	const tapePlay = useTapePlayback({
		order: options.order,
		registry: options.registry,
		getExecutableTerm,
		onRunPass: () => delivery.deliverRunSuccess(),
		onRunExceeded: () => delivery.deliverRunExceeded(),
	});

	const runFailed = createMemo(() => {
		const order = options.order();
		return order.mode === "run" && delivery.deliveredStars() === null && tapePlay.tapeIndex() >= order.stepBudget;
	});

	const undo = (): void => {
		if (options.order().mode === "run" || tapePlay.playTerm() !== null) {
			tapePlay.undoTape();
			return;
		}
		draftBench.undoDraft();
	};

	const clearBench = (): void => {
		const order = options.order();
		if (order.mode === "run") {
			tapePlay.resetTape(order.initialTerm);
			delivery.resetDelivery();
			return;
		}
		draftBench.clearBenchDraft();
	};

	const deliverOrder = (): void => {
		if (draftBench.hasHoles()) return;
		delivery.deliverBuildOrder(draftBench.draft(), draftBench.partCount());
		draftBench.flushDraft();
	};

	const xRayText = createMemo((): string => {
		try {
			const term = tapePlay.playTerm();
			return printXRayTerm(term !== null ? term : draftToTerm(draftBench.draft(), []), options.registry);
		} catch {
			return "装置尚有空槽未填满";
		}
	});

	createEffect(() => {
		draftBench.flushDraft();
		const order = options.order();
		const stars = options.clearedStars().get(order.id);
		delivery.resetDelivery();
		if (order.mode === "run") {
			tapePlay.resetTape(order.initialTerm);
			return;
		}
		const initialDraft = loadLevelDrafts()[order.id] ?? { kind: "hole" };
		draftBench.loadDraft(initialDraft);
		tapePlay.stopPlay();
		delivery.syncInitialDelivery(initialDraft, stars);
	});

	const handleKeyDown = (event: KeyboardEvent): void => {
		if ((event.key === "z" || event.key === "Z") && (event.ctrlKey || !event.metaKey)) undo();
		if (event.key === "x" || event.key === "X") options.onToggleXRay();
		if (event.key === " " && options.order().mode === "build") {
			event.preventDefault();
			tapePlay.startOrStepPlay();
		}
	};

	onMount(() => {
		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("beforeunload", draftBench.flushDraft);
	});
	onCleanup(() => {
		window.removeEventListener("keydown", handleKeyDown);
		window.removeEventListener("beforeunload", draftBench.flushDraft);
		draftBench.flushDraft();
	});

	return {
		draft: draftBench.draft,
		selectedPath: draftBench.selectedPath,
		playTerm: tapePlay.playTerm,
		tape: tapePlay.tape,
		tapeIndex: tapePlay.tapeIndex,
		activeRedexes: tapePlay.activeRedexes,
		isXRay: options.xRayMode,
		xRayText,
		shelfUnlockedIds: delivery.shelfUnlockedIds,
		shelfLockedCount: delivery.shelfLockedCount,
		currentScope: draftBench.currentScope,
		rejected: delivery.rejected,
		deliveredStars: delivery.deliveredStars,
		partCount: draftBench.partCount,
		runSteps: tapePlay.runSteps,
		runFailed,
		draftNotice: draftBench.draftNotice,
		canUndo: () => (tapePlay.playTerm() !== null ? tapePlay.canUndoTape() : draftBench.canUndoDraft()),
		hasHoles: draftBench.hasHoles,
		applyReplacement: draftBench.applyReplacement,
		dismantleAtPath: draftBench.dismantleAtPath,
		fillLam: draftBench.fillLam,
		jumpToTapeIndex: tapePlay.jumpToTapeIndex,
		undo,
		clearBench,
		startOrStepPlay: tapePlay.startOrStepPlay,
		fastForwardPlay: tapePlay.fastForwardPlay,
		stepRedexAt: tapePlay.stepRedexAt,
		stopPlay: tapePlay.stopPlay,
		toggleXRay: options.onToggleXRay,
		selectHole: draftBench.selectHole,
		deliverOrder,
	};
}
