import { parseLambda } from "./parse";
import { type GadgetId, type Term, isClosed, termFingerprint } from "./term";

export interface Gadget {
	readonly id: GadgetId;
	readonly def: Term;
	readonly arity: number;
	readonly origin: "builtin" | "level" | "player";
	readonly fingerprint: string;
}

export type Registry = Map<GadgetId, Gadget>;

export function computeArity(term: Term): number {
	let count = 0;
	let current = term;
	while (current.kind === "lam") {
		count += 1;
		current = current.body;
	}
	return count;
}

export function registerGadget(
	registry: Registry,
	id: GadgetId,
	def: Term,
	origin: "builtin" | "level" | "player",
): Gadget {
	if (!isClosed(def, 0)) throw new Error(`Gadget ${id} must be a closed term`);
	const gadget: Gadget = {
		id,
		def,
		arity: computeArity(def),
		origin,
		fingerprint: termFingerprint(def),
	};
	registry.set(id, gadget);
	return gadget;
}

export function createBuiltinRegistry(): Registry {
	const registry: Registry = new Map();
	registerGadget(registry, "I", parseLambda("\\x. x"), "builtin");
	registerGadget(registry, "K", parseLambda("\\x.\\y. x"), "builtin");
	registerGadget(registry, "S", parseLambda("\\x.\\y.\\z. x z (y z)"), "builtin");
	return registry;
}
