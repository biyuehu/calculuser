import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const isDesktop = (): boolean => typeof window !== "undefined" && (isTauri() || "__TAURI_INTERNALS__" in window);

const toggleDesktopFullscreen = async (): Promise<void> => {
	try {
		const currentWindow = getCurrentWindow();
		await currentWindow.setFullscreen(!(await currentWindow.isFullscreen()));
	} catch (error) {
		console.error("Failed to toggle desktop fullscreen:", error);
	}
};

export function setupDesktopGuard(): void {
	if (!isDesktop()) return;

	window.addEventListener("contextmenu", (event) => {
		event.preventDefault();
	});

	window.addEventListener("dragstart", (event) => {
		event.preventDefault();
	});

	window.addEventListener(
		"click",
		(event) => {
			if (!(event.target instanceof Element)) return;
			const anchor = event.target.closest("a[href]");
			if (anchor === null) return;
			const href = anchor.getAttribute("href");
			if (href === null || (!href.startsWith("https://") && !href.startsWith("http://"))) return;
			event.preventDefault();
			void invoke("open_external_url", { url: href }).catch((error) => {
				console.error("Failed to open external URL:", error);
			});
		},
		{ capture: true },
	);

	window.addEventListener(
		"wheel",
		(event) => {
			if (event.ctrlKey) event.preventDefault();
		},
		{ passive: false },
	);

	window.addEventListener(
		"keydown",
		(event) => {
			if (event.key === "F11") {
				event.preventDefault();
				if (!event.repeat) void toggleDesktopFullscreen();
				return;
			}

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
		},
		{ capture: true },
	);
}
