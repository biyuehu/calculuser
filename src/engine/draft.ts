import type { GadgetId, Path, Term } from "./term";

export type DraftTerm =
	| { readonly kind: "hole" }
	| { readonly kind: "var"; readonly name: string }
	| { readonly kind: "atom"; readonly name: string }
	| { readonly kind: "gad"; readonly id: GadgetId }
	| { readonly kind: "lam"; readonly param: string; readonly body: DraftTerm }
	| { readonly kind: "app"; readonly fn: DraftTerm; readonly arg: DraftTerm };

export function findFirstHole(draft: DraftTerm, path: Path): Path | null {
	if (draft.kind === "hole") return path;
	if (draft.kind === "lam") return findFirstHole(draft.body, `${path}b`);
	if (draft.kind === "app") {
		const holeInFn = findFirstHole(draft.fn, `${path}f`);
		return holeInFn !== null ? holeInFn : findFirstHole(draft.arg, `${path}a`);
	}
	return null;
}

export function setDraftAtPath(draft: DraftTerm, path: Path, replacement: DraftTerm): DraftTerm {
	if (path.length === 0) return replacement;
	const segment = path[0];
	const remaining = path.slice(1);
	if (draft.kind === "lam" && segment === "b") {
		return { kind: "lam", param: draft.param, body: setDraftAtPath(draft.body, remaining, replacement) };
	}
	if (draft.kind === "app") {
		return segment === "f"
			? { kind: "app", fn: setDraftAtPath(draft.fn, remaining, replacement), arg: draft.arg }
			: { kind: "app", fn: draft.fn, arg: setDraftAtPath(draft.arg, remaining, replacement) };
	}
	return draft;
}

export function getScopeAt(draft: DraftTerm, path: Path): readonly string[] {
	const scope: string[] = [];
	let current = draft;
	for (const character of path) {
		if (character === "b" && current.kind === "lam") {
			scope.push(current.param);
			current = current.body;
		} else {
			current =
				character === "f" && current.kind === "app"
					? current.fn
					: character === "a" && current.kind === "app"
						? current.arg
						: current;
		}
	}
	return scope;
}

export function countDraftSize(draft: DraftTerm): number {
	switch (draft.kind) {
		case "hole": {
			return 0;
		}
		case "lam": {
			return 1 + countDraftSize(draft.body);
		}
		case "app": {
			return 1 + countDraftSize(draft.fn) + countDraftSize(draft.arg);
		}
		case "var":
		case "atom":
		case "gad": {
			return 1;
		}
	}
}

export function draftToTerm(draft: DraftTerm, env: readonly string[]): Term {
	switch (draft.kind) {
		case "hole": {
			throw new Error("Draft contains unfilled hole");
		}
		case "atom": {
			return { kind: "atom", name: draft.name };
		}
		case "gad": {
			return { kind: "gad", id: draft.id };
		}
		case "var": {
			const foundPosition = env.lastIndexOf(draft.name);
			if (foundPosition < 0) throw new Error(`Unbound variable: ${draft.name}`);
			return { kind: "var", index: env.length - 1 - foundPosition };
		}
		case "lam": {
			return { kind: "lam", body: draftToTerm(draft.body, [...env, draft.param]) };
		}
		case "app": {
			return { kind: "app", fn: draftToTerm(draft.fn, env), arg: draftToTerm(draft.arg, env) };
		}
	}
}
