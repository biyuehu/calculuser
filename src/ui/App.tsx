import { type JSX, Show, createMemo, createSignal } from "solid-js";
import { setMasterVolume } from "../audio/synth";
import { LEVELS, getContinueOrderIndex, getOrderCode, getToolDefinition } from "../content";
import { type Registry, createBuiltinRegistry, registerGadget } from "../engine/gadget";
import { parseLambda } from "../engine/parse";
import { clearWorkshop, loadSettings, loadWorkshop, saveSettings, saveWorkshop } from "../engine/storage";
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

	for (const order of LEVELS) {
		if (order.mode === "build" && order.unlocksToolId !== void 0 && clearedStars().has(order.id)) {
			const tool = getToolDefinition(order.unlocksToolId);
			if (tool !== null && tool.defText !== null && !registry.has(tool.id)) {
				registerGadget(registry, tool.id, parseLambda(tool.defText), "level");
			}
		}
	}

	const currentOrder = createMemo(() => LEVELS[orderIndex()]);

	const continueIndex = createMemo(() => getContinueOrderIndex(clearedStars()));
	const continueCode = createMemo((): string => getOrderCode(LEVELS[continueIndex()].id));

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
									setOrderIndex(continueIndex());
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
								currentOrderIndex={orderIndex()}
								clearedStars={clearedStars()}
								registry={registry}
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
								judgeMode={settings().judgeMode}
								clearedStars={clearedStars()}
								isLastOrder={orderIndex() === LEVELS.length - 1}
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
