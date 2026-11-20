import { COMBINATORS } from "../content/data/combinators";
import type { ToolDefinition } from "../content/types";
import type { Registry } from "./gadget";
import { judgeNormalize } from "./judge";
import { type Term, app, atom } from "./term";

export type Ty =
	| { readonly k: "any" }
	| { readonly k: "base"; readonly name: string }
	| { readonly k: "var"; readonly id: number }
	| { readonly k: "arrow"; readonly from: Ty; readonly to: Ty };

export const any: Ty = { k: "any" };
export const base = (name: string): Ty => ({ k: "base", name });
export const arrow = (from: Ty, to: Ty): Ty => ({ k: "arrow", from, to });
export const fn = (ps: readonly Ty[], r: Ty): Ty => ps.reduceRight((acc, p) => arrow(p, acc), r);
export const dyn = (arity: number): Ty => fn(Array(arity).fill(any), any);

export function parseTy(src: string): Ty {
	const toks = src.replace(/→/g, "->").match(/->|\?|\(|\)|[A-Za-z_][\w']*/g) ?? [];
	let i = 0;
	const parseAtom = (): Ty => {
		const t = toks[i++];
		if (t === "?") return any;
		if (t === "(") {
			const r = parseExpr();
			i++;
			return r;
		}
		return base(t);
	};
	const parseExpr = (): Ty => {
		const l = parseAtom();
		if (toks[i] === "->") {
			i++;
			return arrow(l, parseExpr());
		}
		return l;
	};
	const r = parseExpr();
	if (i !== toks.length) throw new Error(`类型解析失败: ${src}`);
	return r;
}

export function spine(t: Ty): { readonly params: readonly Ty[]; readonly result: Ty } {
	const params: Ty[] = [];
	let curr = t;
	while (curr.k === "arrow") {
		params.push(curr.from);
		curr = curr.to;
	}
	return { params, result: curr };
}

export const consistent = (a: Ty, b: Ty): boolean =>
	a.k === "any" ||
	b.k === "any" ||
	(a.k === "base" && b.k === "base" && a.name === b.name) ||
	(a.k === "arrow" && b.k === "arrow" && consistent(a.from, b.from) && consistent(a.to, b.to));

export const lessPrecise = (a: Ty, b: Ty): boolean =>
	a.k === "any" ||
	(a.k === "base" && b.k === "base" && a.name === b.name) ||
	(a.k === "arrow" && b.k === "arrow" && lessPrecise(a.from, b.from) && lessPrecise(a.to, b.to));

export const matchArrow = (t: Ty): { readonly from: Ty; readonly to: Ty } | null =>
	t.k === "arrow" ? t : t.k === "any" ? { from: any, to: any } : null;

export function formatTy(t: Ty): string {
	switch (t.k) {
		case "any":
			return "?";
		case "base":
			return t.name;
		case "var":
			return `α${t.id}`;
		case "arrow": {
			const fromStr = t.from.k === "arrow" ? `(${formatTy(t.from)})` : formatTy(t.from);
			return `${fromStr} -> ${formatTy(t.to)}`;
		}
	}
}

export class TypeErr extends Error {
	constructor(
		public readonly reason: string,
		public readonly term: Term,
		public readonly extra?: { readonly want?: Ty; readonly got?: Ty },
	) {
		super(
			reason === "not-a-function"
				? "基础类型无法作为函数调用"
				: reason === "arg-mismatch"
					? `参数类型不一致：期望 ${extra?.want ? formatTy(extra.want) : "?"}，但提供了 ${extra?.got ? formatTy(extra.got) : "?"}`
					: reason === "lam-vs-nonfunction"
						? "抽象机无法匹配非函数类型"
						: `类型不匹配：期望 ${extra?.want ? formatTy(extra.want) : "?"}，但实际为 ${extra?.got ? formatTy(extra.got) : "?"}`,
		);
	}
}

export interface BaseTypeSpec {
	readonly name: string;
	readonly shape: "circle" | "square" | "hexagon";
	readonly note: string;
	readonly unlockedBy?: string;
	readonly samples: (ctx: { readonly atoms: readonly string[] }) => readonly Term[];
	readonly check: (nf: Term, registry: Registry) => boolean;
}

export const BASE_TYPES: Record<string, BaseTypeSpec> = {
	Atom: {
		name: "样品",
		shape: "circle",
		note: "不透明的东西，只能被传递",
		samples: (c) => c.atoms.map(atom),
		check: (t) => t.kind === "atom",
	},
	Bool: {
		name: "真假",
		shape: "square",
		note: "选第一个或选第二个",
		unlockedBy: "bool-intro",
		samples: () => [atom("#T"), atom("#F")],
		check: (t, registry) => {
			const r = judgeNormalize(app(app(t, atom("#T")), atom("#F")), registry, 100);
			return r.terminated && r.term.kind === "atom" && (r.term.name === "#T" || r.term.name === "#F");
		},
	},
};

class InferContext {
	private nextId = 0;
	private readonly subst = new Map<number, Ty>();

	public fresh(): Ty {
		return { k: "var", id: this.nextId++ };
	}

	public find(t: Ty): Ty {
		if (t.k === "var" && this.subst.has(t.id)) {
			const resolved = this.find(this.subst.get(t.id) as Ty);
			this.subst.set(t.id, resolved);
			return resolved;
		}
		return t;
	}

	public occurs(id: number, t: Ty): boolean {
		const res = this.find(t);
		return res.k === "var"
			? res.id === id
			: res.k === "arrow"
				? this.occurs(id, res.from) || this.occurs(id, res.to)
				: false;
	}

	public unify(a: Ty, b: Ty): void {
		const t1 = this.find(a);
		const t2 = this.find(b);
		if (t1.k === "any" || t2.k === "any") return;
		if (t1.k === "var" && t2.k === "var" && t1.id === t2.id) return;
		if (t1.k === "var") {
			this.subst.set(t1.id, this.occurs(t1.id, t2) ? any : t2);
			return;
		}
		if (t2.k === "var") {
			this.subst.set(t2.id, this.occurs(t2.id, t1) ? any : t1);
			return;
		}
		if (t1.k === "base" && t2.k === "base" && t1.name === t2.name) return;
		if (t1.k === "arrow" && t2.k === "arrow") {
			this.unify(t1.from, t2.from);
			this.unify(t1.to, t2.to);
		}
	}

	public finalize(t: Ty): Ty {
		const res = this.find(t);
		switch (res.k) {
			case "var":
				return any;
			case "arrow":
				return { k: "arrow", from: this.finalize(res.from), to: this.finalize(res.to) };
			default:
				return res;
		}
	}
}

const TOOL_DEFS: ReadonlyMap<string, ToolDefinition> = new Map(COMBINATORS.map((c) => [c.id, c]));

function inferRaw(term: Term, env: readonly Ty[], ctx: InferContext): Ty {
	switch (term.kind) {
		case "var":
			return term.index < env.length ? ctx.find(env[term.index]) : any;
		case "atom":
			return base("Atom");
		case "gad": {
			const tool = TOOL_DEFS.get(term.id);
			if (tool?.defText) {
				return inferRaw(parseDefText(tool.defText), [], ctx);
			}
			return any;
		}
		case "lam": {
			const paramTy = ctx.fresh();
			return arrow(paramTy, inferRaw(term.body, [paramTy, ...env], ctx));
		}
		case "app": {
			const fnTy = inferRaw(term.fn, env, ctx);
			const argTy = inferRaw(term.arg, env, ctx);
			const resTy = ctx.fresh();
			ctx.unify(fnTy, arrow(argTy, resTy));
			return resTy;
		}
	}
}

const PARSED_DEF_CACHE = new Map<string, Term>();

function parseDefText(defText: string): Term {
	const cached = PARSED_DEF_CACHE.get(defText);
	if (cached !== void 0) return cached;
	// Lightweight de Bruijn lambda parser for defText
	const parsed = parseSimpleLambda(defText);
	PARSED_DEF_CACHE.set(defText, parsed);
	return parsed;
}

function parseSimpleLambda(text: string): Term {
	const normalized = text.replace(/λ/g, "\\");
	const parseScoped = (expr: string, scope: readonly string[]): Term => {
		const trimmed = expr.trim();
		if (trimmed.startsWith("\\")) {
			const dotIdx = trimmed.indexOf(".");
			const param = trimmed.slice(1, dotIdx).trim();
			return {
				kind: "lam",
				body: parseScoped(trimmed.slice(dotIdx + 1), [param, ...scope]),
			};
		}
		const tokens = trimmed.match(/\(|\)|[^\s()]+/g) ?? [];
		const parseAppChain = (items: readonly string[]): Term => {
			if (items.length === 0) return atom("?");
			let cur: Term;
			let idx = 0;
			const parseNextAtom = (): Term => {
				const tok = items[idx++];
				if (tok === "(") {
					let depth = 1;
					const sub: string[] = [];
					while (idx < items.length && depth > 0) {
						const next = items[idx++];
						if (next === "(") depth += 1;
						else if (next === ")") depth -= 1;
						if (depth > 0) sub.push(next);
					}
					return parseAppChain(sub);
				}
				const sIdx = scope.indexOf(tok);
				return sIdx >= 0 ? { kind: "var", index: sIdx } : atom(tok);
			};
			cur = parseNextAtom();
			while (idx < items.length) {
				cur = app(cur, parseNextAtom());
			}
			return cur;
		};
		return parseAppChain(tokens);
	};
	return parseScoped(normalized, []);
}

export function inferTermType(term: Term): Ty {
	const ctx = new InferContext();
	return ctx.finalize(inferRaw(term, [], ctx));
}

export function synth(term: Term, env: readonly Ty[] = []): Ty {
	switch (term.kind) {
		case "var":
			return term.index < env.length ? env[term.index] : any;
		case "atom":
			return base("Atom");
		case "gad": {
			const tool = TOOL_DEFS.get(term.id);
			return tool?.defText ? inferTermType(parseDefText(tool.defText)) : any;
		}
		case "lam":
			return arrow(any, synth(term.body, [any, ...env]));
		case "app": {
			const m = matchArrow(synth(term.fn, env));
			if (!m) throw new TypeErr("not-a-function", term);
			const a = synth(term.arg, env);
			if (!consistent(a, m.from)) throw new TypeErr("arg-mismatch", term, { want: m.from, got: a });
			return m.to;
		}
	}
}

export function check(term: Term, want: Ty, env: readonly Ty[] = []): void {
	if (term.kind === "lam") {
		const m = matchArrow(want);
		if (!m) throw new TypeErr("lam-vs-nonfunction", term);
		check(term.body, m.to, [m.from, ...env]);
		return;
	}
	const got = synth(term, env);
	if (!consistent(got, want)) throw new TypeErr("mismatch", term, { want, got });
}

function cartesianProduct<T>(pools: readonly (readonly T[])[], maxLimit = 30): readonly (readonly T[])[] {
	let result: (readonly T[])[] = [[]];
	for (const pool of pools) {
		if (pool.length === 0) return [];
		const next: (readonly T[])[] = [];
		for (const prev of result) {
			for (const item of pool) {
				next.push([...prev, item]);
				if (next.length >= maxLimit) return next;
			}
		}
		result = next;
	}
	return result;
}

export type VerifyFailure =
	| { readonly kind: "diverge"; readonly args: readonly Term[] }
	| { readonly kind: "bad-result"; readonly args: readonly Term[]; readonly got: Term };

export function verify(
	term: Term,
	plate: Ty,
	ctx: { readonly atoms: readonly string[] },
	registry: Registry,
	maxSteps = 100,
): VerifyFailure | null {
	const { params, result } = spine(plate);
	const pools = params.map((p) =>
		p.k === "base" && BASE_TYPES[p.name] !== void 0 ? BASE_TYPES[p.name].samples(ctx) : ctx.atoms.map(atom),
	);
	for (const args of cartesianProduct(pools, 30)) {
		const norm = judgeNormalize(
			args.reduce((f, a) => app(f, a), term),
			registry,
			maxSteps,
		);
		if (!norm.terminated) return { kind: "diverge", args };
		if (
			result.k === "base" &&
			BASE_TYPES[result.name] !== void 0 &&
			!BASE_TYPES[result.name].check(norm.term, registry)
		) {
			return { kind: "bad-result", args, got: norm.term };
		}
	}
	return null;
}

export type NameplateStatus =
	| "unplated"
	| "unverified"
	| "certified"
	| { readonly kind: "rejected"; readonly reason: string }
	| { readonly kind: "inconsistent"; readonly reason: string };

export interface NameplateSpec {
	readonly inputs: readonly Ty[];
	readonly output: Ty;
	readonly status: NameplateStatus;
}

export function verifyNameplate(
	term: Term,
	spec: NameplateSpec,
	ctx: { readonly atoms: readonly string[] },
	registry: Registry,
): { readonly certified: boolean; readonly reason?: string } {
	const declaredTy = fn(spec.inputs, spec.output);
	try {
		check(term, declaredTy, []);
	} catch (err) {
		return { certified: false, reason: err instanceof Error ? err.message : String(err) };
	}
	const verifyRes = verify(term, declaredTy, ctx, registry, 100);
	if (verifyRes !== null) {
		return {
			certified: false,
			reason: verifyRes.kind === "diverge" ? "求值超时或产生发散循环" : "输出结果不符合目标类型的特征规范",
		};
	}
	return { certified: true };
}
