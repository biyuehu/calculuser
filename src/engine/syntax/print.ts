import type { Registry } from "../semantics/gadget";
import type { Term } from "./term";

export function printTerm(term: Term): string {
	switch (term.kind) {
		case "var":
			return term.name;
		case "atom":
			return term.name;
		case "gad":
			return term.id;
		case "lam":
			return `λ${term.param}.${printTerm(term.body)}`;
		case "app": {
			const fnStr = term.fn.kind === "lam" ? `(${printTerm(term.fn)})` : printTerm(term.fn);
			const argStr =
				term.arg.kind === "app" || term.arg.kind === "lam" ? `(${printTerm(term.arg)})` : printTerm(term.arg);
			return `${fnStr} ${argStr}`;
		}
	}
}

export function printXRayTerm(term: Term, registry: Registry): string {
	switch (term.kind) {
		case "var":
			return term.name;
		case "atom":
			return term.name;
		case "gad": {
			if (term.id === "I" || term.id === "K" || term.id === "S") return term.id;
			const entry = registry.get(term.id);
			return entry !== void 0 ? `(${printXRayTerm(entry.def, registry)})` : term.id;
		}
		case "lam":
			return `λ${term.param}.${printXRayTerm(term.body, registry)}`;
		case "app": {
			const fnStr = term.fn.kind === "lam" ? `(${printXRayTerm(term.fn, registry)})` : printXRayTerm(term.fn, registry);
			const argStr =
				term.arg.kind === "app" || term.arg.kind === "lam"
					? `(${printXRayTerm(term.arg, registry)})`
					: printXRayTerm(term.arg, registry);
			return `${fnStr} ${argStr}`;
		}
	}
}
