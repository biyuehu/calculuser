import { describe, expect, it } from "vitest";
import { isDesktop, setupDesktopGuard } from "../src/ui/desktopGuard";

describe("Desktop Guard Layer", () => {
	it("detects desktop environment based on tauri presence", () => {
		expect(typeof isDesktop()).toBe("boolean");
	});

	it("registers desktop guard listeners when in desktop mode", () => {
		const listeners = new Map<string, (e: { defaultPrevented: boolean; preventDefault: () => void }) => void>();
		const mockWindow = {
			__TAURI_INTERNALS__: {},
			addEventListener: (
				event: string,
				handler: (e: { defaultPrevented: boolean; preventDefault: () => void }) => void,
			) => {
				listeners.set(event, handler);
			},
		};
		Object.defineProperty(globalThis, "window", { value: mockWindow, configurable: true, writable: true });

		expect(isDesktop()).toBe(true);
		setupDesktopGuard();

		// Contextmenu should be prevented
		const ctxEvent = {
			defaultPrevented: false,
			preventDefault() {
				this.defaultPrevented = true;
			},
		};
		listeners.get("contextmenu")?.(ctxEvent);
		expect(ctxEvent.defaultPrevented).toBe(true);

		// F5 should be prevented
		const f5Event = {
			key: "F5",
			ctrlKey: false,
			metaKey: false,
			defaultPrevented: false,
			preventDefault() {
				this.defaultPrevented = true;
			},
		};
		// biome-ignore lint/suspicious/noExplicitAny: mock event
		(listeners.get("keydown") as any)?.(f5Event);
		expect(f5Event.defaultPrevented).toBe(true);

		// Ctrl+R should be prevented
		const ctrlREvent = {
			key: "r",
			ctrlKey: true,
			metaKey: false,
			defaultPrevented: false,
			preventDefault() {
				this.defaultPrevented = true;
			},
		};
		// biome-ignore lint/suspicious/noExplicitAny: mock event
		(listeners.get("keydown") as any)?.(ctrlREvent);
		expect(ctrlREvent.defaultPrevented).toBe(true);
	});
});
