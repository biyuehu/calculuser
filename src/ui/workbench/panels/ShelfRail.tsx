import type { JSX } from "solid-js";
import { For, Show } from "solid-js";
import { getGadgetMeta } from "../../../content";
import type { PRINT_NAMES } from "../../../engine/parse";
import type { GadgetId } from "../../../engine/term";
import { getVariableColor } from "../../../styles";
import { startDragResize } from "../../../utils/dragResize";

interface ShelfRailProps {
	readonly width: number;
	readonly onResize: (width: number) => void;
	readonly unlockedIds: readonly GadgetId[];
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
}

export function ShelfRail(props: ShelfRailProps): JSX.Element {
	const handleResize = (downEvent: PointerEvent): void =>
		startDragResize(downEvent, props.width, 1, 72, 480, props.onResize);

	return (
		<aside class="shelf-rail" style={{ width: `${props.width}px` }} onWheel={(event) => event.stopPropagation()}>
			<div class="shelf-resize-handle" onPointerDown={handleResize} title="拖动调整工具栏宽度" />

			<Show when={props.allowBlueprint || props.unlockedIds.length > 1}>
				<div class="shelf-group">
					<Show when={props.allowBlueprint}>
						<button
							type="button"
							class="shelf-item"
							title={props.canAddLam ? "开槽 (Q)" : "已达最大嵌套深度限制"}
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
			</Show>

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
						<div class="shelf-item locked" title="未解锁零件">
							<span style={{ "font-size": "14px" }}>🔒</span>
						</div>
					)}
				</For>
			</div>
		</aside>
	);
}
