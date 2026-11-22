import { type Ty, base } from "../types/ty";
import type { VarName } from "./names";

export type GadgetId = string;
export type Path = string;

export type Term =
	| { readonly kind: "var"; readonly index: number; readonly name: VarName }
	| { readonly kind: "lam"; readonly param: VarName; readonly ty?: Ty; readonly body: Term }
	| { readonly kind: "app"; readonly fn: Term; readonly arg: Term }
	| { readonly kind: "gad"; readonly id: GadgetId }
	| { readonly kind: "atom"; readonly name: string; readonly ty: Ty }
	| { readonly kind: "ann"; readonly term: Term; readonly ty: Ty };

export const atom = (name: string, ty: Ty = base("Atom")): Term => ({ kind: "atom", name, ty });
export const app = (fn: Term, arg: Term): Term => ({ kind: "app", fn, arg });

export function shift(term: Term, delta: number, cutoff: number): Term {
	switch (term.kind) {
		case "var":
			return term.index >= cutoff ? { kind: "var", index: term.index + delta, name: term.name } : term;
		case "lam":
			return { kind: "lam", param: term.param, ty: term.ty, body: shift(term.body, delta, cutoff + 1) };
		case "app":
			return { kind: "app", fn: shift(term.fn, delta, cutoff), arg: shift(term.arg, delta, cutoff) };
		case "ann":
			return { kind: "ann", term: shift(term.term, delta, cutoff), ty: term.ty };
		case "gad":
		case "atom":
			return term;
	}
}

export function subst(term: Term, targetIndex: number, replacement: Term): Term {
	switch (term.kind) {
		case "var":
			return term.index === targetIndex ? replacement : term;
		case "lam":
			return {
				kind: "lam",
				param: term.param,
				ty: term.ty,
				body: subst(term.body, targetIndex + 1, shift(replacement, 1, 0)),
			};
		case "app":
			return {
				kind: "app",
				fn: subst(term.fn, targetIndex, replacement),
				arg: subst(term.arg, targetIndex, replacement),
			};
		case "ann":
			return { kind: "ann", term: subst(term.term, targetIndex, replacement), ty: term.ty };
		case "gad":
		case "atom":
			return term;
	}
}

export const betaLam = (body: Term, arg: Term): Term => shift(subst(body, 0, shift(arg, 1, 0)), -1, 0);

export function termsEqual(first: Term, second: Term): boolean {
	if (first.kind === "ann") return termsEqual(first.term, second);
	if (second.kind === "ann") return termsEqual(first, second.term);
	if (first.kind !== second.kind) return false;
	switch (first.kind) {
		case "var":
			return second.kind === "var" && first.index === second.index;
		case "atom":
			return second.kind === "atom" && first.name === second.name;
		case "gad":
			return second.kind === "gad" && first.id === second.id;
		case "lam":
			return second.kind === "lam" && termsEqual(first.body, second.body);
		case "app":
			return second.kind === "app" && termsEqual(first.fn, second.fn) && termsEqual(first.arg, second.arg);
	}
}

export function isClosed(term: Term, depth: number): boolean {
	switch (term.kind) {
		case "var":
			return term.index < depth;
		case "lam":
			return isClosed(term.body, depth + 1);
		case "app":
			return isClosed(term.fn, depth) && isClosed(term.arg, depth);
		case "ann":
			return isClosed(term.term, depth);
		case "gad":
		case "atom":
			return true;
	}
}

export function countCopies(term: Term, targetIndex: number): number {
	switch (term.kind) {
		case "var":
			return term.index === targetIndex ? 1 : 0;
		case "lam":
			return countCopies(term.body, targetIndex + 1);
		case "app":
			return countCopies(term.fn, targetIndex) + countCopies(term.arg, targetIndex);
		case "ann":
			return countCopies(term.term, targetIndex);
		case "gad":
		case "atom":
			return 0;
	}
}
