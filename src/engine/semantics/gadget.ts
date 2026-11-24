import { parseLambda } from "../syntax/parse";
import { type GadgetId, type Term, isClosed } from "../syntax/term";

export interface Gadget {
	readonly id: GadgetId;
	readonly def: Term;
	readonly arity: number;
	readonly origin: "builtin" | "level" | "custom";
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

export function registerGadget(
	registry: Registry,
	id: GadgetId,
	def: Term,
	origin: "builtin" | "level" | "custom",
): Gadget {
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

export function inlineCustomGadgets(term: Term, registry: Registry): Term {
	const visited = new Set<GadgetId>();
	const expand = (t: Term): Term => {
		switch (t.kind) {
			case "var":
			case "atom":
				return t;
			case "gad": {
				if (visited.has(t.id)) return t;
				const gadget = registry.get(t.id);
				if (gadget === void 0 || gadget.origin !== "custom") return t;
				visited.add(t.id);
				const res = expand(gadget.def);
				visited.delete(t.id);
				return res;
			}
			case "lam":
				return { kind: "lam", param: t.param, ty: t.ty, body: expand(t.body) };
			case "ann":
				return { kind: "ann", term: expand(t.term), ty: t.ty };
			case "app":
				return { kind: "app", fn: expand(t.fn), arg: expand(t.arg) };
		}
	};
	return expand(term);
}
