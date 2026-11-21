import { type Accessor, createMemo, createSignal } from "solid-js";
import { playSnapSound, playUndoSound } from "../audio/synth";
import { type DraftTerm, countDraftSize, findFirstHole, getScopeAt, setDraftAtPath } from "../engine/draft";
import { PRINT_NAMES } from "../engine/parse";
import { clearLevelDraft, saveLevelDraft } from "../engine/storage";
import type { Path } from "../engine/term";

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
	readonly currentScope: Accessor<readonly string[]>;
	readonly hasHoles: Accessor<boolean>;
	readonly partCount: Accessor<number>;
	readonly canUndoDraft: Accessor<boolean>;
	readonly applyReplacement: (replacement: DraftTerm) => void;
	readonly dismantleAtPath: (path: Path) => void;
	readonly fillLam: () => void;
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
		const available = PRINT_NAMES.find((candidate) => !currentScope().includes(candidate));
		if (available !== void 0) applyReplacement({ kind: "lam", param: available, body: { kind: "hole" } });
	};

	const selectHole = (path: Path): void => {
		playSnapSound(0);
		setSelectedPath(path);
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
		applyReplacement,
		dismantleAtPath,
		fillLam,
		selectHole,
		undoDraft,
		clearBenchDraft,
		loadDraft,
		flushDraft: draftSaver.flush,
	};
}
