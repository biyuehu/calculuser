import { type Accessor, createMemo, createSignal } from "solid-js";
import {
	playBetaReductionMelody,
	playDropSound,
	playMoveSound,
	playPassSound,
	playSnapSound,
	playSplitSound,
} from "../audio/synth";
import type { OrderLevel } from "../content";
import type { Registry } from "../engine/gadget";
import { type StepEvent, redexes, stepAt, stepLeftmost } from "../engine/reduce";
import { type Path, type Term, termsEqual } from "../engine/term";

function playStepEventSound(event: StepEvent, stepCount: number): void {
	const count = event.kind === "beta" ? event.copies : event.copies.length > 0 ? event.copies[0] : 1;
	if (count === 0) playDropSound();
	else if (count >= 2) playSplitSound();
	else {
		playMoveSound();
		playBetaReductionMelody(stepCount);
	}
}

interface UseTapePlaybackOptions {
	readonly order: Accessor<OrderLevel>;
	readonly registry: Registry;
	readonly getExecutableTerm: () => Term | null;
	readonly onRunPass?: (stepped: Term, updatedTape: readonly Term[]) => void;
	readonly onRunExceeded?: () => void;
}

interface TapePlayback {
	readonly playTerm: Accessor<Term | null>;
	readonly tape: Accessor<readonly Term[]>;
	readonly tapeIndex: Accessor<number>;
	readonly activeRedexes: Accessor<readonly Path[]>;
	readonly runSteps: Accessor<number>;
	readonly canUndoTape: Accessor<boolean>;
	readonly jumpToTapeIndex: (targetIndex: number) => void;
	readonly stepRedexAt: (path: Path) => void;
	readonly startOrStepPlay: () => void;
	readonly fastForwardPlay: () => void;
	readonly stopPlay: () => void;
	readonly resetTape: (initialTerm: Term | null) => void;
	readonly undoTape: () => void;
}

export function useTapePlayback(options: UseTapePlaybackOptions): TapePlayback {
	const [playTerm, setPlayTerm] = createSignal<Term | null>(null);
	const [tape, setTape] = createSignal<readonly Term[]>([]);
	const [tapeIndex, setTapeIndex] = createSignal<number>(0);

	const activeRedexes = createMemo(() => {
		const term = playTerm();
		return term !== null ? redexes(term, options.registry, "") : [];
	});
	const runSteps = createMemo(() => tapeIndex());
	const canUndoTape = createMemo(() => tapeIndex() > 0);

	const jumpToTapeIndex = (targetIndex: number): void => {
		const currentTape = tape();
		if (targetIndex < 0 || targetIndex >= currentTape.length) return;
		playMoveSound();
		setTapeIndex(targetIndex);
		setPlayTerm(currentTape[targetIndex]);
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
			)
				options.onRunPass?.(stepped.next, updatedTape);
			else if (updatedTape.length - 1 >= order.stepBudget) options.onRunExceeded?.();
		}
	};

	const startOrStepPlay = (): void => {
		const order = options.order();
		if (order.mode === "run") {
			const paths = activeRedexes();
			if (paths.length > 0) stepRedexAt(paths[0]);
			return;
		}
		const active = playTerm();
		if (active === null) {
			const executable = options.getExecutableTerm();
			if (executable === null) return;
			playMoveSound();
			setPlayTerm(executable);
			setTape([executable]);
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
		if (order.mode === "run") return;
		const term = playTerm();
		let current = term !== null ? term : options.getExecutableTerm();
		if (current === null) return;
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

	const stopPlay = (): void => {
		setPlayTerm(null);
		setTape([]);
		setTapeIndex(0);
	};

	const resetTape = (initialTerm: Term | null): void => {
		setPlayTerm(initialTerm);
		setTape(initialTerm !== null ? [initialTerm] : []);
		setTapeIndex(0);
	};

	const undoTape = (): void => {
		if (tapeIndex() > 0) jumpToTapeIndex(tapeIndex() - 1);
	};

	return {
		playTerm,
		tape,
		tapeIndex,
		activeRedexes,
		runSteps,
		canUndoTape,
		jumpToTapeIndex,
		stepRedexAt,
		startOrStepPlay,
		fastForwardPlay,
		stopPlay,
		resetTape,
		undoTape,
	};
}
