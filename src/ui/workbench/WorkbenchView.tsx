import { type JSX, Show, createEffect, createSignal } from "solid-js";
import { CHAPTERS, type OrderLevel, type RunOrder, type ToolDefinition } from "../../content";
import type { Registry } from "../../engine/gadget";
import { PRINT_NAMES } from "../../engine/parse";
import type { Term } from "../../engine/term";
import { DeliveryCounter } from "./DeliveryCounter";
import { DraftNode } from "./DraftNode";
import { OrderSlip } from "./OrderSlip";
import { PressureGauge } from "./PressureGauge";
import { ShelfRail } from "./ShelfRail";
import { TapeTimeline } from "./TapeTimeline";
import { TermVisual } from "./TermVisual";
import { createWorkbenchSession } from "./workbenchSession";

export interface WorkbenchViewProps {
	readonly order: OrderLevel;
	readonly registry: Registry;
	readonly gadgetNames: ReadonlyMap<string, string>;
	readonly judgeMode: boolean;
	readonly clearedStars: ReadonlyMap<string, number>;
	readonly isLastOrder: boolean;
	readonly onRecordStars: (orderId: string, stars: number) => void;
	readonly onUnlockCanonicalTool: (tool: ToolDefinition, def: Term) => void;
	readonly onNextOrder: () => void;
	readonly onOpenWorkshop: () => void;
	readonly onOpenSettings: () => void;
	readonly onBackToTitle: () => void;
}

export function WorkbenchView(props: WorkbenchViewProps): JSX.Element {
	const session = createWorkbenchSession({
		order: () => props.order,
		registry: props.registry,
		gadgetNames: () => props.gadgetNames,
		judgeMode: () => props.judgeMode,
		clearedStars: () => props.clearedStars,
		onRecordStars: props.onRecordStars,
		onUnlockCanonicalTool: props.onUnlockCanonicalTool,
	});

	const [zoom, setZoom] = createSignal<number>(1);
	const [panX, setPanX] = createSignal<number>(0);
	const [panY, setPanY] = createSignal<number>(0);
	const [shelfWidth, setShelfWidth] = createSignal<number>(76);
	let isPanning = false;
	let panStartX = 0;
	let panStartY = 0;

	createEffect(() => {
		props.order.id;
		setPanX(0);
		setPanY(0);
		setZoom(1);
	});

	const currentChapter = () => CHAPTERS.find((c) => c.levels.some((l) => l.id === props.order.id));
	const currentChapterNumber = () => {
		const chapter = currentChapter();
		return chapter !== undefined ? chapter.chapter : 1;
	};

	return (
		<div class="workshop-root">
			<header class="top-bar">
				<button type="button" class="order-badge-btn" onClick={props.onOpenWorkshop}>
					<span>工坊 · 第 {currentChapterNumber()} 章</span>
					<span style={{ color: "var(--accent-clay)" }}>{props.order.title}</span>
					<span style={{ color: "var(--text-muted)", "font-size": "11px" }}>▾</span>
				</button>

				<div class="media-controls">
					<button type="button" class="icon-btn" onClick={session.undo} disabled={!session.canUndo()} title="撤销 (Z)">
						<span>↩</span>
						<span>回退</span>
					</button>
					<Show when={props.order.mode === "build"}>
						<button
							type="button"
							class="icon-btn"
							onClick={session.startOrStepPlay}
							disabled={session.hasHoles()}
							title="单步试机 (Space)"
						>
							<span>▶</span>
							<span>{session.playTerm() === null ? "开动" : "单步"}</span>
						</button>
						<button
							type="button"
							class="icon-btn"
							onClick={session.fastForwardPlay}
							disabled={session.hasHoles()}
							title="快进到底"
						>
							<span>⏭</span>
							<span>快进</span>
						</button>
						<Show when={session.playTerm() !== null}>
							<button type="button" class="icon-btn active" onClick={session.stopPlay} title="停止试机">
								<span>■</span>
								<span>停机</span>
							</button>
						</Show>
					</Show>
					<button
						type="button"
						class={`icon-btn ${session.isXRay() ? "active" : ""}`}
						onClick={session.toggleXRay}
						title="透视模式 (X)"
					>
						<span>◎</span>
						<span>透视</span>
					</button>
					<button type="button" class="icon-btn" onClick={props.onOpenWorkshop} title="工坊总览">
						<span>▦</span>
						<span>工坊</span>
					</button>
					<button type="button" class="icon-btn" onClick={props.onOpenSettings} title="设置">
						<span>⚙</span>
					</button>
					<button type="button" class="icon-btn" onClick={props.onBackToTitle} title="返回主界面">
						<span>⌂</span>
					</button>
				</div>
			</header>

			<main
				class="canvas-viewport"
				onWheel={(event) => {
					if (
						(event.target as HTMLElement).closest(
							".shelf-rail, .order-slip, .delivery-counter, .tape-timeline, .compendium-modal, .about-modal, .settings-card",
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
					<div class="workbench-assembly">
						<Show
							when={session.playTerm() !== null}
							fallback={
								<DraftNode
									draft={session.draft()}
									path=""
									selectedPath={session.selectedPath()}
									registry={props.registry}
									gadgetNames={props.gadgetNames}
									onSelectHole={session.selectHole}
									onDismantle={session.dismantleAtPath}
								/>
							}
						>
							<TermVisual
								term={session.playTerm() as Term}
								depth={0}
								path=""
								registry={props.registry}
								gadgetNames={props.gadgetNames}
								redexPaths={session.activeRedexes()}
								onStepRedex={session.stepRedexAt}
							/>
						</Show>
					</div>
				</div>

				<Show when={session.isXRay()}>
					<div class="xray-pill" style={{ left: props.order.mode === "build" ? `${shelfWidth() + 24}px` : "16px" }}>
						透视：{session.xRayText()}
					</div>
				</Show>

				<Show when={props.order.mode === "build"}>
					<ShelfRail
						width={shelfWidth()}
						onResize={setShelfWidth}
						unlockedIds={session.shelfUnlockedIds()}
						lockedCount={session.shelfLockedCount()}
						registry={props.registry}
						gadgetNames={props.gadgetNames}
						scopeVariables={session.currentScope()}
						atoms={props.order.mode === "build" ? (props.order as { readonly atoms: readonly string[] }).atoms : []}
						allowBlueprint={
							props.order.mode === "build"
								? (props.order as { readonly allowBlueprint: boolean }).allowBlueprint
								: false
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

				<Show when={props.order.mode === "run"}>
					<PressureGauge
						currentSteps={session.runSteps()}
						maxBudget={(props.order as RunOrder).stepBudget}
						hasExploded={session.runFailed()}
						onReset={session.clearBench}
					/>
				</Show>

				<OrderSlip
					order={props.order}
					registry={props.registry}
					gadgetNames={props.gadgetNames}
					rejected={session.rejected()}
					runSteps={session.runSteps()}
					runFailed={session.runFailed()}
				/>

				<DeliveryCounter
					mode={props.order.mode}
					canDeliver={props.order.mode === "build" && !session.hasHoles()}
					delivered={session.deliveredStars() !== null}
					stars={session.deliveredStars() !== null ? (session.deliveredStars() as number) : 0}
					countValue={props.order.mode === "run" ? session.runSteps() : session.partCount()}
					targetValue={
						props.order.mode === "run"
							? (props.order as RunOrder).stepBudget
							: (props.order as { readonly parSize: number }).parSize
					}
					note={props.order.note}
					isLastOrder={props.isLastOrder}
					onDeliver={session.deliverOrder}
					onNextOrder={props.onNextOrder}
				/>

				<div class="zoom-controls" style={{ left: props.order.mode === "build" ? `${shelfWidth() + 24}px` : "16px" }}>
					<button type="button" class="icon-btn" onClick={() => setZoom(Math.min(2, zoom() + 0.15))}>
						＋
					</button>
					<button type="button" class="icon-btn" onClick={() => setZoom(Math.max(0.45, zoom() - 0.15))}>
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
						title="回到全景"
					>
						⌖
					</button>
					<button type="button" class="icon-btn" onClick={session.clearBench}>
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
							props.order.mode === "build"
								? session.startOrStepPlay()
								: session.jumpToTapeIndex(session.tapeIndex() + 1)
						}
						onRewind={() => session.jumpToTapeIndex(0)}
					/>
				</Show>
			</main>
		</div>
	);
}
