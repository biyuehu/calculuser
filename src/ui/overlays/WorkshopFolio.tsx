import { For, type JSX, Show, createSignal } from "solid-js";
import {
	ACHIEVEMENTS,
	BUILTIN_COUNT,
	CHAPTERS,
	COMBINATORS,
	LEVELS,
	deriveAchievementVisuals,
	getGadgetMeta,
	getOrderUnlockedTools,
	isOrderUnlocked,
	isToolUnlocked,
} from "../../content";
import { useKeyScope } from "../../utils/keybus";
import { transitionView } from "../../utils/transition";

type FolioTab = "orders" | "parts" | "achievements";

interface WorkshopFolioProps {
	readonly initialTab?: FolioTab;
	readonly currentOrderIndex: number;
	readonly isSandboxActive?: boolean;
	readonly clearedStars: ReadonlyMap<string, number>;
	readonly unlockedAchievements: Readonly<Record<string, number>>;
	readonly judgeMode: boolean;
	readonly reducedMotion: boolean;
	readonly onSelectOrder: (index: number) => void;
	readonly onSelectSandbox?: () => void;
	readonly onClose: () => void;
}

const CHAPTER_GROUPS = [
	...CHAPTERS.map((chapterInfo) => ({
		title: chapterInfo.title,
		levels: LEVELS.filter((level) => level.mode !== "sandbox" && level.chapter === chapterInfo.id),
		isBossEligible: true,
	})),
	{
		title: "其它",
		levels: LEVELS.filter((level) => level.mode !== "sandbox" && !level.chapter),
		isBossEligible: false,
	},
].filter((group) => group.levels.length > 0);

const TAB_ORDER: readonly FolioTab[] = ["orders", "parts", "achievements"];

export function WorkshopFolio(props: WorkshopFolioProps): JSX.Element {
	const [activeTab, setActiveTab] = createSignal<FolioTab>(props.initialTab ?? "orders");
	const [isClosing, setIsClosing] = createSignal<boolean>(false);

	const handleClose = (): void => {
		if (isClosing()) return;
		if (props.reducedMotion) {
			props.onClose();
			return;
		}
		setIsClosing(true);
		setTimeout(props.onClose, 180);
	};

	const cycleTab = (): void => {
		setActiveTab(TAB_ORDER[(TAB_ORDER.indexOf(activeTab()) + 1) % TAB_ORDER.length]);
	};

	useKeyScope({
		id: "workshop-folio",
		level: "modal",
		bindings: [
			{ key: ["Escape", "m"], handle: handleClose },
			{ key: "Tab", handle: cycleTab },
		],
	});

	const isUnlocked = (index: number): boolean => isOrderUnlocked(index, props.clearedStars, props.judgeMode);

	const totalStars = (): number => Array.from(props.clearedStars.values()).reduce((sum, s) => sum + s, 0);

	return (
		<div
			class={`modal-backdrop ${isClosing() ? "modal-exit" : ""}`}
			onClick={handleClose}
			onKeyDown={(event) => event.key === "Escape" && handleClose()}
		>
			<div
				class={`modal-card folio-card ${isClosing() ? "modal-exit" : ""}`}
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
						<button
							type="button"
							class={`folio-tab-btn ${activeTab() === "achievements" ? "active" : ""}`}
							onClick={() => setActiveTab("achievements")}
						>
							<span>◈</span>
							<span>成就</span>
						</button>
					</div>

					<button type="button" class="icon-btn" onClick={handleClose}>
						✕
					</button>
				</header>

				<main class="folio-body">
					<Show when={activeTab() === "orders"}>
						<div style={{ "margin-bottom": "16px" }}>
							<button
								type="button"
								class={`order-card-cell available ${props.isSandboxActive ? "current" : ""}`}
								style={{
									width: "100%",
									"text-align": "left",
									padding: "10px 14px",
									display: "flex",
									"align-items": "center",
									"justify-content": "space-between",
								}}
								onClick={() => {
									transitionView(() => {
										props.onSelectSandbox?.();
										props.onClose();
									});
								}}
							>
								<div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
									<span style={{ "font-weight": "700" }}>自由沙盒实验台</span>
								</div>
								<span style={{ "font-size": "12px", color: "var(--text-muted)" }}>无约束组合子装配与推演</span>
							</button>
						</div>
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
															class={`order-card-cell mode-${order.mode} ${stars !== void 0 ? "ok" : ""} ${
																unlocked && stars === void 0 ? "available" : ""
															} ${!unlocked ? "locked" : ""} ${
																group.isBossEligible &&
																localIndex() === group.levels.length - 1 &&
																group.levels.length > 3
																	? "boss"
																	: ""
															} ${globalIndex === props.currentOrderIndex ? "current" : ""}`}
															onClick={() => {
																transitionView(() => {
																	props.onSelectOrder(globalIndex);
																	props.onClose();
																});
															}}
															title={`${code} ${order.title}`}
														>
															<span class="card-code">{code}</span>
															{(() => {
																if (!unlocked) return <span class="card-icon">🔒</span>;
																if (stars !== void 0) {
																	const unlockedTools = getOrderUnlockedTools(order);
																	const meta = getGadgetMeta(unlockedTools[0] ?? order.id);
																	return (
																		<>
																			<span class={`gadget-glyph sm ${meta.shape}`} style={{ background: meta.accent }}>
																				{meta.symbol}
																			</span>
																			<span class="card-stars">{"★".repeat(stars)}</span>
																		</>
																	);
																}
																return (
																	<span class="card-mode-tag">
																		{order.mode === "build" ? "造" : order.mode === "typebuild" ? "型" : "解"}
																	</span>
																);
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
								<h3 class="chapter-title">基本工具</h3>
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
													</div>
												</div>
												<div style={{ "font-size": "11.5px", color: "var(--text-secondary)", "line-height": "1.4" }}>
													{tool.note}
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
												<div
													style={{
														"font-family": "var(--font-mono)",
														"font-size": "11px",
														color: "var(--accent-clay-strong)",
														"font-weight": 600,
													}}
												>
													{tool.typingText}
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
											const isUnlockedPart = isToolUnlocked(tool.id, props.clearedStars, props.judgeMode);
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
															</div>
														</div>
													</div>
													<div style={{ "font-size": "11.5px", color: "var(--text-secondary)", "line-height": "1.4" }}>
														{tool.note}
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
													<div
														style={{
															"font-family": "var(--font-mono)",
															"font-size": "11px",
															color: "var(--accent-clay-strong)",
															"font-weight": 600,
														}}
													>
														{tool.typingText}
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
													</Show>
												</div>
											);
										}}
									</For>
								</div>
							</div>
						</div>
					</Show>

					<Show when={activeTab() === "achievements"}>
						<div class="overview-chapters-list">
							<div class="chapter-block">
								<h3 class="chapter-title">工坊进度</h3>
								<div style={{ display: "flex", "flex-wrap": "wrap", gap: "8px" }}>
									<span class="folio-status-badge">
										★ 星数 {totalStars()} / {LEVELS.filter((level) => level.mode !== "sandbox").length * 3}
									</span>
									<span class="folio-status-badge">
										▦ 订单 {props.clearedStars.size} / {LEVELS.filter((level) => level.mode !== "sandbox").length}
									</span>
									<span class="folio-status-badge">
										⚙ 零件{" "}
										{COMBINATORS.filter((tool) => isToolUnlocked(tool.id, props.clearedStars, props.judgeMode)).length}{" "}
										/ {COMBINATORS.length}
									</span>
									<span class="folio-status-badge">
										◈ 成就 {Object.keys(props.unlockedAchievements).length} / {ACHIEVEMENTS.length}
									</span>
								</div>
							</div>

							<div class="chapter-block">
								<h3 class="chapter-title">工坊成就</h3>
								<div
									class="compendium-grid"
									style={{ "grid-template-columns": "repeat(auto-fill, minmax(250px, 1fr))" }}
								>
									<For each={ACHIEVEMENTS}>
										{(item) => {
											const unlocked = (): boolean => props.unlockedAchievements[item.id] !== void 0;
											const visual = deriveAchievementVisuals(item.id);
											return (
												<div
													class={`compendium-cell ${!unlocked() ? "locked-cell" : ""}`}
													style={!unlocked() ? { opacity: 0.45, filter: "grayscale(1)" } : {}}
												>
													<div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
														<Show when={unlocked()} fallback={<span class="achievement-badge-locked">☆</span>}>
															<span class={`gadget-glyph ${visual.shape}`} style={{ background: visual.accent }}>
																{visual.symbol}
															</span>
														</Show>
														<span style={{ "font-weight": 700, "font-size": "13px" }}>{item.title}</span>
													</div>
													<div style={{ "font-size": "11.5px", color: "var(--text-secondary)", "line-height": "1.4" }}>
														{item.description}
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
		</div>
	);
}
