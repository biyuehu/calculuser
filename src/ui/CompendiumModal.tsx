import type { JSX } from "solid-js";
import { For, Show } from "solid-js";
import type { Registry } from "../engine/gadget";
import type { OrderLevel } from "../levels/orders";
import { getGadgetMeta } from "../theme/world";

export interface CompendiumModalProps {
	readonly mode: "compendium" | "map";
	readonly orders: readonly OrderLevel[];
	readonly currentOrderIndex: number;
	readonly clearedStars: ReadonlyMap<string, number>;
	readonly registry: Registry;
	readonly gadgetNames: ReadonlyMap<string, string>;
	readonly onSelectOrder: (index: number) => void;
	readonly onClose: () => void;
}

export function CompendiumModal(props: CompendiumModalProps): JSX.Element {
	return (
		<div
			class="modal-backdrop"
			onClick={props.onClose}
			onKeyDown={(event) => {
				if (event.key === "Escape") props.onClose();
			}}
		>
			<div
				class="modal-card"
				onClick={(event) => event.stopPropagation()}
				onKeyDown={(event) => event.stopPropagation()}
			>
				<div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
					<span style={{ "font-size": "16px", "font-weight": "700" }}>
						{props.mode === "compendium" ? "工坊图鉴 · 已收录装置" : "委托地图 · 全部订单"}
					</span>
					<button type="button" class="icon-btn" onClick={props.onClose}>
						关闭
					</button>
				</div>

				<Show when={props.mode === "compendium"}>
					<div class="compendium-grid">
						<For each={[...props.registry.values()]}>
							{(gadget) => {
								const customName = props.gadgetNames.get(gadget.id);
								const meta = getGadgetMeta(
									gadget.id,
									customName !== undefined ? customName : gadget.id,
									gadget.fingerprint,
								);
								return (
									<div class="compendium-cell">
										<div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
											<span class={`gadget-glyph ${meta.shape}`} style={{ background: meta.accent }}>
												{gadget.id.length <= 2 ? gadget.id : "★"}
											</span>
											<span style={{ "font-size": "13px", "font-weight": "700" }}>{meta.name}</span>
										</div>
										<span style={{ "font-size": "11.5px", color: "var(--text-secondary)", "line-height": "1.4" }}>
											{meta.note}
										</span>
									</div>
								);
							}}
						</For>
					</div>
				</Show>

				<Show when={props.mode === "map"}>
					<div class="compendium-grid">
						<For each={props.orders}>
							{(order, index) => {
								const stars = () => props.clearedStars.get(order.id);
								return (
									<button
										type="button"
										class="compendium-cell"
										style={{
											"text-align": "left",
											cursor: "pointer",
											"border-color":
												index() === props.currentOrderIndex ? "var(--accent-clay)" : "var(--border-subtle)",
										}}
										onClick={() => {
											props.onSelectOrder(index());
											props.onClose();
										}}
									>
										<div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
											<span style={{ "font-size": "13px", "font-weight": "700", color: "var(--text-primary)" }}>
												{index() + 1}. {order.title}
											</span>
											<span style={{ color: "#fbbf24", "font-size": "11px" }}>
												{stars() !== undefined ? "★".repeat(stars() as number) : ""}
											</span>
										</div>
										<span style={{ "font-size": "11px", color: "var(--text-muted)" }}>标准 {order.parSize} 件</span>
									</button>
								);
							}}
						</For>
					</div>
				</Show>
			</div>
		</div>
	);
}
