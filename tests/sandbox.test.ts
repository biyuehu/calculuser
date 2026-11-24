import { describe, expect, it } from "vitest";
import { COMBINATORS, SANDBOX_ORDER } from "../src/content";
import { atom, createRegistry, draftToTerm, redexes, stepLeftmost } from "../src/engine";

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
});
