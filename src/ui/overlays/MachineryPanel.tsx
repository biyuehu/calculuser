import { type JSX, Show, createSignal } from "solid-js";
import { setMasterVolume } from "../../audio/synth";
import type { SettingsState } from "../../storage";
import { useKeyScope } from "../keybus";

interface MachineryPanelProps {
	readonly initialTab?: "settings" | "controls" | "about";
	readonly settings: SettingsState;
	readonly onUpdateSettings: (updater: (prev: SettingsState) => SettingsState) => void;
	readonly onResetData: () => void;
	readonly onClose: () => void;
}

export function MachineryPanel(props: MachineryPanelProps): JSX.Element {
	const [activeTab, setActiveTab] = createSignal<"settings" | "controls" | "about">(props.initialTab ?? "settings");
	const [isClosing, setIsClosing] = createSignal<boolean>(false);
	const [confirmingReset, setConfirmingReset] = createSignal<boolean>(false);
	let resetTimer: number | undefined;

	const handleResetClick = (): void => {
		if (!confirmingReset()) {
			setConfirmingReset(true);
			resetTimer = window.setTimeout(() => setConfirmingReset(false), 3500);
			return;
		}
		if (resetTimer !== void 0) clearTimeout(resetTimer);
		props.onResetData();
	};

	const handleClose = (): void => {
		if (isClosing()) return;
		if (props.settings.reducedMotion) {
			props.onClose();
			return;
		}
		setIsClosing(true);
		setTimeout(props.onClose, 180);
	};

	useKeyScope({
		id: "machinery-panel",
		level: "modal",
		bindings: [
			{ key: ["Escape", "o"], handle: handleClose },
			{
				key: "Tab",
				handle: (e) => {
					const tabs: readonly ("settings" | "controls" | "about")[] = ["settings", "controls", "about"];
					const currentIdx = tabs.indexOf(activeTab());
					const nextIdx = e.shiftKey ? (currentIdx - 1 + tabs.length) % tabs.length : (currentIdx + 1) % tabs.length;
					setActiveTab(tabs[nextIdx]);
				},
			},
		],
	});

	const setVolume = (value: number): void => {
		setMasterVolume(value);
		props.onUpdateSettings((prev) => ({ ...prev, volume: value }));
	};

	const toggleMotion = (): void => props.onUpdateSettings((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));

	const toggleJudgeMode = (): void => {
		props.onUpdateSettings((prev) => ({ ...prev, judgeMode: !prev.judgeMode }));
		setTimeout(() => window.location.reload(), 100);
	};

	const toggleAutoSkipRead = (): void =>
		props.onUpdateSettings((prev) => ({ ...prev, autoSkipRead: !prev.autoSkipRead }));

	return (
		<div
			class={`modal-backdrop ${isClosing() ? "modal-exit" : ""}`}
			onClick={handleClose}
			onKeyDown={(event) => event.key === "Escape" && handleClose()}
		>
			<div
				class={`modal-card machinery-panel ${isClosing() ? "modal-exit" : ""}`}
				onClick={(event) => event.stopPropagation()}
				onKeyDown={(event) => event.stopPropagation()}
			>
				<header class="machinery-header">
					<div class="machinery-tabs">
						<button
							type="button"
							class={`machinery-tab-btn ${activeTab() === "settings" ? "active" : ""}`}
							onClick={() => setActiveTab("settings")}
						>
							<span>⚙</span>
							<span>设置</span>
						</button>
						<button
							type="button"
							class={`machinery-tab-btn ${activeTab() === "controls" ? "active" : ""}`}
							onClick={() => setActiveTab("controls")}
						>
							<span>⌨</span>
							<span>操作指南</span>
						</button>
						<button
							type="button"
							class={`machinery-tab-btn ${activeTab() === "about" ? "active" : ""}`}
							onClick={() => setActiveTab("about")}
						>
							<span>ℹ</span>
							<span>关于</span>
						</button>
					</div>
					<button type="button" class="icon-btn" onClick={handleClose} title="关闭 (Esc / O)">
						✕
					</button>
				</header>

				<Show when={activeTab() === "settings"}>
					<section class="machinery-section">
						<div class="control-row">
							<div>
								<div class="control-title">声音音量</div>
								<div class="control-desc">网页音频合成音效</div>
							</div>
							<div class="btn-group">
								<button
									type="button"
									class={`icon-btn sm ${props.settings.volume === 0 ? "active" : ""}`}
									onClick={() => setVolume(0)}
								>
									静音
								</button>
								<button
									type="button"
									class={`icon-btn sm ${props.settings.volume === 0.5 ? "active" : ""}`}
									onClick={() => setVolume(0.5)}
								>
									适中
								</button>
								<button
									type="button"
									class={`icon-btn sm ${props.settings.volume === 1 ? "active" : ""}`}
									onClick={() => setVolume(1)}
								>
									饱满
								</button>
							</div>
						</div>

						<div class="control-row">
							<div>
								<div class="control-title">减少动效</div>
								<div class="control-desc">关闭震动与大幅形变动画</div>
							</div>
							<button
								type="button"
								class={`icon-btn ${props.settings.reducedMotion ? "active" : ""}`}
								onClick={toggleMotion}
							>
								{props.settings.reducedMotion ? "已开启" : "已关闭"}
							</button>
						</div>

						<div class="control-row">
							<div>
								<div class="control-title">自动跳过已读对话</div>
								<div class="control-desc">通关重玩时自动跳过看过的剧情</div>
							</div>
							<button
								type="button"
								class={`icon-btn ${props.settings.autoSkipRead ? "active" : ""}`}
								onClick={toggleAutoSkipRead}
							>
								{props.settings.autoSkipRead ? "已开启" : "未开启"}
							</button>
						</div>

						<div class="control-row">
							<div>
								<div class="control-title">评委模式（全关卡解锁）</div>
								<div class="control-desc">直接开放所有 27 个订单，便于评测</div>
							</div>
							<button
								type="button"
								class={`icon-btn ${props.settings.judgeMode ? "active" : ""}`}
								onClick={toggleJudgeMode}
							>
								{props.settings.judgeMode ? "已激活" : "未开启"}
							</button>
						</div>

						<div class="control-row danger-zone">
							<div>
								<div class="control-title" style={{ color: "var(--accent-danger)" }}>
									重置存档
								</div>
								<div class="control-desc">
									{confirmingReset() ? "危险：不可撤销，请再次点击确认清空" : "清空所有进度、草稿与设置项"}
								</div>
							</div>
							<button
								type="button"
								class="icon-btn danger"
								style={confirmingReset() ? { background: "var(--accent-danger)", color: "#ffffff" } : {}}
								onClick={handleResetClick}
							>
								{confirmingReset() ? "再次点击确认" : "清空整个存档"}
							</button>
						</div>
					</section>
				</Show>

				<Show when={activeTab() === "controls"}>
					<section class="machinery-section controls-section">
						<div class="shortcut-group">
							<div class="shortcut-group-title">装配与零件填入</div>
							<div class="shortcut-row">
								<span>开槽（λ 抽象机身）</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">Q</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>喂入（应用连接器 ◀）</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">E</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>填入对应组合子（需未被禁用）</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">I</span>
									<span class="key-cap">S</span>
									<span class="key-cap">K</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>填入作用域信号珠（0 为当前最内层）</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">0</span>
									<span>~</span>
									<span class="key-cap">9</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>左右循环切换聚焦的空槽</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">A</span>
									<span class="key-cap">D</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>拆解零件（回退为空槽）</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">Del</span>
									<span>/</span>
									<span class="key-cap">Backspace</span>
									<span>或右键</span>
								</div>
							</div>
						</div>

						<div class="shortcut-group">
							<div class="shortcut-group-title">运转、试机与关卡</div>
							<div class="shortcut-row">
								<span>单步开动 / 单步规约</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">Space</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>快进到底</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">Shift</span>
									<span>+</span>
									<span class="key-cap">Space</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>纸带时间轴步退 / 步进</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">←</span>
									<span class="key-cap">→</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>重置关卡纸带或工作台</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">R</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>验货交付 / 通关下一关</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">Enter</span>
								</div>
							</div>
						</div>

						<div class="shortcut-group">
							<div class="shortcut-group-title">视口与界面辅助</div>
							<div class="shortcut-row">
								<span>集中画布（回到全景 100%）</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">F</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>画布缩放</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">+</span>
									<span class="key-cap">-</span>
									<span>或滚轮</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>透视模式（展开组合子 λ 式）</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">X</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>显示 / 收起客人过关提示</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">H</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>工坊总览地图开关</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">M</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>设置面板与指南开关</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">O</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>关闭弹窗 / 返回主界面</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">Esc</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>弹窗内切换标签页</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">Tab</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>撤销上一步操作</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">Z</span>
									<span>或</span>
									<span class="key-cap">Ctrl+Z</span>
								</div>
							</div>
						</div>

						<div class="shortcut-group">
							<div class="shortcut-group-title">剧情对话与接待台</div>
							<div class="shortcut-row">
								<span>推进对话 / 立即显现文本</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">Space</span>
									<span>/</span>
									<span class="key-cap">Enter</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>选择对应数字分支选项</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">1</span>
									<span>~</span>
									<span class="key-cap">9</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>跳过剧情对话</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">Esc</span>
								</div>
							</div>
						</div>
					</section>
				</Show>

				<Show when={activeTab() === "about"}>
					<section class="machinery-section archive-section">
						<div class="archive-intro">
							<p>
								<strong>Calculuser</strong>（Calculus + User）是一款立足于
								<strong>纯无类型 λ-演算（Untyped Lambda Calculus）</strong>与
								<strong>组合子逻辑（Combinatory Logic, SKI）</strong>的解谜与构造游戏。
							</p>
							<p style={{ "margin-top": "8px" }}>
								游戏中所有的零件并非黑盒脚本，而是严格遵循 β-归约与项代换规则的数学对象。从基础的 I、K、S
								组合子，到布尔逻辑、邱奇数（Church Numerals）、算术运算，再到递归的不动点组合子（Y / Turing
								Fixpoint），所有高级构件均由基础零件逐一封装而成。
							</p>
						</div>

						<div class="archive-references">
							<div class="archive-ref-title">理论与设计参考</div>
							<ul class="archive-ref-list">
								<li>
									Alonzo Church (1936) · <em>An Unsolvable Problem of Elementary Number Theory</em>
								</li>
								<li>
									Moses Schönfinkel & Haskell Curry · <em>Combinatory Logic</em>
								</li>
								<li>
									Benjamin C. Pierce · <em>Types and Programming Languages</em> (TAPL)
								</li>
								<li>
									Inspirations · <em>Recursed</em>, <em>TIS-100</em>, <em>Shenzhen I/O</em>
								</li>
							</ul>
						</div>
					</section>
				</Show>
			</div>
		</div>
	);
}
