import { For, type JSX, Show, createEffect, createSignal } from "solid-js";
import {
	type ChoiceBranch,
	type DialogueBeat,
	type DialogueFace,
	type DialogueLine,
	type DialogueSpeaker,
	type TextLine,
	isChoicesLine,
} from "../../content/dialogue";
import { useKeyScope } from "../keybus";

interface CounterViewProps {
	readonly beat?: DialogueBeat;
	readonly autoSkipRead: boolean;
	readonly onToggleAutoSkipRead: () => void;
	readonly onComplete: () => void;
	readonly onSkip: () => void;
}

const SPEAKER_NAMES: Record<DialogueSpeaker, string> = {
	me: "我",
	hen: "小恒 · 助手机械臂",
	guest: "工坊来客",
	master: "老师傅的旧信件",
};

export function CounterView(props: CounterViewProps): JSX.Element {
	const [activeLines, setActiveLines] = createSignal<readonly DialogueLine[]>([]);
	const [lineIndex, setLineIndex] = createSignal<number>(0);
	const [charCount, setCharCount] = createSignal<number>(0);

	createEffect(() => {
		const beat = props.beat;
		if (beat === void 0) return;
		setActiveLines(beat.lines);
		setLineIndex(0);
		setCharCount(0);
	});

	const currentLine = (): DialogueLine => activeLines()[lineIndex()] ?? { text: "" };

	const lastTextLine = (): TextLine | null => {
		const lines = activeLines().slice(0, lineIndex() + 1);
		for (let i = lines.length - 1; i >= 0; i--) {
			const line = lines[i];
			if (!isChoicesLine(line)) return line;
		}
		return null;
	};

	const currentText = (): string => {
		const line = currentLine();
		if (!isChoicesLine(line)) return line.text;
		const prev = lastTextLine();
		return prev === null ? "" : prev.text;
	};

	const currentChoices = (): readonly [string, ChoiceBranch][] => {
		const line = currentLine();
		return isChoicesLine(line) ? line.choices : [];
	};

	const currentSpeaker = (): DialogueSpeaker =>
		activeLines()
			.slice(0, lineIndex() + 1)
			.reduce<DialogueSpeaker>(
				(prev, cur) => (!isChoicesLine(cur) && cur.speaker !== void 0 ? cur.speaker : prev),
				"me",
			);

	const currentFace = (): DialogueFace =>
		activeLines()
			.slice(0, lineIndex() + 1)
			.reduce<DialogueFace>(
				(prev, cur) => (!isChoicesLine(cur) ? (cur.face ?? (cur.speaker !== void 0 ? "default" : prev)) : prev),
				"default",
			);

	createEffect(() => {
		const text = currentText();
		setCharCount(0);
		if (!text) return;
		const timer = setInterval(() => {
			setCharCount((prev) => {
				if (prev >= text.length) {
					clearInterval(timer);
					return prev;
				}
				return prev + 1;
			});
		}, 32);
		return () => clearInterval(timer);
	});

	const chooseBranch = (branch: ChoiceBranch): void => {
		const branchLines = Array.isArray(branch) ? branch : [branch];
		const index = lineIndex();
		const nextLines = [...activeLines().slice(0, index), ...branchLines, ...activeLines().slice(index + 1)];
		setActiveLines(nextLines);
		setCharCount(0);
		if (branchLines.length === 0 && index >= nextLines.length) props.onComplete();
	};

	const handleAdvance = (): void => {
		if (isChoicesLine(currentLine())) return;
		const text = currentText();
		if (charCount() < text.length) {
			setCharCount(text.length);
			return;
		}
		if (lineIndex() + 1 < activeLines().length) setLineIndex(lineIndex() + 1);
		else props.onComplete();
	};

	useKeyScope({
		id: "counter-dialogue",
		level: "modal",
		active: () => props.beat !== void 0,
		bindings: [
			{ key: [" ", "Enter"], handle: handleAdvance },
			{ key: "Escape", handle: props.onSkip },
			{
				predicate: (event) => /^[1-9]$/.test(event.key) && isChoicesLine(currentLine()),
				handle: (event) => {
					const index = Number.parseInt(event.key, 10) - 1;
					const choices = currentChoices();
					if (index >= 0 && index < choices.length) chooseBranch(choices[index][1]);
				},
			},
		],
	});

	return (
		<div
			class="counter-scene"
			onClick={handleAdvance}
			onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && handleAdvance()}
		>
			<div class="counter-backdrop-glow" />

			<div class="counter-desk">
				<div class="counter-desk-wood">
					<div class="counter-wood-grain" />
					<div class="counter-station-tray">
						<span class="counter-brass-plaque">接待台 · 验货窗</span>
					</div>
				</div>
			</div>

			<Show when={props.beat}>
				{(_) => (
					<>
						<div class={`avatar-standee avatar-${currentFace()}`}>
							<div class="avatar-head">
								<div class="avatar-eye-left" />
								<div class="avatar-eye-right" />
								<div class={`avatar-mouth ${charCount() < currentText().length ? "talking" : ""}`} />
							</div>
							<div class="avatar-body-shape">
								<span class="avatar-sigil">λ</span>
							</div>
						</div>

						<div
							class="dialogue-box"
							onClick={(event) => {
								event.stopPropagation();
								handleAdvance();
							}}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.stopPropagation();
									handleAdvance();
								}
							}}
						>
							<header class="dialogue-header">
								<div class="dialogue-speaker-pill">
									<span class="dialogue-speaker-dot" />
									<span>{SPEAKER_NAMES[currentSpeaker()]}</span>
								</div>
								<div class="dialogue-header-actions">
									<button
										type="button"
										class={`dialogue-skip-btn ${props.autoSkipRead ? "active" : ""}`}
										onClick={(event) => {
											event.stopPropagation();
											props.onToggleAutoSkipRead();
										}}
									>
										{props.autoSkipRead ? "自动跳过已读 · 开" : "自动跳过已读 · 关"}
									</button>
									<button
										type="button"
										class="dialogue-skip-btn"
										onClick={(event) => {
											event.stopPropagation();
											props.onSkip();
										}}
									>
										跳过 ⏭
									</button>
								</div>
							</header>

							<Show when={isChoicesLine(currentLine())}>
								<div class="dialogue-choices-floating">
									<For each={currentChoices()}>
										{([label, branch], idx) => (
											<button
												type="button"
												class="dialogue-choice-btn"
												onClick={(event) => {
													event.stopPropagation();
													chooseBranch(branch);
												}}
											>
												<span class="dialogue-choice-badge">{(idx() + 1).toString().padStart(2, "0")}</span>
												<span class="dialogue-choice-text">{label}</span>
												<span class="dialogue-choice-arrow">▸</span>
											</button>
										)}
									</For>
								</div>
							</Show>

							<p class="dialogue-text">
								{currentText().slice(0, isChoicesLine(currentLine()) ? currentText().length : charCount())}
								<Show when={!isChoicesLine(currentLine()) && charCount() < currentText().length}>
									<span class="dialogue-cursor">▎</span>
								</Show>
							</p>

							<footer class="dialogue-footer">
								<span class="dialogue-prompt-hint">
									{isChoicesLine(currentLine())
										? "请在上方选择回应"
										: charCount() < currentText().length
											? "点击补全"
											: "点击继续 ▸"}
								</span>
							</footer>
						</div>
					</>
				)}
			</Show>
		</div>
	);
}
