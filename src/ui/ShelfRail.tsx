import type { JSX } from "solid-js";
import { For, Show } from "solid-js";
import type { Registry } from "../engine/gadget";
import type { GadgetId } from "../engine/term";
import { getGadgetMeta } from "../theme/world";

const VARIABLE_COLORS: Record<string, string> = {
	x: "var(--var-x)",
	y: "var(--var-y)",
	z: "var(--var-z)",
	w: "var(--var-w)",
};

export interface ShelfRailProps {
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

function getVariableColor(name: string): string {
	return VARIABLE_COLORS[name] !== undefined ? VARIABLE_COLORS[name] : "#94a3b8";
}

export function ShelfRail(props: ShelfRailProps): JSX.Element {
	return (
		<aside class="shelf-rail">
			<Show when={props.scopeVariables.length > 0}>
				<For each={props.scopeVariables}>
					{(variableName) => (
						<button
							type="button"
							class="shelf-item"
							style={{ "border-color": getVariableColor(variableName) }}
							title="信号珠"
							disabled={!props.hasSelectedHole}
							onClick={() => props.onFillVar(variableName)}
						>
							<span
								class="signal-orb"
								style={{
									width: "18px",
									height: "18px",
									background: getVariableColor(variableName),
									"--orb-glow": getVariableColor(variableName),
								}}
							/>
							<span>信号</span>
						</button>
					)}
				</For>
				<div class="shelf-divider" />
			</Show>

			<Show when={props.allowBlueprint || props.unlockedIds.length > 1}>
				<Show when={props.allowBlueprint}>
					<button
						type="button"
						class="shelf-item"
						title="开一个新槽"
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
					title="喂入连接（左吃右）"
					disabled={!props.hasSelectedHole}
					onClick={props.onFillApp}
				>
					<span style={{ "font-size": "13px", "font-weight": "700", color: "var(--accent-clay)" }}>◀</span>
					<span>喂入</span>
				</button>
				<div class="shelf-divider" />
			</Show>

			<For each={props.unlockedIds}>
				{(gadgetId) => {
					const gadget = props.registry.get(gadgetId);
					const customName = props.gadgetNames.get(gadgetId);
					const meta = getGadgetMeta(
						gadgetId,
						customName !== undefined ? customName : gadgetId,
						gadget !== undefined ? gadget.fingerprint : gadgetId,
					);
					return (
						<button
							type="button"
							class="shelf-item"
							title={meta.name}
							disabled={!props.hasSelectedHole}
							onClick={() => props.onFillGad(gadgetId)}
						>
							<span class={`gadget-glyph ${meta.shape}`} style={{ background: meta.accent }}>
								{gadgetId.length <= 2 ? gadgetId : "★"}
							</span>
							<span>{meta.name.slice(0, 3)}</span>
						</button>
					);
				}}
			</For>

			<div class="shelf-divider" />
			<For each={props.atoms}>
				{(atomName) => (
					<button
						type="button"
						class="shelf-item"
						title={`样品 ${atomName}`}
						disabled={!props.hasSelectedHole}
						onClick={() => props.onFillAtom(atomName)}
					>
						<span class="atom-token" style={{ height: "22px", "min-width": "22px", "font-size": "11px" }}>
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
		</aside>
	);
}
