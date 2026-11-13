import { For, type JSX, Show, createSignal } from "solid-js";
import type { Registry } from "../engine/gadget";
import { printTerm } from "../engine/parse";
import type { OrderLevel } from "../levels/orders";
import { BUILTIN_TOOLS, MONSTER_LIST, ORDER_TOOLS, getGadgetMeta } from "../theme/world";

interface WorkshopOverviewProps {
	readonly orders: readonly OrderLevel[];
	readonly currentOrderIndex: number;
	readonly clearedStars: ReadonlyMap<string, number>;
	readonly registry: Registry;
	readonly gadgetNames: ReadonlyMap<string, string>;
	readonly judgeMode: boolean;
	readonly origin: "title" | "workbench";
	readonly onBack: () => void;
	readonly onSelectOrder: (index: number) => void;
}

const CHAPTER_TITLES: readonly { readonly chapter: number; readonly title: string }[] = [
	{ chapter: 1, title: "第一章 · 合成" },
	{ chapter: 2, title: "第二章 · 图纸台" },
	{ chapter: 3, title: "第三章 · 逻辑与布尔" },
	{ chapter: 4, title: "第四章 · 递归与时钟" },
];

export function WorkshopOverview(props: WorkshopOverviewProps): JSX.Element {
	const [activeTab, setActiveTab] = createSignal<"orders" | "parts">("orders");

	const isUnlocked = (index: number): boolean =>
		props.judgeMode || index === 0 || props.clearedStars.has(props.orders[index - 1].id);

	const continueIndex = (): number =>
		Math.max(
			0,
			props.orders.findIndex((order) => !props.clearedStars.has(order.id)),
		);

	const continueCode = (): string => {
		const order = props.orders[continueIndex()];
		return `${order.chapter}.${
			props.orders.filter((item) => item.chapter === order.chapter).findIndex((item) => item.id === order.id) + 1
		}`;
	};

	return (
		<div class="workshop-overview-container">
			<header class="top-bar">
				<button type="button" class="icon-btn" onClick={props.onBack}>
					<span>←</span>
					<span>{props.origin === "workbench" ? "返回工作台" : "返回主界面"}</span>
				</button>

				<div style={{ display: "flex", gap: "6px" }}>
					<button
						type="button"
						class={`icon-btn ${activeTab() === "orders" ? "active" : ""}`}
						onClick={() => setActiveTab("orders")}
					>
						<span>▦</span>
						<span>订单</span>
					</button>
					<button
						type="button"
						class={`icon-btn ${activeTab() === "parts" ? "active" : ""}`}
						onClick={() => setActiveTab("parts")}
					>
						<span>⚙</span>
						<span>零件</span>
					</button>
				</div>

				<button type="button" class="order-badge-btn" onClick={() => props.onSelectOrder(continueIndex())}>
					<span>▶</span>
					<span>继续 {continueCode()}</span>
				</button>
			</header>

			<main class="overview-body">
				<Show when={activeTab() === "orders"}>
					<div class="overview-chapters-list">
						<For each={CHAPTER_TITLES}>
							{(chapterInfo) => {
								const chapterOrders = props.orders
									.map((order, globalIndex) => ({ order, globalIndex }))
									.filter((item) => item.order.chapter === chapterInfo.chapter);
								return (
									<div class="chapter-block">
										<h3 class="chapter-title">{chapterInfo.title}</h3>
										<div class="orders-card-row">
											<For each={chapterOrders}>
												{({ order, globalIndex }, localIndex) => {
													const code = `${order.chapter}.${localIndex() + 1}`;
													const stars = props.clearedStars.get(order.id);
													const unlocked = isUnlocked(globalIndex);
													return (
														<button
															type="button"
															disabled={!unlocked}
															class={`order-card-cell ${stars !== undefined ? "ok" : ""} ${
																unlocked && stars === undefined ? "available" : ""
															} ${!unlocked ? "locked" : ""} ${
																localIndex() === chapterOrders.length - 1 && chapterOrders.length > 3 ? "boss" : ""
															} ${globalIndex === props.currentOrderIndex ? "current" : ""}`}
															onClick={() => props.onSelectOrder(globalIndex)}
															title={`${code} ${order.title}`}
														>
															<span class="card-code">{code}</span>
															{(() => {
																if (!unlocked) return <span class="card-icon">🔒</span>;
																if (stars !== undefined) {
																	const meta = getGadgetMeta(
																		order.id,
																		order.mode === "build" ? order.unlocksName : order.title,
																		order.id,
																	);
																	return (
																		<>
																			<span class={`gadget-glyph sm ${meta.shape}`} style={{ background: meta.accent }}>
																				{meta.symbol}
																			</span>
																			<span class="card-stars">{"★".repeat(stars)}</span>
																		</>
																	);
																}
																return <span class="card-mode-tag">{order.mode === "build" ? "造" : "解"}</span>;
															})()}
														</button>
													);
												}}
											</For>
										</div>
									</div>
								);
							}}
						</For>
					</div>
				</Show>

				<Show when={activeTab() === "parts"}>
					<div class="overview-parts-section">
						<div class="chapter-block" style={{ "margin-bottom": "20px" }}>
							<h3 class="chapter-title">基础组合子（公理工具）</h3>
							<div class="compendium-grid">
								<For each={BUILTIN_TOOLS}>
									{(tool) => (
										<div class="compendium-cell">
											<div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
												<span class={`gadget-glyph lg ${tool.shape}`} style={{ background: tool.accent }}>
													{tool.symbol}
												</span>
												<div>
													<div style={{ "font-weight": 700, "font-size": "13px" }}>{tool.name}</div>
													<div style={{ "font-size": "11px", color: "var(--text-muted)" }}>
														公理件 · 元数: {tool.arity}
													</div>
												</div>
											</div>
											<div
												class="code-blueprint"
												style={{
													"font-family": "var(--font-mono)",
													"font-size": "11px",
													"margin-top": "4px",
													background: "var(--surface-1)",
													padding: "4px 8px",
													"border-radius": "4px",
													color: "var(--accent-clay-strong)",
													"font-weight": "600",
												}}
											>
												{tool.schematic}
											</div>
											<div style={{ "font-size": "11px", color: "var(--text-secondary)", "line-height": "1.4" }}>
												{tool.note}
											</div>
										</div>
									)}
								</For>
							</div>
						</div>

						<div class="chapter-block" style={{ "margin-bottom": "20px" }}>
							<h3 class="chapter-title">工坊研发与封装零件</h3>
							<div class="compendium-grid">
								<For each={ORDER_TOOLS}>
									{(tool) => {
										const isPartUnlocked =
											props.judgeMode ||
											(tool.orderId !== null && props.clearedStars.has(tool.orderId)) ||
											props.registry.has(tool.id);
										const registeredEntry = props.registry.get(tool.id);
										if (!isPartUnlocked) {
											const targetOrder = props.orders.find((item) => item.id === tool.orderId);
											return (
												<div class="compendium-cell" style={{ opacity: 0.55, "border-style": "dashed" }}>
													<div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
														<span class="gadget-glyph lg square" style={{ background: "var(--border-strong)" }}>
															🔒
														</span>
														<div>
															<div style={{ "font-weight": 600, "font-size": "13px" }}>未封装装置</div>
															<div style={{ "font-size": "11px", color: "var(--text-muted)" }}>
																{targetOrder !== undefined ? `第 ${targetOrder.chapter} 章` : "研发图纸"}
															</div>
														</div>
													</div>
													<div style={{ "font-size": "11px", color: "var(--text-muted)", "margin-top": "6px" }}>
														通关 [{targetOrder !== undefined ? targetOrder.title : tool.name}] 后收录
													</div>
												</div>
											);
										}
										const customName = props.gadgetNames.get(tool.id);
										return (
											<div class="compendium-cell">
												<div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
													<span class={`gadget-glyph lg ${tool.shape}`} style={{ background: tool.accent }}>
														{tool.symbol}
													</span>
													<div>
														<div style={{ "font-weight": 700, "font-size": "13px" }}>
															{customName !== undefined ? customName : tool.name}
														</div>
														<div style={{ "font-size": "11px", color: "var(--text-muted)" }}>
															{registeredEntry !== undefined ? `元数: ${registeredEntry.arity}` : `元数: ${tool.arity}`}
														</div>
													</div>
												</div>
												<div
													class="code-blueprint"
													style={{
														"font-family": "var(--font-mono)",
														"font-size": "11px",
														"margin-top": "4px",
														background: "var(--surface-1)",
														padding: "4px 8px",
														"border-radius": "4px",
													}}
												>
													{registeredEntry !== undefined ? printTerm(registeredEntry.def, 0) : tool.schematic}
												</div>
												<div style={{ "font-size": "11px", color: "var(--text-secondary)", "line-height": "1.4" }}>
													{tool.note}
												</div>
											</div>
										);
									}}
								</For>
							</div>
						</div>

						<div class="chapter-block">
							<h3 class="chapter-title" style={{ color: "var(--accent-danger)" }}>
								危险品与奇异点图鉴（Monsters）
							</h3>
							<div class="compendium-grid">
								<For each={MONSTER_LIST}>
									{(monster) => (
										<div class="hazard-cell">
											<span class="hazard-badge">{monster.dangerLevel}</span>
											<div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
												<span class="gadget-glyph lg hex" style={{ background: "var(--accent-danger)" }}>
													{monster.symbol}
												</span>
												<div>
													<div style={{ "font-weight": 700, "font-size": "13px", color: "var(--accent-danger)" }}>
														{monster.name}
													</div>
													<div style={{ "font-size": "11px", color: "var(--text-muted)" }}>发散/递归原型</div>
												</div>
											</div>
											<div
												class="code-blueprint"
												style={{
													"font-family": "var(--font-mono)",
													"font-size": "11px",
													"margin-top": "4px",
													background: "#ffffff",
													padding: "4px 8px",
													"border-radius": "4px",
													border: "1px solid #fecaca",
												}}
											>
												{monster.termText}
											</div>
											<div style={{ "font-size": "11px", color: "var(--text-secondary)", "line-height": "1.4" }}>
												{monster.note}
											</div>
										</div>
									)}
								</For>
							</div>
						</div>
					</div>
				</Show>
			</main>
		</div>
	);
}
