import type { Gadget, Registry } from "./gadget";
import { type GadgetId, type Path, type Term, betaLam, countCopies } from "./term";

export type StepEvent =
	| { readonly kind: "beta"; readonly path: Path; readonly copies: number }
	| { readonly kind: "delta"; readonly path: Path; readonly gadget: GadgetId; readonly copies: readonly number[] };

export interface StepResult {
	readonly next: Term;
	readonly event: StepEvent;
}

export function spine(term: Term): { readonly head: Term; readonly args: readonly Term[] } {
	const args: Term[] = [];
	let current = term;
	while (current.kind === "app") {
		args.unshift(current.arg);
		current = current.fn;
	}
	return { head: current, args };
}

function deltaExpand(
	gadget: Gadget,
	args: readonly Term[],
): { readonly next: Term; readonly copies: readonly number[] } {
	const copies: number[] = [];
	let current = gadget.def;
	for (let index = 0; index < Math.min(gadget.arity, args.length); index += 1) {
		if (current.kind === "lam") {
			copies.push(countCopies(current.body, 0));
			current = betaLam(current.body, args[index]);
		}
	}
	return {
		next: args.slice(gadget.arity).reduce<Term>((fn, arg) => ({ kind: "app", fn, arg }), current),
		copies,
	};
}

function isDeltaRedex(term: Term, registry: Registry): Gadget | null {
	const { head, args } = spine(term);
	if (head.kind !== "gad") return null;
	const gadget = registry.get(head.id);
	if (gadget === undefined) return null;
	return args.length === Math.max(1, gadget.arity) ? gadget : null;
}

export function redexes(term: Term, registry: Registry, path: Path): readonly Path[] {
	if (term.kind === "app") {
		const isSelfBeta = term.fn.kind === "lam";
		const isSelfDelta = isDeltaRedex(term, registry) !== null;
		const selfList = isSelfBeta || isSelfDelta ? [path] : [];
		return [...selfList, ...redexes(term.fn, registry, `${path}f`), ...redexes(term.arg, registry, `${path}a`)];
	}
	if (term.kind === "lam") return redexes(term.body, registry, `${path}b`);
	return [];
}

export function stepLeftmost(term: Term, registry: Registry, path: Path): StepResult | null {
	if (term.kind === "app") {
		if (term.fn.kind === "lam")
			return {
				next: betaLam(term.fn.body, term.arg),
				event: { kind: "beta", path, copies: countCopies(term.fn.body, 0) },
			};
		const deltaGadget = isDeltaRedex(term, registry);
		if (deltaGadget !== null) {
			const expanded = deltaExpand(deltaGadget, spine(term).args);
			return {
				next: expanded.next,
				event: { kind: "delta", path, gadget: deltaGadget.id, copies: expanded.copies },
			};
		}
		const fnStep = stepLeftmost(term.fn, registry, `${path}f`);
		if (fnStep !== null) return { next: { kind: "app", fn: fnStep.next, arg: term.arg }, event: fnStep.event };
		const argStep = stepLeftmost(term.arg, registry, `${path}a`);
		if (argStep !== null) return { next: { kind: "app", fn: term.fn, arg: argStep.next }, event: argStep.event };
		return null;
	}
	if (term.kind === "lam") {
		const bodyStep = stepLeftmost(term.body, registry, `${path}b`);
		return bodyStep !== null ? { next: { kind: "lam", body: bodyStep.next }, event: bodyStep.event } : null;
	}
	return null;
}

export function stepAt(term: Term, targetPath: Path, registry: Registry, currentPath: Path): StepResult | null {
	if (currentPath === targetPath) {
		if (term.kind === "app" && term.fn.kind === "lam")
			return {
				next: betaLam(term.fn.body, term.arg),
				event: { kind: "beta", path: currentPath, copies: countCopies(term.fn.body, 0) },
			};
		const deltaGadget = isDeltaRedex(term, registry);
		if (deltaGadget !== null) {
			const expanded = deltaExpand(deltaGadget, spine(term).args);
			return {
				next: expanded.next,
				event: { kind: "delta", path: currentPath, gadget: deltaGadget.id, copies: expanded.copies },
			};
		}
		return null;
	}
	const segment = targetPath[currentPath.length];
	if (term.kind === "lam" && segment === "b") {
		const res = stepAt(term.body, targetPath, registry, `${currentPath}b`);
		return res !== null ? { next: { kind: "lam", body: res.next }, event: res.event } : null;
	}
	if (term.kind === "app" && segment === "f") {
		const res = stepAt(term.fn, targetPath, registry, `${currentPath}f`);
		return res !== null ? { next: { kind: "app", fn: res.next, arg: term.arg }, event: res.event } : null;
	}
	if (term.kind === "app" && segment === "a") {
		const res = stepAt(term.arg, targetPath, registry, `${currentPath}a`);
		return res !== null ? { next: { kind: "app", fn: term.fn, arg: res.next }, event: res.event } : null;
	}
	return null;
}
