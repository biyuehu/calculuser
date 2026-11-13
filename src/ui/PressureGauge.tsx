import { type JSX, Show, createMemo } from "solid-js";

interface PressureGaugeProps {
	readonly currentSteps: number;
	readonly maxBudget: number;
	readonly hasExploded: boolean;
	readonly onReset: () => void;
}

export function PressureGauge(props: PressureGaugeProps): JSX.Element {
	const ratio = createMemo(() => Math.min(1.2, props.currentSteps / Math.max(1, props.maxBudget)));

	return (
		<div class="pressure-gauge-container">
			<div
				class={`gauge-dial ${ratio() >= 0.75 && ratio() < 1 ? "warning" : ""} ${
					ratio() >= 1 || props.hasExploded ? "danger shaking" : ""
				}`}
				title={`步数消耗: ${props.currentSteps} / ${props.maxBudget}`}
			>
				<svg viewBox="0 0 100 65" class="gauge-svg">
					<title>步数压力表</title>
					<path d="M 15 55 A 40 40 0 0 1 85 55" fill="none" stroke="var(--border-subtle)" stroke-width="8" />
					<path
						d="M 15 55 A 40 40 0 0 1 50 15"
						fill="none"
						stroke="var(--accent-success)"
						stroke-width="8"
						stroke-dasharray="65"
						stroke-dashoffset="0"
					/>
					<path d="M 50 15 A 40 40 0 0 1 75 28" fill="none" stroke="var(--accent-warning)" stroke-width="8" />
					<path d="M 75 28 A 40 40 0 0 1 85 55" fill="none" stroke="var(--accent-danger)" stroke-width="8" />
					<circle cx="50" cy="55" r="5" fill="var(--text-primary)" />
					<line
						x1="50"
						y1="55"
						x2="50"
						y2="20"
						stroke="var(--accent-danger)"
						stroke-width="2.5"
						stroke-linecap="round"
						style={{
							transform: `rotate(${-120 + ratio() * 240}deg)`,
							"transform-origin": "50px 55px",
							transition: "transform 0.18s cubic-bezier(0.34, 1.3, 0.64, 1)",
						}}
					/>
				</svg>

				<div class="gauge-label">
					<span class="gauge-current">{props.currentSteps}</span>
					<span class="gauge-max">/{props.maxBudget} 步</span>
				</div>
			</div>

			<Show when={props.hasExploded}>
				<div class="explosion-banner">
					<div class="explosion-icon">💥</div>
					<div style={{ "font-size": "12px", "font-weight": 700, color: "var(--accent-danger)" }}>
						压力过载！机器冒烟了
					</div>
					<button type="button" class="order-badge-btn" onClick={props.onReset} style={{ "font-size": "11px" }}>
						清空冷却
					</button>
				</div>
			</Show>
		</div>
	);
}
