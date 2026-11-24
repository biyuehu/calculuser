import { describe, expect, it } from "vitest";
import {
	DEFAULT_UI_PREFS,
	STORAGE_KEY,
	clearLevelDraft,
	clearLevelDrafts,
	clearSave,
	deleteCustomGadget,
	loadCustomGadgets,
	loadLevelDrafts,
	loadSession,
	loadUiPreferences,
	loadWorkshop,
	saveCustomGadget,
	saveLevelDraft,
	saveSession,
	saveUiPreferences,
	saveWorkshop,
} from "../src/storage";

describe("Storage Persistence Layer", () => {
	it("loads, saves, and sanitizes UI preferences", () => {
		const store = new Map<string, string>();
		const mockStorage = {
			getItem: (k: string): string | null => store.get(k) ?? null,
			setItem: (k: string, v: string): void => {
				store.set(k, v);
			},
			removeItem: (k: string): void => {
				store.delete(k);
			},
			clear: (): void => store.clear(),
			key: (_index: number): string | null => null,
			length: 0,
		};
		Object.defineProperty(globalThis, "localStorage", { value: mockStorage, configurable: true, writable: true });

		const initial = loadUiPreferences();
		expect(initial.shelfWidth).toBe(DEFAULT_UI_PREFS.shelfWidth);
		expect(initial.orderSlipWidth).toBe(DEFAULT_UI_PREFS.orderSlipWidth);
		expect(initial.orderSlipCollapsed).toBe(DEFAULT_UI_PREFS.orderSlipCollapsed);

		saveUiPreferences({ shelfWidth: 160, orderSlipWidth: 400, orderSlipCollapsed: true });
		const loaded = loadUiPreferences();
		expect(loaded.shelfWidth).toBe(160);
		expect(loaded.orderSlipWidth).toBe(400);
		expect(loaded.orderSlipCollapsed).toBe(true);

		saveUiPreferences({ shelfWidth: 9999, orderSlipWidth: 10, orderSlipCollapsed: false });
		const sanitized = loadUiPreferences();
		expect(sanitized.shelfWidth).toBe(DEFAULT_UI_PREFS.shelfWidth);
		expect(sanitized.orderSlipWidth).toBe(DEFAULT_UI_PREFS.orderSlipWidth);
	});

	it("persists session navigation state cleanly", () => {
		const initial = loadSession();
		expect(initial.lastOrderId).toBeUndefined();
		expect(initial.screen).toBe("title");

		saveSession({ lastOrderId: "1.2", screen: "workbench" });
		const loaded = loadSession();
		expect(loaded.lastOrderId).toBe("1.2");
		expect(loaded.screen).toBe("workbench");
	});

	it("persists, validates and clears level draft terms", () => {
		expect(Object.keys(loadLevelDrafts()).length).toBe(0);

		saveLevelDraft("1.1", { kind: "gad", id: "I" });
		saveLevelDraft("1.2", {
			kind: "app",
			fn: { kind: "lam", param: "x", body: { kind: "var", name: "x" } },
			arg: { kind: "atom", name: "A" },
		});

		const drafts = loadLevelDrafts();
		expect(drafts["1.1"]).toEqual({ kind: "gad", id: "I" });
		expect(drafts["1.2"]).toEqual({
			kind: "app",
			fn: { kind: "lam", param: "x", body: { kind: "var", name: "x" } },
			arg: { kind: "atom", name: "A" },
		});

		clearLevelDraft("1.1");
		const afterClearSingle = loadLevelDrafts();
		expect(afterClearSingle["1.1"]).toBeUndefined();
		expect(afterClearSingle["1.2"]).toBeDefined();

		clearLevelDrafts();
		expect(Object.keys(loadLevelDrafts()).length).toBe(0);
	});

	it("persists, validates and deletes custom gadgets", () => {
		expect(Object.keys(loadCustomGadgets()).length).toBe(0);

		saveCustomGadget({
			id: "PAIR",
			name: "二元组",
			term: {
				kind: "lam",
				param: "x",
				body: { kind: "lam", param: "y", body: { kind: "var", index: 1, name: "x" } },
			},
		});

		const loaded = loadCustomGadgets();
		expect(loaded.PAIR).toBeDefined();
		expect(loaded.PAIR.id).toBe("PAIR");
		expect(loaded.PAIR.name).toBe("二元组");
		expect(loaded.PAIR.term.kind).toBe("lam");

		deleteCustomGadget("PAIR");
		expect(loadCustomGadgets().PAIR).toBeUndefined();
	});

	it("stores all persistent state under exactly one storage key", () => {
		const store = new Map<string, string>();
		Object.defineProperty(globalThis, "localStorage", {
			value: {
				getItem: (k: string): string | null => store.get(k) ?? null,
				setItem: (k: string, v: string): void => {
					store.set(k, v);
				},
				removeItem: (k: string): void => {
					store.delete(k);
				},
				clear: (): void => store.clear(),
				key: (_i: number): string | null => null,
				length: 0,
			},
			configurable: true,
			writable: true,
		});

		saveWorkshop(new Map([["1.1", 3]]));
		saveSession({ lastOrderId: "1.1", screen: "workbench" });
		saveLevelDraft("1.1", { kind: "gad", id: "I" });

		expect(store.size).toBe(1);
		expect(store.has(STORAGE_KEY)).toBe(true);
		expect(loadWorkshop().stars["1.1"]).toBe(3);
		expect(loadSession().lastOrderId).toBe("1.1");
		expect(loadLevelDrafts()["1.1"]).toEqual({ kind: "gad", id: "I" });

		clearSave();
		expect(store.size).toBe(0);
		expect(loadWorkshop().stars["1.1"]).toBeUndefined();
	});
});
