import type { JSX } from "solid-js";
import { For, Show } from "solid-js";
import type { Registry } from "../engine/gadget";
import type { OrderLevel } from "../levels/orders";
import { getGadgetMeta } from "../theme/world";

const CHAPTER_TITLES: ReadonlyArray<{ readonly chapter: number; readonly label: string }> = [
	{ chapter: 1, label: "第一章 · 工坊启蒙" },
	{ chapter: 2, label: "第二章 · 运转掌控与进阶" },
	{ chapter: 3, label: "第三章 · 数据类型" },
	{ chapter: 4, label: "第四章 · 数字与列表" },
];

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
						<For each={CHAPTER_TITLES}>
							{(chapterInfo) => (
								<div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
									<div class="chapter-section-title">{chapterInfo.label}</div>
									<div class="compendium-grid">
										<For
											each={props.orders
												.map((order, index) => ({ order, index }))
												.filter((entry) => entry.order.chapter === chapterInfo.chapter)}
										>
											{(entry) => {
												const stars = () => props.clearedStars.get(entry.order.id);
												return (
													<button
														type="button"
														class="compendium-cell"
														style={{
															"text-align": "left",
															cursor: "pointer",
															"border-color":
																entry.index === props.currentOrderIndex ? "var(--accent-clay)" : "var(--border-subtle)",
														}}
														onClick={() => {
															props.onSelectOrder(entry.index);
															props.onClose();
														}}
													>
														<div
															style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}
														>
															<span
																style={{ "font-size": "12.5px", "font-weight": "700", color: "var(--text-primary)" }}
															>
																{entry.order.title}
															</span>
															<span style={{ color: "#d97706", "font-size": "11px" }}>
																{stars() !== undefined ? "★".repeat(stars() as number) : ""}
															</span>
														</div>
														<span style={{ "font-size": "11px", color: "var(--text-muted)" }}>
															{entry.order.mode === "run"
																? `预算 ${entry.order.stepBudget} 步`
																: `标准 ${entry.order.parSize} 件`}
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
