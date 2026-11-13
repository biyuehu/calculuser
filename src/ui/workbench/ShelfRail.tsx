import type { JSX } from "solid-js";
import { For, Show } from "solid-js";
import type { Registry } from "../../engine/gadget";
import type { GadgetId } from "../../engine/term";
import { resolveGadgetMeta } from "../../theme/world";

const VARIABLE_COLORS: Record<string, string> = {
	x: "var(--var-x)",
	y: "var(--var-y)",
	z: "var(--var-z)",
	w: "var(--var-w)",
};

export interface ShelfRailProps {
	readonly width: number;
	readonly onResize: (width: number) => void;
	readonly unlockedIds: readonly GadgetId[];
	readonly lockedCount: number;
	readonly registry: Registry;
	readonly gadgetNames: ReadonlyMap<string, string>;
	readonly scopeVariables: readonly string[];
	readonly atoms: readonly string[];
	readonly allowBlueprint: boolean;
	readonly canAddLam: boolean;
	readonly hasSelectedHole: boolean;
	readonly onFillGad: (id: GadgetId) => void;
	readonly onFillVar: (name: string) => void;
	readonly onFillAtom: (name: string) => void;
	readonly onFillLam: () => void;
	readonly onFillApp: () => void;
}

const VARIABLE_PALETTE: readonly string[] = [
	"var(--var-x)",
	"var(--var-y)",
	"var(--var-z)",
	"var(--var-w)",
	"#06b6d4",
	"#8b5cf6",
	"#ec4899",
	"#10b981",
	"#f59e0b",
	"#3b82f6",
	"#6366f1",
	"#14b8a6",
	"#f97316",
	"#84cc16",
	"#e11d48",
	"#0284c7",
];

function getVariableColor(name: string): string {
	const direct = VARIABLE_COLORS[name];
	if (direct !== undefined) return direct;
	return VARIABLE_PALETTE[name.charCodeAt(0) % VARIABLE_PALETTE.length];
}

export function ShelfRail(props: ShelfRailProps): JSX.Element {
	const handleResize = (downEvent: PointerEvent): void => {
		downEvent.preventDefault();
		downEvent.stopPropagation();
		const handle = downEvent.currentTarget as HTMLElement;
		handle.setPointerCapture(downEvent.pointerId);
		const startX = downEvent.clientX;
		const startWidth = props.width;

		const onPointerMove = (moveEvent: PointerEvent): void => {
			props.onResize(Math.max(72, Math.min(480, startWidth + (moveEvent.clientX - startX))));
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
	};

	return (
		<aside class="shelf-rail" style={{ width: `${props.width}px` }} onWheel={(event) => event.stopPropagation()}>
			<div class="shelf-resize-handle" onPointerDown={handleResize} title="拖动调整工具栏宽度" />

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

			<Show when={props.allowBlueprint || props.unlockedIds.length > 1}>
				<div class="shelf-group">
					<Show when={props.allowBlueprint}>
						<button
							type="button"
							class="shelf-item"
							title="开槽"
							disabled={!props.hasSelectedHole || !props.canAddLam}
							onClick={props.onFillLam}
						>
							<span style={{ "font-size": "14px", "font-weight": "700" }}>▢</span>
							<span>开槽</span>
						</button>
					</Show>
					<button
						type="button"
						class="shelf-item"
						title="喂入"
						disabled={!props.hasSelectedHole}
						onClick={props.onFillApp}
					>
						<span style={{ "font-size": "13px", "font-weight": "700", color: "var(--accent-clay)" }}>◀</span>
						<span>喂入</span>
					</button>
				</div>
				<div class="shelf-divider" />
			</Show>

			<div class="shelf-group">
				<For each={props.unlockedIds}>
					{(gadgetId) => {
						const meta = resolveGadgetMeta(gadgetId, props.registry, props.gadgetNames);
						return (
							<button
								type="button"
								class="shelf-item"
								title={meta.name}
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
			</div>

			<div class="shelf-divider" />
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
