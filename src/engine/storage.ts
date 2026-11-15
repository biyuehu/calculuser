export interface SettingsState {
	readonly volume: number;
	readonly reducedMotion: boolean;
	readonly judgeMode: boolean;
}

export interface UiPreferences {
	readonly shelfWidth: number;
	readonly orderSlipWidth: number;
	readonly orderSlipCollapsed: boolean;
}

const STORAGE_KEY = "calculuser_workshop_v2";
const SETTINGS_KEY = "calculuser_settings_v1";
const UI_PREFS_KEY = "calculuser_ui_prefs_v1";
const DEFAULT_SETTINGS: SettingsState = { volume: 1, reducedMotion: false, judgeMode: false };
export const DEFAULT_UI_PREFS: UiPreferences = {
	shelfWidth: 76,
	orderSlipWidth: 290,
	orderSlipCollapsed: false,
};

interface SavedWorkshop {
	readonly stars: Record<string, number>;
}

export function loadWorkshop(): SavedWorkshop {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw === null) return { stars: {} };
		const parsed = JSON.parse(raw) as SavedWorkshop;
		return { stars: parsed.stars !== void 0 ? parsed.stars : {} };
	} catch {
		return { stars: {} };
	}
}

export function saveWorkshop(stars: ReadonlyMap<string, number>): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ stars: Object.fromEntries(stars) }));
	} catch {}
}

export function clearWorkshop(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {}
}

export function loadSettings(): SettingsState {
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		if (raw === null) return DEFAULT_SETTINGS;
		const parsed = JSON.parse(raw) as SettingsState;
		return { volume: parsed.volume, reducedMotion: parsed.reducedMotion, judgeMode: parsed.judgeMode };
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export function saveSettings(settings: SettingsState): void {
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
	} catch {}
}

export function loadUiPreferences(): UiPreferences {
	try {
		const raw = localStorage.getItem(UI_PREFS_KEY);
		if (raw === null) return DEFAULT_UI_PREFS;
		const parsed = JSON.parse(raw);
		return !parsed || typeof parsed !== "object"
			? DEFAULT_UI_PREFS
			: {
					shelfWidth:
						typeof parsed.shelfWidth === "number" && parsed.shelfWidth >= 72 && parsed.shelfWidth <= 480
							? parsed.shelfWidth
							: DEFAULT_UI_PREFS.shelfWidth,
					orderSlipWidth:
						typeof parsed.orderSlipWidth === "number" && parsed.orderSlipWidth >= 260 && parsed.orderSlipWidth <= 720
							? parsed.orderSlipWidth
							: DEFAULT_UI_PREFS.orderSlipWidth,
					orderSlipCollapsed:
						typeof parsed.orderSlipCollapsed === "boolean"
							? parsed.orderSlipCollapsed
							: DEFAULT_UI_PREFS.orderSlipCollapsed,
				};
	} catch {
		return DEFAULT_UI_PREFS;
	}
}

export function saveUiPreferences(prefs: UiPreferences): void {
	try {
		localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
	} catch {}
}
