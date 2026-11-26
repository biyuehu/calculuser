import { type Accessor, createMemo, createSignal } from "solid-js";
import { playFailSound, playSnapSound, playUndoSound } from "../audio/synth";
import { unlockAchievement } from "../content";
import {
	type DraftTerm,
	PRINT_NAMES,
	type Path,
	type Ty,
	countDraftSize,
	findAllHoles,
	findFirstHole,
	getDraftAtPath,
	getScopeAt,
	setDraftAtPath,
} from "../engine";
import { clearLevelDraft, saveLevelDraft } from "../storage";

const createDebouncedDraftSaver = (
	delayMs: number,
): {
	readonly schedule: (orderId: string, draft: DraftTerm) => void;
	readonly flush: () => void;
} => {
	let timer: ReturnType<typeof setTimeout> | null = null;
	let pendingOrderId: string | null = null;
	let pendingDraft: DraftTerm | null = null;
	const flush = (): void => {
		if (timer !== null && pendingOrderId !== null && pendingDraft !== null) {
			clearTimeout(timer);
			saveLevelDraft(pendingOrderId, pendingDraft);
			timer = null;
			pendingOrderId = null;
			pendingDraft = null;
		}
	};
	return {
		schedule: (orderId: string, draft: DraftTerm): void => {
			pendingOrderId = orderId;
			pendingDraft = draft;
			if (timer !== null) clearTimeout(timer);
			timer = setTimeout(flush, delayMs);
		},
		flush,
	};
};

interface UseDraftWorkbenchOptions {
	readonly orderId: Accessor<string>;
	readonly onDraftMutated?: () => void;
}

interface DraftWorkbench {
	readonly draft: Accessor<DraftTerm>;
	readonly selectedPath: Accessor<Path | null>;
	readonly currentScope: Accessor<readonly (typeof PRINT_NAMES)[number][]>;
	readonly hasHoles: Accessor<boolean>;
	readonly partCount: Accessor<number>;
	readonly canUndoDraft: Accessor<boolean>;
	readonly draftNotice: Accessor<string | null>;
	readonly applyReplacement: (replacement: DraftTerm) => void;
	readonly dismantleAtPath: (path: Path) => void;
	readonly dismantleSelected: () => void;
	readonly cycleHoleFocus: (direction: "left" | "right") => void;
	readonly fillLam: () => void;
	readonly updateLamTypeAtPath: (path: Path, ty?: Ty) => void;
	readonly selectHole: (path: Path) => void;
	readonly undoDraft: () => void;
	readonly clearBenchDraft: () => void;
	readonly loadDraft: (initialDraft: DraftTerm) => void;
	readonly flushDraft: () => void;
}

export function useDraftWorkbench(options: UseDraftWorkbenchOptions): DraftWorkbench {
	const draftSaver = createDebouncedDraftSaver(200);
	const [draft, setDraft] = createSignal<DraftTerm>({ kind: "hole" });
	const [selectedPath, setSelectedPath] = createSignal<Path | null>("");
	const [history, setHistory] = createSignal<readonly DraftTerm[]>([]);
	const [combo, setCombo] = createSignal<number>(0);
	const [draftNotice, setDraftNotice] = createSignal<string | null>(null);
	let noticeTimer: ReturnType<typeof setTimeout> | null = null;

	const showNotice = (message: string): void => {
		if (noticeTimer !== null) clearTimeout(noticeTimer);
		setDraftNotice(message);
		noticeTimer = setTimeout(() => {
			setDraftNotice(null);
			noticeTimer = null;
		}, 2600);
	};

	const currentScope = createMemo(() => {
		const path = selectedPath();
		return path !== null ? getScopeAt(draft(), path) : [];
	});
	const hasHoles = createMemo(() => findFirstHole(draft(), "") !== null);
	const partCount = createMemo(() => countDraftSize(draft()));
	const canUndoDraft = createMemo(() => history().length > 0);

	const applyReplacement = (replacement: DraftTerm): void => {
		const path = selectedPath();
		if (path === null) return;
		playSnapSound(combo());
		setCombo(combo() + 1);
		setHistory([...history(), draft()]);
		const updated = setDraftAtPath(draft(), path, replacement);
		setDraft(updated);
		setSelectedPath(findFirstHole(updated, ""));
		draftSaver.schedule(options.orderId(), updated);
		options.onDraftMutated?.();
	};

	const dismantleAtPath = (path: Path): void => {
		playUndoSound();
		setCombo(0);
		setHistory([...history(), draft()]);
		const updated = setDraftAtPath(draft(), path, { kind: "hole" });
		setDraft(updated);
		setSelectedPath(path);
		draftSaver.schedule(options.orderId(), updated);
		options.onDraftMutated?.();
	};

	const fillLam = (): void => {
		const f = () => ((_) => showNotice(`已达到最大插槽深度限制（${PRINT_NAMES.length} 层）`))(playFailSound());
		if (currentScope().length >= PRINT_NAMES.length) {
			f();
			unlockAchievement("max_lam_depth");
			return;
		}
		const available = PRINT_NAMES.find((candidate) => !currentScope().includes(candidate));
		if (available === void 0) {
			f();
			unlockAchievement("max_lam_depth");
			return;
		}
		applyReplacement({ kind: "lam", param: available, body: { kind: "hole" } });
	};

	const updateLamTypeAtPath = (path: Path, ty?: Ty): void => {
		const node = getDraftAtPath(draft(), path);
		if (node?.kind !== "lam") return;
		playSnapSound(0);
		setHistory([...history(), draft()]);
		const updated = setDraftAtPath(draft(), path, { ...node, ty });
		setDraft(updated);
		draftSaver.schedule(options.orderId(), updated);
		options.onDraftMutated?.();
	};

	const selectHole = (path: Path): void => {
		playSnapSound(0);
		setSelectedPath(path);
	};

	const cycleHoleFocus = (direction: "left" | "right"): void => {
		const holes = findAllHoles(draft(), "");
		if (holes.length === 0) return;
		const current = selectedPath();
		const currentIndex = current !== null ? holes.indexOf(current) : -1;
		const nextIndex =
			direction === "right"
				? currentIndex < 0
					? 0
					: (currentIndex + 1) % holes.length
				: currentIndex <= 0
					? holes.length - 1
					: currentIndex - 1;
		selectHole(holes[nextIndex]);
	};

	const dismantleSelected = (): void => {
		const current = selectedPath();
		if (current === null) {
			if (draft().kind !== "hole") dismantleAtPath("");
			return;
		}
		const node = getDraftAtPath(draft(), current);
		if (node === null || node.kind === "hole") {
			if (current.length > 0) dismantleAtPath(current.slice(0, -1));
			else if (draft().kind !== "hole") dismantleAtPath("");
			return;
		}
		dismantleAtPath(current);
	};

	const undoDraft = (): void => {
		const past = history();
		if (past.length === 0) return;
		playUndoSound();
		setCombo(0);
		const previous = past[past.length - 1];
		setHistory(past.slice(0, past.length - 1));
		setDraft(previous);
		setSelectedPath(findFirstHole(previous, ""));
		draftSaver.schedule(options.orderId(), previous);
		options.onDraftMutated?.();
	};

	const clearBenchDraft = (): void => {
		playUndoSound();
		setCombo(0);
		clearLevelDraft(options.orderId());
		setDraft({ kind: "hole" });
		setSelectedPath("");
		setHistory([]);
		options.onDraftMutated?.();
	};

	const loadDraft = (initialDraft: DraftTerm): void => {
		setDraft(initialDraft);
		setSelectedPath(findFirstHole(initialDraft, ""));
		setHistory([]);
		setCombo(0);
	};

	return {
		draft,
		selectedPath,
		currentScope,
		hasHoles,
		partCount,
		canUndoDraft,
		draftNotice,
		applyReplacement,
		dismantleAtPath,
		dismantleSelected,
		cycleHoleFocus,
		fillLam,
		updateLamTypeAtPath,
		selectHole,
		undoDraft,
		clearBenchDraft,
		loadDraft,
		flushDraft: draftSaver.flush,
	};
}
