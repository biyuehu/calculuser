import { For, type JSX, Show, createSignal } from "solid-js";
import {
	BUILTIN_TOOLS,
	CHAPTERS,
	LEVELS,
	ORDER_TOOLS,
	getContinueOrderIndex,
	getGadgetMeta,
	getOrderCode,
	getToolSource,
} from "../../content";
import type { Registry } from "../../engine/gadget";
import { printTerm } from "../../engine/parse";

interface WorkshopOverviewProps {
	readonly currentOrderIndex: number;
	readonly clearedStars: ReadonlyMap<string, number>;
	readonly registry: Registry;
	readonly judgeMode: boolean;
	readonly origin: "title" | "workbench";
	readonly onBack: () => void;
	readonly onSelectOrder: (index: number) => void;
}

const CHAPTER_GROUPS = [
	...CHAPTERS.map((chapterInfo) => ({
		title: chapterInfo.title,
		subtitle: chapterInfo.subtitle,
		levels: LEVELS.filter((level) => level.chapter === chapterInfo.chapter),
		isBossEligible: true,
	})),
	{
		title: "其它",
		subtitle: "",
		levels: LEVELS.filter((level) => !level.chapter),
		isBossEligible: false,
	},
].filter((group) => group.levels.length > 0);

export function WorkshopOverview(props: WorkshopOverviewProps): JSX.Element {
	const [activeTab, setActiveTab] = createSignal<"orders" | "parts">("orders");

	const isUnlocked = (index: number): boolean =>
		props.judgeMode || index === 0 || props.clearedStars.has(LEVELS[index - 1].id);

	const continueIndex = (): number => getContinueOrderIndex(props.clearedStars);

	const continueCode = (): string => getOrderCode(LEVELS[continueIndex()].id);

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
						<For each={CHAPTER_GROUPS}>
							{(group) => (
								<div class="chapter-block">
									<div style={{ display: "flex", "align-items": "baseline", gap: "8px" }}>
										<h3 class="chapter-title">{group.title}</h3>
										<Show when={group.subtitle}>
											<span style={{ "font-size": "11.5px", color: "var(--text-muted)" }}>{group.subtitle}</span>
										</Show>
									</div>
									<div class="orders-card-row">
										<For each={group.levels}>
											{(order, localIndex) => {
												const globalIndex = LEVELS.findIndex((item) => item.id === order.id);
												const code = order.code;
												const stars = props.clearedStars.get(order.id);
												const unlocked = isUnlocked(globalIndex);
												return (
													<button
														type="button"
														disabled={!unlocked}
														class={`order-card-cell ${stars !== void 0 ? "ok" : ""} ${
															unlocked && stars === void 0 ? "available" : ""
														} ${!unlocked ? "locked" : ""} ${
															group.isBossEligible &&
															localIndex() === group.levels.length - 1 &&
															group.levels.length > 3
																? "boss"
																: ""
														} ${globalIndex === props.currentOrderIndex ? "current" : ""}`}
														onClick={() => props.onSelectOrder(globalIndex)}
														title={`${code} ${order.title}`}
													>
														<span class="card-code">{code}</span>
														{(() => {
															if (!unlocked) return <span class="card-icon">🔒</span>;
															if (stars !== void 0) {
																const meta = getGadgetMeta(
																	order.mode === "build" && order.unlocksToolId !== void 0
																		? order.unlocksToolId
																		: order.id,
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
							)}
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
										const sourceOrderId = getToolSource(tool.id);
										const isPartUnlocked =
											props.judgeMode || (sourceOrderId !== null && props.clearedStars.has(sourceOrderId));
										const registeredEntry = props.registry.get(tool.id);
										return (
											<div
												class={`compendium-cell ${!isPartUnlocked ? "locked" : ""}`}
												style={!isPartUnlocked ? { opacity: 0.45, filter: "grayscale(1)" } : {}}
											>
												<div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
													<span
														class={`gadget-glyph lg ${tool.shape}`}
														style={{ background: !isPartUnlocked ? "var(--border-strong)" : tool.accent }}
													>
														{tool.symbol}
													</span>
													<div>
														<div style={{ "font-weight": 700, "font-size": "13px" }}>{tool.name}</div>
														<div style={{ "font-size": "11px", color: "var(--text-muted)" }}>
															{!isPartUnlocked
																? "未解锁"
																: registeredEntry !== void 0
																	? `元数: ${registeredEntry.arity}`
																	: `元数: ${tool.arity}`}
														</div>
													</div>
												</div>
												<Show when={isPartUnlocked}>
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
														{registeredEntry !== void 0 ? printTerm(registeredEntry.def, 0) : tool.schematic}
													</div>
												</Show>
												<div style={{ "font-size": "11px", color: "var(--text-secondary)", "line-height": "1.4" }}>
													{tool.note}
												</div>
											</div>
										);
									}}
								</For>
							</div>
						</div>
					</div>
				</Show>
			</main>
		</div>
	);
}
