import type { JSX } from "solid-js";
import { Show } from "solid-js";

export interface DeliveryCounterProps {
	readonly canDeliver: boolean;
	readonly delivered: boolean;
	readonly stars: number;
	readonly partCount: number;
	readonly parSize: number;
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
				if (props.canDeliver && !props.delivered) props.onDeliver();
			}}
			onKeyDown={(event) => {
				if (event.key === "Enter" && props.canDeliver && !props.delivered) props.onDeliver();
			}}
		>
			<Show
				when={props.delivered}
				fallback={
					<>
						<span style={{ "font-size": "22px" }}>📦</span>
						<span style={{ "font-size": "13px", "font-weight": "600", color: "var(--accent-clay)" }}>
							{props.canDeliver ? "交货台（点击验货）" : "先填满工作台空槽"}
						</span>
						<span style={{ "font-size": "11px", color: "var(--text-muted)" }}>
							当前零件 {props.partCount} / 标准 {props.parSize}
						</span>
					</>
				}
			>
				<div class="star-row">
					{"★".repeat(props.stars)}
					{"☆".repeat(3 - props.stars)}
				</div>
				<span class="delivery-title-ok">客人满意收货！（{props.partCount} 件）</span>
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
