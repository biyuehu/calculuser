import { type JSX, Show, createSignal } from "solid-js";
import { setMasterVolume } from "../../audio/synth";
import type { SettingsState } from "../../engine/storage";

interface MachineryPanelProps {
	readonly initialTab?: "settings" | "about";
	readonly settings: SettingsState;
	readonly onUpdateSettings: (updater: (prev: SettingsState) => SettingsState) => void;
	readonly onResetData: () => void;
	readonly onClose: () => void;
}

export function MachineryPanel(props: MachineryPanelProps): JSX.Element {
	const [activeTab, setActiveTab] = createSignal<"settings" | "about">(props.initialTab ?? "settings");
	const [isClosing, setIsClosing] = createSignal<boolean>(false);

	const handleClose = (): void => {
		if (isClosing()) return;
		if (props.settings.reducedMotion) {
			props.onClose();
			return;
		}
		setIsClosing(true);
		setTimeout(props.onClose, 180);
	};

	const setVolume = (value: number): void => {
		setMasterVolume(value);
		props.onUpdateSettings((prev) => ({ ...prev, volume: value }));
	};

	const toggleMotion = (): void => props.onUpdateSettings((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));

	const toggleJudgeMode = (): void => props.onUpdateSettings((prev) => ({ ...prev, judgeMode: !prev.judgeMode }));

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
							class={`machinery-tab-btn ${activeTab() === "about" ? "active" : ""}`}
							onClick={() => setActiveTab("about")}
						>
							<span>ℹ</span>
							<span>关于</span>
						</button>
					</div>
					<button type="button" class="icon-btn" onClick={handleClose} title="关闭 (Esc)">
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
									重置进度
								</div>
								<div class="control-desc">清空星级与解锁记录</div>
							</div>
							<button type="button" class="icon-btn danger" onClick={props.onResetData}>
								清空数据
							</button>
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
