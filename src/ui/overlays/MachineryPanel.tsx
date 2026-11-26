import { type JSX, Show, createSignal } from "solid-js";
import { setBgmVolume } from "../../audio/bgm";
import { playFailSound, playPassSound, setMasterVolume } from "../../audio/synth";
import { type SettingsState, exportSaveJson, importSaveJson } from "../../storage";
import { useKeyScope } from "../../utils/keybus";

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
	const [saveNotice, setSaveNotice] = createSignal<string | null>(null);
	let resetTimer: number | undefined;
	let fileInputRef: HTMLInputElement | undefined;

	const handleExportSave = (): void => {
		const blob = new Blob([exportSaveJson()], { type: "application/json;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		const now = new Date();
		const pad = (n: number): string => String(n).padStart(2, "0");
		const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
		anchor.href = url;
		anchor.download = `calculuser_save_${stamp}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
		playPassSound();
		setSaveNotice("已导出存档文件");
	};

	const handleImportFile = async (event: Event): Promise<void> => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files !== null ? input.files[0] : void 0;
		input.value = "";
		if (file === void 0) return;
		const text = await file.text();
		if (!importSaveJson(text)) {
			playFailSound();
			setSaveNotice("存档文件格式无效");
			return;
		}
		playPassSound();
		setSaveNotice("存档已导入，正在刷新…");
		window.setTimeout(() => window.location.reload(), 200);
	};

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

	const setMusicVolume = (value: number): void => {
		const clamped = Math.max(0, Math.min(1, value));
		setBgmVolume(clamped);
		props.onUpdateSettings((prev) => ({ ...prev, bgmVolume: clamped }));
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
					<button type="button" class="icon-btn" onClick={handleClose}>
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
								<div class="control-title">背景音乐音量</div>
								<div class="control-desc">单独调节工坊背景音乐播放响度</div>
							</div>
							<div class="bgm-slider-group">
								<input
									type="range"
									min="0"
									max="1"
									step="0.01"
									class="bgm-volume-slider"
									value={props.settings.bgmVolume}
									aria-label="背景音乐音量"
									onInput={(event) => setMusicVolume(Number.parseFloat(event.currentTarget.value))}
								/>
								<span class="bgm-volume-value">{Math.round(props.settings.bgmVolume * 100)}%</span>
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
								<div class="control-desc">直接开放所有关卡与内容，便于评测</div>
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
								<div class="control-title">存档备份</div>
								<div class="control-desc">{saveNotice() ?? "导出或导入 JSON 格式的本地存档"}</div>
							</div>
							<div class="btn-group">
								<button type="button" class="icon-btn sm" onClick={handleExportSave}>
									导出存档
								</button>
								<button
									type="button"
									class="icon-btn sm"
									onClick={() => {
										if (fileInputRef !== void 0) fileInputRef.click();
									}}
								>
									导入存档
								</button>
								<input
									ref={fileInputRef}
									type="file"
									accept=".json,application/json"
									style={{ display: "none" }}
									onChange={(event) => void handleImportFile(event)}
								/>
							</div>
						</div>

						<div class="control-row ">
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
								<span>开槽（抽象机）</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">Q</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>喂入（应用连接器）</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">E</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>填入对应工具</span>
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
								<span>拆解零件</span>
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
								<span>单步开动 / 单步归约</span>
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
								<span>集中画布</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">F</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>切换全屏显示</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">F11</span>
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
								<span>平移视口</span>
								<div class="shortcut-key-badge">
									<span>左键拖拽空白画布</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>透视模式</span>
								<div class="shortcut-key-badge">
									<span class="key-cap">X</span>
								</div>
							</div>
							<div class="shortcut-row">
								<span>显示 / 收起提示</span>
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
								<strong>Calculuser</strong>（Calculus + User）是一款基于
								<strong>渐进式类型 λ 演算（Gradual Typing Lambda Calculus）</strong>与
								<strong>组合子逻辑（Combinatory Logic, SKI）</strong>的逻辑构造与推演游戏。
							</p>
							<p style={{ "margin-top": "8px" }}>
								游戏中的所有装置均严格遵循 α-等价、β-归约与类型一致性规则，并非黑盒脚本。从基础的 I、K、S
								组合子起步，经由布尔逻辑、邱奇数、不动点递归到带类型标注的零件装配与自由沙盒推演，所有高级构件均由基础零件逐层封装而成。
							</p>
						</div>

						<div class="archive-references">
							<div class="archive-ref-title">工坊核心模块</div>
							<ul class="archive-ref-list">
								<li>
									<strong>运行与构建订单</strong> · 逐步观测 β/δ-归约纸带，在步数与拷贝预算内封装目标组合子
								</li>
								<li>
									<strong>渐进类型构造</strong> · 借助基础类型与箭头类型完成精确的类型契约装配
								</li>
								<li>
									<strong>自由沙盒实验台</strong> · 无约束装配任意 λ 项，自定义并封装属于自己的组合子零件
								</li>
							</ul>
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
									Jeremy G. Siek & Walid Taha (2006) · <em>Gradual Typing for Functional Languages</em>
								</li>
								<li>
									Benjamin C. Pierce · <em>Types and Programming Languages</em> (TAPL)
								</li>
							</ul>
						</div>

						<div class="archive-references">
							<div class="archive-ref-title">制作与版权</div>
							<ul class="archive-ref-list">
								<li>
									<strong>制作者</strong> ·{" "}
									<a href="https://github.com/biyuehu" target="_blank" rel="noreferrer">
										Arimura Romi
									</a>
								</li>
								<li>
									<strong>项目主页</strong> ·{" "}
									<a href="https://github.com/biyuehu/calculuser" target="_blank" rel="noreferrer">
										https://github.com/biyuehu/calculuser
									</a>
								</li>
								<li>
									<strong>版本与协议</strong> · v0.1.0 · GPL-3.0 · Copyright © 2026 Arimura Romi
								</li>
							</ul>
						</div>
					</section>
				</Show>
			</div>
		</div>
	);
}
