import { describe, expect, it } from "vitest";
import { BUILTIN_COUNT, COMBINATORS, LEVELS } from "../src/content";
import {
	type DraftTerm,
	atom,
	createRegistry,
	findAllHoles,
	getDraftAtPath,
	judgeNormalize,
	judgeOrder,
	parseLambda,
	printTerm,
	redexes,
	stepAt,
	stepLeftmost,
	termsEqual,
} from "../src/engine";

describe("Calculuser core engine", () => {
	it("parses and prints lambda expressions cleanly", () => {
		expect(printTerm(parseLambda("λx.λy. x"))).toBe("λx.λy.x");
		expect(printTerm(parseLambda("λf.λx. f (f x)"))).toBe("λf.λx.f (f x)");
	});

	it("evaluates S K K A -> A via play delta-reduction with copy events", () => {
		const registry = createRegistry(COMBINATORS.slice(0, BUILTIN_COUNT));
		let current = parseLambda("@S @K @K A");
		const events: string[] = [];
		for (let step = 0; step < 20; step += 1) {
			const res = stepLeftmost(current, registry, "");
			if (res === null) break;
			events.push(res.event.kind);
			current = res.next;
		}
		expect(termsEqual(current, atom("A"))).toBe(true);
		expect(events).toContain("delta");
	});

	it("reports exact copies count on beta and delta steps", () => {
		const registry = createRegistry(COMBINATORS.slice(0, BUILTIN_COUNT));
		const dropStep = stepLeftmost(parseLambda("(λx.λy. x) A B"), registry, "");
		expect(dropStep !== null && dropStep.event.kind === "beta" && dropStep.event.copies === 1).toBe(true);
		const zeroCopyStep = stepLeftmost(parseLambda("(λy. A) B"), registry, "");
		expect(zeroCopyStep !== null && zeroCopyStep.event.kind === "beta" && zeroCopyStep.event.copies === 0).toBe(true);
		const twoCopyStep = stepLeftmost(parseLambda("(λx. x x) A"), registry, "");
		expect(twoCopyStep !== null && twoCopyStep.event.kind === "beta" && twoCopyStep.event.copies === 2).toBe(true);
	});

	it("finds clickable redexes and supports stepAt", () => {
		const registry = createRegistry(COMBINATORS.slice(0, BUILTIN_COUNT));
		const expr = parseLambda("(λx. x) ((λy. y) A)");
		const paths = redexes(expr, registry, "");
		expect(paths).toContain("");
		expect(paths).toContain("a");
		const innerReduced = stepAt(expr, "a", registry, "");
		expect(innerReduced !== null && termsEqual(innerReduced.next, parseLambda("(λx. x) A"))).toBe(true);
	});

	it("judges equivalence by inlining gadgets and stops on Omega loop", () => {
		const registry = createRegistry(COMBINATORS.slice(0, BUILTIN_COUNT));
		const skk = parseLambda("@S @K @K");
		const results = judgeOrder(skk, [{ args: [atom("A")], expect: atom("A") }], registry, 100);
		expect(results[0].passed).toBe(true);
		const omega = judgeNormalize(parseLambda("(λx. x x) (λx. x x)"), registry, 40);
		expect(omega.terminated).toBe(false);
	});

	it("solves the three run-mode puzzles within exact step budgets", () => {
		const registry = createRegistry(COMBINATORS.slice(0, BUILTIN_COUNT));
		const dropStep = stepAt(parseLambda("@K A ((@S @I @I) (@S @I @I))"), "", registry, "");
		expect(dropStep !== null && termsEqual(dropStep.next, atom("A"))).toBe(true);

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
			else if (order.mode === "run") expect(order.stepBudget).toBeGreaterThan(0);
			else expect(order.parSize).toBeGreaterThan(0);
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
});
