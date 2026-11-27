import type { DraftTerm, Term } from "../engine";

export interface CustomGadgetRecord {
	readonly id: string;
	readonly name?: string;
	readonly term: Term;
}

export interface SettingsState {
	readonly volume: number;
	readonly bgmVolume: number;
	readonly reducedMotion: boolean;
	readonly judgeMode: boolean;
	readonly autoSkipRead: boolean;
	readonly xRayMode: boolean;
	readonly compactCanvas: boolean;
}

export interface UiPreferences {
	readonly shelfWidth: number;
	readonly orderSlipWidth: number;
	readonly orderSlipCollapsed: boolean;
}

export type SessionState =
	| { readonly screen: "title"; readonly lastOrderId?: string }
	| { readonly screen: "workbench"; readonly lastOrderId: string };

export interface SaveData {
	readonly workshop: { readonly stars: Record<string, number> };
	readonly settings: SettingsState;
	readonly uiPrefs: UiPreferences;
	readonly session: SessionState;
	readonly drafts: Record<string, DraftTerm>;
	readonly customGadgets: Record<string, CustomGadgetRecord>;
	readonly seenDialogues: readonly string[];
	readonly introSeen?: boolean;
	readonly achievements?: Record<string, number>;
	readonly unlockedMusic?: readonly string[];
}

export const STORAGE_KEY = "calculuser_save";

export const DEFAULT_SETTINGS: SettingsState = {
	volume: 1,
	bgmVolume: 0.4,
	reducedMotion: false,
	judgeMode: false,
	autoSkipRead: false,
	xRayMode: false,
	compactCanvas: false,
};

export const DEFAULT_SESSION: SessionState = { screen: "title" };

export const DEFAULT_UI_PREFS: UiPreferences = {
	shelfWidth: 76,
	orderSlipWidth: 290,
	orderSlipCollapsed: false,
};
