import { For, type JSX, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { type Ty, any, arrow, formatTy } from "../../../engine";
import { useKeyScope } from "../../keybus";

interface TypeEditorModalProps {
	readonly currentTy: Ty;
	readonly baseTypes: readonly string[];
	readonly onConfirm: (ty: Ty) => void;
	readonly onClose: () => void;
}

type TyStep = "from" | "to";
type TyPath = readonly TyStep[];

const isPathEqual = (a: TyPath, b: TyPath): boolean => a.length === b.length && a.every((step, i) => step === b[i]);

const getTyAtPath = (root: Ty, path: TyPath): Ty => {
	let curr = root;
	for (const step of path) {
		if (curr.k !== "arrow") return curr;
		curr = step === "from" ? curr.from : curr.to;
	}
	return curr;
};

const setTyAtPath = (root: Ty, path: TyPath, replacement: Ty): Ty => {
	if (path.length === 0) return replacement;
	if (root.k !== "arrow") return replacement;
	const [step, ...rest] = path;
	return step === "from"
		? { k: "arrow", from: setTyAtPath(root.from, rest, replacement), to: root.to }
		: { k: "arrow", from: root.from, to: setTyAtPath(root.to, rest, replacement) };
};

export function TypeEditorModal(props: TypeEditorModalProps): JSX.Element {
	const [rootTy, setRootTy] = createSignal<Ty>(props.currentTy);
	const [selectedPath, setSelectedPath] = createSignal<TyPath>([]);

	useKeyScope({
		id: "type-editor-modal",
		level: "modal",
		bindings: [{ key: "Escape", handle: props.onClose }],
	});

	const currentSlotTy = (): Ty => getTyAtPath(rootTy(), selectedPath());

	const applySlotReplacement = (replacement: Ty): void => {
		const path = selectedPath();
		const updated = setTyAtPath(rootTy(), path, replacement);
		setRootTy(updated);
		if (replacement.k === "arrow") setSelectedPath([...path, "from"]);
	};

	const renderNode = (node: Ty, path: TyPath): JSX.Element => {
		const isSelected = () => isPathEqual(selectedPath(), path);
		if (node.k === "arrow") {
			return (
				<span
					class={`ty-tree-arrow ${isSelected() ? "selected" : ""}`}
					onClick={(event) => {
						event.stopPropagation();
						setSelectedPath(path);
					}}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.stopPropagation();
							setSelectedPath(path);
						}
					}}
				>
					<span class="ty-paren">(</span>
					{renderNode(node.from, [...path, "from"])}
					<span class="ty-arrow-op">→</span>
					{renderNode(node.to, [...path, "to"])}
					<span class="ty-paren">)</span>
				</span>
			);
		}
		return (
			<button
				type="button"
				class={`ty-slot-chip ${isSelected() ? "selected" : ""}`}
				onClick={(event) => {
					event.stopPropagation();
					setSelectedPath(path);
				}}
			>
				{formatTy(node)}
			</button>
		);
	};

	return (
		<Portal>
			<div
				class="modal-backdrop"
				onClick={(event) => {
					if (event.target === event.currentTarget) props.onClose();
				}}
				onKeyDown={(event) => {
					if (event.key === "Escape") props.onClose();
				}}
			>
				<div
					class="modal-card type-editor-card"
					onClick={(event) => event.stopPropagation()}
					onKeyDown={(event) => event.stopPropagation()}
				>
					<header class="type-editor-header">
						<h3>构筑参数类型</h3>
						<button type="button" class="icon-btn" onClick={props.onClose} title="关闭 (Esc)">
							✕
						</button>
					</header>

					<div class="type-editor-body">
						<div class="type-editor-preview">
							<span class="preview-label">当前构造：</span>
							<span class="preview-formula">{formatTy(rootTy())}</span>
						</div>

						<div
							class="type-tree-canvas"
							onClick={() => setSelectedPath([])}
							onKeyDown={(event) => {
								if (event.key === "Escape") setSelectedPath([]);
							}}
						>
							{renderNode(rootTy(), [])}
						</div>

						<div class="type-editor-controls">
							<span class="controls-label">填充选中槽位 [{formatTy(currentSlotTy())}] 为：</span>
							<div class="type-constructors-row">
								<button type="button" class="type-op-btn" onClick={() => applySlotReplacement(any)}>
									?
								</button>
								<For each={props.baseTypes}>
									{(baseName) => (
										<button
											type="button"
											class="type-op-btn"
											onClick={() => applySlotReplacement({ k: "base", name: baseName })}
										>
											{baseName}
										</button>
									)}
								</For>
								<button
									type="button"
									class="type-op-btn constructor"
									onClick={() => applySlotReplacement(arrow(any, any))}
								>
									arrow
								</button>
							</div>
						</div>
					</div>

					<footer class="type-editor-footer">
						<button type="button" class="icon-btn" onClick={props.onClose}>
							取消
						</button>
						<button type="button" class="icon-btn active" onClick={() => props.onConfirm(rootTy())}>
							应用类型
						</button>
					</footer>
				</div>
			</div>
		</Portal>
	);
}
