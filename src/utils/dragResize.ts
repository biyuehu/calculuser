export function startDragResize(
	downEvent: PointerEvent,
	startWidth: number,
	direction: 1 | -1,
	minWidth: number,
	maxWidth: number,
	onResize: (width: number) => void,
): void {
	downEvent.preventDefault();
	downEvent.stopPropagation();
	const handle = downEvent.currentTarget as HTMLElement;
	handle.setPointerCapture(downEvent.pointerId);
	const startX = downEvent.clientX;

	const onPointerMove = (moveEvent: PointerEvent): void => {
		onResize(Math.max(minWidth, Math.min(maxWidth, startWidth + direction * (moveEvent.clientX - startX))));
	};
	const onPointerUp = (upEvent: PointerEvent): void => {
		handle.releasePointerCapture(upEvent.pointerId);
		handle.removeEventListener("pointermove", onPointerMove);
		handle.removeEventListener("pointerup", onPointerUp);
		window.removeEventListener("pointermove", onPointerMove);
		window.removeEventListener("pointerup", onPointerUp);
	};
	handle.addEventListener("pointermove", onPointerMove);
	handle.addEventListener("pointerup", onPointerUp);
	window.addEventListener("pointermove", onPointerMove);
	window.addEventListener("pointerup", onPointerUp);
}
