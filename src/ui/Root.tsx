import { type JSX, Show, createEffect, createMemo, createSignal } from "solid-js";
import { setMasterVolume } from "../audio/synth";
import {
	BUILTIN_COUNT,
	COMBINATORS,
	type DialogueBeat,
	LEVELS,
	LEVEL_DIALOGUES,
	SANDBOX_ORDER,
	getContinueOrderIndex,
	getOrderCode,
	getToolDefinition,
	isToolUnlocked,
} from "../content";
import { type Registry, createRegistry, parseLambda, registerGadget } from "../engine";
import {
	type SettingsState,
	clearSave,
	loadCustomGadgets,
	loadIntroSeen,
	loadSeenDialogues,
	loadSession,
	loadSettings,
	loadWorkshop,
	markDialogueSeen,
	markIntroSeen,
	saveSession,
	saveSettings,
	saveWorkshop,
} from "../storage";
import { transitionView } from "../utils/transition";
import { IntroSequence } from "./overlays/IntroSequence";
import { MachineryPanel } from "./overlays/MachineryPanel";
import { WorkshopFolio } from "./overlays/WorkshopFolio";
import { CounterView } from "./views/CounterView";
import { TitleView } from "./views/TitleView";
import { WorkbenchView } from "./views/WorkbenchView";

function registerAllCombinators(registry: Registry): void {
	for (const def of COMBINATORS) {
		if (!registry.has(def.id)) registerGadget(registry, def.id, parseLambda(def.defText), "level");
	}
	for (const custom of Object.values(loadCustomGadgets())) {
		registerGadget(registry, custom.id, custom.term, "custom");
	}
}

function syncRegistryWithUnlocked(registry: Registry, stars: ReadonlyMap<string, number>, isJudge: boolean): void {
	for (const key of Array.from(registry.keys())) {
		const item = registry.get(key);
		if (
			item !== void 0 &&
			(item.origin === "level" || item.origin === "custom") &&
			!isToolUnlocked(key, stars, isJudge)
		)
			registry.delete(key);
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

	const registry: Registry = createRegistry(COMBINATORS.slice(0, BUILTIN_COUNT));
	const initialStars = new Map(Object.entries(saved.stars));
	if (initialSession.lastOrderId === "sandbox") registerAllCombinators(registry);
	else syncRegistryWithUnlocked(registry, initialStars, initialSettings.judgeMode);

	const initialIndex = (() => {
		const savedIdx =
			initialSession.lastOrderId !== void 0 ? LEVELS.findIndex((item) => item.id === initialSession.lastOrderId) : -1;
		return savedIdx >= 0 ? savedIdx : getContinueOrderIndex(initialStars);
	})();
	const [screen, setScreen] = createSignal<"title" | "workbench">(
		initialSession.lastOrderId !== void 0 ? initialSession.screen : "title",
	);
	const [showIntro, setShowIntro] = createSignal<boolean>(screen() === "title" && !loadIntroSeen());
	const [showFolio, setShowFolio] = createSignal<boolean>(false);
	const [folioTab, setFolioTab] = createSignal<"orders" | "parts">("orders");
	const [showMachinery, setShowMachinery] = createSignal<boolean>(false);
	const [machineryTab, setMachineryTab] = createSignal<"settings" | "controls" | "about">("settings");
	const [settings, setSettings] = createSignal<SettingsState>(initialSettings);

	createEffect(() => {
		if (typeof document !== "undefined")
			document.documentElement.classList.toggle("reduced-motion", settings().reducedMotion);
	});
	const [isSandbox, setIsSandbox] = createSignal<boolean>(initialSession.lastOrderId === "sandbox");
	const [orderIndex, setOrderIndex] = createSignal<number>(initialIndex);
	const [clearedStars, setClearedStars] = createSignal<ReadonlyMap<string, number>>(
		new Map(Object.entries(saved.stars)),
	);
	const [activeBeat, setActiveBeat] = createSignal<DialogueBeat | null>(null);
	const [cameraView, setCameraView] = createSignal<"bench" | "counter">("bench");

	createEffect(() => {
		if (isSandbox()) registerAllCombinators(registry);
		else syncRegistryWithUnlocked(registry, clearedStars(), settings().judgeMode);
	});

	const currentOrder = createMemo(() => (isSandbox() ? SANDBOX_ORDER : LEVELS[orderIndex()]));

	const continueCode = createMemo((): string => (isSandbox() ? "∞" : getOrderCode(LEVELS[orderIndex()].id)));

	const selectOrder = (index: number): void => {
		setIsSandbox(false);
		setOrderIndex(index);
		saveSession({ lastOrderId: LEVELS[index].id, screen: "workbench" });
	};

	const selectSandbox = (): void => {
		setIsSandbox(true);
		saveSession({ lastOrderId: "sandbox", screen: "workbench" });
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

	const toggleFolio = (tab: "orders" | "parts"): void => {
		if (showFolio()) setShowFolio(false);
		else {
			setFolioTab(tab);
			setShowFolio(true);
		}
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

	const openMachinery = (tab: "settings" | "controls" | "about"): void => {
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
							active={screen() === "workbench"}
							order={currentOrder()}
							registry={registry}
							judgeMode={settings().judgeMode}
							clearedStars={clearedStars()}
							xRayMode={settings().xRayMode}
							onToggleXRay={toggleXRay}
							isLastOrder={orderIndex() === LEVELS.length - 1}
							onRecordStars={recordStars}
							onNextOrder={handleNextOrderAdvance}
							onOpenWorkshop={() => toggleFolio("orders")}
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
							if (!isSandbox()) selectOrder(orderIndex());
							setScreen("workbench");
						}, "forward");
					}}
					onOpenSandbox={() => {
						transitionView(() => {
							selectSandbox();
							setScreen("workbench");
						}, "forward");
					}}
					onOpenWorkshop={() => toggleFolio("orders")}
					onOpenSettings={() => openMachinery("settings")}
					onOpenAbout={() => openMachinery("about")}
				/>
			</Show>

			<Show when={showIntro()}>
				<IntroSequence
					reducedMotion={settings().reducedMotion}
					onComplete={() => {
						markIntroSeen();
						setShowIntro(false);
					}}
				/>
			</Show>

			<Show when={showFolio()}>
				<WorkshopFolio
					initialTab={folioTab()}
					currentOrderIndex={orderIndex()}
					isSandboxActive={isSandbox()}
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
					onSelectSandbox={() => {
						transitionView(() => {
							selectSandbox();
							setScreen("workbench");
						}, "forward");
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
