import { type JSX, Show, createEffect, createMemo, createSignal } from "solid-js";
import { playFailSound } from "../../audio/synth";
import type { OrderLevel } from "../../content";
import {
	PRINT_NAMES,
	type Path,
	type Registry,
	type Ty,
	collectBaseTypes,
	formatTy,
	inferDraftType,
} from "../../engine";
import { useUiPreferences } from "../../hooks/useUiPreferences";
import { useWorkbenchSession } from "../../hooks/useWorkbenchSession";
import { useKeyScope } from "../keybus";
import { DeliveryCounter } from "../workbench/panels/DeliveryCounter";
import { OrderSlip } from "../workbench/panels/OrderSlip";
import { PressureGauge } from "../workbench/panels/PressureGauge";
import { ShelfRail } from "../workbench/panels/ShelfRail";
import { TapeTimeline } from "../workbench/panels/TapeTimeline";
import { DraftNode } from "../workbench/term/DraftNode";
import { TermVisual } from "../workbench/term/TermVisual";
import { TypeEditorModal } from "../workbench/term/TypeEditorModal";

interface WorkbenchViewProps {
	readonly active?: boolean;
	readonly order: OrderLevel;
	readonly registry: Registry;
	readonly judgeMode: boolean;
	readonly clearedStars: ReadonlyMap<string, number>;
	readonly xRayMode: boolean;
	readonly isLastOrder: boolean;
	readonly onRecordStars: (orderId: string, stars: number) => void;
	readonly onToggleXRay: () => void;
	readonly onNextOrder: () => void;
	readonly onOpenWorkshop: () => void;
	readonly onOpenSettings: () => void;
	readonly onBackToTitle: () => void;
}

export function WorkbenchView(props: WorkbenchViewProps): JSX.Element {
	const session = useWorkbenchSession({
		order: () => props.order,
		registry: props.registry,
		judgeMode: () => props.judgeMode,
		clearedStars: () => props.clearedStars,
		onRecordStars: props.onRecordStars,
		xRayMode: () => props.xRayMode,
		onToggleXRay: props.onToggleXRay,
	});

	const ui = useUiPreferences();
	const [zoom, setZoom] = createSignal<number>(1);
	const [panX, setPanX] = createSignal<number>(0);
	const [panY, setPanY] = createSignal<number>(0);
	const [levelTransitioning, setLevelTransitioning] = createSignal<boolean>(false);
	const [showHint, setShowHint] = createSignal<boolean>(false);
	const [editingLamType, setEditingLamType] = createSignal<{ readonly path: Path; readonly currentTy: Ty } | null>(
		null,
	);
	let isPanning = false;
	let panStartX = 0;
	let panStartY = 0;

	createEffect(() => {
		props.order.id;
		setPanX(0);
		setPanY(0);
		setZoom(1);
		setShowHint(false);
		setLevelTransitioning(true);
		setTimeout(() => setLevelTransitioning(false), 380);
	});

	useKeyScope({
		id: "workbench-view",
		level: "view",
		active: () => props.active !== false,
		bindings: [
			{ key: "Escape", handle: props.onBackToTitle },
			{
				key: "z",
				handle: (event) => {
					if (event.ctrlKey || !event.metaKey) session.undo();
				},
			},
			{
				key: "q",
				handle: () => {
					if (
						(props.order.mode === "build" || props.order.mode === "typebuild" || props.order.mode === "sandbox") &&
						session.playTerm() === null &&
						props.order.allowBlueprint !== false &&
						session.currentScope().length < PRINT_NAMES.length
					)
						session.fillLam();
					else playFailSound();
				},
			},
			{
				key: "e",
				handle: () => {
					if (
						(props.order.mode === "build" || props.order.mode === "typebuild" || props.order.mode === "sandbox") &&
						session.playTerm() === null
					)
						session.applyReplacement({ kind: "app", fn: { kind: "hole" }, arg: { kind: "hole" } });
					else playFailSound();
				},
			},
			{
				key: "i",
				handle: () => {
					if (
						(props.order.mode === "build" || props.order.mode === "sandbox") &&
						session.playTerm() === null &&
						session.shelfUnlockedIds().includes("I")
					)
						session.applyReplacement({ kind: "gad", id: "I" });
					else playFailSound();
				},
			},
			{
				key: "s",
				handle: () => {
					if (
						(props.order.mode === "build" || props.order.mode === "sandbox") &&
						session.playTerm() === null &&
						session.shelfUnlockedIds().includes("S")
					)
						session.applyReplacement({ kind: "gad", id: "S" });
					else playFailSound();
				},
			},
			{ key: "o", handle: props.onOpenSettings },
			{
				key: "k",
				handle: () => {
					if (
						(props.order.mode === "build" || props.order.mode === "sandbox") &&
						session.playTerm() === null &&
						session.shelfUnlockedIds().includes("K")
					)
						session.applyReplacement({ kind: "gad", id: "K" });
					else playFailSound();
				},
			},
			{
				predicate: (event) => /^[0-9]$/.test(event.key),
				handle: (event) => {
					if (
						(props.order.mode === "build" || props.order.mode === "typebuild" || props.order.mode === "sandbox") &&
						session.playTerm() === null
					) {
						const digit = Number.parseInt(event.key, 10);
						const scope = session.currentScope();
						if (scope.length === 0) {
							playFailSound();
							return;
						}
						const targetVar =
							digit === 0
								? scope[scope.length - 1]
								: scope.length - 1 - digit >= 0
									? scope[scope.length - 1 - digit]
									: digit <= scope.length
										? scope[digit - 1]
										: void 0;
						if (targetVar !== void 0) session.applyReplacement({ kind: "var", name: targetVar });
						else playFailSound();
					}
				},
			},
			{ key: "x", handle: props.onToggleXRay },
			{ key: "m", handle: props.onOpenWorkshop },
			{ key: "h", handle: () => setShowHint(!showHint()) },
			{
				key: "f",
				handle: () => {
					setPanX(0);
					setPanY(0);
					setZoom(1);
				},
			},
			{ key: ["+", "="], handle: () => setZoom(Math.min(2, zoom() + 0.15)) },
			{ key: ["-", "_"], handle: () => setZoom(Math.max(0.45, zoom() - 0.15)) },
			{ key: "r", handle: session.clearBench },
			{ key: "ArrowLeft", handle: session.stepBackward },
			{ key: "ArrowRight", handle: session.stepForward },
			{ key: "a", handle: () => session.cycleHoleFocus("left") },
			{ key: "d", handle: () => session.cycleHoleFocus("right") },
			{ key: ["Delete", "Backspace"], handle: session.dismantleSelected },
			{
				key: "Enter",
				handle: () => {
					if (session.deliveredStars() !== null) {
						if (!props.isLastOrder) props.onNextOrder();
					} else if ((props.order.mode === "build" || props.order.mode === "typebuild") && !session.hasHoles()) {
						session.deliverOrder();
					}
				},
			},
			{
				key: " ",
				handle: (event) => {
					if (event.shiftKey) session.fastForwardPlay();
					else session.startOrStepPlay();
				},
			},
		],
	});

	return (
		<div class={`workshop-root ${session.deliveredStars() !== null ? "level-cleared-celebration" : ""}`}>
			<header class="top-bar">
				<button
					type="button"
					class={`order-badge-btn ${levelTransitioning() ? "level-transitioning" : ""}`}
					onClick={props.onOpenWorkshop}
				>
					<span>工坊 · {props.order.chapter ? `第 ${props.order.chapter} 章` : "其它"}</span>
					<span style={{ color: "var(--accent-clay)" }}>{props.order.title}</span>
					<span style={{ color: "var(--text-muted)", "font-size": "11px" }}>▾</span>
				</button>

				<div class="media-controls">
					<button type="button" class="icon-btn" onClick={session.undo} disabled={!session.canUndo()} title="撤销 (Z)">
						<span>↩</span>
						<span>回退</span>
					</button>
					<Show when={props.order.mode === "build" || props.order.mode === "sandbox"}>
						<button
							type="button"
							class="icon-btn"
							onClick={session.startOrStepPlay}
							disabled={session.hasHoles()}
							title={session.playTerm() === null ? "开动 (Space)" : "单步 (Space)"}
						>
							<span>▶</span>
							<span>{session.playTerm() === null ? "开动" : "单步"}</span>
						</button>
						<button
							type="button"
							class="icon-btn"
							onClick={session.fastForwardPlay}
							disabled={session.hasHoles()}
							title="快进 (Shift+Space)"
						>
							<span>⏭</span>
							<span>快进</span>
						</button>
						<Show when={session.playTerm() !== null}>
							<button type="button" class="icon-btn active" onClick={session.stopPlay} title="停机 (Space)">
								<span>■</span>
								<span>停机</span>
							</button>
						</Show>
					</Show>
					<button
						type="button"
						class={`icon-btn ${session.isXRay() ? "active" : ""}`}
						onClick={session.toggleXRay}
						title="透视 (X)"
					>
						<span>◎</span>
						<span>透视</span>
					</button>
					<button type="button" class="icon-btn" onClick={props.onOpenWorkshop} title="工坊 (M)">
						<span>▦</span>
						<span>工坊</span>
					</button>
					<button type="button" class="icon-btn" onClick={props.onOpenSettings} title="设置 (O)">
						<span>⚙</span>
						<span>设置</span>
					</button>
					<button type="button" class="icon-btn" onClick={props.onBackToTitle} title="主页 (Esc)">
						<span>⌂</span>
						<span>主页</span>
					</button>
				</div>
			</header>

			<main
				class="canvas-viewport"
				onWheel={(event) => {
					if (
						(event.target as HTMLElement).closest(
							".shelf-rail, .order-slip, .delivery-counter, .tape-timeline, .about-modal, .settings-card",
						)
					)
						return;
					event.preventDefault();
					setZoom(Math.min(2, Math.max(0.45, zoom() + (event.deltaY < 0 ? 0.1 : -0.1))));
				}}
				onPointerDown={(event) => {
					if (event.target !== event.currentTarget) return;
					isPanning = true;
					panStartX = event.clientX - panX();
					panStartY = event.clientY - panY();
				}}
				onPointerMove={(event) => {
					if (!isPanning) return;
					setPanX(event.clientX - panStartX);
					setPanY(event.clientY - panStartY);
				}}
				onPointerUp={() => {
					isPanning = false;
				}}
			>
				<div
					class="canvas-transform-layer"
					style={{ transform: `translate(${panX()}px, ${panY()}px) scale(${zoom()})` }}
				>
					<div class={`workbench-assembly ${levelTransitioning() ? "level-transitioning" : ""}`}>
						<Show
							when={session.playTerm()}
							fallback={
								<DraftNode
									draft={session.draft()}
									path=""
									isTypeMode={props.order.mode === "typebuild"}
									onEditType={(path, currentTy) => setEditingLamType({ path, currentTy })}
									selectedPath={session.selectedPath() ?? void 0}
									onSelectHole={session.selectHole}
									onDismantle={session.dismantleAtPath}
								/>
							}
						>
							{(term) => (
								<TermVisual
									term={term()}
									path=""
									redexPaths={session.activeRedexes()}
									onStepRedex={session.stepRedexAt}
								/>
							)}
						</Show>
					</div>
				</div>

				<Show when={session.isXRay()}>
					<div
						class="xray-pill"
						style={{
							left:
								props.order.mode === "build" || props.order.mode === "typebuild" || props.order.mode === "sandbox"
									? `${ui.shelfWidth() + 24}px`
									: "16px",
						}}
					>
						透视：{session.xRayText()}
					</div>
				</Show>

				<Show when={session.draftNotice()}>{(notice) => <div class="workbench-toast-notice">{notice()}</div>}</Show>

				<Show when={props.order.mode === "build" || props.order.mode === "typebuild" || props.order.mode === "sandbox"}>
					<ShelfRail
						width={ui.shelfWidth()}
						onResize={ui.setShelfWidth}
						unlockedIds={
							props.order.mode === "build" || props.order.mode === "sandbox" ? session.shelfUnlockedIds() : []
						}
						lockedCount={props.order.mode === "build" ? session.shelfLockedCount() : 0}
						scopeVariables={session.currentScope()}
						atoms={props.order.mode === "build" || props.order.mode === "sandbox" ? props.order.atoms : []}
						allowBlueprint={
							props.order.mode === "build" || props.order.mode === "sandbox" ? props.order.allowBlueprint : true
						}
						canAddLam={session.currentScope().length < PRINT_NAMES.length}
						hasSelectedHole={session.selectedPath() !== null && session.playTerm() === null}
						onFillGad={(id) => session.applyReplacement({ kind: "gad", id })}
						onFillVar={(name) => session.applyReplacement({ kind: "var", name })}
						onFillAtom={(name) => session.applyReplacement({ kind: "atom", name })}
						onFillLam={session.fillLam}
						onFillApp={() => session.applyReplacement({ kind: "app", fn: { kind: "hole" }, arg: { kind: "hole" } })}
					/>
				</Show>

				<Show when={props.order.mode === "run" ? props.order : null}>
					{(runOrder) => (
						<PressureGauge
							currentSteps={session.runSteps()}
							maxBudget={runOrder().stepBudget}
							hasExploded={session.runFailed()}
							rightOffset={ui.orderSlipWidth() + 24}
							onReset={session.clearBench}
						/>
					)}
				</Show>

				<OrderSlip
					order={props.order}
					rejected={session.rejected() ?? void 0}
					typeError={session.typeError() ?? void 0}
					runSteps={session.runSteps()}
					runFailed={session.runFailed()}
					transitioning={levelTransitioning()}
					showHint={showHint()}
					onToggleHint={() => setShowHint(!showHint())}
				/>

				<DeliveryCounter
					mode={props.order.mode}
					canDeliver={
						(props.order.mode === "build" || props.order.mode === "typebuild" || props.order.mode === "sandbox") &&
						!session.hasHoles()
					}
					delivered={props.order.mode !== "sandbox" && session.deliveredStars() !== null}
					stars={session.deliveredStars() ?? 0}
					countValue={props.order.mode === "run" ? session.runSteps() : session.partCount()}
					targetValue={
						props.order.mode === "run"
							? props.order.stepBudget
							: props.order.mode === "sandbox"
								? 0
								: props.order.parSize
					}
					note={props.order.note}
					isLastOrder={props.isLastOrder}
					rejected={props.order.mode !== "sandbox" && (session.rejected() !== null || session.typeError() !== null)}
					rejectReason={session.typeError() ?? (session.rejected() !== null ? "未能通过客人测试用例" : void 0)}
					unlocksToolId={props.order.mode === "build" ? props.order.unlocksToolId : void 0}
					onDeliver={props.order.mode === "sandbox" ? session.startOrStepPlay : session.deliverOrder}
					onNextOrder={props.onNextOrder}
				/>

				<div
					class="zoom-controls"
					style={{
						left:
							props.order.mode === "build" || props.order.mode === "typebuild" || props.order.mode === "sandbox"
								? `${ui.shelfWidth() + 24}px`
								: "16px",
					}}
				>
					<button type="button" class="icon-btn" onClick={() => setZoom(Math.min(2, zoom() + 0.15))} title="放大 (+)">
						＋
					</button>
					<button
						type="button"
						class="icon-btn"
						onClick={() => setZoom(Math.max(0.45, zoom() - 0.15))}
						title="缩小 (-)"
					>
						－
					</button>
					<button
						type="button"
						class="icon-btn"
						onClick={() => {
							setZoom(1);
							setPanX(0);
							setPanY(0);
						}}
						title="回到全景 (F)"
					>
						⌖
					</button>
					<button
						type="button"
						class="icon-btn"
						onClick={session.clearBench}
						title={props.order.mode === "run" ? "重置残局 (R)" : "清空桌面 (R)"}
					>
						{props.order.mode === "run" ? "重置残局" : "清空桌面"}
					</button>
				</div>

				<Show when={session.tape().length > 1 && session.playTerm() !== null}>
					<TapeTimeline
						currentIndex={session.tapeIndex()}
						totalSteps={session.tape().length - 1}
						onJumpToStep={session.jumpToTapeIndex}
						onStepBack={() => session.jumpToTapeIndex(session.tapeIndex() - 1)}
						onStepForward={() =>
							props.order.mode === "build" || props.order.mode === "sandbox"
								? session.startOrStepPlay()
								: session.jumpToTapeIndex(session.tapeIndex() + 1)
						}
						onRewind={() => session.jumpToTapeIndex(0)}
					/>
				</Show>

				<Show when={props.order.mode === "typebuild" ? props.order : null}>
					{(_) => {
						const inferred = createMemo(() => inferDraftType(session.draft(), props.registry));
						return <div class="typebuild-footer-pill">⊢ {inferred().ty ? formatTy(inferred().ty as Ty) : "?"}</div>;
					}}
				</Show>

				<Show when={editingLamType()}>
					{(info) => (
						<TypeEditorModal
							currentTy={info().currentTy}
							baseTypes={props.order.mode === "typebuild" ? collectBaseTypes(props.order.targetTy) : []}
							onConfirm={(newTy) => {
								session.updateLamTypeAtPath(info().path, newTy);
								setEditingLamType(null);
							}}
							onClose={() => setEditingLamType(null)}
						/>
					)}
				</Show>
			</main>
		</div>
	);
}
