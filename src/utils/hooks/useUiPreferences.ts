import { createSignal } from "solid-js";
import { type UiPreferences, loadUiPreferences, saveUiPreferences } from "../../engine/storage";

const createDebouncedSaver = (delayMs: number): ((prefs: UiPreferences) => void) => {
	let timer: ReturnType<typeof setTimeout> | null = null;
	return (prefs: UiPreferences): void => {
		if (timer !== null) clearTimeout(timer);
		timer = setTimeout(() => {
			saveUiPreferences(prefs);
			timer = null;
		}, delayMs);
	};
};

const [prefs, setPrefs] = createSignal<UiPreferences>(loadUiPreferences());
const debouncedSave = createDebouncedSaver(200);

if (typeof window !== "undefined") window.addEventListener("beforeunload", () => saveUiPreferences(prefs()));

export function useUiPreferences(): {
	readonly shelfWidth: () => number;
	readonly setShelfWidth: (width: number) => void;
	readonly orderSlipWidth: () => number;
	readonly setOrderSlipWidth: (width: number) => void;
	readonly orderSlipCollapsed: () => boolean;
	readonly setOrderSlipCollapsed: (collapsed: boolean) => void;
} {
	return {
		shelfWidth: () => prefs().shelfWidth,
		setShelfWidth: (shelfWidth: number): void => {
			const next = { ...prefs(), shelfWidth };
			setPrefs(next);
			debouncedSave(next);
		},
		orderSlipWidth: () => prefs().orderSlipWidth,
		setOrderSlipWidth: (orderSlipWidth: number): void => {
			const next = { ...prefs(), orderSlipWidth };
			setPrefs(next);
			debouncedSave(next);
		},
		orderSlipCollapsed: () => prefs().orderSlipCollapsed,
		setOrderSlipCollapsed: (orderSlipCollapsed: boolean): void => {
			const next = { ...prefs(), orderSlipCollapsed };
			setPrefs(next);
			saveUiPreferences(next);
		},
	};
}
