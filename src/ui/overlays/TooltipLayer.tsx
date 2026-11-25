import { type JSX, Show, createSignal, onCleanup, onMount } from "solid-js";

interface TooltipState {
	readonly text: string;
	readonly left: number;
	readonly top: number;
	readonly placement: "top" | "bottom";
}

function restoreTitle(el: Element | null): void {
	if (el === null) return;
	const cached = el.getAttribute("data-tooltip-cache");
	if (cached !== null) {
		if (!el.hasAttribute("title")) el.setAttribute("title", cached);
		el.removeAttribute("data-tooltip-cache");
	}
}

export function TooltipLayer(): JSX.Element {
	const [tooltip, setTooltip] = createSignal<TooltipState | null>(null);
	let activeEl: Element | null = null;
	let showTimer: number | undefined;

	const hide = (): void => {
		if (showTimer !== void 0) window.clearTimeout(showTimer);
		showTimer = void 0;
		restoreTitle(activeEl);
		activeEl = null;
		setTooltip(null);
	};

	const computeState = (target: Element, text: string): TooltipState => {
		const rect = target.getBoundingClientRect();
		const placement: "top" | "bottom" = rect.top < 54 ? "bottom" : "top";
		const left = Math.max(16, Math.min(window.innerWidth - 16, rect.left + rect.width / 2));
		const top = placement === "top" ? rect.top - 8 : rect.bottom + 8;
		return { text, left, top, placement };
	};

	onMount(() => {
		const onMouseOver = (event: MouseEvent): void => {
			const raw = event.target instanceof Element ? event.target.closest("[title], [data-tooltip-cache]") : null;
			if (raw === null) {
				hide();
				return;
			}
			if (raw === activeEl) return;
			hide();
			const text = raw.getAttribute("title") ?? raw.getAttribute("data-tooltip-cache") ?? "";
			if (!text) return;
			if (raw.hasAttribute("title")) {
				raw.setAttribute("data-tooltip-cache", text);
				raw.removeAttribute("title");
			}
			activeEl = raw;
			showTimer = window.setTimeout(() => {
				if (activeEl === raw) setTooltip(computeState(raw, text));
			}, 160);
		};

		const onMouseOut = (event: MouseEvent): void => {
			if (activeEl === null) return;
			const related = event.relatedTarget instanceof Element ? event.relatedTarget : null;
			if (related !== null && activeEl.contains(related)) return;
			hide();
		};

		document.addEventListener("mouseover", onMouseOver);
		document.addEventListener("mouseout", onMouseOut);
		document.addEventListener("pointerdown", hide, true);
		document.addEventListener("keydown", hide, true);
		window.addEventListener("scroll", hide, true);

		onCleanup(() => {
			hide();
			document.removeEventListener("mouseover", onMouseOver);
			document.removeEventListener("mouseout", onMouseOut);
			document.removeEventListener("pointerdown", hide, true);
			document.removeEventListener("keydown", hide, true);
			window.removeEventListener("scroll", hide, true);
		});
	});

	return (
		<Show when={tooltip()}>
			{(tip) => (
				<div
					class={`workshop-tooltip placement-${tip().placement}`}
					style={{ left: `${tip().left}px`, top: `${tip().top}px` }}
					role="tooltip"
				>
					{tip().text}
				</div>
			)}
		</Show>
	);
}
