import type { DraftTerm } from "./draft";

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

export interface SessionState {
	readonly lastOrderId: string | null;
	readonly screen: "title" | "workbench";
}

const STORAGE_KEY = "calculuser_workshop_v2";
const SETTINGS_KEY = "calculuser_settings_v1";
const UI_PREFS_KEY = "calculuser_ui_prefs_v1";
const DRAFT_STORAGE_KEY = "calculuser_drafts_v1";
const SESSION_STORAGE_KEY = "calculuser_session_v1";
const DEFAULT_SETTINGS: SettingsState = { volume: 1, reducedMotion: false, judgeMode: false };
const DEFAULT_SESSION: SessionState = { lastOrderId: null, screen: "title" };
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
		localStorage.removeItem(DRAFT_STORAGE_KEY);
		localStorage.removeItem(SESSION_STORAGE_KEY);
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

function isValidDraft(val: unknown): val is DraftTerm {
	if (!val || typeof val !== "object") return false;
	const record = val as {
		readonly kind?: unknown;
		readonly name?: unknown;
		readonly id?: unknown;
		readonly param?: unknown;
		readonly body?: unknown;
		readonly fn?: unknown;
		readonly arg?: unknown;
	};
	switch (record.kind) {
		case "hole": {
			return true;
		}
		case "var":
		case "atom": {
			return typeof record.name === "string";
		}
		case "gad": {
			return typeof record.id === "string";
		}
		case "lam": {
			return typeof record.param === "string" && isValidDraft(record.body);
		}
		case "app": {
			return isValidDraft(record.fn) && isValidDraft(record.arg);
		}
		default: {
			return false;
		}
	}
}

export function loadLevelDrafts(): Record<string, DraftTerm> {
	try {
		const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
		if (raw === null) return {};
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return {};
		const result: Record<string, DraftTerm> = {};
		for (const [key, value] of Object.entries(parsed)) {
			if (isValidDraft(value)) result[key] = value;
		}
		return result;
	} catch {
		return {};
	}
}

export function saveLevelDraft(orderId: string, draft: DraftTerm): void {
	try {
		const current = loadLevelDrafts();
		current[orderId] = draft;
		localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(current));
	} catch {}
}

export function clearLevelDraft(orderId: string): void {
	try {
		const current = loadLevelDrafts();
		if (current[orderId] !== void 0) {
			delete current[orderId];
			localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(current));
		}
	} catch {}
}

export function clearLevelDrafts(): void {
	try {
		localStorage.removeItem(DRAFT_STORAGE_KEY);
	} catch {}
}

export function loadSession(): SessionState {
	try {
		const raw = localStorage.getItem(SESSION_STORAGE_KEY);
		if (raw === null) return DEFAULT_SESSION;
		const parsed = JSON.parse(raw);
		return !parsed || typeof parsed !== "object"
			? DEFAULT_SESSION
			: {
					lastOrderId: typeof parsed.lastOrderId === "string" ? parsed.lastOrderId : null,
					screen: parsed.screen === "workbench" ? "workbench" : "title",
				};
	} catch {
		return DEFAULT_SESSION;
	}
}

export function saveSession(session: SessionState): void {
	try {
		localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
	} catch {}
}
