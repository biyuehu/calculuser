import { describe, expect, it, vi } from "vitest";
import { dispatchKeyEvent, registerKeyScope } from "../src/utils/keybus";

describe("keybus", () => {
	it("prioritizes modal scope over view scope and suppresses view on modal active", () => {
		const modalEsc = vi.fn();
		const viewEsc = vi.fn();

		const unregisterView = registerKeyScope({
			id: "view",
			level: "view",
			bindings: [{ key: "Escape", handle: viewEsc }],
		});

		const unregisterModal = registerKeyScope({
			id: "modal",
			level: "modal",
			bindings: [{ key: "Escape", handle: modalEsc }],
		});

		const preventDefault = vi.fn();
		dispatchKeyEvent({ key: "Escape", target: null, preventDefault });
		expect(modalEsc).toHaveBeenCalledTimes(1);
		expect(viewEsc).not.toHaveBeenCalled();
		expect(preventDefault).toHaveBeenCalledTimes(1);

		unregisterModal();
		unregisterView();
	});

	it("prevents view scope execution when an active modal exists even if unhandled by modal", () => {
		const viewSpace = vi.fn();

		const unregisterView = registerKeyScope({
			id: "view",
			level: "view",
			bindings: [{ key: " ", handle: viewSpace }],
		});

		const unregisterModal = registerKeyScope({
			id: "modal",
			level: "modal",
			bindings: [{ key: "Escape", handle: vi.fn() }],
		});

		const preventDefault = vi.fn();
		dispatchKeyEvent({ key: " ", target: null, preventDefault });
		expect(viewSpace).not.toHaveBeenCalled();

		unregisterModal();
		dispatchKeyEvent({ key: " ", target: null, preventDefault });
		expect(viewSpace).toHaveBeenCalledTimes(1);

		unregisterView();
	});

	it("respects active condition", () => {
		let active = false;
		const action = vi.fn();
		const unregister = registerKeyScope({
			id: "conditional",
			level: "view",
			active: () => active,
			bindings: [{ key: "Enter", handle: action }],
		});

		const preventDefault = vi.fn();
		dispatchKeyEvent({ key: "Enter", target: null, preventDefault });
		expect(action).not.toHaveBeenCalled();

		active = true;
		dispatchKeyEvent({ key: "Enter", target: null, preventDefault });
		expect(action).toHaveBeenCalledTimes(1);

		unregister();
	});
});
