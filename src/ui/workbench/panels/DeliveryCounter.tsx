import { For, type JSX, Show } from "solid-js";
import { getGadgetMeta } from "../../../content";

interface DeliveryCounterProps {
	readonly mode: "build" | "run";
	readonly canDeliver: boolean;
	readonly delivered: boolean;
	readonly stars: number;
	readonly countValue: number;
	readonly targetValue: number;
	readonly note: string;
	readonly isLastOrder: boolean;
	readonly rejected: boolean;
	readonly unlocksToolId: string | null;
	readonly onDeliver: () => void;
	readonly onNextOrder: () => void;
}

export function DeliveryCounter(props: DeliveryCounterProps): JSX.Element {
	return (
		<section
			class={`delivery-counter ${!props.canDeliver && !props.delivered ? "disabled" : ""} ${
				props.delivered ? "delivered" : ""
			} ${props.rejected ? "rejected" : ""}`}
			onClick={() => {
				if (props.canDeliver && !props.delivered && props.mode === "build") props.onDeliver();
			}}
			onKeyDown={(event) => {
				if (event.key === "Enter" && props.canDeliver && !props.delivered && props.mode === "build") props.onDeliver();
			}}
		>
			<Show when={props.delivered}>
				<div class="stamp-seal stamp-passed">合格 · 交付</div>
			</Show>
			<Show when={props.rejected}>
				<div class="stamp-seal stamp-rejected">退货 · 拒收</div>
			</Show>

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
							{props.mode === "run" ? "达标后自动停机" : `当前零件 ${props.countValue} / 标准 ${props.targetValue}`}
						</span>
					</>
				}
			>
				<div class="star-row">
					<For each={[1, 2, 3]}>
						{(starIdx) => (
							<span
								class={`star-item ${starIdx <= props.stars ? "earned" : "empty"}`}
								style={{ "animation-delay": `${(starIdx - 1) * 90 + 80}ms` }}
							>
								{starIdx <= props.stars ? "★" : "☆"}
							</span>
						)}
					</For>
				</div>
				<span class="delivery-title-ok">
					{props.mode === "run"
						? `运转成功！（共 ${props.countValue} 步）`
						: `客人满意收货！（${props.countValue} 件）`}
				</span>
				<span style={{ "font-size": "11.5px", color: "var(--text-secondary)", "text-align": "center" }}>
					{props.note}
				</span>
				<Show when={props.unlocksToolId !== null ? props.unlocksToolId : null}>
					{(toolId) => {
						const meta = getGadgetMeta(toolId());
						return (
							<div class="unlock-reward-tag">
								<span
									class={`gadget-glyph ${meta.shape}`}
									style={{ background: meta.accent, width: "16px", height: "16px", "font-size": "9.5px" }}
								>
									{meta.symbol}
								</span>
								<span>零件【{meta.name}】已入库</span>
							</div>
						);
					}}
				</Show>
				<Show when={!props.isLastOrder}>
					<button
						type="button"
						class="icon-btn active next-order-btn"
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
