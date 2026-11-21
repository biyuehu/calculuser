import { describe, expect, it } from "vitest";
import { LEVELS } from "../content";
import { type DraftTerm, findAllHoles, getDraftAtPath } from "./draft";
import { createBuiltinRegistry } from "./gadget";
import { judgeNormalize, judgeOrder } from "./judge";
import { parseLambda, printTerm } from "./parse";
import { redexes, stepAt, stepLeftmost } from "./reduce";
import {
	DEFAULT_UI_PREFS,
	STORAGE_KEY,
	clearLevelDraft,
	clearLevelDrafts,
	clearSave,
	loadLevelDrafts,
	loadSession,
	loadUiPreferences,
	loadWorkshop,
	saveLevelDraft,
	saveSession,
	saveUiPreferences,
	saveWorkshop,
} from "./storage";
import { termsEqual } from "./term";

describe("Calculuser core engine", () => {
	it("parses and prints lambda expressions cleanly", () => {
		expect(printTerm(parseLambda("λx.λy. x"))).toBe("λx.λy.x");
		expect(printTerm(parseLambda("λf.λx. f (f x)"))).toBe("λf.λx.f (f x)");
	});

	it("evaluates S K K A -> A via play delta-reduction with copy events", () => {
		const registry = createBuiltinRegistry();
		let current = parseLambda("@S @K @K A");
		const events: string[] = [];
		for (let step = 0; step < 20; step += 1) {
			const res = stepLeftmost(current, registry, "");
			if (res === null) break;
			events.push(res.event.kind);
			current = res.next;
		}
		expect(termsEqual(current, { kind: "atom", name: "A" })).toBe(true);
		expect(events).toContain("delta");
	});

	it("reports exact copies count on beta and delta steps", () => {
		const registry = createBuiltinRegistry();
		const dropStep = stepLeftmost(parseLambda("(λx.λy. x) A B"), registry, "");
		expect(dropStep !== null && dropStep.event.kind === "beta" && dropStep.event.copies === 1).toBe(true);
		const zeroCopyStep = stepLeftmost(parseLambda("(λy. A) B"), registry, "");
		expect(zeroCopyStep !== null && zeroCopyStep.event.kind === "beta" && zeroCopyStep.event.copies === 0).toBe(true);
		const twoCopyStep = stepLeftmost(parseLambda("(λx. x x) A"), registry, "");
		expect(twoCopyStep !== null && twoCopyStep.event.kind === "beta" && twoCopyStep.event.copies === 2).toBe(true);
	});

	it("finds clickable redexes and supports stepAt", () => {
		const registry = createBuiltinRegistry();
		const expr = parseLambda("(λx. x) ((λy. y) A)");
		const paths = redexes(expr, registry, "");
		expect(paths).toContain("");
		expect(paths).toContain("a");
		const innerReduced = stepAt(expr, "a", registry, "");
		expect(innerReduced !== null && termsEqual(innerReduced.next, parseLambda("(λx. x) A"))).toBe(true);
	});

	it("judges equivalence by inlining gadgets and stops on Omega loop", () => {
		const registry = createBuiltinRegistry();
		const skk = parseLambda("@S @K @K");
		const results = judgeOrder(
			skk,
			[{ args: [{ kind: "atom", name: "A" }], expect: { kind: "atom", name: "A" } }],
			registry,
			100,
		);
		expect(results[0].passed).toBe(true);
		const omega = judgeNormalize(parseLambda("(λx. x x) (λx. x x)"), registry, 40);
		expect(omega.terminated).toBe(false);
	});

	it("solves the three run-mode puzzles within exact step budgets", () => {
		const registry = createBuiltinRegistry();
		const dropStep = stepAt(parseLambda("@K A ((@S @I @I) (@S @I @I))"), "", registry, "");
		expect(dropStep !== null && termsEqual(dropStep.next, { kind: "atom", name: "A" })).toBe(true);

		let innerTerm = parseLambda("(@S @I @I) (@I A)");
		for (const path of ["a", "", "f", "a"]) {
			const res = stepAt(innerTerm, path, registry, "");
			expect(res).not.toBeNull();
			if (res !== null) innerTerm = res.next;
		}
		expect(termsEqual(innerTerm, parseLambda("A A"))).toBe(true);

		let bossTerm = parseLambda("@K ((@S @I @I) (@I A)) (@I (@I (@I B)))");
		for (const path of ["", "a", "", "f", "a"]) {
			const res = stepAt(bossTerm, path, registry, "");
			expect(res).not.toBeNull();
			if (res !== null) bossTerm = res.next;
		}
		expect(termsEqual(bossTerm, parseLambda("A A"))).toBe(true);
	});

	it("loads all orders without parse errors", () => {
		expect(LEVELS.length).toBeGreaterThanOrEqual(27);
		for (const order of LEVELS)
			if (order.mode === "build") expect(order.tests.length).toBeGreaterThan(0);
			else expect(order.stepBudget).toBeGreaterThan(0);
	});

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

	it("traverses draft holes and nodes via findAllHoles and getDraftAtPath", () => {
		const draft: DraftTerm = {
			kind: "app",
			fn: { kind: "lam", param: "x", body: { kind: "hole" } },
			arg: { kind: "hole" },
		};
		expect(findAllHoles(draft, "")).toEqual(["fb", "a"]);
		expect(getDraftAtPath(draft, "fb")).toEqual({ kind: "hole" });
		expect(getDraftAtPath(draft, "f")?.kind).toBe("lam");
		expect(getDraftAtPath(draft, "a")).toEqual({ kind: "hole" });
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
