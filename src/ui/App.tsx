import { type JSX, Show, createMemo, createSignal } from "solid-js";
import { setMasterVolume } from "../audio/synth";
import { CHAPTERS, getToolDefinition } from "../content";
import { type Registry, createBuiltinRegistry, registerGadget } from "../engine/gadget";
import { parseLambda } from "../engine/parse";
import { STORAGE_KEY, loadSettings, loadWorkshop, saveSettings, saveWorkshop } from "../engine/storage";
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

	const [screen, setScreen] = createSignal<"title" | "workshop" | "workbench">("title");
	const [workshopOrigin, setWorkshopOrigin] = createSignal<"title" | "workbench">("title");
	const [showSettings, setShowSettings] = createSignal<boolean>(false);
	const [showAbout, setShowAbout] = createSignal<boolean>(false);
	const [settings, setSettings] = createSignal<SettingsState>(initialSettings);
	const [orderIndex, setOrderIndex] = createSignal<number>(0);
	const [clearedStars, setClearedStars] = createSignal<ReadonlyMap<string, number>>(
		new Map(Object.entries(saved.stars)),
	);
	const [gadgetNames, setGadgetNames] = createSignal<ReadonlyMap<string, string>>(new Map());

	const allOrders = CHAPTERS.flatMap((c) => c.levels);

	for (const order of allOrders) {
		if (order.mode === "build" && order.unlocksToolId !== undefined && clearedStars().has(order.id)) {
			const tool = getToolDefinition(order.unlocksToolId);
			if (tool !== null && tool.defText !== null && !registry.has(tool.id)) {
				registerGadget(registry, tool.id, parseLambda(tool.defText), "level");
			}
		}
	}

	const currentOrder = createMemo(() => allOrders[orderIndex()]);

	const continueCode = createMemo((): string => {
		const firstIncomplete = allOrders.findIndex((order) => !clearedStars().has(order.id));
		const target = allOrders[firstIncomplete >= 0 ? firstIncomplete : 0];
		const chapter = CHAPTERS.find((c) => c.levels.some((l) => l.id === target.id));
		return chapter !== undefined
			? `${chapter.chapter}.${chapter.levels.findIndex((l) => l.id === target.id) + 1}`
			: "1.1";
	});

	const recordStars = (orderId: string, stars: number): void => {
		const updatedStars = new Map(clearedStars());
		const previousBest = updatedStars.get(orderId);
		if (previousBest === undefined || stars > previousBest) updatedStars.set(orderId, stars);
		setClearedStars(updatedStars);
		saveWorkshop(updatedStars);
	};

	const resetWorkshopData = (): void => {
		localStorage.removeItem(STORAGE_KEY);
		setClearedStars(new Map());
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
									const firstIncomplete = allOrders.findIndex((order) => !clearedStars().has(order.id));
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
								chapters={CHAPTERS}
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
								isLastOrder={orderIndex() === allOrders.length - 1}
								onRecordStars={recordStars}
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
