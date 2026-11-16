import { type JSX, Show, createEffect, createSignal } from "solid-js";
import type { DialogueBeat, DialogueFace, DialogueLine, DialogueSpeaker } from "../../content/dialogue";

interface CounterViewProps {
	readonly beat: DialogueBeat | null;
	readonly autoSkipRead: boolean;
	readonly onToggleAutoSkipRead: () => void;
	readonly onComplete: () => void;
	readonly onSkip: () => void;
}

const SPEAKER_NAMES: Record<DialogueSpeaker, string> = {
	hen: "小恒 · 助手机械臂",
	guest: "工坊来客",
	master: "老师傅的旧信件",
};

export function CounterView(props: CounterViewProps): JSX.Element {
	const [lineIndex, setLineIndex] = createSignal<number>(0);
	const [charCount, setCharCount] = createSignal<number>(0);

	createEffect(() => {
		const beat = props.beat;
		if (beat === null) return;
		setLineIndex(0);
		setCharCount(0);
	});

	const currentLineRaw = (): string | DialogueLine => {
		const beat = props.beat;
		if (beat === null) return "";
		return beat.lines[lineIndex()] ?? "";
	};

	const currentText = (): string => {
		const raw = currentLineRaw();
		return typeof raw === "string" ? raw : raw.text;
	};

	const currentSpeaker = (): DialogueSpeaker => {
		const raw = currentLineRaw();
		const beat = props.beat;
		return typeof raw !== "string" && raw.speaker !== void 0 ? raw.speaker : beat !== null ? beat.speaker : "hen";
	};

	const currentFace = (): DialogueFace => {
		const raw = currentLineRaw();
		const beat = props.beat;
		return typeof raw !== "string" && raw.face !== void 0 ? raw.face : beat !== null ? beat.face : "default";
	};

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

	const handleAdvance = (): void => {
		const text = currentText();
		if (charCount() < text.length) {
			setCharCount(text.length);
			return;
		}
		const beat = props.beat;
		if (beat === null) return;
		if (lineIndex() + 1 < beat.lines.length) setLineIndex(lineIndex() + 1);
		else props.onComplete();
	};

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

							<p class="dialogue-text">
								{currentText().slice(0, charCount())}
								<Show when={charCount() < currentText().length}>
									<span class="dialogue-cursor">▎</span>
								</Show>
							</p>

							<footer class="dialogue-footer">
								<span class="dialogue-prompt-hint">
									{charCount() < currentText().length ? "点击补全" : "点击继续 ▸"}
								</span>
							</footer>
						</div>
					</>
				)}
			</Show>
		</div>
	);
}
