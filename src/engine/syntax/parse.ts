import { type Ty, parseTy } from "../types/ty";
import type { VarName } from "./names";
import { type Term, atom } from "./term";

interface ParseState {
	readonly source: string;
	cursor: number;
}

function skipWhitespace(state: ParseState): void {
	while (state.cursor < state.source.length && /\s/.test(state.source[state.cursor])) state.cursor += 1;
}

function readIdentifier(state: ParseState): VarName {
	const start = state.cursor;
	while (state.cursor < state.source.length && /[A-Za-z0-9_]/.test(state.source[state.cursor])) state.cursor += 1;
	return state.source.slice(start, state.cursor) as VarName;
}

function parseTypeFragment(state: ParseState, delimiter: "." | ")"): Ty {
	skipWhitespace(state);
	const start = state.cursor;
	let depth = 0;
	while (state.cursor < state.source.length) {
		const char = state.source[state.cursor];
		if (char === "(") depth += 1;
		else if (char === ")") {
			if (depth === 0 && delimiter === ")") break;
			depth -= 1;
		} else if (char === "." && depth === 0 && delimiter === ".") {
			break;
		}
		state.cursor += 1;
	}
	const raw = state.source.slice(start, state.cursor).trim();
	if (raw.length === 0) throw new Error(`Expected type expression at position ${start}`);
	return parseTy(raw);
}

function parseAtomOrVar(state: ParseState, env: readonly string[]): Term | null {
	skipWhitespace(state);
	if (state.cursor >= state.source.length) return null;
	const character = state.source[state.cursor];
	if (character === ")" || character === "." || character === ":") return null;
	if (character === "(") {
		state.cursor += 1;
		const inner = parseExpr(state, env);
		skipWhitespace(state);
		if (state.source[state.cursor] === ":") {
			state.cursor += 1;
			const ty = parseTypeFragment(state, ")");
			skipWhitespace(state);
			if (state.source[state.cursor] !== ")") throw new Error("Expected closing parenthesis");
			state.cursor += 1;
			return { kind: "ann", term: inner, ty };
		}
		if (state.source[state.cursor] !== ")") throw new Error("Expected closing parenthesis");
		state.cursor += 1;
		return inner;
	}
	if (character === "λ") return parseExpr(state, env);
	if (character === "@") {
		state.cursor += 1;
		return { kind: "gad", id: readIdentifier(state) };
	}
	const identifier = readIdentifier(state);
	if (identifier.length === 0) throw new Error(`Unexpected token at position ${state.cursor}`);
	if (/^[A-Z]/.test(identifier)) return atom(identifier);
	const boundPosition = env.lastIndexOf(identifier);
	if (boundPosition < 0) throw new Error(`Unbound variable: ${identifier}`);
	return { kind: "var", index: env.length - 1 - boundPosition, name: identifier };
}

function parseExpr(state: ParseState, env: readonly string[]): Term {
	skipWhitespace(state);
	const character = state.source[state.cursor];
	if (character === "λ") {
		state.cursor += 1;
		skipWhitespace(state);
		let param: VarName;
		let paramTy: Ty | undefined;
		if (state.source[state.cursor] === "(") {
			state.cursor += 1;
			skipWhitespace(state);
			param = readIdentifier(state);
			skipWhitespace(state);
			if (state.source[state.cursor] === ":") {
				state.cursor += 1;
				paramTy = parseTypeFragment(state, ")");
			}
			skipWhitespace(state);
			if (state.source[state.cursor] !== ")") throw new Error("Expected ')' after parameter declaration");
			state.cursor += 1;
		} else {
			param = readIdentifier(state);
			skipWhitespace(state);
			if (state.source[state.cursor] === ":") {
				state.cursor += 1;
				paramTy = parseTypeFragment(state, ".");
			}
		}
		skipWhitespace(state);
		if (state.source[state.cursor] !== ".") throw new Error("Expected '.' after lambda parameter");
		state.cursor += 1;
		return { kind: "lam", param, ty: paramTy, body: parseExpr(state, [...env, param]) };
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
