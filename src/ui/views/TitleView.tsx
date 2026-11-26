import { type JSX, createSignal } from "solid-js";
import { playSnapSound } from "../../audio/synth";
import { useKeyScope } from "../../utils/keybus";

interface TitleViewProps {
	readonly continueOrderCode: string;
	readonly onStart: () => void;
	readonly onOpenSandbox: () => void;
	readonly onOpenWorkshop: () => void;
	readonly onOpenSettings: () => void;
	readonly onOpenAbout: () => void;
}

export function TitleView(props: TitleViewProps): JSX.Element {
	const [isStarting, setIsStarting] = createSignal<boolean>(false);

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
				<header class="title-header">
					<img src="/logo.png" alt="Calculuser Logo" class="title-logo" />
					<h1 class="title-wordmark">Calculuser</h1>
					<div class="title-ornament" aria-hidden="true">
						<span class="title-ornament-line" />
						<span class="title-ornament-glyph">λ</span>
						<span class="title-ornament-line" />
					</div>
				</header>

				<div class="title-actions">
					<button type="button" class="title-primary-btn" onClick={handleStart} disabled={isStarting()}>
						<span>▶</span>
						<span>{props.continueOrderCode === "1.1" ? "开始体验" : `继续关卡 · ${props.continueOrderCode}`}</span>
					</button>

					<button
						type="button"
						class="title-primary-btn"
						style={{
							"margin-top": "8px",
							background: "var(--surface-2)",
							color: "var(--text-primary)",
							border: "1px solid var(--border-strong)",
							"box-shadow": "none",
						}}
						onClick={props.onOpenSandbox}
						disabled={isStarting()}
					>
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
