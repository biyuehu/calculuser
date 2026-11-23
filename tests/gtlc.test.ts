import { describe, expect, it } from "vitest";
import { BUILTIN_COUNT, COMBINATORS } from "../src/content";
import {
	any,
	app,
	arrow,
	atom,
	base,
	check,
	consistent,
	createRegistry,
	inferTermType,
	lessPrecise,
	parseLambda,
	parseTy,
	spine,
	verify,
} from "../src/engine";

describe("GTLC Type System", () => {
	it("parses string types into Ty representation", () => {
		expect(parseTy("?")).toEqual(any);
		expect(parseTy("Atom")).toEqual(base("Atom"));
		expect(parseTy("Atom -> Bool")).toEqual(arrow(base("Atom"), base("Bool")));
		expect(parseTy("(Atom -> Atom) -> Atom")).toEqual(arrow(arrow(base("Atom"), base("Atom")), base("Atom")));
		expect(parseTy("Atom -> Atom -> Atom")).toEqual(arrow(base("Atom"), arrow(base("Atom"), base("Atom"))));
	});

	it("deconstructs arrows into parameter spine and final result", () => {
		const s1 = spine(parseTy("Atom -> Bool -> Atom"));
		expect(s1.params).toEqual([base("Atom"), base("Bool")]);
		expect(s1.result).toEqual(base("Atom"));

		const s2 = spine(parseTy("?"));
		expect(s2.params).toEqual([]);
		expect(s2.result).toEqual(any);
	});

	it("evaluates type consistency correctly according to GTLC rules", () => {
		const atomTy = base("Atom");
		const boolTy = base("Bool");

		expect(consistent(any, any)).toBe(true);
		expect(consistent(any, atomTy)).toBe(true);
		expect(consistent(atomTy, any)).toBe(true);
		expect(consistent(atomTy, atomTy)).toBe(true);
		expect(consistent(atomTy, boolTy)).toBe(false);

		const arr1 = arrow(atomTy, atomTy);
		const arr2 = arrow(any, atomTy);
		const arr3 = arrow(atomTy, boolTy);

		expect(consistent(arr1, arr2)).toBe(true);
		expect(consistent(arr1, arr3)).toBe(false);
		expect(consistent(arr2, arr3)).toBe(false);
	});

	it("computes precision ordering (a ⊑ b)", () => {
		const atomTy = base("Atom");
		const arr1 = arrow(atomTy, atomTy);
		const arr2 = arrow(any, any);

		expect(lessPrecise(any, atomTy)).toBe(true);
		expect(lessPrecise(atomTy, any)).toBe(false);
		expect(lessPrecise(arr2, arr1)).toBe(true);
		expect(lessPrecise(arr1, arr2)).toBe(false);
	});

	it("infers accurate arrow structures and arity for combinators and lambda terms", () => {
		expect(inferTermType(parseLambda("λx. x"))).toEqual(arrow(any, any));
		expect(inferTermType(parseLambda("λx. λy. x"))).toEqual(arrow(any, arrow(any, any)));
		expect(inferTermType(parseLambda("λx. λy. λz. x z (y z)"))).toEqual(
			arrow(arrow(any, arrow(any, any)), arrow(arrow(any, any), arrow(any, any))),
		);
		expect(inferTermType(parseLambda("λx. x x"))).toEqual(arrow(any, any));

		const termK = parseLambda("λx. λy. x");
		const termKA = app(termK, atom("A"));
		expect(inferTermType(termKA)).toEqual(arrow(any, base("Atom")));

		const termKAB = app(termKA, atom("B"));
		expect(inferTermType(termKAB)).toEqual(base("Atom"));
	});

	it("checks and verifies valid terms against target types", () => {
		const registry = createRegistry(COMBINATORS.slice(0, BUILTIN_COUNT));
		expect(() => check(parseLambda("λx. x"), parseTy("Atom -> Atom"))).not.toThrow();
		expect(() => check(parseLambda("λx. λy. x"), parseTy("Atom -> Bool -> Atom"))).not.toThrow();

		const resI = verify(parseLambda("λx. x"), parseTy("Atom -> Atom"), { atoms: ["A", "B"] }, registry, 100);
		expect(resI).toBeNull();

		const resK = verify(
			parseLambda("λx. λy. x"),
			parseTy("Atom -> Bool -> Atom"),
			{ atoms: ["A", "B"] },
			registry,
			100,
		);
		expect(resK).toBeNull();
	});

	it("rejects ill-typed applications on base types in check and verify", () => {
		const registry = createRegistry(COMBINATORS.slice(0, BUILTIN_COUNT));
		const termM = parseLambda("λx. x x");

		expect(() => check(termM, parseTy("? -> ?"))).not.toThrow();
		expect(() => check(termM, parseTy("Atom -> ?"))).toThrow("基础类型无法作为函数调用");
		expect(() => check(termM, parseTy("Atom -> Atom"))).toThrow("基础类型无法作为函数调用");

		const resDynamic = verify(termM, parseTy("? -> ?"), { atoms: ["A", "B"] }, registry, 100);
		expect(resDynamic).toBeNull();

		expect(() => check(termM, parseTy("Atom -> ?"), [], registry)).toThrow("基础类型无法作为函数调用");
	});

	it("verifies behavioral compliance of term with verify helper", () => {
		const registry = createRegistry(COMBINATORS.slice(0, BUILTIN_COUNT));
		const ctx = { atoms: ["A", "B"] };

		const resIdentity = verify(parseLambda("λx. x"), parseTy("Atom -> Atom"), ctx, registry, 50);
		expect(resIdentity).toBeNull();

		const resConst = verify(parseLambda("λx. λy. x"), parseTy("Atom -> Atom -> Atom"), ctx, registry, 50);
		expect(resConst).toBeNull();
	});

	it("parses and prints type-annotated lambdas and type ascriptions", () => {
		const t1 = parseLambda("λ(x: Atom). x");
		expect(t1.kind).toBe("lam");
		if (t1.kind === "lam") expect(t1.ty).toEqual(base("Atom"));

		const t2 = parseLambda("λx: Atom -> Bool. x");
		expect(t2.kind).toBe("lam");
		if (t2.kind === "lam") expect(t2.ty).toEqual(arrow(base("Atom"), base("Bool")));

		const t3 = parseLambda("λ(x: ?). x");
		expect(t3.kind).toBe("lam");
		if (t3.kind === "lam") expect(t3.ty).toEqual(any);

		const t4 = parseLambda("λx. (x : Atom)");
		expect(t4.kind).toBe("lam");
		if (t4.kind === "lam") {
			expect(t4.body.kind).toBe("ann");
			if (t4.body.kind === "ann") {
				expect(t4.body.ty).toEqual(base("Atom"));
				expect(t4.body.term.kind).toBe("var");
			}
		}

		const t5 = parseLambda("(A : Atom)");
		expect(t5.kind).toBe("ann");
		if (t5.kind === "ann") {
			expect(t5.ty).toEqual(base("Atom"));
			expect(t5.term.kind).toBe("atom");
			if (t5.term.kind === "atom") expect(t5.term.ty).toEqual(base("Atom"));
		}

		const boolAtom = atom("#T", base("Bool"));
		expect(boolAtom.kind).toBe("atom");
		if (boolAtom.kind === "atom") expect(boolAtom.ty).toEqual(base("Bool"));
		expect(inferTermType(boolAtom)).toEqual(base("Bool"));

		expect(inferTermType(t1)).toEqual(arrow(base("Atom"), base("Atom")));
		expect(inferTermType(t2)).toEqual(arrow(arrow(base("Atom"), base("Bool")), arrow(base("Atom"), base("Bool"))));
		expect(() => check(t1, parseTy("Bool -> Bool"))).toThrow();
	});
});
