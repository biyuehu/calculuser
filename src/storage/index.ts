import type { DraftTerm, Term } from "../engine";
import {
	type CustomGadgetRecord,
	DEFAULT_SESSION,
	DEFAULT_SETTINGS,
	DEFAULT_UI_PREFS,
	STORAGE_KEY,
	type SaveData,
	type SessionState,
	type SettingsState,
	type UiPreferences,
} from "./types";

export * from "./types";

const DEFAULT_SAVE_DATA: SaveData = {
	workshop: { stars: {} },
	settings: DEFAULT_SETTINGS,
	uiPrefs: DEFAULT_UI_PREFS,
	session: DEFAULT_SESSION,
	drafts: {},
	customGadgets: {},
	seenDialogues: [],
	introSeen: false,
};

function isValidTerm(val: unknown): val is Term {
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
		case "var":
			return typeof (val as { readonly index?: unknown }).index === "number" && typeof r.name === "string";
		case "atom":
			return typeof r.name === "string";
		case "gad":
			return typeof r.id === "string";
		case "lam":
			return typeof r.param === "string" && isValidTerm(r.body);
		case "app":
			return isValidTerm(r.fn) && isValidTerm(r.arg);
		default:
			return false;
	}
}

function sanitizeCustomGadgets(val: unknown): Record<string, CustomGadgetRecord> {
	return !val || typeof val !== "object"
		? {}
		: (Object.fromEntries(
				Object.entries(val).filter(([, v]) => {
					if (!v || typeof v !== "object") return false;
					const r = v as { readonly id?: unknown; readonly name?: unknown; readonly term?: unknown };
					return typeof r.id === "string" && (r.name === void 0 || typeof r.name === "string") && isValidTerm(r.term);
				}),
			) as Record<string, CustomGadgetRecord>);
}

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
		xRayMode: typeof r.xRayMode === "boolean" ? r.xRayMode : DEFAULT_SETTINGS.xRayMode,
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
					customGadgets: sanitizeCustomGadgets(parsed.customGadgets),
					seenDialogues: Array.isArray(parsed.seenDialogues)
						? parsed.seenDialogues.filter((item: unknown): item is string => typeof item === "string")
						: [],
					introSeen: typeof parsed.introSeen === "boolean" ? parsed.introSeen : true,
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

export const loadWorkshop = (): { readonly stars: Record<string, number> } => loadSaveData().workshop;

export const saveWorkshop = (stars: ReadonlyMap<string, number>): void =>
	mutateSaveData((prev) => ({ ...prev, workshop: { stars: Object.fromEntries(stars) } }));

export const clearSave = (): void => localStorage.removeItem(STORAGE_KEY);

export const loadSettings = (): SettingsState => loadSaveData().settings;

export const saveSettings = (settings: SettingsState): void => mutateSaveData((prev) => ({ ...prev, settings }));

export const loadUiPreferences = (): UiPreferences => loadSaveData().uiPrefs;

export const saveUiPreferences = (uiPrefs: UiPreferences): void => mutateSaveData((prev) => ({ ...prev, uiPrefs }));

export const loadLevelDrafts = (): Record<string, DraftTerm> => loadSaveData().drafts;

export const saveLevelDraft = (orderId: string, draft: DraftTerm): void =>
	mutateSaveData((prev) => ({ ...prev, drafts: { ...prev.drafts, [orderId]: draft } }));

export const clearLevelDraft = (orderId: string): void =>
	mutateSaveData((prev) => {
		const nextDrafts = { ...prev.drafts };
		delete nextDrafts[orderId];
		return { ...prev, drafts: nextDrafts };
	});

export const clearLevelDrafts = (): void => mutateSaveData((prev) => ({ ...prev, drafts: {} }));

export const loadCustomGadgets = (): Record<string, CustomGadgetRecord> => loadSaveData().customGadgets;

export const saveCustomGadget = (record: CustomGadgetRecord): void =>
	mutateSaveData((prev) => ({ ...prev, customGadgets: { ...prev.customGadgets, [record.id]: record } }));

export const deleteCustomGadget = (id: string): void =>
	mutateSaveData((prev) => {
		const next = { ...prev.customGadgets };
		delete next[id];
		return { ...prev, customGadgets: next };
	});

export const loadSession = (): SessionState => loadSaveData().session;

export const saveSession = (session: SessionState): void => mutateSaveData((prev) => ({ ...prev, session }));

export const loadSeenDialogues = (): ReadonlySet<string> => new Set(loadSaveData().seenDialogues);

export const markDialogueSeen = (dialogueId: string): void =>
	mutateSaveData((prev) => ({
		...prev,
		seenDialogues: prev.seenDialogues.includes(dialogueId) ? prev.seenDialogues : [...prev.seenDialogues, dialogueId],
	}));

export const loadIntroSeen = (): boolean => loadSaveData().introSeen ?? false;

export const markIntroSeen = (): void => mutateSaveData((prev) => ({ ...prev, introSeen: true }));
