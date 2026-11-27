import { describe, expect, it } from "vitest";
import { COMBINATORS, LEVELS, LEVEL_SOLUTIONS, isToolAvailableForOrder, parseSolutionTerm } from "../src/content";
import {
	type GadgetId,
	type Term,
	checkTypeBuild,
	createRegistry,
	judgeNormalize,
	judgeOrder,
	stepLeftmost,
	termsEqual,
} from "../src/engine";

const collectGadgets = (term: Term): GadgetId[] => {
	switch (term.kind) {
		case "gad":
			return [term.id];
		case "lam":
			return collectGadgets(term.body);
		case "ann":
			return collectGadgets(term.term);
		case "app":
			return [...collectGadgets(term.fn), ...collectGadgets(term.arg)];
		case "var":
		case "atom":
			return [];
	}
};

const hasBlueprintConstructs = (term: Term): boolean => {
	switch (term.kind) {
		case "lam":
		case "var":
			return true;
		case "ann":
			return hasBlueprintConstructs(term.term);
		case "app":
			return hasBlueprintConstructs(term.fn) || hasBlueprintConstructs(term.arg);
		case "gad":
		case "atom":
			return false;
	}
};

describe("Constructive Level Solvability", () => {
	const registry = createRegistry(COMBINATORS);
	const allCleared = new Map<string, number>(LEVELS.map((l) => [l.id, 3]));
	const buildOrders = LEVELS.filter((l) => l.mode === "build");
	const typeBuildOrders = LEVELS.filter((l) => l.mode === "typebuild");
	const runOrders = LEVELS.filter((l) => l.mode === "run");

	it("covers every build level with a valid, constraint-compliant solution", () => {
		expect(buildOrders.length).toBe(56);
		for (const order of buildOrders) {
			const source = LEVEL_SOLUTIONS[order.id];
			expect(source, `Missing canonical solution for ${order.code} (${order.id})`).toBeDefined();
			const term = parseSolutionTerm(source);

			if (!order.allowBlueprint)
				expect(hasBlueprintConstructs(term), `${order.code} (${order.id}) forbids blueprint`).toBe(false);

			const forbidden = order.forbidden ?? [];
			for (const gadgetId of collectGadgets(term)) {
				expect(forbidden.includes(gadgetId), `${order.code} (${order.id}) uses forbidden ${gadgetId}`).toBe(false);
				expect(
					isToolAvailableForOrder(gadgetId, order.id, allCleared, false),
					`${order.code} (${order.id}) uses unavailable tool ${gadgetId}`,
				).toBe(true);
			}

			const results = judgeOrder(term, order.tests, registry, 5000);
			expect(
				results.every((r) => r.passed),
				`${order.code} (${order.id}) failed judgeOrder`,
			).toBe(true);
		}
	});

	it("covers every non-uninhabited typebuild level in LEVEL_SOLUTIONS", () => {
		expect(typeBuildOrders.length).toBe(15);
		for (const order of typeBuildOrders) {
			if (order.uninhabited) continue;
			const source = LEVEL_SOLUTIONS[order.id];
			expect(source, `Missing canonical solution for ${order.code} (${order.id})`).toBeDefined();
			const term = parseSolutionTerm(source);
			expect(() => checkTypeBuild(term, order.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(term, registry, 50).terminated).toBe(true);
		}
	});

	it("verifies every run level reduces from initialTerm to targetTerm within stepBudget", () => {
		expect(runOrders.length).toBe(11);
		for (const order of runOrders) {
			let current = order.initialTerm;
			let steps = 0;
			while (!termsEqual(current, order.targetTerm) && steps < order.stepBudget) {
				const step = stepLeftmost(current, registry, "", "run");
				if (step === null) break;
				current = step.next;
				steps += 1;
			}
			expect(
				termsEqual(current, order.targetTerm),
				`RUN ${order.code} (${order.id}) did not reach target within ${order.stepBudget} steps`,
			).toBe(true);
		}
	});
});
