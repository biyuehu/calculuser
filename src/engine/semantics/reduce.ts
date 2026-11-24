import { type GadgetId, type Path, type Term, betaLam, countCopies } from "../syntax/term";
import type { Gadget, Registry } from "./gadget";

export type StepEvent =
	| { readonly kind: "beta"; readonly path: Path; readonly copies: number }
	| { readonly kind: "delta"; readonly path: Path; readonly gadget: GadgetId; readonly copies: readonly number[] };

export interface StepResult {
	readonly next: Term;
	readonly event: StepEvent;
}

export type ReductionMode = "run" | "free";

function spine(term: Term): { readonly head: Term; readonly args: readonly Term[] } {
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
	return gadget !== void 0 && args.length === Math.max(1, gadget.arity) ? gadget : null;
}

function reduceAppRedex(term: Term, registry: Registry, path: Path): StepResult | null {
	if (term.kind !== "app") return null;
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
	return null;
}

function reduceGadgetUnfold(id: GadgetId, registry: Registry, path: Path): StepResult | null {
	const gadget = registry.get(id);
	return gadget !== void 0 ? { next: gadget.def, event: { kind: "delta", path, gadget: id, copies: [] } } : null;
}

export function redexes(term: Term, registry: Registry, path: Path, mode: ReductionMode): readonly Path[] {
	if (mode === "run") {
		if (term.kind === "app") {
			const selfList = term.fn.kind === "lam" || isDeltaRedex(term, registry) !== null ? [path] : [];
			return [
				...selfList,
				...redexes(term.fn, registry, `${path}f`, mode),
				...redexes(term.arg, registry, `${path}a`, mode),
			];
		}
		if (term.kind === "lam") return redexes(term.body, registry, `${path}b`, mode);
		if (term.kind === "ann") return redexes(term.term, registry, `${path}n`, mode);
		return [];
	}
	if (term.kind === "gad") return registry.has(term.id) ? [path] : [];
	if (term.kind === "app") {
		const selfList = term.fn.kind === "lam" ? [path] : [];
		return [
			...selfList,
			...redexes(term.fn, registry, `${path}f`, mode),
			...redexes(term.arg, registry, `${path}a`, mode),
		];
	}
	if (term.kind === "lam") return redexes(term.body, registry, `${path}b`, mode);
	if (term.kind === "ann") return redexes(term.term, registry, `${path}n`, mode);
	return [];
}

export function stepLeftmost(term: Term, registry: Registry, path: Path, mode: ReductionMode): StepResult | null {
	if (mode === "free" && term.kind === "gad") return reduceGadgetUnfold(term.id, registry, path);
	if (term.kind === "app") {
		if (mode === "run") {
			const redex = reduceAppRedex(term, registry, path);
			if (redex !== null) return redex;
		} else if (term.fn.kind === "lam")
			return {
				next: betaLam(term.fn.body, term.arg),
				event: { kind: "beta", path, copies: countCopies(term.fn.body, 0) },
			};
		const fnStep = stepLeftmost(term.fn, registry, `${path}f`, mode);
		if (fnStep !== null) return { next: { kind: "app", fn: fnStep.next, arg: term.arg }, event: fnStep.event };
		const argStep = stepLeftmost(term.arg, registry, `${path}a`, mode);
		return argStep !== null ? { next: { kind: "app", fn: term.fn, arg: argStep.next }, event: argStep.event } : null;
	}
	if (term.kind === "lam") {
		const bodyStep = stepLeftmost(term.body, registry, `${path}b`, mode);
		return bodyStep !== null
			? { next: { kind: "lam", param: term.param, ty: term.ty, body: bodyStep.next }, event: bodyStep.event }
			: null;
	}
	if (term.kind === "ann") {
		const inner = stepLeftmost(term.term, registry, `${path}n`, mode);
		return inner !== null ? { next: { kind: "ann", term: inner.next, ty: term.ty }, event: inner.event } : null;
	}
	return null;
}

export function stepAt(
	term: Term,
	targetPath: Path,
	registry: Registry,
	currentPath: Path,
	mode: ReductionMode,
): StepResult | null {
	if (currentPath === targetPath) {
		if (mode === "run") return reduceAppRedex(term, registry, currentPath);
		if (term.kind === "gad") return reduceGadgetUnfold(term.id, registry, currentPath);
		if (term.kind === "app" && term.fn.kind === "lam")
			return {
				next: betaLam(term.fn.body, term.arg),
				event: { kind: "beta", path: currentPath, copies: countCopies(term.fn.body, 0) },
			};
		return null;
	}
	const segment = targetPath[currentPath.length];
	if (term.kind === "lam" && segment === "b") {
		const res = stepAt(term.body, targetPath, registry, `${currentPath}b`, mode);
		return res !== null
			? { next: { kind: "lam", param: term.param, ty: term.ty, body: res.next }, event: res.event }
			: null;
	}
	if (term.kind === "ann" && segment === "n") {
		const res = stepAt(term.term, targetPath, registry, `${currentPath}n`, mode);
		return res !== null ? { next: { kind: "ann", term: res.next, ty: term.ty }, event: res.event } : null;
	}
	if (term.kind === "app" && segment === "f") {
		const res = stepAt(term.fn, targetPath, registry, `${currentPath}f`, mode);
		return res !== null ? { next: { kind: "app", fn: res.next, arg: term.arg }, event: res.event } : null;
	}
	if (term.kind === "app" && segment === "a") {
		const res = stepAt(term.arg, targetPath, registry, `${currentPath}a`, mode);
		return res !== null ? { next: { kind: "app", fn: term.fn, arg: res.next }, event: res.event } : null;
	}
	return null;
}
