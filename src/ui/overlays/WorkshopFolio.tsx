import { For, type JSX, Show, createSignal } from "solid-js";
import { BUILTIN_COUNT, CHAPTERS, COMBINATORS, LEVELS, getGadgetMeta, getToolSource } from "../../content";
import type { Registry } from "../../engine/gadget";
import { printTerm } from "../../engine/parse";

interface WorkshopFolioProps {
	readonly initialTab?: "orders" | "parts";
	readonly currentOrderIndex: number;
	readonly clearedStars: ReadonlyMap<string, number>;
	readonly registry: Registry;
	readonly judgeMode: boolean;
	readonly onSelectOrder: (index: number) => void;
	readonly onClose: () => void;
}

const CHAPTER_GROUPS = [
	...CHAPTERS.map((chapterInfo) => ({
		title: chapterInfo.title,
		levels: LEVELS.filter((level) => level.chapter === chapterInfo.id),
		isBossEligible: true,
	})),
	{
		title: "其它",
		levels: LEVELS.filter((level) => !level.chapter),
		isBossEligible: false,
	},
].filter((group) => group.levels.length > 0);

export function WorkshopFolio(props: WorkshopFolioProps): JSX.Element {
	const [activeTab, setActiveTab] = createSignal<"orders" | "parts">(props.initialTab ?? "orders");

	const isUnlocked = (index: number): boolean =>
		props.judgeMode || index === 0 || props.clearedStars.has(LEVELS[index - 1].id);

	const totalStars = (): number => Array.from(props.clearedStars.values()).reduce((sum, s) => sum + s, 0);

	return (
		<div
			class="modal-backdrop"
			onClick={props.onClose}
			onKeyDown={(event) => event.key === "Escape" && props.onClose()}
		>
			<div
				class="modal-card folio-card"
				onClick={(event) => event.stopPropagation()}
				onKeyDown={(event) => event.stopPropagation()}
			>
				<header class="folio-header">
					<div class="folio-tabs">
						<button
							type="button"
							class={`folio-tab-btn ${activeTab() === "orders" ? "active" : ""}`}
							onClick={() => setActiveTab("orders")}
						>
							<span>▦</span>
							<span>订单</span>
						</button>
						<button
							type="button"
							class={`folio-tab-btn ${activeTab() === "parts" ? "active" : ""}`}
							onClick={() => setActiveTab("parts")}
						>
							<span>⚙</span>
							<span>零件</span>
						</button>
					</div>

					<div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
						<span class="folio-status-badge">★ {totalStars()}</span>
						<button type="button" class="icon-btn" onClick={props.onClose} title="关闭 (Esc)">
							✕
						</button>
					</div>
				</header>

				<main class="folio-body">
					<Show when={activeTab() === "orders"}>
						<div class="overview-chapters-list">
							<For each={CHAPTER_GROUPS}>
								{(group) => (
									<div class="chapter-block">
										<div style={{ display: "flex", "align-items": "baseline", gap: "8px" }}>
											<h3 class="chapter-title">{group.title}</h3>
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
															onClick={() => {
																props.onSelectOrder(globalIndex);
																props.onClose();
															}}
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
								<h3 class="chapter-title">基础工具（公理工具）</h3>
								<div
									class="compendium-grid"
									style={{ "grid-template-columns": "repeat(auto-fill, minmax(240px, 1fr))" }}
								>
									<For each={COMBINATORS.slice(0, BUILTIN_COUNT)}>
										{(tool) => (
											<div class="compendium-cell">
												<div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
													<span class={`gadget-glyph ${tool.shape}`} style={{ background: tool.accent }}>
														{tool.symbol}
													</span>
													<div>
														<div style={{ "font-weight": 700, "font-size": "13px" }}>{tool.name}</div>
														<div style={{ "font-size": "10.5px", color: "var(--text-muted)" }}>
															公理工具 · 元数 {tool.arity}
														</div>
													</div>
												</div>
												<div
													style={{
														"font-family": "var(--font-mono)",
														"font-size": "12px",
														color: "var(--accent-clay)",
													}}
												>
													{tool.schematic}
												</div>
												<div style={{ "font-size": "11.5px", color: "var(--text-secondary)", "line-height": "1.4" }}>
													{tool.note}
												</div>
											</div>
										)}
									</For>
								</div>
							</div>

							<div class="chapter-block">
								<h3 class="chapter-title">工坊研发与封装零件</h3>
								<div
									class="compendium-grid"
									style={{ "grid-template-columns": "repeat(auto-fill, minmax(240px, 1fr))" }}
								>
									<For each={COMBINATORS.slice(BUILTIN_COUNT)}>
										{(tool) => {
											const sourceOrderId = getToolSource(tool.id);
											const isUnlockedPart =
												props.judgeMode ||
												(sourceOrderId !== null && props.clearedStars.has(sourceOrderId)) ||
												props.registry.has(tool.id);
											const reg = props.registry.get(tool.id);
											return (
												<div
													class={`compendium-cell ${!isUnlockedPart ? "locked-cell" : ""}`}
													style={!isUnlockedPart ? { opacity: 0.45, filter: "grayscale(1)" } : {}}
												>
													<div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
														<div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
															<span class={`gadget-glyph ${tool.shape}`} style={{ background: tool.accent }}>
																{tool.symbol}
															</span>
															<div>
																<div style={{ "font-weight": 700, "font-size": "13px" }}>{tool.name}</div>
																<div style={{ "font-size": "10.5px", color: "var(--text-muted)" }}>
																	元数 {tool.arity}
																</div>
															</div>
														</div>
													</div>
													<div
														style={{
															"font-family": "var(--font-mono)",
															"font-size": "12px",
															color: "var(--accent-clay)",
														}}
													>
														{tool.schematic}
													</div>
													<div style={{ "font-size": "11.5px", color: "var(--text-secondary)", "line-height": "1.4" }}>
														{tool.note}
													</div>
													<Show when={isUnlockedPart}>
														<div
															style={{
																"font-family": "var(--font-mono)",
																"font-size": "10.5px",
																color: "var(--text-muted)",
																background: "var(--surface-1)",
																padding: "3px 6px",
																"border-radius": "4px",
															}}
														>
															{tool.defText}
														</div>
														<Show when={reg}>
															{(entry) => (
																<div
																	style={{
																		"font-family": "var(--font-mono)",
																		"font-size": "10.5px",
																		color: "var(--accent-success)",
																		background: "var(--surface-1)",
																		padding: "3px 6px",
																		"border-radius": "4px",
																	}}
																>
																	实机项: {printTerm(entry().def, 0)}
																</div>
															)}
														</Show>
													</Show>
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
		</div>
	);
}
