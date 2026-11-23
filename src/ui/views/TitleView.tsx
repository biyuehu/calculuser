import { type JSX, Show, createSignal } from "solid-js";
import { playPassSound, playSnapSound } from "../../audio/synth";
import { getGadgetMeta } from "../../content";
import { useKeyScope } from "../keybus";

interface TitleViewProps {
	readonly continueOrderCode: string;
	readonly onStart: () => void;
	readonly onOpenSandbox: () => void;
	readonly onOpenWorkshop: () => void;
	readonly onOpenSettings: () => void;
	readonly onOpenAbout: () => void;
}

export function TitleView(props: TitleViewProps): JSX.Element {
	const [toyState, setToyState] = createSignal<number>(0);
	const [isStarting, setIsStarting] = createSignal<boolean>(false);

	const clickToy = (): void => {
		if (toyState() === 0) {
			playPassSound();
			setToyState(1);
			return;
		}
		playSnapSound(0);
		setToyState(0);
	};

	const handleStart = (): void => {
		if (isStarting()) return;
		setIsStarting(true);
		playSnapSound(2);
		props.onStart();
	};

	useKeyScope({
		id: "title-view",
		level: "view",
		bindings: [
			{ key: [" ", "Enter"], handle: handleStart },
			{ key: "o", handle: props.onOpenSettings },
			{ key: "m", handle: props.onOpenWorkshop },
		],
	});

	return (
		<div class={`title-screen-container ${isStarting() ? "title-exit" : ""}`}>
			<div class={`title-card ${isStarting() ? "title-exit" : ""}`}>
				<header style={{ "text-align": "center" }}>
					<img src="/logo.png" alt="Calculuser Logo" class="title-logo" />
					<h1 style={{ "font-size": "26px", "font-weight": 700, "letter-spacing": "-0.5px" }}>Calculuser · 装置工坊</h1>
					<p style={{ "font-size": "13px", color: "var(--text-muted)", "margin-top": "4px" }}>
						λ-演算与组合逻辑的机器实验台
					</p>
				</header>

				<div class="title-toy-box" onClick={clickToy} onKeyDown={(event) => event.key === "Enter" && clickToy()}>
					<div class="toy-term-row">
						<Show
							when={toyState() === 0}
							fallback={
								<>
									<span class="atom-token pop-appear">A</span>
									<span style={{ "font-size": "12px", color: "var(--accent-success)", "font-weight": "600" }}>
										归约完成！(K A B → A)
									</span>
								</>
							}
						>
							{(() => {
								const kMeta = getGadgetMeta("K");
								return (
									<span class="gadget-token">
										<span class={`gadget-glyph ${kMeta.shape}`} style={{ background: kMeta.accent }}>
											{kMeta.symbol}
										</span>
										<span>{kMeta.name}</span>
									</span>
								);
							})()}
							<span class="atom-token">A</span>
							<span class="atom-token">B</span>
						</Show>
					</div>
					<span class="toy-caption">{toyState() === 0 ? "点一下试试" : "再点一下重置"}</span>
				</div>

				<div class="title-actions">
					<button
						type="button"
						class="title-primary-btn"
						onClick={handleStart}
						disabled={isStarting()}
						title="开始游戏 (Space)"
					>
						<span>▶</span>
						<span>{props.continueOrderCode === "1.1" ? "开始体验" : `继续关卡 · ${props.continueOrderCode}`}</span>
					</button>

					<button
						type="button"
						class="title-primary-btn"
						style={{
							"margin-top": "8px",
							background: "var(--paper-card)",
							color: "var(--text-primary)",
							border: "1px solid var(--border-color)",
						}}
						onClick={props.onOpenSandbox}
						disabled={isStarting()}
						title="自由沙盒实验台"
					>
						<span>⚡</span>
						<span>自由沙盒实验台</span>
					</button>

					<div class="title-secondary-row">
						<button type="button" class="icon-btn" onClick={props.onOpenWorkshop}>
							<span>▦</span>
							<span>工坊总览</span>
						</button>
						<button type="button" class="icon-btn" onClick={props.onOpenSettings}>
							<span>⚙</span>
							<span>设置</span>
						</button>
						<button type="button" class="icon-btn" onClick={props.onOpenAbout}>
							<span>ℹ</span>
							<span>关于</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
