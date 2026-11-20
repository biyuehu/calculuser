import type { DraftTerm } from "./draft";

export interface SettingsState {
	readonly volume: number;
	readonly reducedMotion: boolean;
	readonly judgeMode: boolean;
	readonly autoSkipRead: boolean;
}

export interface UiPreferences {
	readonly shelfWidth: number;
	readonly orderSlipWidth: number;
	readonly orderSlipCollapsed: boolean;
}

export type SessionState =
	| { readonly screen: "title"; readonly lastOrderId?: string }
	| { readonly screen: "workbench"; readonly lastOrderId: string };

interface SaveData {
	readonly workshop: { readonly stars: Record<string, number> };
	readonly settings: SettingsState;
	readonly uiPrefs: UiPreferences;
	readonly session: SessionState;
	readonly drafts: Record<string, DraftTerm>;
	readonly seenDialogues: readonly string[];
}

export const STORAGE_KEY = "calculuser_save";

const DEFAULT_SETTINGS: SettingsState = {
	volume: 1,
	reducedMotion: false,
	judgeMode: false,
	autoSkipRead: false,
};

const DEFAULT_SESSION: SessionState = { screen: "title" };

export const DEFAULT_UI_PREFS: UiPreferences = {
	shelfWidth: 76,
	orderSlipWidth: 290,
	orderSlipCollapsed: false,
};

const DEFAULT_SAVE_DATA: SaveData = {
	workshop: { stars: {} },
	settings: DEFAULT_SETTINGS,
	uiPrefs: DEFAULT_UI_PREFS,
	session: DEFAULT_SESSION,
	drafts: {},
	seenDialogues: [],
};

function isValidDraft(val: unknown): val is DraftTerm {
	if (!val || typeof val !== "object") return false;
	const r = val as {
		readonly kind?: unknown;
		readonly name?: unknown;
		readonly id?: unknown;
		readonly param?: unknown;
		readonly body?: unknown;
		readonly fn?: unknown;
		readonly arg?: unknown;
	};
	switch (r.kind) {
		case "hole":
			return true;
		case "var":
		case "atom":
			return typeof r.name === "string";
		case "gad":
			return typeof r.id === "string";
		case "lam":
			return typeof r.param === "string" && isValidDraft(r.body);
		case "app":
			return isValidDraft(r.fn) && isValidDraft(r.arg);
		default:
			return false;
	}
}

function sanitizeDrafts(val: unknown): Record<string, DraftTerm> {
	return !val || typeof val !== "object"
		? {}
		: (Object.fromEntries(Object.entries(val).filter(([, v]) => isValidDraft(v))) as Record<string, DraftTerm>);
}

function sanitizeSettings(val: unknown): SettingsState {
	if (!val || typeof val !== "object") return DEFAULT_SETTINGS;
	const r = val as Partial<SettingsState>;
	return {
		volume: typeof r.volume === "number" ? r.volume : DEFAULT_SETTINGS.volume,
		reducedMotion: typeof r.reducedMotion === "boolean" ? r.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
		judgeMode: typeof r.judgeMode === "boolean" ? r.judgeMode : DEFAULT_SETTINGS.judgeMode,
		autoSkipRead: typeof r.autoSkipRead === "boolean" ? r.autoSkipRead : false,
	};
}

function sanitizeUiPrefs(val: unknown): UiPreferences {
	if (!val || typeof val !== "object") return DEFAULT_UI_PREFS;
	const r = val as Partial<UiPreferences>;
	return {
		shelfWidth:
			typeof r.shelfWidth === "number" && r.shelfWidth >= 72 && r.shelfWidth <= 480
				? r.shelfWidth
				: DEFAULT_UI_PREFS.shelfWidth,
		orderSlipWidth:
			typeof r.orderSlipWidth === "number" && r.orderSlipWidth >= 260 && r.orderSlipWidth <= 720
				? r.orderSlipWidth
				: DEFAULT_UI_PREFS.orderSlipWidth,
		orderSlipCollapsed:
			typeof r.orderSlipCollapsed === "boolean" ? r.orderSlipCollapsed : DEFAULT_UI_PREFS.orderSlipCollapsed,
	};
}

function sanitizeSession(val: unknown): SessionState {
	if (!val || typeof val !== "object") return DEFAULT_SESSION;
	const r = val as { readonly lastOrderId?: unknown; readonly screen?: unknown };
	const lastOrderId = typeof r.lastOrderId === "string" ? r.lastOrderId : void 0;
	return r.screen === "workbench" && lastOrderId !== void 0
		? { screen: "workbench", lastOrderId }
		: lastOrderId !== void 0
			? { screen: "title", lastOrderId }
			: { screen: "title" };
}

function loadSaveData(): SaveData {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw === null) return DEFAULT_SAVE_DATA;
		const parsed = JSON.parse(raw);
		return !parsed || typeof parsed !== "object"
			? DEFAULT_SAVE_DATA
			: {
					workshop:
						parsed.workshop && typeof parsed.workshop === "object"
							? { stars: parsed.workshop.stars ?? {} }
							: DEFAULT_SAVE_DATA.workshop,
					settings: sanitizeSettings(parsed.settings),
					uiPrefs: sanitizeUiPrefs(parsed.uiPrefs),
					session: sanitizeSession(parsed.session),
					drafts: sanitizeDrafts(parsed.drafts),
					seenDialogues: Array.isArray(parsed.seenDialogues)
						? parsed.seenDialogues.filter((item: unknown): item is string => typeof item === "string")
						: [],
				};
	} catch {
		return DEFAULT_SAVE_DATA;
	}
}

function mutateSaveData(mutator: (draft: SaveData) => SaveData): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(mutator(loadSaveData())));
	} catch (err) {
		console.warn("Failed to persist save data", err);
	}
}

export function loadWorkshop(): { readonly stars: Record<string, number> } {
	return loadSaveData().workshop;
}

export function saveWorkshop(stars: ReadonlyMap<string, number>): void {
	mutateSaveData((prev) => ({ ...prev, workshop: { stars: Object.fromEntries(stars) } }));
}

export function clearWorkshop(): void {
	mutateSaveData((prev) => ({
		...prev,
		workshop: { stars: {} },
		session: DEFAULT_SESSION,
		drafts: {},
		seenDialogues: [],
		nameplates: {},
	}));
}

export function loadSettings(): SettingsState {
	return loadSaveData().settings;
}

export function saveSettings(settings: SettingsState): void {
	mutateSaveData((prev) => ({ ...prev, settings }));
}

export function loadUiPreferences(): UiPreferences {
	return loadSaveData().uiPrefs;
}

export function saveUiPreferences(uiPrefs: UiPreferences): void {
	mutateSaveData((prev) => ({ ...prev, uiPrefs }));
}

export function loadLevelDrafts(): Record<string, DraftTerm> {
	return loadSaveData().drafts;
}

export function saveLevelDraft(orderId: string, draft: DraftTerm): void {
	mutateSaveData((prev) => ({ ...prev, drafts: { ...prev.drafts, [orderId]: draft } }));
}

export function clearLevelDraft(orderId: string): void {
	mutateSaveData((prev) => ({
		...prev,
		drafts: Object.fromEntries(Object.entries(prev.drafts).filter(([k]) => k !== orderId)),
	}));
}

export function clearLevelDrafts(): void {
	mutateSaveData((prev) => ({ ...prev, drafts: {} }));
}

export function loadSession(): SessionState {
	return loadSaveData().session;
}

export function saveSession(session: SessionState): void {
	mutateSaveData((prev) => ({ ...prev, session }));
}

export function loadSeenDialogues(): ReadonlySet<string> {
	return new Set(loadSaveData().seenDialogues);
}

export function markDialogueSeen(id: string): void {
	mutateSaveData((prev) => ({
		...prev,
		seenDialogues: prev.seenDialogues.includes(id) ? prev.seenDialogues : [...prev.seenDialogues, id],
	}));
}
