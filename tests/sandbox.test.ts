import { describe, expect, it } from "vitest";
import { COMBINATORS, SANDBOX_ORDER } from "../src/content";
import { createRegistry, draftToTerm, redexes, stepLeftmost } from "../src/engine";

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

		expect(redexes(term, registry, "").length).toBe(1);
		const stepped = stepLeftmost(term, registry, "");
		expect(stepped).not.toBeNull();
		expect(stepped?.next.kind).toBe("atom");
		expect((stepped?.next as { readonly name: string }).name).toBe("A");
	});
});
