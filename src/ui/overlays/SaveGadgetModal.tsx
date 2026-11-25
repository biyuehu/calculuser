import { type JSX, Show, createMemo, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { COMBINATORS, deriveGadgetVisuals } from "../../content";
import { type Registry, type Term, printXRayTerm } from "../../engine";
import { useKeyScope } from "../keybus";

interface SaveGadgetModalProps {
	readonly currentTerm: Term;
	readonly registry: Registry;
	readonly existingGadgetIds: readonly string[];
	readonly onClose: () => void;
	readonly onSave: (id: string, name?: string) => void;
}

export function SaveGadgetModal(props: SaveGadgetModalProps): JSX.Element {
	const [idInput, setIdInput] = createSignal<string>("");
	const [nameInput, setNameInput] = createSignal<string>("");

	const cleanId = createMemo(() => idInput().trim());
	const cleanName = createMemo(() => nameInput().trim());
	const isValidFormat = createMemo(() => /^[A-Za-z0-9_]{1,12}$/.test(cleanId()));
	const isBuiltinConflict = createMemo(() =>
		COMBINATORS.some((tool) => tool.id === cleanId() || tool.symbol === cleanId()),
	);
	const isExistingOverwrite = createMemo(() => props.existingGadgetIds.includes(cleanId()));
	const canSubmit = createMemo(() => isValidFormat() && !isBuiltinConflict());

	const visual = createMemo(() => deriveGadgetVisuals(cleanId().length > 0 ? cleanId() : "?"));

	const handleConfirm = (): void => {
		if (!canSubmit()) return;
		props.onSave(cleanId(), cleanName().length > 0 ? cleanName() : void 0);
	};

	useKeyScope({
		id: "save-gadget-modal",
		level: "modal",
		bindings: [
			{ key: "Escape", handle: props.onClose },
			{
				key: "Enter",
				handle: (event) => {
					event.preventDefault();
					handleConfirm();
				},
			},
		],
	});

	return (
		<Portal>
			<div
				class="modal-backdrop"
				onClick={props.onClose}
				onKeyDown={(event) => event.key === "Escape" && props.onClose()}
			>
				<div
					class="modal-card"
					style={{ width: "460px" }}
					onClick={(event) => event.stopPropagation()}
					onKeyDown={(event) => event.stopPropagation()}
				>
					<header style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
						<h3 style={{ margin: "0", "font-size": "15px", "font-weight": "700" }}>存为自定义部件</h3>
						<button type="button" class="icon-btn" onClick={props.onClose}>
							✕
						</button>
					</header>

					<div
						style={{
							background: "var(--surface-2)",
							border: "1px solid var(--border-subtle)",
							"border-radius": "8px",
							padding: "10px 12px",
							display: "flex",
							"flex-direction": "column",
							gap: "6px",
						}}
					>
						<span style={{ "font-size": "11px", color: "var(--text-muted)", "font-weight": "600" }}>目标表达式</span>
						<div
							style={{
								"font-family": "var(--font-mono)",
								"font-size": "13px",
								color: "var(--accent-clay)",
								"word-break": "break-all",
							}}
						>
							{printXRayTerm(props.currentTerm, props.registry)}
						</div>
					</div>

					<div style={{ display: "flex", "flex-direction": "column", gap: "10px" }}>
						<div style={{ display: "flex", gap: "12px", "align-items": "center" }}>
							<div style={{ flex: "1", display: "flex", "flex-direction": "column", gap: "4px" }}>
								<label for="gadget-id-input" style={{ "font-size": "12px", color: "var(--text-secondary)" }}>
									部件标识 (ID，必填)
								</label>
								<input
									id="gadget-id-input"
									type="text"
									autofocus
									maxLength={12}
									placeholder="例如 PAIR 或 NOT"
									value={idInput()}
									onInput={(event) => setIdInput(event.currentTarget.value)}
									style={{
										background: "var(--surface-2)",
										border: "1px solid var(--border-subtle)",
										"border-radius": "6px",
										padding: "6px 10px",
										color: "var(--text-primary)",
										"font-family": "var(--font-mono)",
										"font-size": "13px",
									}}
								/>
							</div>
							<div
								style={{
									display: "flex",
									"flex-direction": "column",
									"align-items": "center",
									gap: "4px",
									width: "56px",
								}}
							>
								<span style={{ "font-size": "10.5px", color: "var(--text-muted)" }}>图标预览</span>
								<span
									class={`gadget-glyph ${visual().shape}`}
									style={{ background: visual().accent, width: "32px", height: "32px", "font-size": "14px" }}
								>
									{visual().symbol}
								</span>
							</div>
						</div>

						<div style={{ display: "flex", "flex-direction": "column", gap: "4px" }}>
							<label for="gadget-name-input" style={{ "font-size": "12px", color: "var(--text-secondary)" }}>
								中文名称 (可选)
							</label>
							<input
								id="gadget-name-input"
								type="text"
								maxLength={16}
								placeholder="例如 二元组"
								value={nameInput()}
								onInput={(event) => setNameInput(event.currentTarget.value)}
								style={{
									background: "var(--surface-2)",
									border: "1px solid var(--border-subtle)",
									"border-radius": "6px",
									padding: "6px 10px",
									color: "var(--text-primary)",
									"font-size": "13px",
								}}
							/>
						</div>

						<div style={{ "min-height": "18px", "font-size": "11.5px" }}>
							<Show when={cleanId().length > 0 && !isValidFormat()}>
								<span style={{ color: "var(--accent-ember)" }}>请输入 1~12 位英文字母、数字或下划线</span>
							</Show>
							<Show when={isBuiltinConflict()}>
								<span style={{ color: "var(--accent-ember)" }}>不能与内置组合子标识或符号重复</span>
							</Show>
							<Show when={isValidFormat() && !isBuiltinConflict() && isExistingOverwrite()}>
								<span style={{ color: "var(--accent-clay)" }}>已存在同名自定义部件，保存将覆盖现有定义</span>
							</Show>
						</div>
					</div>

					<footer style={{ display: "flex", "justify-content": "flex-end", gap: "8px", "margin-top": "4px" }}>
						<button type="button" class="icon-btn" onClick={props.onClose}>
							取消
						</button>
						<button
							type="button"
							class={`icon-btn ${canSubmit() ? "active" : ""}`}
							disabled={!canSubmit()}
							onClick={handleConfirm}
						>
							{isExistingOverwrite() ? "覆盖保存" : "保存"}
						</button>
					</footer>
				</div>
			</div>
		</Portal>
	);
}
