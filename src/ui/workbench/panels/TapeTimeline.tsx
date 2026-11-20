import { For, type JSX } from "solid-js";

interface TapeTimelineProps {
	readonly currentIndex: number;
	readonly totalSteps: number;
	readonly onJumpToStep: (index: number) => void;
	readonly onStepBack: () => void;
	readonly onStepForward: () => void;
	readonly onRewind: () => void;
}

export function TapeTimeline(props: TapeTimelineProps): JSX.Element {
	return (
		<div class="tape-timeline-container">
			<div class="tape-controls">
				<button
					type="button"
					class="tape-btn"
					onClick={props.onRewind}
					disabled={props.currentIndex <= 0}
					title="倒带到初始状态"
				>
					|◀
				</button>
				<button
					type="button"
					class="tape-btn"
					onClick={props.onStepBack}
					disabled={props.currentIndex <= 0}
					title="后退一步"
				>
					◀
				</button>
				<div class="tape-counter">
					<span>步数</span>
					<strong>{props.currentIndex}</strong>
					<span style={{ color: "var(--text-muted)" }}>/ {props.totalSteps}</span>
				</div>
				<button
					type="button"
					class="tape-btn"
					onClick={props.onStepForward}
					disabled={props.currentIndex >= props.totalSteps}
					title="单步推进"
				>
					▶
				</button>
			</div>

			<div class="tape-strip">
				<div class="tape-track">
					<For each={Array.from({ length: props.totalSteps + 1 }, (_, index) => index)}>
						{(stepIndex) => (
							<button
								type="button"
								class={`tape-tick ${stepIndex === props.currentIndex ? "current" : ""} ${
									stepIndex <= props.currentIndex ? "past" : ""
								}`}
								onClick={() => props.onJumpToStep(stepIndex)}
								title={`跳转到第 ${stepIndex} 步`}
							>
								<span class="tick-line" />
								<span class="tick-num">{stepIndex}</span>
							</button>
						)}
					</For>
				</div>
			</div>
		</div>
	);
}
