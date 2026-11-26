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
	achievements: {},
	unlockedMusic: [],
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

function sanitizeAchievements(val: unknown): Record<string, number> {
	return !val || typeof val !== "object"
		? {}
		: (Object.fromEntries(Object.entries(val).filter(([, v]) => typeof v === "number" && Number.isFinite(v))) as Record<
				string,
				number
			>);
}

function sanitizeSettings(val: unknown): SettingsState {
	if (!val || typeof val !== "object") return DEFAULT_SETTINGS;
	const r = val as Partial<SettingsState>;
	return {
		volume: typeof r.volume === "number" ? r.volume : DEFAULT_SETTINGS.volume,
		bgmVolume:
			typeof r.bgmVolume === "number" && r.bgmVolume >= 0 && r.bgmVolume <= 1
				? r.bgmVolume
				: DEFAULT_SETTINGS.bgmVolume,
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

function parseSaveData(raw: string): SaveData | null {
	try {
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
		const r = parsed as Record<string, unknown>;
		if (
			r.workshop === void 0 &&
			r.settings === void 0 &&
			r.session === void 0 &&
			r.drafts === void 0 &&
			r.achievements === void 0 &&
			r.unlockedMusic === void 0
		)
			return null;
		return {
			workshop:
				r.workshop && typeof r.workshop === "object"
					? { stars: (r.workshop as { readonly stars?: Record<string, number> }).stars ?? {} }
					: DEFAULT_SAVE_DATA.workshop,
			settings: sanitizeSettings(r.settings),
			uiPrefs: sanitizeUiPrefs(r.uiPrefs),
			session: sanitizeSession(r.session),
			drafts: sanitizeDrafts(r.drafts),
			customGadgets: sanitizeCustomGadgets(r.customGadgets),
			seenDialogues: Array.isArray(r.seenDialogues)
				? r.seenDialogues.filter((item: unknown): item is string => typeof item === "string")
				: [],
			introSeen: typeof r.introSeen === "boolean" ? r.introSeen : true,
			achievements: sanitizeAchievements(r.achievements),
			unlockedMusic: Array.isArray(r.unlockedMusic)
				? r.unlockedMusic.filter((item: unknown): item is string => typeof item === "string")
				: [],
		};
	} catch {
		return null;
	}
}

function loadSaveData(): SaveData {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw === null ? DEFAULT_SAVE_DATA : (parseSaveData(raw) ?? DEFAULT_SAVE_DATA);
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

export const loadAchievements = (): Record<string, number> => loadSaveData().achievements ?? {};

export const saveAchievement = (id: string): boolean => {
	const current = loadAchievements();
	if (current[id] !== void 0) return false;
	mutateSaveData((prev) => ({ ...prev, achievements: { ...current, [id]: Date.now() } }));
	return true;
};

export const loadUnlockedMusic = (): readonly string[] => loadSaveData().unlockedMusic ?? [];

export const saveUnlockedMusic = (id: string): boolean => {
	const current = loadUnlockedMusic();
	if (current.includes(id)) return false;
	mutateSaveData((prev) => ({ ...prev, unlockedMusic: [...current, id] }));
	return true;
};

export const exportSaveJson = (): string => JSON.stringify(loadSaveData(), null, 2);

export const importSaveJson = (raw: string): boolean => {
	const parsed = parseSaveData(raw);
	if (parsed === null) return false;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
		return true;
	} catch {
		return false;
	}
};
