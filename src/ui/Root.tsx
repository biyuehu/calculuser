import { type JSX, Show, createEffect, createMemo, createSignal } from "solid-js";
import { setMasterVolume } from "../audio/synth";
import {
	type DialogueBeat,
	LEVELS,
	LEVEL_DIALOGUES,
	getContinueOrderIndex,
	getOrderCode,
	getToolDefinition,
	isToolUnlocked,
} from "../content";
import { type Registry, createBuiltinRegistry, registerGadget } from "../engine/gadget";
import { parseLambda } from "../engine/parse";
import {
	type SettingsState,
	clearSave,
	loadSeenDialogues,
	loadSession,
	loadSettings,
	loadWorkshop,
	markDialogueSeen,
	saveSession,
	saveSettings,
	saveWorkshop,
} from "../engine/storage";
import { MachineryPanel } from "./overlays/MachineryPanel";
import { WorkshopFolio } from "./overlays/WorkshopFolio";
import { CounterView } from "./views/CounterView";
import { TitleView } from "./views/TitleView";
import { WorkbenchView } from "./views/WorkbenchView";
import { transitionView } from "../utils/transition";

function syncRegistryWithUnlocked(registry: Registry, stars: ReadonlyMap<string, number>, isJudge: boolean): void {
	for (const key of Array.from(registry.keys())) {
		const item = registry.get(key);
		if (item !== void 0 && item.origin === "level" && !isToolUnlocked(key, stars, isJudge)) registry.delete(key);
	}
	for (const order of LEVELS)
		if (
			order.mode === "build" &&
			order.unlocksToolId !== void 0 &&
			isToolUnlocked(order.unlocksToolId, stars, isJudge)
		) {
			const tool = getToolDefinition(order.unlocksToolId);
			if (tool !== null && !registry.has(tool.id))
				registerGadget(registry, tool.id, parseLambda(tool.defText), "level");
		}
}

export function Root(): JSX.Element {
	const saved = loadWorkshop();
	const initialSettings = loadSettings();
	const initialSession = loadSession();
	setMasterVolume(initialSettings.volume);

	const registry: Registry = createBuiltinRegistry();
	const initialStars = new Map(Object.entries(saved.stars));
	syncRegistryWithUnlocked(registry, initialStars, initialSettings.judgeMode);

	const savedOrderIndex =
		initialSession.lastOrderId !== void 0 ? LEVELS.findIndex((item) => item.id === initialSession.lastOrderId) : -1;
	const [screen, setScreen] = createSignal<"title" | "workbench">(
		savedOrderIndex >= 0 ? initialSession.screen : "title",
	);
	const [showFolio, setShowFolio] = createSignal<boolean>(false);
	const [folioTab, setFolioTab] = createSignal<"orders" | "parts">("orders");
	const [showMachinery, setShowMachinery] = createSignal<boolean>(false);
	const [machineryTab, setMachineryTab] = createSignal<"settings" | "about">("settings");
	const [settings, setSettings] = createSignal<SettingsState>(initialSettings);

	createEffect(() => {
		if (typeof document !== "undefined")
			document.documentElement.classList.toggle("reduced-motion", settings().reducedMotion);
	});
	const [orderIndex, setOrderIndex] = createSignal<number>(savedOrderIndex >= 0 ? savedOrderIndex : 0);
	const [clearedStars, setClearedStars] = createSignal<ReadonlyMap<string, number>>(
		new Map(Object.entries(saved.stars)),
	);
	const [activeBeat, setActiveBeat] = createSignal<DialogueBeat | null>(null);
	const [cameraView, setCameraView] = createSignal<"bench" | "counter">("bench");

	createEffect(() => syncRegistryWithUnlocked(registry, clearedStars(), settings().judgeMode));

	const currentOrder = createMemo(() => LEVELS[orderIndex()]);

	const continueIndex = createMemo((): number =>
		savedOrderIndex >= 0 ? savedOrderIndex : getContinueOrderIndex(clearedStars()),
	);
	const continueCode = createMemo((): string => getOrderCode(LEVELS[continueIndex()].id));

	const selectOrder = (index: number): void => {
		setOrderIndex(index);
		saveSession({ lastOrderId: LEVELS[index].id, screen: "workbench" });
	};

	const recordStars = (orderId: string, stars: number): void => {
		const updatedStars = new Map(clearedStars());
		const previousBest = updatedStars.get(orderId);
		if (previousBest === void 0 || stars > previousBest) updatedStars.set(orderId, stars);
		setClearedStars(updatedStars);
		saveWorkshop(updatedStars);
		syncRegistryWithUnlocked(registry, updatedStars, settings().judgeMode);
	};

	const resetWorkshopData = (): void => {
		clearSave();
		setClearedStars(new Map());
		setSettings(loadSettings());
		setMasterVolume(loadSettings().volume);
		syncRegistryWithUnlocked(registry, new Map(), loadSettings().judgeMode);
		setShowMachinery(false);
		setOrderIndex(0);
		setScreen("title");
		setTimeout(() => window.location.reload(), 100);
	};

	const openFolio = (tab: "orders" | "parts"): void => {
		setFolioTab(tab);
		setShowFolio(true);
	};

	const handleNextOrderAdvance = (): void => {
		const beat = LEVEL_DIALOGUES[currentOrder().id];
		if (beat !== void 0 && (!settings().autoSkipRead || !loadSeenDialogues().has(beat.id))) {
			setActiveBeat(beat);
			setCameraView("counter");
			return;
		}
		if (orderIndex() < LEVELS.length - 1) transitionView(() => selectOrder(orderIndex() + 1), "forward");
	};

	const toggleAutoSkipRead = (): void => {
		const updated = { ...settings(), autoSkipRead: !settings().autoSkipRead };
		setSettings(updated);
		saveSettings(updated);
	};

	const toggleXRay = (): void => {
		const updated = { ...settings(), xRayMode: !settings().xRayMode };
		setSettings(updated);
		saveSettings(updated);
	};

	const dismissCounter = (): void => {
		const beat = activeBeat();
		if (beat !== null) markDialogueSeen(beat.id);
		setActiveBeat(null);
		setCameraView("bench");
		if (orderIndex() < LEVELS.length - 1)
			setTimeout(() => transitionView(() => selectOrder(orderIndex() + 1), "forward"), 360);
	};

	const openMachinery = (tab: "settings" | "about"): void => {
		setMachineryTab(tab);
		setShowMachinery(true);
	};

	return (
		<div class={`workshop-root ${settings().reducedMotion ? "reduced-motion" : ""}`}>
			<div
				class={`workshop-camera-viewport camera-${cameraView()}`}
				style={{ "pointer-events": screen() === "title" ? "none" : "auto" }}
			>
				<div class="camera-world-stage">
					<div class="camera-counter-slot">
						<CounterView
							beat={activeBeat() ?? void 0}
							autoSkipRead={settings().autoSkipRead}
							onToggleAutoSkipRead={toggleAutoSkipRead}
							onComplete={dismissCounter}
							onSkip={dismissCounter}
						/>
					</div>
					<div class="camera-bench-slot">
						<WorkbenchView
							order={currentOrder()}
							registry={registry}
							judgeMode={settings().judgeMode}
							clearedStars={clearedStars()}
							xRayMode={settings().xRayMode}
							onToggleXRay={toggleXRay}
							isLastOrder={orderIndex() === LEVELS.length - 1}
							onRecordStars={recordStars}
							onNextOrder={handleNextOrderAdvance}
							onOpenWorkshop={() => openFolio("orders")}
							onOpenSettings={() => openMachinery("settings")}
							onBackToTitle={() => {
								transitionView(() => {
									saveSession({ lastOrderId: LEVELS[orderIndex()].id, screen: "title" });
									setScreen("title");
								}, "backward");
							}}
						/>
					</div>
				</div>
			</div>

			<Show when={screen() === "title"}>
				<TitleView
					continueOrderCode={continueCode()}
					onStart={() => {
						transitionView(() => {
							selectOrder(continueIndex());
							setScreen("workbench");
						}, "forward");
					}}
					onOpenWorkshop={() => openFolio("orders")}
					onOpenSettings={() => openMachinery("settings")}
					onOpenAbout={() => openMachinery("about")}
				/>
			</Show>

			<Show when={showFolio()}>
				<WorkshopFolio
					initialTab={folioTab()}
					currentOrderIndex={orderIndex()}
					clearedStars={clearedStars()}
					judgeMode={settings().judgeMode}
					reducedMotion={settings().reducedMotion}
					onSelectOrder={(index) => {
						const dir = index >= orderIndex() ? "forward" : "backward";
						transitionView(() => {
							selectOrder(index);
							setScreen("workbench");
						}, dir);
					}}
					onClose={() => setShowFolio(false)}
				/>
			</Show>

			<Show when={showMachinery()}>
				<MachineryPanel
					initialTab={machineryTab()}
					settings={settings()}
					onUpdateSettings={(updater) => {
						const updated = updater(settings());
						setSettings(updated);
						saveSettings(updated);
						syncRegistryWithUnlocked(registry, clearedStars(), updated.judgeMode);
					}}
					onResetData={resetWorkshopData}
					onClose={() => setShowMachinery(false)}
				/>
			</Show>
		</div>
	);
}
