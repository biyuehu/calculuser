import { type JSX, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import {
	playDropSound,
	playFailSound,
	playMoveSound,
	playPassSound,
	playSnapSound,
	playSplitSound,
	playUndoSound,
} from "../audio/synth";
import {
	type DraftTerm,
	countDraftSize,
	draftToTerm,
	findFirstHole,
	getScopeAt,
	setDraftAtPath,
} from "../engine/draft";
import { type Registry, createBuiltinRegistry, registerGadget } from "../engine/gadget";
import { judgeOrder } from "../engine/judge";
import { printTerm } from "../engine/parse";
import { type StepEvent, redexes, stepAt, stepLeftmost } from "../engine/reduce";
import { type GadgetId, type Path, type Term, termsEqual } from "../engine/term";
import { ORDERS, type RunOrder } from "../levels/orders";
import { CompendiumModal } from "./CompendiumModal";
import { DeliveryCounter } from "./DeliveryCounter";
import { DraftNode } from "./DraftNode";
import { OrderSlip, type RejectedInfo } from "./OrderSlip";
import { ShelfRail } from "./ShelfRail";
import { TermVisual } from "./TermVisual";

const VARIABLE_POOL: readonly string[] = ["x", "y", "z", "w"];
const STORAGE_KEY = "calculuser_workshop_v2";

interface SavedWorkshop {
	readonly stars: Record<string, number>;
	readonly unlocked: readonly { readonly id: string; readonly name: string; readonly def: Term }[];
}

function loadWorkshop(): SavedWorkshop {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw === null) return { stars: {}, unlocked: [] };
		return JSON.parse(raw) as SavedWorkshop;
	} catch {
		return { stars: {}, unlocked: [] };
	}
}

function saveWorkshop(stars: ReadonlyMap<string, number>, unlocked: SavedWorkshop["unlocked"]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ stars: Object.fromEntries(stars), unlocked }));
	} catch {
		// Ignore quota errors.
	}
}

function playStepEventSound(event: StepEvent): void {
	const count = event.kind === "beta" ? event.copies : event.copies.length > 0 ? event.copies[0] : 1;
	if (count === 0) playDropSound();
	else if (count >= 2) playSplitSound();
	else playMoveSound();
}

export function App(): JSX.Element {
	const saved = loadWorkshop();
	const registry: Registry = createBuiltinRegistry();
	const initialNames = new Map<string, string>();
	for (const item of saved.unlocked) {
		registerGadget(registry, item.id, item.def, "level");
		initialNames.set(item.id, item.name);
	}

	const [orderIndex, setOrderIndex] = createSignal<number>(0);
	const [draft, setDraft] = createSignal<DraftTerm>({ kind: "hole" });
	const [selectedPath, setSelectedPath] = createSignal<Path | null>("");
	const [history, setHistory] = createSignal<readonly DraftTerm[]>([]);
	const [combo, setCombo] = createSignal<number>(0);
	const [clearedStars, setClearedStars] = createSignal<ReadonlyMap<string, number>>(
		new Map(Object.entries(saved.stars)),
	);
	const [unlockedList, setUnlockedList] = createSignal<SavedWorkshop["unlocked"]>(saved.unlocked);
	const [gadgetNames, setGadgetNames] = createSignal<ReadonlyMap<string, string>>(initialNames);
	const [rejected, setRejected] = createSignal<RejectedInfo | null>(null);
	const [deliveredStars, setDeliveredStars] = createSignal<number | null>(null);
	const [isXRay, setIsXRay] = createSignal<boolean>(false);
	const [modalMode, setModalMode] = createSignal<"compendium" | "map" | null>(null);

	// Canvas pan & zoom
	const [zoom, setZoom] = createSignal<number>(1);
	const [panX, setPanX] = createSignal<number>(0);
	const [panY, setPanY] = createSignal<number>(0);
	let isPanning = false;
	let panStartX = 0;
	let panStartY = 0;

	// Live step-by-step playback state (for both build preview and run mode)
	const [playTerm, setPlayTerm] = createSignal<Term | null>(null);
	const [runHistory, setRunHistory] = createSignal<readonly Term[]>([]);

	const currentOrder = createMemo(() => ORDERS[orderIndex()]);
	const currentScope = createMemo(() => (selectedPath() !== null ? getScopeAt(draft(), selectedPath() as Path) : []));
	const hasHoles = createMemo(() => findFirstHole(draft(), "") !== null);
	const partCount = createMemo(() => countDraftSize(draft()));
	const runSteps = createMemo(() => runHistory().length);
	const runFailed = createMemo(
		() =>
			currentOrder().mode === "run" &&
			deliveredStars() === null &&
			runSteps() >= (currentOrder() as RunOrder).stepBudget,
	);

	const shelfUnlockedIds = createMemo((): readonly GadgetId[] => {
		const order = currentOrder();
		if (order.mode !== "build") return [];
		const forbiddenSet = new Set(order.forbidden);
		const candidates =
			order.toolbox === "all" ? [...registry.keys()].filter((id) => id !== `p:${order.id}`) : order.toolbox;
		return candidates.filter((id) => !forbiddenSet.has(id));
	});

	const shelfLockedCount = createMemo(() => {
		const order = currentOrder();
		return order.mode === "build" && order.toolbox === "all" ? Math.max(0, ORDERS.length - unlockedList().length) : 0;
	});

	const applyReplacement = (replacement: DraftTerm): void => {
		const path = selectedPath();
		if (path === null) return;
		playSnapSound(combo());
		setCombo(combo() + 1);
		setHistory([...history(), draft()]);
		const updated = setDraftAtPath(draft(), path, replacement);
		setDraft(updated);
		setSelectedPath(findFirstHole(updated, ""));
		setRejected(null);
		setDeliveredStars(null);
		setPlayTerm(null);
	};

	const dismantleAtPath = (path: Path): void => {
		playUndoSound();
		setCombo(0);
		setHistory([...history(), draft()]);
		setDraft(setDraftAtPath(draft(), path, { kind: "hole" }));
		setSelectedPath(path);
		setRejected(null);
		setDeliveredStars(null);
		setPlayTerm(null);
	};

	const fillLam = (): void => {
		const available = VARIABLE_POOL.find((candidate) => !currentScope().includes(candidate));
		if (available !== undefined) applyReplacement({ kind: "lam", param: available, body: { kind: "hole" } });
	};

	const undo = (): void => {
		if (currentOrder().mode === "run") {
			const pastRuns = runHistory();
			if (pastRuns.length === 0) return;
			playUndoSound();
			setPlayTerm(pastRuns[pastRuns.length - 1]);
			setRunHistory(pastRuns.slice(0, pastRuns.length - 1));
			setDeliveredStars(null);
			return;
		}
		const past = history();
		if (past.length === 0) return;
		playUndoSound();
		setCombo(0);
		const previous = past[past.length - 1];
		setHistory(past.slice(0, past.length - 1));
		setDraft(previous);
		setSelectedPath(findFirstHole(previous, ""));
		setRejected(null);
		setDeliveredStars(null);
		setPlayTerm(null);
	};

	const clearBench = (): void => {
		playUndoSound();
		setCombo(0);
		const order = currentOrder();
		if (order.mode === "run") {
			setPlayTerm(order.initialTerm);
			setRunHistory([]);
			setDeliveredStars(null);
			return;
		}
		setDraft({ kind: "hole" });
		setSelectedPath("");
		setHistory([]);
		setRejected(null);
		setDeliveredStars(null);
		setPlayTerm(null);
	};

	const selectOrder = (index: number): void => {
		setOrderIndex(index);
		setRejected(null);
		setDeliveredStars(null);
		setCombo(0);
		const targetOrder = ORDERS[index];
		if (targetOrder.mode === "run") {
			setPlayTerm(targetOrder.initialTerm);
			setRunHistory([]);
		} else {
			setDraft({ kind: "hole" });
			setSelectedPath("");
			setHistory([]);
			setPlayTerm(null);
		}
		setPanX(0);
		setPanY(0);
		setZoom(1);
	};

	const recordStars = (orderId: string, stars: number): void => {
		const updatedStars = new Map(clearedStars());
		const previousBest = updatedStars.get(orderId);
		if (previousBest === undefined || stars > previousBest) updatedStars.set(orderId, stars);
		setClearedStars(updatedStars);
		saveWorkshop(updatedStars, unlockedList());
	};

	const deliverOrder = (): void => {
		const order = currentOrder();
		if (order.mode !== "build" || hasHoles()) return;
		const candidate = draftToTerm(draft(), []);
		const results = judgeOrder(candidate, order.tests, registry, 300);
		const firstFailIndex = results.findIndex((item) => !item.passed);
		if (firstFailIndex >= 0) {
			playFailSound();
			setRejected({ testCase: order.tests[firstFailIndex], result: results[firstFailIndex] });
			return;
		}
		playPassSound();
		setRejected(null);
		const stars = partCount() <= order.parSize ? 3 : partCount() <= order.parSize + 2 ? 2 : 1;
		setDeliveredStars(stars);

		const newId = `p:${order.id}`;
		if (!registry.has(newId) && order.id !== "first-delivery") {
			registerGadget(registry, newId, candidate, "level");
			const updatedNames = new Map(gadgetNames());
			updatedNames.set(newId, order.unlocksName);
			setGadgetNames(updatedNames);
			setUnlockedList([...unlockedList(), { id: newId, name: order.unlocksName, def: candidate }]);
		}
		recordStars(order.id, stars);
	};

	const startOrStepPlay = (): void => {
		const order = currentOrder();
		if (order.mode === "run") {
			const paths = activeRedexes();
			if (paths.length > 0) stepRedexAt(paths[0]);
			return;
		}
		if (hasHoles()) return;
		const active = playTerm();
		if (active === null) {
			const applied = order.tests[0].args.reduce<Term>(
				(fn, arg) => ({ kind: "app", fn, arg }),
				draftToTerm(draft(), []),
			);
			playMoveSound();
			setPlayTerm(applied);
			return;
		}
		const stepped = stepLeftmost(active, registry, "");
		if (stepped === null) {
			playPassSound();
			return;
		}
		playStepEventSound(stepped.event);
		setPlayTerm(stepped.next);
	};

	const fastForwardPlay = (): void => {
		const order = currentOrder();
		if (order.mode === "run" || hasHoles()) return;
		let current =
			playTerm() !== null
				? (playTerm() as Term)
				: order.tests[0].args.reduce<Term>((fn, arg) => ({ kind: "app", fn, arg }), draftToTerm(draft(), []));
		for (let step = 0; step < 80; step += 1) {
			const stepped = stepLeftmost(current, registry, "");
			if (stepped === null) break;
			current = stepped.next;
		}
		playSnapSound(4);
		setPlayTerm(current);
	};

	const stepRedexAt = (path: Path): void => {
		const active = playTerm();
		if (active === null) return;
		const order = currentOrder();
		const stepped = stepAt(active, path, registry, "");
		if (stepped === null) return;
		playStepEventSound(stepped.event);
		if (order.mode === "run") {
			const nextRunHistory = [...runHistory(), active];
			setRunHistory(nextRunHistory);
			setPlayTerm(stepped.next);
			if (
				nextRunHistory.length <= order.stepBudget &&
				termsEqual(stepped.next, order.targetTerm) &&
				redexes(stepped.next, registry, "").length === 0
			) {
				playPassSound();
				setDeliveredStars(3);
				recordStars(order.id, 3);
			} else if (nextRunHistory.length >= order.stepBudget) playFailSound();
			return;
		}
		setPlayTerm(stepped.next);
	};

	const activeRedexes = createMemo(() => (playTerm() !== null ? redexes(playTerm() as Term, registry, "") : []));

	const xRayText = createMemo((): string => {
		try {
			return printTerm(playTerm() !== null ? (playTerm() as Term) : draftToTerm(draft(), []), 0);
		} catch {
			return "装置尚有空槽未填满";
		}
	});

	const handleKeyDown = (event: KeyboardEvent): void => {
		if ((event.key === "z" || event.key === "Z") && (event.ctrlKey || !event.metaKey)) undo();
		if (event.key === "x" || event.key === "X") setIsXRay(!isXRay());
		if (event.key === " " && currentOrder().mode === "build") {
			event.preventDefault();
			startOrStepPlay();
		}
	};

	onMount(() => window.addEventListener("keydown", handleKeyDown));
	onCleanup(() => window.removeEventListener("keydown", handleKeyDown));

	const canUndo = (): boolean => (currentOrder().mode === "run" ? runHistory().length > 0 : history().length > 0);

	return (
		<div class="workshop-root">
			<header class="top-bar">
				<button type="button" class="order-badge-btn" onClick={() => setModalMode("map")}>
					<span>工坊 · 第 {currentOrder().chapter} 章</span>
					<span style={{ color: "var(--accent-clay)" }}>{currentOrder().title}</span>
					<span style={{ color: "var(--text-muted)", "font-size": "11px" }}>▾</span>
				</button>

				<div class="media-controls">
					<button type="button" class="icon-btn" onClick={undo} disabled={!canUndo()} title="撤销 (Z)">
						<span>↩</span>
						<span>回退</span>
					</button>
					<Show when={currentOrder().mode === "build"}>
						<button
							type="button"
							class="icon-btn"
							onClick={startOrStepPlay}
							disabled={hasHoles()}
							title="单步试机 (Space)"
						>
							<span>▶</span>
							<span>{playTerm() === null ? "开动" : "单步"}</span>
						</button>
						<button type="button" class="icon-btn" onClick={fastForwardPlay} disabled={hasHoles()} title="快进到底">
							<span>⏭</span>
							<span>快进</span>
						</button>
						<Show when={playTerm() !== null}>
							<button type="button" class="icon-btn active" onClick={() => setPlayTerm(null)} title="停止试机">
								<span>■</span>
								<span>停机</span>
							</button>
						</Show>
					</Show>
					<button
						type="button"
						class={`icon-btn ${isXRay() ? "active" : ""}`}
						onClick={() => setIsXRay(!isXRay())}
						title="透视模式 (X)"
					>
						<span>◎</span>
						<span>透视</span>
					</button>
					<button type="button" class="icon-btn" onClick={() => setModalMode("compendium")} title="工坊图鉴">
						<span>📖</span>
						<span>图鉴</span>
					</button>
				</div>
			</header>

			<main
				class="canvas-viewport"
				onWheel={(event) => {
					event.preventDefault();
					setZoom(Math.min(2, Math.max(0.45, zoom() + (event.deltaY < 0 ? 0.1 : -0.1))));
				}}
				onPointerDown={(event) => {
					if (event.target === event.currentTarget) {
						isPanning = true;
						panStartX = event.clientX - panX();
						panStartY = event.clientY - panY();
					}
				}}
				onPointerMove={(event) => {
					if (isPanning) {
						setPanX(event.clientX - panStartX);
						setPanY(event.clientY - panStartY);
					}
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
							when={playTerm() !== null}
							fallback={
								<DraftNode
									draft={draft()}
									path=""
									selectedPath={selectedPath()}
									registry={registry}
									gadgetNames={gadgetNames()}
									onSelectHole={(path) => {
										playSnapSound(0);
										setSelectedPath(path);
									}}
									onDismantle={dismantleAtPath}
								/>
							}
						>
							<TermVisual
								term={playTerm() as Term}
								depth={0}
								path=""
								registry={registry}
								gadgetNames={gadgetNames()}
								redexPaths={activeRedexes()}
								onStepRedex={stepRedexAt}
							/>
						</Show>
					</div>
				</div>

				<Show when={isXRay()}>
					<div class="xray-pill">透视：{xRayText()}</div>
				</Show>

				<Show when={currentOrder().mode === "build"}>
					<ShelfRail
						unlockedIds={shelfUnlockedIds()}
						lockedCount={shelfLockedCount()}
						registry={registry}
						gadgetNames={gadgetNames()}
						scopeVariables={currentScope()}
						atoms={
							currentOrder().mode === "build" ? (currentOrder() as { readonly atoms: readonly string[] }).atoms : []
						}
						allowBlueprint={
							currentOrder().mode === "build"
								? (currentOrder() as { readonly allowBlueprint: boolean }).allowBlueprint
								: false
						}
						canAddLam={currentScope().length < VARIABLE_POOL.length}
						hasSelectedHole={selectedPath() !== null && playTerm() === null}
						onFillGad={(id) => applyReplacement({ kind: "gad", id })}
						onFillVar={(name) => applyReplacement({ kind: "var", name })}
						onFillAtom={(name) => applyReplacement({ kind: "atom", name })}
						onFillLam={fillLam}
						onFillApp={() => applyReplacement({ kind: "app", fn: { kind: "hole" }, arg: { kind: "hole" } })}
					/>
				</Show>

				<OrderSlip
					order={currentOrder()}
					registry={registry}
					gadgetNames={gadgetNames()}
					rejected={rejected()}
					runSteps={runSteps()}
					runFailed={runFailed()}
				/>

				<DeliveryCounter
					mode={currentOrder().mode}
					canDeliver={currentOrder().mode === "build" && !hasHoles()}
					delivered={deliveredStars() !== null}
					stars={deliveredStars() !== null ? (deliveredStars() as number) : 0}
					countValue={currentOrder().mode === "run" ? runSteps() : partCount()}
					targetValue={
						currentOrder().mode === "run"
							? (currentOrder() as RunOrder).stepBudget
							: (currentOrder() as { readonly parSize: number }).parSize
					}
					note={currentOrder().note}
					isLastOrder={orderIndex() === ORDERS.length - 1}
					onDeliver={deliverOrder}
					onNextOrder={() => selectOrder(orderIndex() + 1)}
				/>

				<div class="zoom-controls" style={{ left: currentOrder().mode === "run" ? "16px" : "92px" }}>
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
					<button type="button" class="icon-btn" onClick={clearBench}>
						{currentOrder().mode === "run" ? "重置残局" : "清空桌面"}
					</button>
				</div>
			</main>

			<Show when={modalMode() !== null}>
				<CompendiumModal
					mode={modalMode() as "compendium" | "map"}
					orders={ORDERS}
					currentOrderIndex={orderIndex()}
					clearedStars={clearedStars()}
					registry={registry}
					gadgetNames={gadgetNames()}
					onSelectOrder={selectOrder}
					onClose={() => setModalMode(null)}
				/>
			</Show>
		</div>
	);
}
