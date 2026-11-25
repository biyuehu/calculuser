import { type JSX, Show } from "solid-js";
import { getGadgetMeta } from "../../../content";
import { type DraftTerm, type Path, type Ty, any, formatTy } from "../../../engine";
import { getVariableColor } from "../../../styles";

interface DraftNodeProps {
	readonly draft: DraftTerm;
	readonly path: Path;
	readonly selectedPath?: Path;
	readonly isTypeMode?: boolean;
	readonly onEditType?: (path: Path, currentTy: Ty) => void;
	readonly onSelectHole: (path: Path) => void;
	readonly onDismantle: (path: Path) => void;
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
					case "hole":
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
					case "var":
						return (
							<span
								class="signal-orb"
								onContextMenu={handleDismantle}
								style={{
									background: getVariableColor(node.name),
									"--orb-glow": getVariableColor(node.name),
								}}
							/>
						);
					case "atom":
						return (
							<span class="atom-token" onContextMenu={handleDismantle}>
								{node.name}
							</span>
						);
					case "gad": {
						const meta = getGadgetMeta(node.id);
						return (
							<span class="gadget-token" onContextMenu={handleDismantle}>
								<span class={`gadget-glyph ${meta.shape}`} style={{ background: meta.accent }}>
									{meta.symbol}
								</span>
								<span>{meta.name}</span>
							</span>
						);
					}
					case "lam":
						return (
							<span
								class="machine-lam"
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
									<Show when={props.isTypeMode}>
										<button
											type="button"
											class="lam-type-badge"
											onClick={(event) => {
												event.stopPropagation();
												props.onEditType?.(props.path, node.ty ?? any);
											}}
										>
											{formatTy(node.ty ?? any)}
										</button>
									</Show>
								</span>
								<span class="machine-chamber">
									<DraftNode
										draft={node.body}
										path={`${props.path}b`}
										isTypeMode={props.isTypeMode}
										onEditType={props.onEditType}
										selectedPath={props.selectedPath}
										onSelectHole={props.onSelectHole}
										onDismantle={props.onDismantle}
									/>
								</span>
							</span>
						);
					case "app":
						return (
							<span class="machine-app" onContextMenu={handleDismantle}>
								<DraftNode
									draft={node.fn}
									path={`${props.path}f`}
									isTypeMode={props.isTypeMode}
									onEditType={props.onEditType}
									selectedPath={props.selectedPath}
									onSelectHole={props.onSelectHole}
									onDismantle={props.onDismantle}
								/>
								<span class="feed-connector">◀</span>
								<DraftNode
									draft={node.arg}
									path={`${props.path}a`}
									isTypeMode={props.isTypeMode}
									onEditType={props.onEditType}
									selectedPath={props.selectedPath}
									onSelectHole={props.onSelectHole}
									onDismantle={props.onDismantle}
								/>
							</span>
						);
				}
			})()}
		</>
	);
}
