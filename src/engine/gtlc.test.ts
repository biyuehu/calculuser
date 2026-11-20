import { describe, expect, it } from "vitest";
import { createBuiltinRegistry } from "./gadget";
import {
	any,
	arrow,
	base,
	check,
	consistent,
	inferTermType,
	lessPrecise,
	parseTy,
	spine,
	verify,
	verifyNameplate,
} from "./gtlc";
import { parseLambda } from "./parse";
import { app, atom } from "./term";

describe("GTLC Type System & Nameplates", () => {
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
		const registry = createBuiltinRegistry();
		expect(() => check(parseLambda("λx. x"), parseTy("Atom -> Atom"))).not.toThrow();
		expect(() => check(parseLambda("λx. λy. x"), parseTy("Atom -> Bool -> Atom"))).not.toThrow();

		const resI = verifyNameplate(
			parseLambda("λx. x"),
			{
				inputs: [base("Atom")],
				output: base("Atom"),
				status: "unverified",
			},
			{ atoms: ["A", "B"] },
			registry,
		);
		expect(resI.certified).toBe(true);

		const resK = verifyNameplate(
			parseLambda("λx. λy. x"),
			{
				inputs: [base("Atom"), base("Bool")],
				output: base("Atom"),
				status: "unverified",
			},
			{ atoms: ["A", "B"] },
			registry,
		);
		expect(resK.certified).toBe(true);
	});

	it("rejects ill-typed applications on base types in check and verify", () => {
		const registry = createBuiltinRegistry();
		const termM = parseLambda("λx. x x");

		expect(() => check(termM, parseTy("? -> ?"))).not.toThrow();
		expect(() => check(termM, parseTy("Atom -> ?"))).toThrow("基础类型无法作为函数调用");
		expect(() => check(termM, parseTy("Atom -> Atom"))).toThrow("基础类型无法作为函数调用");

		const resDynamic = verifyNameplate(
			termM,
			{
				inputs: [any],
				output: any,
				status: "unverified",
			},
			{ atoms: ["A", "B"] },
			registry,
		);
		expect(resDynamic.certified).toBe(true);

		const resMonotype = verifyNameplate(
			termM,
			{
				inputs: [base("Atom")],
				output: any,
				status: "unverified",
			},
			{ atoms: ["A", "B"] },
			registry,
		);
		expect(resMonotype.certified).toBe(false);
		expect(resMonotype.reason).toContain("基础类型无法作为函数调用");
	});

	it("verifies behavioral compliance of term with verify helper", () => {
		const registry = createBuiltinRegistry();
		const ctx = { atoms: ["A", "B"] };
		expect(verify(parseLambda("λx. x"), parseTy("Atom -> Atom"), ctx, registry)).toBeNull();

		const failBadResult = verify(parseLambda("λx. x"), parseTy("Atom -> Bool"), ctx, registry);
		expect(failBadResult?.kind).toBe("bad-result");
	});
});
