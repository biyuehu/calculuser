import { type JSX, createEffect, createSignal, onCleanup } from "solid-js";
import { playMoveSound, playSnapSound } from "../../audio/synth";
import { useKeyScope } from "../../utils/keybus";

interface PrologueMonologueProps {
	readonly lines: readonly string[];
	readonly reducedMotion: boolean;
	readonly onComplete: () => void;
}

export function PrologueMonologue(props: PrologueMonologueProps): JSX.Element {
	const [lineIndex, setLineIndex] = createSignal<number>(0);
	const [charCount, setCharCount] = createSignal<number>(0);
	const [exiting, setExiting] = createSignal<boolean>(false);

	const currentLine = (): string => props.lines[lineIndex()] ?? "";

	createEffect(() => {
		const text = currentLine();
		if (props.reducedMotion) {
			setCharCount(text.length);
			return;
		}
		setCharCount(0);
		const timer = window.setInterval(() => {
			setCharCount((prev) => {
				if (prev >= text.length) {
					window.clearInterval(timer);
					return prev;
				}
				return prev + 1;
			});
		}, 75);
		onCleanup(() => window.clearInterval(timer));
	});

	const finish = (): void => {
		if (exiting()) return;
		if (props.reducedMotion) {
			props.onComplete();
			return;
		}
		setExiting(true);
		window.setTimeout(props.onComplete, 320);
	};

	const advance = (): void => {
		if (exiting()) return;
		const text = currentLine();
		if (charCount() < text.length) {
			setCharCount(text.length);
			return;
		}
		if (lineIndex() < props.lines.length - 1) {
			playMoveSound();
			setLineIndex((i) => i + 1);
			return;
		}
		playSnapSound(2);
		finish();
	};

	useKeyScope({
		id: "prologue-monologue",
		level: "modal",
		bindings: [
			{ key: [" ", "Enter"], handle: advance },
			{ key: "Escape", handle: finish },
		],
	});

	return (
		<div
			class={`prologue-monologue-overlay ${exiting() ? "prologue-exiting" : ""}`}
			onClick={advance}
			onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && advance()}
		>
			<button
				type="button"
				class="dialogue-skip-btn prologue-skip-btn"
				onClick={(event) => {
					event.stopPropagation();
					finish();
				}}
			>
				跳过 ⏭
			</button>

			<div class="prologue-monologue-center">
				<p class="prologue-monologue-text">
					{currentLine().slice(0, charCount())}
					<span class="dialogue-cursor">▎</span>
				</p>
				<span class="prologue-monologue-hint">
					{charCount() < currentLine().length
						? "点击或按 Space 显示全句"
						: lineIndex() < props.lines.length - 1
							? "点击或按 Space 继续 ▸"
							: "点击或按 Space 推开工作台大门 ▸"}
				</span>
			</div>
		</div>
	);
}
