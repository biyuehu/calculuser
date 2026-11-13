import type { JSX } from "solid-js";
import type { Registry } from "../../engine/gadget";
import type { Path, Term } from "../../engine/term";
import { resolveGadgetMeta } from "../../theme/world";

const DEPTH_COLORS: readonly string[] = ["var(--var-x)", "var(--var-y)", "var(--var-z)", "var(--var-w)"];

export interface TermVisualProps {
	readonly term: Term;
	readonly depth: number;
	readonly path: Path;
	readonly registry: Registry;
	readonly gadgetNames: ReadonlyMap<string, string>;
	readonly redexPaths: readonly Path[];
	readonly onStepRedex: ((path: Path) => void) | null;
}

function getColorAtDepth(index: number): string {
	return index >= 0 && index < DEPTH_COLORS.length ? DEPTH_COLORS[index] : "#94a3b8";
}

export function TermVisual(props: TermVisualProps): JSX.Element {
	return (
		<>
			{(() => {
				const node = props.term;
				switch (node.kind) {
					case "var": {
						const color = getColorAtDepth(props.depth - 1 - node.index);
						return <span class="signal-orb" style={{ background: color, "--orb-glow": color }} />;
					}
					case "atom": {
						return <span class="atom-token">{node.name}</span>;
					}
					case "gad": {
						const meta = resolveGadgetMeta(node.id, props.registry, props.gadgetNames);
						return (
							<span class="gadget-token">
								<span class={`gadget-glyph ${meta.shape}`} style={{ background: meta.accent }}>
									{meta.symbol}
								</span>
								<span>{meta.name}</span>
							</span>
						);
					}
					case "lam": {
						const color = getColorAtDepth(props.depth);
						return (
							<span class="machine-lam" style={{ "--socket-color": color }}>
								<span class="machine-socket">
									<span class="signal-orb" style={{ background: color, "--orb-glow": color }} />
								</span>
								<span class="machine-chamber">
									<TermVisual
										term={node.body}
										depth={props.depth + 1}
										path={`${props.path}b`}
										registry={props.registry}
										gadgetNames={props.gadgetNames}
										redexPaths={props.redexPaths}
										onStepRedex={props.onStepRedex}
									/>
								</span>
							</span>
						);
					}
					case "app": {
						const isRedex = props.redexPaths.includes(props.path);
						return (
							<span
								class={`machine-app ${isRedex ? "redex-glow" : ""}`}
								onClick={(event) => {
									if (isRedex && props.onStepRedex !== null) {
										event.stopPropagation();
										props.onStepRedex(props.path);
									}
								}}
								onKeyDown={(event) => {
									if (event.key === "Enter" && isRedex && props.onStepRedex !== null) {
										event.stopPropagation();
										props.onStepRedex(props.path);
									}
								}}
								title={isRedex ? "点击运转此反应" : ""}
							>
								<TermVisual
									term={node.fn}
									depth={props.depth}
									path={`${props.path}f`}
									registry={props.registry}
									gadgetNames={props.gadgetNames}
									redexPaths={props.redexPaths}
									onStepRedex={props.onStepRedex}
								/>
								<span class="feed-connector">◀</span>
								<TermVisual
									term={node.arg}
									depth={props.depth}
									path={`${props.path}a`}
									registry={props.registry}
									gadgetNames={props.gadgetNames}
									redexPaths={props.redexPaths}
									onStepRedex={props.onStepRedex}
								/>
							</span>
						);
					}
				}
			})()}
		</>
	);
}
