import type { JSX } from "solid-js";
import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { getGadgetMeta } from "../../../content";
import type { GadgetId, PRINT_NAMES } from "../../../engine";
import type { CustomGadgetRecord } from "../../../storage";
import { getVariableColor } from "../../../styles";
import { startDragResize } from "../../../utils/dragResize";

interface ShelfRailProps {
	readonly width: number;
	readonly onResize: (width: number) => void;
	readonly unlockedIds: readonly GadgetId[];
	readonly customGadgets?: readonly CustomGadgetRecord[];
	readonly lockedCount: number;
	readonly scopeVariables: readonly (typeof PRINT_NAMES)[number][];
	readonly atoms: readonly string[];
	readonly allowBlueprint: boolean;
	readonly canAddLam: boolean;
	readonly hasSelectedHole: boolean;
	readonly onFillGad: (id: GadgetId) => void;
	readonly onFillVar: (name: (typeof PRINT_NAMES)[number]) => void;
	readonly onFillAtom: (name: string) => void;
	readonly onFillLam: () => void;
	readonly onFillApp: () => void;
	readonly onExpandGadget?: (gadget: CustomGadgetRecord) => void;
	readonly onDeleteGadget?: (id: string) => void;
}

export function ShelfRail(props: ShelfRailProps): JSX.Element {
	const [contextMenu, setContextMenu] = createSignal<{
		readonly x: number;
		readonly y: number;
		readonly gadget: CustomGadgetRecord;
	} | null>(null);

	createEffect(() => {
		if (contextMenu() === null) return;
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === "Escape") setContextMenu(null);
		};
		window.addEventListener("keydown", handleKeyDown);
		onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
	});

	const handleResize = (downEvent: PointerEvent): void =>
		startDragResize(downEvent, props.width, 1, 72, 480, props.onResize);

	return (
		<aside class="shelf-rail" style={{ width: `${props.width}px` }} onWheel={(event) => event.stopPropagation()}>
			<div class="shelf-resize-handle" onPointerDown={handleResize} />

			<div class="shelf-group">
				<Show when={props.allowBlueprint}>
					<button
						type="button"
						class="shelf-item"
						title="开槽 (Q)"
						disabled={!props.hasSelectedHole}
						onClick={props.onFillLam}
					>
						<span style={{ "font-size": "14px", "font-weight": "700" }}>▢</span>
						<span>开槽</span>
					</button>
				</Show>
				<button
					type="button"
					class="shelf-item"
					title="喂入 (E)"
					disabled={!props.hasSelectedHole}
					onClick={props.onFillApp}
				>
					<span style={{ "font-size": "13px", "font-weight": "700", color: "var(--accent-clay)" }}>◀</span>
					<span>喂入</span>
				</button>
			</div>
			<div class="shelf-divider" />

			<Show when={props.scopeVariables.length > 0}>
				<div class="shelf-group">
					<For each={props.scopeVariables}>
						{(variableName) => (
							<button
								type="button"
								class="shelf-item"
								style={{ "border-color": getVariableColor(variableName) }}
								title={`信号 ${variableName}`}
								disabled={!props.hasSelectedHole}
								onClick={() => props.onFillVar(variableName)}
							>
								<span
									class="signal-orb"
									style={{
										width: "20px",
										height: "20px",
										background: getVariableColor(variableName),
										"--orb-glow": getVariableColor(variableName),
									}}
								/>
							</button>
						)}
					</For>
				</div>
				<div class="shelf-divider" />
			</Show>

			<div class="shelf-group">
				<For each={props.unlockedIds}>
					{(gadgetId) => {
						const meta = getGadgetMeta(gadgetId);
						return (
							<button
								type="button"
								class="shelf-item"
								title={`${meta.name}${gadgetId === "I" ? " (I)" : gadgetId === "S" ? " (S)" : gadgetId === "K" ? " (K)" : ""}`}
								disabled={!props.hasSelectedHole}
								onClick={() => props.onFillGad(gadgetId)}
							>
								<span class={`gadget-glyph ${meta.shape}`} style={{ background: meta.accent }}>
									{meta.symbol}
								</span>
								<span>{meta.name.slice(0, 3)}</span>
							</button>
						);
					}}
				</For>
				<Show when={props.unlockedIds.length > 0}>
					<div class="shelf-divider" />
				</Show>
			</div>

			<Show when={props.customGadgets && props.customGadgets.length > 0}>
				<div class="shelf-group">
					<For each={props.customGadgets}>
						{(custom) => {
							const meta = getGadgetMeta(custom.id, custom.name);
							return (
								<button
									type="button"
									class={`shelf-item ${!props.hasSelectedHole ? "dimmed" : ""}`}
									title={custom.name ? `${custom.name} (${custom.id})` : `${custom.id}`}
									onClick={() => {
										if (props.hasSelectedHole) props.onFillGad(custom.id);
									}}
									onContextMenu={(event) => {
										event.preventDefault();
										setContextMenu({ x: event.clientX, y: event.clientY, gadget: custom });
									}}
								>
									<span class={`gadget-glyph ${meta.shape}`} style={{ background: meta.accent }}>
										{meta.symbol}
									</span>
									<span>{meta.name.slice(0, 3)}</span>
								</button>
							);
						}}
					</For>
				</div>
				<div class="shelf-divider" />
			</Show>

			<div class="shelf-group">
				<For each={props.atoms}>
					{(atomName) => (
						<button
							type="button"
							class="shelf-item"
							title={`样品 ${atomName}`}
							disabled={!props.hasSelectedHole}
							onClick={() => props.onFillAtom(atomName)}
						>
							<span class="atom-token" style={{ height: "24px", "min-width": "24px", "font-size": "12px" }}>
								{atomName}
							</span>
						</button>
					)}
				</For>

				<For each={Array.from({ length: Math.min(2, props.lockedCount) })}>
					{() => (
						<div class="shelf-item locked">
							<span style={{ "font-size": "14px" }}>🔒</span>
						</div>
					)}
				</For>
			</div>

			<Show when={contextMenu()}>
				{(menu) => (
					<Portal>
						<div
							role="presentation"
							class="gadget-context-backdrop"
							onClick={() => setContextMenu(null)}
							onKeyDown={(event) => event.key === "Escape" && setContextMenu(null)}
							onContextMenu={(event) => {
								event.preventDefault();
								setContextMenu(null);
							}}
						/>
						<div
							class="gadget-context-menu"
							style={{
								left: `${Math.min(menu().x, window.innerWidth - 140)}px`,
								top: `${Math.min(menu().y, window.innerHeight - 80)}px`,
							}}
						>
							<button
								type="button"
								class="gadget-context-item"
								disabled={!props.hasSelectedHole}
								onClick={() => {
									props.onExpandGadget?.(menu().gadget);
									setContextMenu(null);
								}}
							>
								展开到当前槽
							</button>
							<button
								type="button"
								class="gadget-context-item danger"
								onClick={() => {
									props.onDeleteGadget?.(menu().gadget.id);
									setContextMenu(null);
								}}
							>
								删除部件
							</button>
						</div>
					</Portal>
				)}
			</Show>
		</aside>
	);
}
