import type { JSX } from "solid-js";
import { getGadgetMeta } from "../../../content";
import type { Path, Term } from "../../../engine";
import { getVariableColor } from "../../../styles";

interface TermVisualProps {
	readonly term: Term;
	readonly path: Path;
	readonly redexPaths: readonly Path[];
	readonly onStepRedex?: (path: Path) => void;
}

export function TermVisual(props: TermVisualProps): JSX.Element {
	return (
		<>
			{(() => {
				const node = props.term;
				switch (node.kind) {
					case "var": {
						const color = getVariableColor(node.name);
						return <span class="signal-orb" style={{ background: color, "--orb-glow": color }} />;
					}
					case "atom":
						return <span class="atom-token">{node.name}</span>;
					case "gad": {
						const meta = getGadgetMeta(node.id);
						return (
							<span class="gadget-token" title={meta.name}>
								<span class={`gadget-glyph ${meta.shape}`} style={{ background: meta.accent }}>
									{meta.symbol}
								</span>
								<span class="gadget-token-label">{meta.name}</span>
							</span>
						);
					}
					case "lam": {
						const color = getVariableColor(node.param);
						return (
							<span class="machine-lam" style={{ "--socket-color": color }}>
								<span class="machine-socket">
									<span class="signal-orb" style={{ background: color, "--orb-glow": color }} />
								</span>
								<span class="machine-chamber">
									<TermVisual
										term={node.body}
										path={`${props.path}b`}
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
									if (isRedex && props.onStepRedex !== void 0) {
										event.stopPropagation();
										props.onStepRedex(props.path);
									}
								}}
								onKeyDown={(event) => {
									if (event.key === "Enter" && isRedex && props.onStepRedex !== void 0) {
										event.stopPropagation();
										props.onStepRedex(props.path);
									}
								}}
							>
								<TermVisual
									term={node.fn}
									path={`${props.path}f`}
									redexPaths={props.redexPaths}
									onStepRedex={props.onStepRedex}
								/>
								<span class="feed-connector">◀</span>
								<TermVisual
									term={node.arg}
									path={`${props.path}a`}
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
