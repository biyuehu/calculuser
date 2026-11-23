export type Ty =
	| { readonly k: "any" }
	| { readonly k: "base"; readonly name: string }
	| { readonly k: "var"; readonly id: number }
	| { readonly k: "arrow"; readonly from: Ty; readonly to: Ty };

export const any: Ty = { k: "any" };
export const base = (name: string): Ty => ({ k: "base", name });
export const arrow = (from: Ty, to: Ty): Ty => ({ k: "arrow", from, to });
export const fn = (ps: readonly Ty[], r: Ty): Ty => ps.reduceRight((acc, p) => arrow(p, acc), r);

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
	if (i !== toks.length) throw new Error(`Type parse error: ${src}`);
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

export function collectBaseTypes(ty: Ty): readonly string[] {
	const set = new Set<string>();
	const walk = (t: Ty): void => {
		if (t.k === "base") set.add(t.name);
		else if (t.k === "arrow") {
			walk(t.from);
			walk(t.to);
		}
	};
	walk(ty);
	return Array.from(set).sort();
}

export function hasAny(t: Ty): boolean {
	switch (t.k) {
		case "any":
			return true;
		case "base":
		case "var":
			return false;
		case "arrow":
			return hasAny(t.from) || hasAny(t.to);
	}
}

export function tyEquals(a: Ty, b: Ty): boolean {
	if (a.k !== b.k) return false;
	switch (a.k) {
		case "any":
			return true;
		case "base":
			return a.name === (b as { readonly name: string }).name;
		case "var":
			return a.id === (b as { readonly id: number }).id;
		case "arrow":
			return (
				tyEquals(a.from, (b as { readonly from: Ty; readonly to: Ty }).from) &&
				tyEquals(a.to, (b as { readonly from: Ty; readonly to: Ty }).to)
			);
	}
}
