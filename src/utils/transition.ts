export function transitionView(update: () => void, direction?: "forward" | "backward"): void {
	if (typeof document !== "undefined" && "startViewTransition" in document) {
		if (direction !== void 0) {
			document.documentElement.setAttribute("data-transition-direction", direction);
		}
		const vt = (
			document as unknown as { startViewTransition: (cb: () => void) => { finished: Promise<void> } }
		).startViewTransition(update);
		if (direction !== void 0 && vt && typeof vt.finished?.then === "function") {
			vt.finished.finally(() => {
				document.documentElement.removeAttribute("data-transition-direction");
			});
		}
	} else {
		update();
	}
}
