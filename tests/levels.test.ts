import { describe, expect, it } from "vitest";
import { COMBINATORS, LEVELS, isToolAvailableForOrder } from "../src/content";
import {
	type GadgetId,
	type Term,
	createRegistry,
	judgeOrder,
	parseLambda,
	stepLeftmost,
	termsEqual,
} from "../src/engine";

const parseSolution = (source: string): Term => {
	const mapGadget = (term: Term): Term => {
		if (term.kind === "gad" && term.id === "Kp") return { kind: "gad", id: "K'" };
		if (term.kind === "lam") return { ...term, body: mapGadget(term.body) };
		if (term.kind === "app") return { kind: "app", fn: mapGadget(term.fn), arg: mapGadget(term.arg) };
		return term;
	};
	return mapGadget(parseLambda(source));
};

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

const BUILD_SOLUTIONS: Readonly<Record<string, string>> = {
	identity: "@I",
	drop_first_ki: "@K @I",
	blueprint_identity: "λx. x",
	const_k: "λx.λy. x",
	skk_identity: "@S @K @K",
	reverse_apply: "λx.λy. y x",
	compose_b: "λf.λg.λx. f (g x)",
	flip_c: "λf.λx.λy. f y x",
	dup_w: "@C @S @I",
	build_s: "λf.λg.λx. f x (g x)",
	not: "λb. b @Kp @K",
	and: "@W @C",
	or: "@S @I @I",
	xor: "λp. p @not @I",
	if_else: "λc.λt.λf. c t f",
	pair: "λx.λy.λf. f x y",
	fst: "λp. p @K",
	swap: "λp. p (@C @pair)",
	just: "λx.λn.λj. j x",
	is_just: "λm. m @Kp (@K @K)",
	from_maybe: "@snd (@S @pair)",
	maybe_elim: "@pair",
	map_maybe: "@B (@maybe @K) (@B @just)",
	left_build: "λa.λl.λr. l a",
	either_elim: "@pair",
	is_right: "@either (@K @Kp) (@K @K)",
	succ: "λn.λf. @B f (n f)",
	add: "λm.λn. m @succ n",
	mul: "λm.λn.λf. m (n f)",
	exp: "@T",
	is_zero: "λn. n (@K @Kp) @K",
	pred: "λn.λf.λx. n (λg. @T (g f)) (λu. x) @I",
	sub: "@C (λn. n @pred)",
	leq: "@B (@B @isZero) @sub",
	eq: "λm.λn. @and (@leq m n) (@leq n m)",
	max: "λm.λn. @leq m n n m",
	abs_diff: "λm.λn. @add (@sub m n) (@sub n m)",
	cons: "λh.λt.λc.λn. c h (t c n)",
	is_nil: "λl. l (λh.λr. @Kp) @K",
	list_length: "λl. l (λh. @succ) @Kp",
	list_map: "λf.λl.λc. l (@B c f)",
	list_append: "λxs.λys.λc.λn. xs c (ys c n)",
	list_filter: "λp.λl.λc.λn. l (λh.λr. p h (c h r) r) n",
	list_sum: "λl. l @add @Kp",
	list_reverse: "λl. l (λh.λr. @append r (@cons h @Kp)) @Kp",
	tree_node: "λv.λl.λr.λf.λz. f v (l f z) (r f z)",
	tree_size: "λt. t (@K (@B (@B @succ) @add)) @Kp",
	tree_map: "λf.λt.λg. t (@B g f)",
	tree_sum: "λt. t (λv.λl.λr. @add v (@add l r)) @Kp",
	self_apply: "λx. x x",
	fix_y: "λf. @omega (λx. f (x x))",
	fix_z: "λf. @omega (λx. f (λv. x x v))",
	rec_sum: "@Y (λr.λn. (@isZero n) @Kp (@add n (r (@pred n))))",
	rec_length: "λl. l (λh. @succ) @Kp",
	fix_rec_final: "@Y (λr.λn. (@isZero n) (λf.λx. f x) (@mul n (r (@pred n))))",
	rec_fib: "@Y (λr.λn. (@leq n (λf.λx. f x)) n (@add (r (@pred n)) (r (@pred (@pred n)))))",
};

describe("Constructive Level Solvability", () => {
	const registry = createRegistry(COMBINATORS);
	const allCleared = new Map<string, number>(LEVELS.map((l) => [l.id, 3]));
	const buildOrders = LEVELS.filter((l) => l.mode === "build");
	const runOrders = LEVELS.filter((l) => l.mode === "run");

	it("covers every build level with a valid, constraint-compliant solution", () => {
		expect(buildOrders.length).toBe(56);
		for (const order of buildOrders) {
			const source = BUILD_SOLUTIONS[order.id];
			expect(source, `Missing canonical solution for ${order.code} (${order.id})`).toBeDefined();
			const term = parseSolution(source);

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
