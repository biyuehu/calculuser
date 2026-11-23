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

	it("contains exactly 11 typebuild levels distributed across chapters", () => {
		expect(typeBuildOrders.length).toBe(11);
		const ch1 = typeBuildOrders.filter((l) => l.chapter === 1);
		const ch2 = typeBuildOrders.filter((l) => l.chapter === 2);
		const ch3 = typeBuildOrders.filter((l) => l.chapter === 3);
		const ch4 = typeBuildOrders.filter((l) => l.chapter === 4);

		expect(ch1.length).toBe(2);
		expect(ch2.length).toBe(3);
		expect(ch3.length).toBe(3);
		expect(ch4.length).toBe(3);
	});

	it("formats and parses all targetTy specifications consistently", () => {
		for (const order of typeBuildOrders) {
			const formatted = formatTy(order.targetTy);
			expect(formatted.length).toBeGreaterThan(0);
			const reparsed = parseTy(formatted);
			expect(formatTy(reparsed)).toBe(formatted);
		}
	});

	it("accepts canonical solutions for Chapter 1 typebuild orders", () => {
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

	it("accepts canonical solutions for Chapter 2 typebuild orders", () => {
		const tbThrush = typeBuildOrders.find((l) => l.id === "tb-thrush");
		expect(tbThrush).toBeDefined();
		if (tbThrush) {
			const sol = parseLambda("λ(x: A). λ(f: A -> B). f x");
			expect(() => checkTypeBuild(sol, tbThrush.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
		}

		const tbCompose = typeBuildOrders.find((l) => l.id === "tb-compose");
		expect(tbCompose).toBeDefined();
		if (tbCompose) {
			const sol = parseLambda("λ(f: B -> C). λ(g: A -> B). λ(x: A). f (g x)");
			expect(() => checkTypeBuild(sol, tbCompose.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
		}

		const tbFlip = typeBuildOrders.find((l) => l.id === "tb-flip");
		expect(tbFlip).toBeDefined();
		if (tbFlip) {
			const sol = parseLambda("λ(f: A -> B -> C). λ(y: B). λ(x: A). f x y");
			expect(() => checkTypeBuild(sol, tbFlip.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
		}
	});

	it("accepts canonical solutions for Chapter 3 typebuild orders", () => {
		const tbBoolSel = typeBuildOrders.find((l) => l.id === "tb-bool-sel");
		expect(tbBoolSel).toBeDefined();
		if (tbBoolSel) {
			const sol = parseLambda("λ(x: A). λ(y: A). x");
			expect(() => checkTypeBuild(sol, tbBoolSel.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
		}

		const tbPair = typeBuildOrders.find((l) => l.id === "tb-pair");
		expect(tbPair).toBeDefined();
		if (tbPair) {
			const sol = parseLambda("λ(x: A). λ(y: B). λ(f: A -> B -> C). f x y");
			expect(() => checkTypeBuild(sol, tbPair.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
		}

		const tbFst = typeBuildOrders.find((l) => l.id === "tb-fst");
		expect(tbFst).toBeDefined();
		if (tbFst) {
			const sol = parseLambda("λ(p: (A -> B -> A) -> A). p (λ(x: A). λ(y: B). x)");
			expect(() => checkTypeBuild(sol, tbFst.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
		}
	});

	it("accepts canonical solutions for Chapter 4 typebuild orders", () => {
		const tbZero = typeBuildOrders.find((l) => l.id === "tb-zero");
		expect(tbZero).toBeDefined();
		if (tbZero) {
			const sol = parseLambda("λ(f: A -> A). λ(x: A). x");
			expect(() => checkTypeBuild(sol, tbZero.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
		}

		const tbOne = typeBuildOrders.find((l) => l.id === "tb-one");
		expect(tbOne).toBeDefined();
		if (tbOne) {
			const sol = parseLambda("λ(f: A -> A). λ(x: A). f x");
			expect(() => checkTypeBuild(sol, tbOne.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
		}

		const tbTwo = typeBuildOrders.find((l) => l.id === "tb-two");
		expect(tbTwo).toBeDefined();
		if (tbTwo) {
			const sol = parseLambda("λ(f: A -> A). λ(x: A). f (f x)");
			expect(() => checkTypeBuild(sol, tbTwo.targetTy, registry)).not.toThrow();
			expect(judgeNormalize(sol, registry, 50).terminated).toBe(true);
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
