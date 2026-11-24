import { describe, expect, it } from "vitest";
import { COMBINATORS, SANDBOX_ORDER, deriveGadgetVisuals, getGadgetMeta } from "../src/content";
import {
	atom,
	createRegistry,
	draftToTerm,
	inlineCustomGadgets,
	redexes,
	registerGadget,
	setDraftAtPath,
	stepLeftmost,
	termToDraft,
} from "../src/engine";

describe("Sandbox Mode", () => {
	it("provides a valid sandbox order definition", () => {
		expect(SANDBOX_ORDER.mode).toBe("sandbox");
		expect(SANDBOX_ORDER.id).toBe("sandbox");
		expect(SANDBOX_ORDER.allowBlueprint).toBe(true);
		expect(SANDBOX_ORDER.atoms.length).toBeGreaterThan(0);
	});

	it("supports full step reduction on arbitrary draft assembly", () => {
		const registry = createRegistry(COMBINATORS);
		const term = draftToTerm(
			{
				kind: "app",
				fn: {
					kind: "app",
					fn: { kind: "gad", id: "K" },
					arg: { kind: "atom", name: "A" },
				},
				arg: { kind: "atom", name: "B" },
			},
			[],
		);

		expect(redexes(term, registry, "", "free").length).toBe(1);
		let current = term;
		while (true) {
			const stepped = stepLeftmost(current, registry, "", "free");
			if (stepped === null) break;
			current = stepped.next;
		}
		expect(current.kind).toBe("atom");
		expect((current as { readonly name: string }).name).toBe("A");
	});

	it("allows standalone gadget or partial application to reduce in free mode without arity gate", () => {
		const registry = createRegistry(COMBINATORS);
		const standaloneI = { kind: "gad" as const, id: "I" };
		expect(redexes(standaloneI, registry, "", "free").length).toBe(1);
		expect(redexes(standaloneI, registry, "", "run").length).toBe(0);
		const steppedI = stepLeftmost(standaloneI, registry, "", "free");
		expect(steppedI !== null && steppedI.next.kind === "lam").toBe(true);

		const partialK = { kind: "app" as const, fn: { kind: "gad" as const, id: "K" }, arg: atom("A") };
		expect(redexes(partialK, registry, "", "free").length).toBe(1);
		expect(redexes(partialK, registry, "", "run").length).toBe(0);
	});

	it("derives deterministic visual glyph, shape and accent from gadget id", () => {
		const visual1 = deriveGadgetVisuals("PAIR");
		const visual2 = deriveGadgetVisuals("PAIR");
		expect(visual1.symbol).toBe("P");
		expect(visual1.shape).toBe(visual2.shape);
		expect(visual1.accent).toBe(visual2.accent);

		const meta = getGadgetMeta("PAIR", "二元组");
		expect(meta.name).toBe("二元组");
		expect(meta.symbol).toBe("P");
		expect(meta.shape).toBe(visual1.shape);
	});

	it("registers and reduces custom gadget in free sandbox mode", () => {
		const registry = createRegistry(COMBINATORS);
		const myId = "MY_NOT";
		const notTerm = {
			kind: "lam" as const,
			param: "p" as const,
			body: {
				kind: "app" as const,
				fn: {
					kind: "app" as const,
					fn: { kind: "var" as const, index: 0, name: "p" as const },
					arg: atom("F"),
				},
				arg: atom("T"),
			},
		};
		registerGadget(registry, myId, notTerm, "custom");

		const applied = {
			kind: "app" as const,
			fn: { kind: "gad" as const, id: myId },
			arg: atom("X"),
		};

		const paths = redexes(applied, registry, "", "free");
		expect(paths).toContain("f");
		const step1 = stepLeftmost(applied, registry, "", "free");
		expect(step1).not.toBeNull();
		expect(step1?.event.kind).toBe("delta");
		expect((step1?.event as { readonly gadget: string }).gadget).toBe(myId);
	});

	it("inlines custom gadgets as snapshots to prevent self-referential cycles", () => {
		const registry = createRegistry(COMBINATORS);
		const idA = "a";
		const defA = {
			kind: "lam" as const,
			param: "x" as const,
			body: { kind: "var" as const, index: 0, name: "x" as const },
		};
		registerGadget(registry, idA, defA, "custom");

		const benchTerm = { kind: "gad" as const, id: idA };
		const inlined = inlineCustomGadgets(benchTerm, registry);
		expect(inlined.kind).toBe("lam");
		expect(inlined).toEqual(defA);

		registerGadget(registry, idA, inlined, "custom");
		const stepped = stepLeftmost({ kind: "gad", id: idA }, registry, "", "free");
		expect(stepped !== null && stepped.next.kind === "lam").toBe(true);
	});

	it("converts closed term to draft term and expands into selected hole", () => {
		const term = {
			kind: "lam" as const,
			param: "x" as const,
			body: {
				kind: "app" as const,
				fn: { kind: "gad" as const, id: "I" },
				arg: { kind: "var" as const, index: 0, name: "x" as const },
			},
		};
		const draft = termToDraft(term);
		expect(draft).toEqual({
			kind: "lam",
			param: "x",
			body: {
				kind: "app",
				fn: { kind: "gad", id: "I" },
				arg: { kind: "var", name: "x" },
			},
		});

		const workbenchDraft = {
			kind: "app" as const,
			fn: { kind: "hole" as const },
			arg: { kind: "atom" as const, name: "A" },
		};
		const filled = setDraftAtPath(workbenchDraft, "f", draft);
		expect(filled).toEqual({
			kind: "app",
			fn: draft,
			arg: { kind: "atom", name: "A" },
		});
	});
});
