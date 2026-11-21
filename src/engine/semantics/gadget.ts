import { parseLambda } from "../syntax/parse";
import { type GadgetId, type Term, isClosed } from "../syntax/term";

export interface Gadget {
	readonly id: GadgetId;
	readonly def: Term;
	readonly arity: number;
	readonly origin: "builtin" | "level";
}

export type Registry = Map<GadgetId, Gadget>;

function computeArity(term: Term): number {
	let count = 0;
	let current = term;
	while (current.kind === "lam") {
		count += 1;
		current = current.body;
	}
	return count;
}

export function registerGadget(registry: Registry, id: GadgetId, def: Term, origin: "builtin" | "level"): Gadget {
	if (!isClosed(def, 0)) throw new Error(`Gadget ${id} must be a closed term`);
	return registry
		.set(id, {
			id,
			def,
			arity: computeArity(def),
			origin,
		})
		.get(id) as Gadget;
}

export function createRegistry(tools: readonly { readonly id: string; readonly defText: string }[]): Registry {
	const registry: Registry = new Map();
	for (const tool of tools)
		if (!registry.has(tool.id)) registerGadget(registry, tool.id, parseLambda(tool.defText), "builtin");
	return registry;
}
