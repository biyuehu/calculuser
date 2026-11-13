import type { JSX } from "solid-js";
import type { DraftTerm } from "../../engine/draft";
import type { Registry } from "../../engine/gadget";
import type { Path } from "../../engine/term";
import { resolveGadgetMeta } from "../../theme/world";

const VARIABLE_COLORS: Record<string, string> = {
	x: "var(--var-x)",
	y: "var(--var-y)",
	z: "var(--var-z)",
	w: "var(--var-w)",
};

export interface DraftNodeProps {
	readonly draft: DraftTerm;
	readonly path: Path;
	readonly selectedPath: Path | null;
	readonly registry: Registry;
	readonly gadgetNames: ReadonlyMap<string, string>;
	readonly onSelectHole: (path: Path) => void;
	readonly onDismantle: (path: Path) => void;
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

export function DraftNode(props: DraftNodeProps): JSX.Element {
	const handleDismantle = (event: MouseEvent): void => {
		event.preventDefault();
		event.stopPropagation();
		props.onDismantle(props.path);
	};

	return (
		<>
			{(() => {
				const node = props.draft;
				switch (node.kind) {
					case "hole": {
						return (
							<button
								type="button"
								class={`slot-hole ${props.path === props.selectedPath ? "selected" : ""}`}
								onClick={() => props.onSelectHole(props.path)}
								aria-label="Empty slot"
							>
								?
							</button>
						);
					}
					case "var": {
						return (
							<span
								class="signal-orb"
								title="右键拆回空槽"
								onContextMenu={handleDismantle}
								style={{
									background: getVariableColor(node.name),
									"--orb-glow": getVariableColor(node.name),
								}}
							/>
						);
					}
					case "atom": {
						return (
							<span class="atom-token" title="右键拆回空槽" onContextMenu={handleDismantle}>
								{node.name}
							</span>
						);
					}
					case "gad": {
						const meta = resolveGadgetMeta(node.id, props.registry, props.gadgetNames);
						return (
							<span class="gadget-token" title="右键拆回空槽" onContextMenu={handleDismantle}>
								<span class={`gadget-glyph ${meta.shape}`} style={{ background: meta.accent }}>
									{meta.symbol}
								</span>
								<span>{meta.name}</span>
							</span>
						);
					}
					case "lam": {
						return (
							<span
								class="machine-lam"
								title="右键拆回空槽"
								onContextMenu={handleDismantle}
								style={{ "--socket-color": getVariableColor(node.param) }}
							>
								<span class="machine-socket">
									<span
										class="signal-orb"
										style={{
											background: getVariableColor(node.param),
											"--orb-glow": getVariableColor(node.param),
										}}
									/>
								</span>
								<span class="machine-chamber">
									<DraftNode
										draft={node.body}
										path={`${props.path}b`}
										selectedPath={props.selectedPath}
										registry={props.registry}
										gadgetNames={props.gadgetNames}
										onSelectHole={props.onSelectHole}
										onDismantle={props.onDismantle}
									/>
								</span>
							</span>
						);
					}
					case "app": {
						return (
							<span class="machine-app" title="右键拆回空槽" onContextMenu={handleDismantle}>
								<DraftNode
									draft={node.fn}
									path={`${props.path}f`}
									selectedPath={props.selectedPath}
									registry={props.registry}
									gadgetNames={props.gadgetNames}
									onSelectHole={props.onSelectHole}
									onDismantle={props.onDismantle}
								/>
								<span class="feed-connector">◀</span>
								<DraftNode
									draft={node.arg}
									path={`${props.path}a`}
									selectedPath={props.selectedPath}
									registry={props.registry}
									gadgetNames={props.gadgetNames}
									onSelectHole={props.onSelectHole}
									onDismantle={props.onDismantle}
								/>
							</span>
						);
					}
				}
			})()}
		</>
	);
}
