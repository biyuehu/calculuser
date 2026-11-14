import type { SettingsState } from "../ui/modals/SettingsModal";

const STORAGE_KEY = "calculuser_workshop_v2";
const SETTINGS_KEY = "calculuser_settings_v1";
const DEFAULT_SETTINGS: SettingsState = { volume: 1, reducedMotion: false, judgeMode: false };

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
