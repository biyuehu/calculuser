import { isTauri } from "@tauri-apps/api/core";

export const isDesktop = (): boolean => typeof window !== "undefined" && (isTauri() || "__TAURI_INTERNALS__" in window);

export function setupDesktopGuard(): void {
	if (!isDesktop()) return;

	window.addEventListener("contextmenu", (event) => {
		event.preventDefault();
	});

	window.addEventListener("dragstart", (event) => {
		event.preventDefault();
	});

	window.addEventListener(
		"wheel",
		(event) => {
			if (event.ctrlKey) event.preventDefault();
		},
		{ passive: false },
	);

	window.addEventListener("keydown", (event) => {
		if (import.meta.env.PROD) {
			if (event.key === "F12") {
				event.preventDefault();
				return;
			}
			if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "i") {
				event.preventDefault();
				return;
			}
		}

		if (event.key === "F5") {
			event.preventDefault();
			return;
		}

		if (event.ctrlKey || event.metaKey) {
			const lowerKey = event.key.toLowerCase();
			if (
				lowerKey === "r" ||
				lowerKey === "p" ||
				lowerKey === "u" ||
				lowerKey === "f" ||
				lowerKey === "0" ||
				lowerKey === "=" ||
				lowerKey === "+" ||
				lowerKey === "-"
			) {
				event.preventDefault();
			}
		}
	});
}
