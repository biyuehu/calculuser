import type { JSX } from "solid-js";
import { Show } from "solid-js";

export interface DeliveryCounterProps {
	readonly mode: "build" | "run";
	readonly canDeliver: boolean;
	readonly delivered: boolean;
	readonly stars: number;
	readonly countValue: number;
	readonly targetValue: number;
	readonly note: string;
	readonly isLastOrder: boolean;
	readonly onDeliver: () => void;
	readonly onNextOrder: () => void;
}

export function DeliveryCounter(props: DeliveryCounterProps): JSX.Element {
	return (
		<section
			class={`delivery-counter ${!props.canDeliver && !props.delivered ? "disabled" : ""} ${props.delivered ? "delivered" : ""}`}
			onClick={() => {
				if (props.canDeliver && !props.delivered && props.mode === "build") props.onDeliver();
			}}
			onKeyDown={(event) => {
				if (event.key === "Enter" && props.canDeliver && !props.delivered && props.mode === "build") props.onDeliver();
			}}
		>
			<Show
				when={props.delivered}
				fallback={
					<>
						<span style={{ "font-size": "22px" }}>{props.mode === "run" ? "⚡" : "📦"}</span>
						<span style={{ "font-size": "13px", "font-weight": "600", color: "var(--accent-clay)" }}>
							{props.mode === "run"
								? "点击桌面发光连接进行运转"
								: props.canDeliver
									? "交货台（点击验货）"
									: "先填满工作台空槽"}
						</span>
						<span style={{ "font-size": "11px", color: "var(--text-muted)" }}>
							{props.mode === "run"
								? `已用步数 ${props.countValue} / 预算 ${props.targetValue}`
								: `当前零件 ${props.countValue} / 标准 ${props.targetValue}`}
						</span>
					</>
				}
			>
				<div class="star-row">
					{"★".repeat(props.stars)}
					{"☆".repeat(3 - props.stars)}
				</div>
				<span class="delivery-title-ok">
					{props.mode === "run"
						? `运转成功！（共 ${props.countValue} 步）`
						: `客人满意收货！（${props.countValue} 件）`}
				</span>
				<span style={{ "font-size": "11.5px", color: "var(--text-secondary)", "text-align": "center" }}>
					{props.note}
				</span>
				<Show when={!props.isLastOrder}>
					<button
						type="button"
						class="icon-btn active"
						style={{ "margin-top": "4px" }}
						onClick={(event) => {
							event.stopPropagation();
							props.onNextOrder();
						}}
					>
						接下一单 →
					</button>
				</Show>
			</Show>
		</section>
	);
}
