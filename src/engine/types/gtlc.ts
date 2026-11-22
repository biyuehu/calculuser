import type { Registry } from "../semantics/gadget";
import { judgeNormalize } from "../semantics/judge";
import { type DraftTerm, draftToInferTerm } from "../syntax/draft";
import { type Term, app, atom } from "../syntax/term";
import { type Ty, any, arrow, consistent, fn, formatTy, matchArrow, spine } from "./ty";

export * from "./ty";

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
		samples: (c) => c.atoms.map((name) => atom(name)),
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

function inferRaw(term: Term, env: readonly Ty[], ctx: InferContext, registry?: Registry): Ty {
	switch (term.kind) {
		case "var":
			return term.index < env.length ? ctx.find(env[term.index]) : any;
		case "atom":
			return term.ty;
		case "gad": {
			const entry = registry ? registry.get(term.id) : void 0;
			return entry !== void 0 ? inferRaw(entry.def, [], ctx, registry) : any;
		}
		case "ann": {
			const inferred = inferRaw(term.term, env, ctx, registry);
			ctx.unify(inferred, term.ty);
			return term.ty;
		}
		case "lam": {
			const paramTy = term.ty !== void 0 ? term.ty : ctx.fresh();
			return arrow(paramTy, inferRaw(term.body, [paramTy, ...env], ctx, registry));
		}
		case "app": {
			const fnTy = inferRaw(term.fn, env, ctx, registry);
			const argTy = inferRaw(term.arg, env, ctx, registry);
			const resTy = ctx.fresh();
			ctx.unify(fnTy, arrow(argTy, resTy));
			return resTy;
		}
	}
}

export function inferTermType(term: Term, registry?: Registry): Ty {
	const ctx = new InferContext();
	return ctx.finalize(inferRaw(term, [], ctx, registry));
}

export function synth(term: Term, env: readonly Ty[] = [], registry?: Registry): Ty {
	switch (term.kind) {
		case "var":
			return term.index < env.length ? env[term.index] : any;
		case "atom":
			return term.ty;
		case "gad": {
			const entry = registry ? registry.get(term.id) : void 0;
			return entry !== void 0 ? inferTermType(entry.def, registry) : any;
		}
		case "ann": {
			check(term.term, term.ty, env, registry);
			return term.ty;
		}
		case "lam": {
			const paramTy = term.ty ?? any;
			return arrow(paramTy, synth(term.body, [paramTy, ...env], registry));
		}
		case "app": {
			const m = matchArrow(synth(term.fn, env, registry));
			if (!m) throw new TypeErr("not-a-function", term);
			const a = synth(term.arg, env, registry);
			if (!consistent(a, m.from)) throw new TypeErr("arg-mismatch", term, { want: m.from, got: a });
			return m.to;
		}
	}
}

export function check(term: Term, want: Ty, env: readonly Ty[] = [], registry?: Registry): void {
	if (term.kind === "lam") {
		const m = matchArrow(want);
		if (!m) throw new TypeErr("lam-vs-nonfunction", term);
		if (term.ty !== void 0 && !consistent(term.ty, m.from))
			throw new TypeErr("arg-mismatch", term, { want: m.from, got: term.ty });
		const paramTy = term.ty ?? m.from;
		check(term.body, m.to, [paramTy, ...env], registry);
		return;
	}
	if (term.kind === "ann") {
		if (!consistent(term.ty, want)) throw new TypeErr("mismatch", term, { want, got: term.ty });
		check(term.term, term.ty, env, registry);
		return;
	}
	const got = synth(term, env, registry);
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
		p.k === "base" && BASE_TYPES[p.name] !== void 0
			? BASE_TYPES[p.name].samples(ctx)
			: ctx.atoms.map((name) => atom(name)),
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
		check(term, declaredTy, [], registry);
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

export function inferDraftType(
	draft: DraftTerm,
	registry?: Registry,
): { readonly ty: Ty | null; readonly error: string | null } {
	try {
		const term = draftToInferTerm(draft, []);
		return { ty: inferTermType(term, registry), error: null };
	} catch (err) {
		return {
			ty: null,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}
