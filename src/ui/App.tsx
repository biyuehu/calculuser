import { type JSX, Show, createMemo, createSignal } from "solid-js";
import { setMasterVolume } from "../audio/synth";
import { LEVELS, getContinueOrderIndex, getOrderCode, getToolDefinition } from "../content";
import { type Registry, createBuiltinRegistry, registerGadget } from "../engine/gadget";
import { parseLambda } from "../engine/parse";
import {
	type SettingsState,
	clearWorkshop,
	loadSession,
	loadSettings,
	loadWorkshop,
	saveSession,
	saveSettings,
	saveWorkshop,
} from "../engine/storage";
import { MachineryPanel } from "./overlays/MachineryPanel";
import { WorkshopFolio } from "./overlays/WorkshopFolio";
import { TitleScreen } from "./screens/TitleScreen";
import { WorkbenchView } from "./workbench/WorkbenchView";

export function App(): JSX.Element {
	const saved = loadWorkshop();
	const initialSettings = loadSettings();
	const initialSession = loadSession();
	setMasterVolume(initialSettings.volume);

	const registry: Registry = createBuiltinRegistry();

	const savedOrderIndex =
		initialSession.lastOrderId !== null ? LEVELS.findIndex((item) => item.id === initialSession.lastOrderId) : -1;
	const [screen, setScreen] = createSignal<"title" | "workbench">(
		savedOrderIndex >= 0 ? initialSession.screen : "title",
	);
	const [showFolio, setShowFolio] = createSignal<boolean>(false);
	const [folioTab, setFolioTab] = createSignal<"orders" | "parts">("orders");
	const [showMachinery, setShowMachinery] = createSignal<boolean>(false);
	const [machineryTab, setMachineryTab] = createSignal<"settings" | "about">("settings");
	const [settings, setSettings] = createSignal<SettingsState>(initialSettings);
	const [orderIndex, setOrderIndex] = createSignal<number>(savedOrderIndex >= 0 ? savedOrderIndex : 0);
	const [clearedStars, setClearedStars] = createSignal<ReadonlyMap<string, number>>(
		new Map(Object.entries(saved.stars)),
	);

	for (const order of LEVELS) {
		if (order.mode === "build" && order.unlocksToolId !== void 0 && clearedStars().has(order.id)) {
			const tool = getToolDefinition(order.unlocksToolId);
			if (tool !== null && tool.defText !== null && !registry.has(tool.id)) {
				registerGadget(registry, tool.id, parseLambda(tool.defText), "level");
			}
		}
	}

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
	};

	const resetWorkshopData = (): void => {
		clearWorkshop();
		setClearedStars(new Map());
		setShowMachinery(false);
		setOrderIndex(0);
		setScreen("title");
	};

	const openFolio = (tab: "orders" | "parts"): void => {
		setFolioTab(tab);
		setShowFolio(true);
	};

	const openMachinery = (tab: "settings" | "about"): void => {
		setMachineryTab(tab);
		setShowMachinery(true);
	};

	return (
		<div class={`workshop-root ${settings().reducedMotion ? "reduced-motion" : ""}`}>
			<Show
				when={screen() === "workbench"}
				fallback={
					<TitleScreen
						continueOrderCode={continueCode()}
						onStart={() => {
							selectOrder(continueIndex());
							setScreen("workbench");
						}}
						onOpenWorkshop={() => openFolio("orders")}
						onOpenSettings={() => openMachinery("settings")}
						onOpenAbout={() => openMachinery("about")}
					/>
				}
			>
				<WorkbenchView
					order={currentOrder()}
					registry={registry}
					judgeMode={settings().judgeMode}
					clearedStars={clearedStars()}
					isLastOrder={orderIndex() === LEVELS.length - 1}
					onRecordStars={recordStars}
					onNextOrder={() => selectOrder(orderIndex() + 1)}
					onOpenWorkshop={() => openFolio("orders")}
					onOpenSettings={() => openMachinery("settings")}
					onBackToTitle={() => {
						saveSession({ lastOrderId: LEVELS[orderIndex()].id, screen: "title" });
						setScreen("title");
					}}
				/>
			</Show>

			<Show when={showFolio()}>
				<WorkshopFolio
					initialTab={folioTab()}
					currentOrderIndex={orderIndex()}
					clearedStars={clearedStars()}
					registry={registry}
					judgeMode={settings().judgeMode}
					onSelectOrder={(index) => {
						selectOrder(index);
						setScreen("workbench");
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
					}}
					onResetData={resetWorkshopData}
					onClose={() => setShowMachinery(false)}
				/>
			</Show>
		</div>
	);
}
