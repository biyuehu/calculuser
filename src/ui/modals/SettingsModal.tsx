import type { JSX } from "solid-js";
import { setMasterVolume } from "../../audio/synth";

export interface SettingsState {
	readonly volume: number;
	readonly reducedMotion: boolean;
	readonly judgeMode: boolean;
}

interface SettingsModalProps {
	readonly settings: SettingsState;
	readonly onUpdateSettings: (updater: (prev: SettingsState) => SettingsState) => void;
	readonly onResetData: () => void;
	readonly onClose: () => void;
}

export function SettingsModal(props: SettingsModalProps): JSX.Element {
	const setVolume = (value: number): void => {
		setMasterVolume(value);
		props.onUpdateSettings((prev) => ({
			volume: value,
			reducedMotion: prev.reducedMotion,
			judgeMode: prev.judgeMode,
		}));
	};

	const toggleMotion = (): void => {
		props.onUpdateSettings((prev) => ({
			volume: prev.volume,
			reducedMotion: !prev.reducedMotion,
			judgeMode: prev.judgeMode,
		}));
	};

	const toggleJudgeMode = (): void => {
		props.onUpdateSettings((prev) => ({
			volume: prev.volume,
			reducedMotion: prev.reducedMotion,
			judgeMode: !prev.judgeMode,
		}));
	};

	return (
		<div
			class="modal-backdrop"
			onClick={props.onClose}
			onKeyDown={(event) => event.key === "Escape" && props.onClose()}
		>
			<div
				class="modal-card"
				style={{ "max-width": "500px" }}
				onClick={(event) => event.stopPropagation()}
				onKeyDown={(event) => event.stopPropagation()}
			>
				<header style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
					<h2 style={{ "font-size": "17px", "font-weight": 700 }}>工坊设置</h2>
					<button type="button" class="icon-btn" onClick={props.onClose}>
						✕
					</button>
				</header>

				<section style={{ display: "flex", "flex-direction": "column", gap: "16px", "font-size": "13px" }}>
					<div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
						<div>
							<div style={{ "font-weight": 600 }}>声音音量</div>
							<div style={{ "font-size": "11px", color: "var(--text-muted)" }}>网页音频合成音效</div>
						</div>
						<div style={{ display: "flex", gap: "6px" }}>
							<button
								type="button"
								class={`icon-btn ${props.settings.volume === 0 ? "active" : ""}`}
								onClick={() => setVolume(0)}
							>
								静音
							</button>
							<button
								type="button"
								class={`icon-btn ${props.settings.volume === 0.5 ? "active" : ""}`}
								onClick={() => setVolume(0.5)}
							>
								适中
							</button>
							<button
								type="button"
								class={`icon-btn ${props.settings.volume === 1 ? "active" : ""}`}
								onClick={() => setVolume(1)}
							>
								饱满
							</button>
						</div>
					</div>

					<div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
						<div>
							<div style={{ "font-weight": 600 }}>减少动效</div>
							<div style={{ "font-size": "11px", color: "var(--text-muted)" }}>关闭震动与大幅形变动画</div>
						</div>
						<button
							type="button"
							class={`icon-btn ${props.settings.reducedMotion ? "active" : ""}`}
							onClick={toggleMotion}
						>
							{props.settings.reducedMotion ? "已开启" : "已关闭"}
						</button>
					</div>

					<div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
						<div>
							<div style={{ "font-weight": 600 }}>评委模式（全关卡解锁）</div>
							<div style={{ "font-size": "11px", color: "var(--text-muted)" }}>直接开放所有 27 个订单，便于评测</div>
						</div>
						<button
							type="button"
							class={`icon-btn ${props.settings.judgeMode ? "active" : ""}`}
							onClick={toggleJudgeMode}
						>
							{props.settings.judgeMode ? "已激活" : "未开启"}
						</button>
					</div>

					<div
						style={{
							display: "flex",
							"justify-content": "space-between",
							"align-items": "center",
							"border-top": "1px solid var(--border-subtle)",
							"padding-top": "12px",
						}}
					>
						<div>
							<div style={{ "font-weight": 600, color: "var(--accent-danger)" }}>重置进度</div>
							<div style={{ "font-size": "11px", color: "var(--text-muted)" }}>清空星级与解锁记录</div>
						</div>
						<button
							type="button"
							class="icon-btn"
							style={{ color: "var(--accent-danger)", "border-color": "var(--accent-danger)" }}
							onClick={props.onResetData}
						>
							清空数据
						</button>
					</div>
				</section>

				<footer style={{ display: "flex", "justify-content": "flex-end", "margin-top": "8px" }}>
					<button type="button" class="order-badge-btn" onClick={props.onClose}>
						完成
					</button>
				</footer>
			</div>
		</div>
	);
}
