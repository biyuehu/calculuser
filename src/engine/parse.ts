import type { Term } from "./term";

const PRINT_NAMES: readonly string[] = [
	"x",
	"y",
	"z",
	"w",
	"u",
	"v",
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
];

interface ParseState {
	readonly source: string;
	cursor: number;
}

function skipWhitespace(state: ParseState): void {
	while (state.cursor < state.source.length && /\s/.test(state.source[state.cursor])) state.cursor += 1;
}

function readIdentifier(state: ParseState): string {
	const start = state.cursor;
	while (state.cursor < state.source.length && /[A-Za-z0-9_:]/.test(state.source[state.cursor])) state.cursor += 1;
	return state.source.slice(start, state.cursor);
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
	return { kind: "var", index: env.length - 1 - boundPosition };
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
		return { kind: "lam", body: parseExpr(state, [...env, param]) };
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

export function printTerm(term: Term, depth: number): string {
	switch (term.kind) {
		case "var": {
			const position = depth - 1 - term.index;
			return position >= 0 && position < PRINT_NAMES.length ? PRINT_NAMES[position] : `v${term.index}`;
		}
		case "atom": {
			return term.name;
		}
		case "gad": {
			return `@${term.id}`;
		}
		case "lam": {
			return `λ${depth < PRINT_NAMES.length ? PRINT_NAMES[depth] : `x${depth}`}.${printTerm(term.body, depth + 1)}`;
		}
		case "app": {
			const fnStr = term.fn.kind === "lam" ? `(${printTerm(term.fn, depth)})` : printTerm(term.fn, depth);
			const argStr =
				term.arg.kind === "app" || term.arg.kind === "lam"
					? `(${printTerm(term.arg, depth)})`
					: printTerm(term.arg, depth);
			return `${fnStr} ${argStr}`;
		}
	}
}
