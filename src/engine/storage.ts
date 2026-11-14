import type { SettingsState } from "../ui/modals/SettingsModal";

export const STORAGE_KEY = "calculuser_workshop_v2";
export const SETTINGS_KEY = "calculuser_settings_v1";

export interface SavedWorkshop {
	readonly stars: Record<string, number>;
}

export function loadWorkshop(): SavedWorkshop {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw === null) return { stars: {} };
		const parsed = JSON.parse(raw) as SavedWorkshop;
		return { stars: parsed.stars !== undefined ? parsed.stars : {} };
	} catch {
		return { stars: {} };
	}
}

export function saveWorkshop(stars: ReadonlyMap<string, number>): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ stars: Object.fromEntries(stars) }));
	} catch {}
}

export function loadSettings(): SettingsState {
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		if (raw === null) return { volume: 1, reducedMotion: false, judgeMode: false };
		const parsed = JSON.parse(raw) as SettingsState;
		return { volume: parsed.volume, reducedMotion: parsed.reducedMotion, judgeMode: parsed.judgeMode };
	} catch {
		return { volume: 1, reducedMotion: false, judgeMode: false };
	}
}

export function saveSettings(settings: SettingsState): void {
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
	} catch {}
}
