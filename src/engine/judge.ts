import type { Registry } from "./gadget";
import { type GadgetId, type Term, betaLam, termsEqual } from "./term";

export interface JudgeTestCase {
	readonly args: readonly Term[];
	readonly expect: Term;
}

export interface JudgeTestResult {
	readonly passed: boolean;
	readonly actual: Term | null;
	readonly terminated: boolean;
	readonly steps: number;
}

export function inlineGadgets(term: Term, registry: Registry, cache: Map<GadgetId, Term>): Term {
	switch (term.kind) {
		case "var":
		case "atom": {
			return term;
		}
		case "gad": {
			const cached = cache.get(term.id);
			if (cached !== undefined) return cached;
			const gadget = registry.get(term.id);
			if (gadget === undefined) throw new Error(`Unknown gadget: ${term.id}`);
			const expanded = inlineGadgets(gadget.def, registry, cache);
			cache.set(term.id, expanded);
			return expanded;
		}
		case "lam": {
			return { kind: "lam", body: inlineGadgets(term.body, registry, cache) };
		}
		case "app": {
			return {
				kind: "app",
				fn: inlineGadgets(term.fn, registry, cache),
				arg: inlineGadgets(term.arg, registry, cache),
			};
		}
	}
}

function stepPureBeta(term: Term): Term | null {
	if (term.kind === "app") {
		if (term.fn.kind === "lam") return betaLam(term.fn.body, term.arg);
		const fnStep = stepPureBeta(term.fn);
		if (fnStep !== null) return { kind: "app", fn: fnStep, arg: term.arg };
		const argStep = stepPureBeta(term.arg);
		return argStep !== null ? { kind: "app", fn: term.fn, arg: argStep } : null;
	}
	if (term.kind === "lam") {
		const bodyStep = stepPureBeta(term.body);
		return bodyStep !== null ? { kind: "lam", body: bodyStep } : null;
	}
	return null;
}

export function judgeNormalize(
	term: Term,
	registry: Registry,
	maxSteps: number,
): { readonly term: Term; readonly steps: number; readonly terminated: boolean } {
	let current = inlineGadgets(term, registry, new Map());
	let steps = 0;
	while (steps < maxSteps) {
		const next = stepPureBeta(current);
		if (next === null) return { term: current, steps, terminated: true };
		current = next;
		steps += 1;
	}
	return { term: current, steps, terminated: false };
}

export function judgeOrder(
	candidate: Term,
	tests: readonly JudgeTestCase[],
	registry: Registry,
	maxSteps: number,
): readonly JudgeTestResult[] {
	return tests.map((testCase) => {
		const applied = testCase.args.reduce<Term>((fn, arg) => ({ kind: "app", fn, arg }), candidate);
		const result = judgeNormalize(applied, registry, maxSteps);
		const expectedNorm = judgeNormalize(testCase.expect, registry, maxSteps);
		return {
			passed: result.terminated && expectedNorm.terminated && termsEqual(result.term, expectedNorm.term),
			actual: result.terminated ? result.term : null,
			terminated: result.terminated,
			steps: result.steps,
		};
	});
}
