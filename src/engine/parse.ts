import type { Registry } from "./gadget";
import type { Term } from "./term";

export const PRINT_NAMES = [
	"x",
	"y",
	"z",
	"u",
	"v",
	"w",
	"a",
	"b",
	"c",
	"d",
	"e",
	"f",
	"g",
	"h",
	"i",
	"j",
	"k",
	"l",
	"m",
	"n",
	"o",
	"p",
	"q",
	"r",
	"s",
	"t",
] as const;

interface ParseState {
	readonly source: string;
	cursor: number;
}

function skipWhitespace(state: ParseState): void {
	while (state.cursor < state.source.length && /\s/.test(state.source[state.cursor])) state.cursor += 1;
}

function readIdentifier(state: ParseState): (typeof PRINT_NAMES)[number] {
	const start = state.cursor;
	while (state.cursor < state.source.length && /[A-Za-z0-9_:]/.test(state.source[state.cursor])) state.cursor += 1;
	return state.source.slice(start, state.cursor) as (typeof PRINT_NAMES)[number];
}

function parseAtomOrVar(state: ParseState, env: readonly string[]): Term | null {
	skipWhitespace(state);
	if (state.cursor >= state.source.length) return null;
	const character = state.source[state.cursor];
	if (character === ")" || character === ".") return null;
	if (character === "(") {
		state.cursor += 1;
		const inner = parseExpr(state, env);
		skipWhitespace(state);
		if (state.source[state.cursor] !== ")") throw new Error("Expected closing parenthesis");
		state.cursor += 1;
		return inner;
	}
	if (character === "\\" || character === "λ") return parseExpr(state, env);
	if (character === "@") {
		state.cursor += 1;
		return { kind: "gad", id: readIdentifier(state) };
	}
	const identifier = readIdentifier(state);
	if (identifier.length === 0) throw new Error(`Unexpected token at position ${state.cursor}`);
	if (/^[A-Z]/.test(identifier)) return { kind: "atom", name: identifier };
	const boundPosition = env.lastIndexOf(identifier);
	if (boundPosition < 0) throw new Error(`Unbound variable: ${identifier}`);
	return { kind: "var", index: env.length - 1 - boundPosition, name: identifier };
}

function parseExpr(state: ParseState, env: readonly string[]): Term {
	skipWhitespace(state);
	const character = state.source[state.cursor];
	if (character === "\\" || character === "λ") {
		state.cursor += 1;
		skipWhitespace(state);
		const param = readIdentifier(state);
		skipWhitespace(state);
		if (state.source[state.cursor] !== ".") throw new Error("Expected '.' after lambda parameter");
		state.cursor += 1;
		return { kind: "lam", param, body: parseExpr(state, [...env, param]) };
	}
	let current = parseAtomOrVar(state, env);
	if (current === null) throw new Error(`Expected expression at position ${state.cursor}`);
	while (true) {
		const next = parseAtomOrVar(state, env);
		if (next === null) return current;
		current = { kind: "app", fn: current, arg: next };
	}
}

export function parseLambda(source: string): Term {
	const state: ParseState = { source, cursor: 0 };
	const parsed = parseExpr(state, []);
	skipWhitespace(state);
	if (state.cursor < state.source.length) throw new Error(`Trailing characters at position ${state.cursor}`);
	return parsed;
}

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
			if (entry !== void 0) return `(${printXRayTerm(entry.def, registry)})`;
			return term.id;
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
