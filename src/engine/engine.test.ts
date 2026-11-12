import { describe, expect, it } from "vitest";
import { ORDERS } from "../levels/orders";
import { createBuiltinRegistry } from "./gadget";
import { judgeNormalize, judgeOrder } from "./judge";
import { parseLambda, printTerm } from "./parse";
import { redexes, stepAt, stepLeftmost } from "./reduce";
import { termsEqual } from "./term";

describe("Calculuser core engine", () => {
	it("parses and prints lambda expressions cleanly", () => {
		expect(printTerm(parseLambda("\\x.\\y. x"), 0)).toBe("λx.λy.x");
		expect(printTerm(parseLambda("\\f.\\x. f (f x)"), 0)).toBe("λx.λy.x (x y)");
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
		const dropStep = stepLeftmost(parseLambda("(\\x.\\y. x) A B"), registry, "");
		expect(dropStep !== null && dropStep.event.kind === "beta" && dropStep.event.copies === 1).toBe(true);
		const zeroCopyStep = stepLeftmost(parseLambda("(\\y. A) B"), registry, "");
		expect(zeroCopyStep !== null && zeroCopyStep.event.kind === "beta" && zeroCopyStep.event.copies === 0).toBe(true);
		const twoCopyStep = stepLeftmost(parseLambda("(\\x. x x) A"), registry, "");
		expect(twoCopyStep !== null && twoCopyStep.event.kind === "beta" && twoCopyStep.event.copies === 2).toBe(true);
	});

	it("finds clickable redexes and supports stepAt", () => {
		const registry = createBuiltinRegistry();
		const expr = parseLambda("(\\x. x) ((\\y. y) A)");
		const paths = redexes(expr, registry, "");
		expect(paths).toContain("");
		expect(paths).toContain("a");
		const innerReduced = stepAt(expr, "a", registry, "");
		expect(innerReduced !== null && termsEqual(innerReduced.next, parseLambda("(\\x. x) A"))).toBe(true);
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
		const omega = judgeNormalize(parseLambda("(\\x. x x) (\\x. x x)"), registry, 40);
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
		expect(ORDERS.length).toBeGreaterThanOrEqual(27);
		for (const order of ORDERS) {
			if (order.mode === "build") expect(order.tests.length).toBeGreaterThan(0);
			else expect(order.stepBudget).toBeGreaterThan(0);
		}
	});
});
