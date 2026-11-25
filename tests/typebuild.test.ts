import { describe, expect, it } from "vitest";
import { BUILTIN_COUNT, COMBINATORS, LEVELS } from "../src/content";
import {
	type DraftTerm,
	base,
	checkTypeBuild,
	collectBaseTypes,
	countDraftSize,
	createRegistry,
	formatTy,
	inferDraftType,
	judgeNormalize,
	parseLambda,
	parseTy,
} from "../src/engine";

describe("TypeBuild Mode & Level Verification", () => {
	const registry = createRegistry(COMBINATORS.slice(0, BUILTIN_COUNT));
	const typeBuildOrders = LEVELS.filter((lvl) => lvl.mode === "typebuild");

	it("contains exactly 12 typebuild levels distributed across chapters 2-7", () => {
		expect(typeBuildOrders.length).toBe(12);
		expect(typeBuildOrders.filter((l) => l.chapter === 1).length).toBe(0);
		expect(typeBuildOrders.filter((l) => l.chapter === 2).length).toBe(2);
		expect(typeBuildOrders.filter((l) => l.chapter === 3).length).toBe(3);
		expect(typeBuildOrders.filter((l) => l.chapter === 4).length).toBe(2);
		expect(typeBuildOrders.filter((l) => l.chapter === 5).length).toBe(2);
		expect(typeBuildOrders.filter((l) => l.chapter === 6).length).toBe(2);
		expect(typeBuildOrders.filter((l) => l.chapter === 7).length).toBe(1);
	});

	it("formats and parses all targetTy specifications consistently", () => {
		for (const order of typeBuildOrders) {
			const formatted = formatTy(order.targetTy);
			expect(formatted.length).toBeGreaterThan(0);
			const reparsed = parseTy(formatted);
			expect(formatTy(reparsed)).toBe(formatted);
		}
	});

	it("accepts canonical solutions for Chapter 2 typebuild orders", () => {
		const tbId = typeBuildOrders.find((l) => l.id === "tb-identity");
		expect(tbId).toBeDefined();
		if (tbId) {
			const sol = parseLambda("λ(x: A). x");
			expect(() => checkTypeBuild(sol, tbId.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
			const draft: DraftTerm = { kind: "lam", param: "x", ty: base("A"), body: { kind: "var", name: "x" } };
			expect(countDraftSize(draft)).toBeLessThanOrEqual(tbId.parSize);
		}

		const tbConst = typeBuildOrders.find((l) => l.id === "tb-const");
		expect(tbConst).toBeDefined();
		if (tbConst) {
			const sol = parseLambda("λ(x: A). λ(y: B). x");
			expect(() => checkTypeBuild(sol, tbConst.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
			const draft: DraftTerm = {
				kind: "lam",
				param: "x",
				ty: base("A"),
				body: { kind: "lam", param: "y", ty: base("B"), body: { kind: "var", name: "x" } },
			};
			expect(countDraftSize(draft)).toBeLessThanOrEqual(tbConst.parSize);
		}
	});

	it("accepts canonical solutions for Chapter 3 typebuild orders", () => {
		const tbThrush = typeBuildOrders.find((l) => l.id === "tb-thrush");
		expect(tbThrush).toBeDefined();
		if (tbThrush) {
			const sol = parseLambda("λ(x: A). λ(f: A -> B). f x");
			expect(() => checkTypeBuild(sol, tbThrush.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
		}

		const tbBoolSel = typeBuildOrders.find((l) => l.id === "tb-bool-sel");
		expect(tbBoolSel).toBeDefined();
		if (tbBoolSel) {
			const sol = parseLambda("λ(x: A). λ(y: A). x");
			expect(() => checkTypeBuild(sol, tbBoolSel.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
		}

		const tbCompose = typeBuildOrders.find((l) => l.id === "tb-compose");
		expect(tbCompose).toBeDefined();
		if (tbCompose) {
			const sol = parseLambda("λ(f: B -> C). λ(g: A -> B). λ(x: A). f (g x)");
			expect(() => checkTypeBuild(sol, tbCompose.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
		}
	});

	it("accepts canonical solutions for Chapter 4-7 typebuild orders", () => {
		const cases: readonly [string, string][] = [
			["tb-maybe-nothing", "λ(d: B). λ(j: A -> B). d"],
			["tb-either-left", "λ(a: A). λ(l: A -> C). λ(r: B -> C). l a"],
			["tb-zero", "λ(f: A -> A). λ(x: A). x"],
			["tb-two", "λ(f: A -> A). λ(x: A). f (f x)"],
			["tb-list", "λ(c: A -> B -> B). λ(n: B). n"],
			["tb-tree", "λ(f: A -> B -> B -> B). λ(z: B). z"],
			["tb-rec-step", "λ(r: A -> B). λ(x: A). r x"],
		];
		for (const [id, code] of cases) {
			const lvl = typeBuildOrders.find((l) => l.id === id);
			expect(lvl).toBeDefined();
			if (lvl) {
				const sol = parseLambda(code);
				expect(() => checkTypeBuild(sol, lvl.targetTy, registry)).not.toThrow();
				expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
			}
		}
	});

	it("strictly rejects any parameter containing any or unannotated in checkTypeBuild", () => {
		const tbId = typeBuildOrders.find((l) => l.id === "tb-identity");
		expect(tbId).toBeDefined();
		if (tbId) {
			expect(() => checkTypeBuild(parseLambda("λx. x"), tbId.targetTy, registry)).toThrow("未指定类型");
			expect(() => checkTypeBuild(parseLambda("λ(x: ?). x"), tbId.targetTy, registry)).toThrow("不能包含动态类型 ?");
			expect(() => checkTypeBuild(parseLambda("λ(x: B). x"), tbId.targetTy, registry)).toThrow("参数类型不一致");
		}
		expect(() => checkTypeBuild(parseLambda("λ(x: A). λ(y: ?). x"), parseTy("A -> B -> A"), registry)).toThrow(
			"不能包含动态类型 ?",
		);
	});

	it("rejects diverging or loop terms in typebuild normalization check", () => {
		const omega = parseLambda("(λx. x x) (λx. x x)");
		const norm = judgeNormalize(omega, registry, 30);
		expect(norm.terminated).toBe(false);
	});

	it("extracts base types and infers draft types with holes and annotations", () => {
		const ty = parseTy("(B -> C) -> (A -> B) -> A -> C");
		expect(collectBaseTypes(ty)).toEqual(["A", "B", "C"]);

		const holeDraft: DraftTerm = { kind: "hole" };
		expect(formatTy(inferDraftType(holeDraft, registry).ty ?? parseTy("?"))).toBe("?");

		const annotatedDraft: DraftTerm = {
			kind: "lam",
			param: "x",
			ty: base("A"),
			body: { kind: "var", name: "x" },
		};
		expect(formatTy(inferDraftType(annotatedDraft, registry).ty ?? parseTy("?"))).toBe("A -> A");

		const partialDraft: DraftTerm = {
			kind: "lam",
			param: "x",
			ty: base("A"),
			body: { kind: "hole" },
		};
		expect(formatTy(inferDraftType(partialDraft, registry).ty ?? parseTy("?"))).toBe("A -> ?");
	});
});
