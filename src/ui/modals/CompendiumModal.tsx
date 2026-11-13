import type { JSX } from "solid-js";
import { For, Show } from "solid-js";
import { CHAPTERS, type OrderLevel, getGadgetMeta } from "../../content";
import type { Registry } from "../../engine/gadget";

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
						{props.mode === "compendium" ? "工坊图鉴 · 已收录装置" : "委托地图 · 分章订单"}
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
												{meta.symbol}
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
					<div style={{ display: "flex", "flex-direction": "column", gap: "12px" }}>
						<For each={CHAPTERS}>
							{(chapterInfo) => (
								<div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
									<div class="chapter-section-title">{chapterInfo.title}</div>
									<div class="compendium-grid">
										<For each={chapterInfo.levels}>
											{(order) => {
												const index = props.orders.findIndex((item) => item.id === order.id);
												const stars = () => props.clearedStars.get(order.id);
												return (
													<button
														type="button"
														class="compendium-cell"
														style={{
															"text-align": "left",
															cursor: "pointer",
															"border-color":
																index === props.currentOrderIndex ? "var(--accent-clay)" : "var(--border-subtle)",
														}}
														onClick={() => {
															props.onSelectOrder(index);
															props.onClose();
														}}
													>
														<div
															style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}
														>
															<span
																style={{ "font-size": "12.5px", "font-weight": "700", color: "var(--text-primary)" }}
															>
																{order.title}
															</span>
															<span style={{ color: "#d97706", "font-size": "11px" }}>
																{stars() !== undefined ? "★".repeat(stars() as number) : ""}
															</span>
														</div>
														<span style={{ "font-size": "11px", color: "var(--text-muted)" }}>
															{order.mode === "run" ? `预算 ${order.stepBudget} 步` : `标准 ${order.parSize} 件`}
														</span>
													</button>
												);
											}}
										</For>
									</div>
								</div>
							)}
						</For>
					</div>
				</Show>
			</div>
		</div>
	);
}
