import { type JSX, Show, createMemo, createSignal } from "solid-js";
import { setMasterVolume } from "../audio/synth";
import { type Registry, createBuiltinRegistry, registerGadget } from "../engine/gadget";
import {
	STORAGE_KEY,
	type SavedWorkshop,
	loadSettings,
	loadWorkshop,
	saveSettings,
	saveWorkshop,
} from "../engine/storage";
import type { Term } from "../engine/term";
import { ORDERS } from "../levels/orders";
import type { ToolDefinition } from "../theme/world";
import { AboutModal } from "./modals/AboutModal";
import { SettingsModal, type SettingsState } from "./modals/SettingsModal";
import { TitleScreen } from "./screens/TitleScreen";
import { WorkshopOverview } from "./screens/WorkshopOverview";
import { WorkbenchView } from "./workbench/WorkbenchView";

export function App(): JSX.Element {
	const saved = loadWorkshop();
	const initialSettings = loadSettings();
	setMasterVolume(initialSettings.volume);

	const registry: Registry = createBuiltinRegistry();
	const initialNames = new Map<string, string>();
	for (const item of saved.unlocked) {
		if (registry.has(item.id)) continue;
		registerGadget(registry, item.id, item.def, "level");
		initialNames.set(item.id, item.name);
	}

	const [screen, setScreen] = createSignal<"title" | "workshop" | "workbench">("title");
	const [workshopOrigin, setWorkshopOrigin] = createSignal<"title" | "workbench">("title");
	const [showSettings, setShowSettings] = createSignal<boolean>(false);
	const [showAbout, setShowAbout] = createSignal<boolean>(false);
	const [settings, setSettings] = createSignal<SettingsState>(initialSettings);
	const [orderIndex, setOrderIndex] = createSignal<number>(0);
	const [clearedStars, setClearedStars] = createSignal<ReadonlyMap<string, number>>(
		new Map(Object.entries(saved.stars)),
	);
	const [unlockedList, setUnlockedList] = createSignal<SavedWorkshop["unlocked"]>(saved.unlocked);
	const [gadgetNames, setGadgetNames] = createSignal<ReadonlyMap<string, string>>(initialNames);

	const currentOrder = createMemo(() => ORDERS[orderIndex()]);

	const continueCode = createMemo((): string => {
		const firstIncomplete = ORDERS.findIndex((order) => !clearedStars().has(order.id));
		const target = ORDERS[firstIncomplete >= 0 ? firstIncomplete : 0];
		const chapterOrders = ORDERS.filter((item) => item.chapter === target.chapter);
		return `${target.chapter}.${chapterOrders.findIndex((item) => item.id === target.id) + 1}`;
	});

	const recordStars = (orderId: string, stars: number): void => {
		const updatedStars = new Map(clearedStars());
		const previousBest = updatedStars.get(orderId);
		if (previousBest === undefined || stars > previousBest) updatedStars.set(orderId, stars);
		setClearedStars(updatedStars);
		saveWorkshop(updatedStars, unlockedList());
	};

	const unlockCanonicalTool = (tool: ToolDefinition, def: Term): void => {
		const updatedNames = new Map(gadgetNames());
		updatedNames.set(tool.id, tool.name);
		setGadgetNames(updatedNames);
		const nextList = [...unlockedList(), { id: tool.id, name: tool.name, def }];
		setUnlockedList(nextList);
		saveWorkshop(clearedStars(), nextList);
	};

	const resetWorkshopData = (): void => {
		localStorage.removeItem(STORAGE_KEY);
		setClearedStars(new Map());
		setUnlockedList([]);
		setGadgetNames(new Map());
		setShowSettings(false);
		setOrderIndex(0);
	};

	return (
		<div class={`workshop-root ${settings().reducedMotion ? "reduced-motion" : ""}`}>
			{(() => {
				switch (screen()) {
					case "title": {
						return (
							<TitleScreen
								continueOrderCode={continueCode()}
								onStart={() => {
									const firstIncomplete = ORDERS.findIndex((order) => !clearedStars().has(order.id));
									setOrderIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
									setScreen("workbench");
								}}
								onOpenWorkshop={() => {
									setWorkshopOrigin("title");
									setScreen("workshop");
								}}
								onOpenSettings={() => setShowSettings(true)}
								onOpenAbout={() => setShowAbout(true)}
							/>
						);
					}
					case "workshop": {
						return (
							<WorkshopOverview
								orders={ORDERS}
								currentOrderIndex={orderIndex()}
								clearedStars={clearedStars()}
								registry={registry}
								gadgetNames={gadgetNames()}
								judgeMode={settings().judgeMode}
								origin={workshopOrigin()}
								onBack={() => setScreen(workshopOrigin())}
								onSelectOrder={(index) => {
									setOrderIndex(index);
									setScreen("workbench");
								}}
							/>
						);
					}
					case "workbench": {
						return (
							<WorkbenchView
								order={currentOrder()}
								registry={registry}
								gadgetNames={gadgetNames()}
								judgeMode={settings().judgeMode}
								clearedStars={clearedStars()}
								isLastOrder={orderIndex() === ORDERS.length - 1}
								onRecordStars={recordStars}
								onUnlockCanonicalTool={unlockCanonicalTool}
								onNextOrder={() => setOrderIndex(orderIndex() + 1)}
								onOpenWorkshop={() => {
									setWorkshopOrigin("workbench");
									setScreen("workshop");
								}}
								onOpenSettings={() => setShowSettings(true)}
								onBackToTitle={() => setScreen("title")}
							/>
						);
					}
				}
			})()}

			<Show when={showSettings()}>
				<SettingsModal
					settings={settings()}
					onUpdateSettings={(updater) => {
						const updated = updater(settings());
						setSettings(updated);
						saveSettings(updated);
					}}
					onResetData={resetWorkshopData}
					onClose={() => setShowSettings(false)}
				/>
			</Show>

			<Show when={showAbout()}>
				<AboutModal onClose={() => setShowAbout(false)} />
			</Show>
		</div>
	);
}
