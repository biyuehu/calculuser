import { For, type JSX, Show, createEffect, createSignal } from "solid-js";
import {
	type ChoiceBranch,
	type DialogueBeat,
	type DialogueFace,
	type DialogueLine,
	type DialogueSpeaker,
	type TextLine,
	isChoicesLine,
} from "../../content";
import { useKeyScope } from "../../utils/keybus";

interface CounterViewProps {
	readonly beat?: DialogueBeat;
	readonly autoSkipRead: boolean;
	readonly onToggleAutoSkipRead: () => void;
	readonly onComplete: () => void;
	readonly onSkip: () => void;
}

const SPEAKER_NAMES: Record<DialogueSpeaker, string> = {
	me: "我",
	church: "小丘",
	guest: "工坊来客",
	master: "老师傅的旧信件",
};

const CHARACTER_STANDEES: Partial<Record<DialogueSpeaker, Partial<Record<DialogueFace, string>>>> = {
	church: {
		default: "/characters/church_default.png",
		happy: "/characters/church_happy.png",
		wow: "/characters/church_wow.png",
	},
	guest: {
		default: "/characters/guest_default.svg",
	},
	master: {
		default: "/characters/master_default.svg",
	},
};

const PRELOAD_STANDEES = [
	"/characters/church_default.png",
	"/characters/church_happy.png",
	"/characters/church_wow.png",
	"/characters/guest_default.svg",
	"/characters/master_default.svg",
] as const;

if (typeof window !== "undefined")
	for (const src of PRELOAD_STANDEES) {
		const img = new Image();
		img.src = src;
	}

interface VisibleStandee {
	readonly speaker: DialogueSpeaker;
	readonly face: DialogueFace;
	readonly src: string;
}

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

	const currentStandee = (): VisibleStandee | null => {
		let visible: VisibleStandee | null = null;
		let speaker: DialogueSpeaker = "me";
		let face: DialogueFace = "default";
		const lines = activeLines().slice(0, lineIndex() + 1);
		for (const line of lines) {
			if (isChoicesLine(line)) continue;
			if (line.speaker !== void 0) speaker = line.speaker;
			if (line.face !== void 0) face = line.face;
			const standees = CHARACTER_STANDEES[speaker];
			if (standees !== void 0) {
				const src = standees[face] ?? standees.default;
				if (src !== void 0) visible = { speaker, face, src };
			} else if (speaker !== "me") {
				visible = null;
			}
		}
		return visible;
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
			data-speaker={currentSpeaker()}
			onClick={handleAdvance}
			onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && handleAdvance()}
		>
			<div class="counter-grid-overlay" aria-hidden="true" />
			<div class="counter-window-arch" aria-hidden="true">
				<div class="counter-window-mullion-v" />
				<div class="counter-window-mullion-h" />
			</div>
			<div class="counter-sunbeam counter-sunbeam-a" aria-hidden="true" />
			<div class="counter-sunbeam counter-sunbeam-b" aria-hidden="true" />
			<div class="counter-backdrop-glow" aria-hidden="true" />
			<svg class="counter-astrolabe" viewBox="0 0 400 400" fill="none" aria-hidden="true">
				<g class="counter-ring-outer">
					<circle cx="200" cy="200" r="184" stroke="currentColor" stroke-width="1.2" stroke-dasharray="6 10" />
					<circle cx="200" cy="200" r="168" stroke="currentColor" stroke-width="1" opacity="0.55" />
					<path d="M200 10 V24 M200 376 V390 M10 200 H24 M376 200 H390" stroke="currentColor" stroke-width="2" />
				</g>
				<g class="counter-ring-inner">
					<circle cx="200" cy="200" r="136" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 8" />
					<circle cx="200" cy="200" r="112" stroke="currentColor" stroke-width="0.9" opacity="0.45" />
				</g>
			</svg>
			<div class="counter-float-symbols" aria-hidden="true">
				<span class="counter-symbol s1">λ</span>
				<span class="counter-symbol s2">→</span>
				<span class="counter-symbol s3">S</span>
				<span class="counter-symbol s4">K</span>
				<span class="counter-symbol s5">Y</span>
				<span class="counter-mote m1" />
				<span class="counter-mote m2" />
				<span class="counter-mote m3" />
				<span class="counter-mote m4" />
			</div>

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
						<Show when={props.beat !== void 0 ? props.beat.title : void 0}>
							{(title) => <div class="dialogue-scene-title">{title()}</div>}
						</Show>
						<Show when={currentStandee()}>
							{(standee) => (
								<div class={`avatar-standee avatar-${standee().face}`}>
									<img
										src={standee().src}
										alt={SPEAKER_NAMES[standee().speaker]}
										class="standee-image"
										draggable={false}
									/>
								</div>
							)}
						</Show>

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
