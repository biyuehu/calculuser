import { For, type JSX, Show, createSignal } from "solid-js";
import { type NameplateSpec, type Ty, any, base, formatTy } from "../../../engine";
import { TypeShapeGlyph } from "./TypeShapeGlyph";

interface NameplateProps {
	readonly spec: NameplateSpec;
	readonly interactive?: boolean;
	readonly onUpdateSpec?: (spec: NameplateSpec) => void;
	readonly onRequestVerification?: () => void;
}

const AVAILABLE_BASE_SHAPES: readonly Ty[] = [any, base("Atom"), base("Bool"), base("Nat")];

const shapeKey = (s: Ty): string => (s.k === "any" ? "?" : s.k === "base" ? s.name : formatTy(s));

export function Nameplate(props: NameplateProps): JSX.Element {
	const [isOpenEditor, setIsOpenEditor] = createSignal<boolean>(false);

	const handleSelectInput = (index: number, shape: Ty): void => {
		if (props.onUpdateSpec === void 0) return;
		const nextInputs = [...props.spec.inputs];
		nextInputs[index] = shape;
		props.onUpdateSpec({
			inputs: nextInputs,
			output: props.spec.output,
			status: "unverified",
		});
	};

	const handleSelectOutput = (shape: Ty): void => {
		if (props.onUpdateSpec === void 0) return;
		props.onUpdateSpec({
			inputs: props.spec.inputs,
			output: shape,
			status: "unverified",
		});
	};

	const handleToggleEditor = (event: MouseEvent): void => {
		event.stopPropagation();
		if (props.interactive === false) return;
		setIsOpenEditor(!isOpenEditor());
	};

	return (
		<div
			class={`nameplate-body ${typeof props.spec.status === "string" ? props.spec.status : props.spec.status.kind} ${props.interactive !== false ? "interactive" : ""}`}
			onClick={handleToggleEditor}
			onKeyDown={(e) => e.key === "Enter" && handleToggleEditor(e as unknown as MouseEvent)}
			title="装置铭牌 (点击配置类型 · 按 T 切换视角)"
		>
			<Show when={props.spec.inputs.length > 0}>
				<div class="nameplate-socket-group">
					<For each={props.spec.inputs}>
						{(inputShape) => (
							<div class="nameplate-plug-socket" title={`输入接口: ${formatTy(inputShape)}`}>
								<TypeShapeGlyph shape={inputShape} />
							</div>
						)}
					</For>
				</div>
				<span class="nameplate-arrow">→</span>
			</Show>

			<div class="nameplate-plug-out" title={`输出插头: ${formatTy(props.spec.output)}`}>
				<TypeShapeGlyph shape={props.spec.output} />
			</div>

			<Show when={props.spec.status === "certified"}>
				<div class="nameplate-certified-stamp" title="出厂检验合格">
					合格
				</div>
			</Show>

			<Show when={typeof props.spec.status === "object" && props.spec.status.kind === "rejected"}>
				<div class="nameplate-reject-slash" />
				<div class="nameplate-bubble-tip">{(props.spec.status as { readonly reason: string }).reason}</div>
			</Show>

			<Show when={typeof props.spec.status === "object" && props.spec.status.kind === "inconsistent"}>
				<div class="nameplate-inconsistent-cross" title={(props.spec.status as { readonly reason: string }).reason}>
					✕
				</div>
			</Show>

			<Show when={isOpenEditor()}>
				<div
					class="nameplate-popover-editor"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<div class="popover-header">
						<span>铭牌配置</span>
						<button type="button" class="popover-close-btn" onClick={() => setIsOpenEditor(false)}>
							✕
						</button>
					</div>

					<div class="popover-body">
						<For each={props.spec.inputs}>
							{(inputShape, i) => (
								<div class="popover-field">
									<span class="popover-label">输入 {props.spec.inputs.length > 1 ? i() + 1 : ""}</span>
									<select
										class="shape-select"
										value={shapeKey(inputShape)}
										onChange={(e) => {
											const found = AVAILABLE_BASE_SHAPES.find((s) => shapeKey(s) === e.currentTarget.value);
											if (found !== void 0) handleSelectInput(i(), found);
										}}
									>
										<For each={AVAILABLE_BASE_SHAPES}>
											{(shape) => <option value={shapeKey(shape)}>{formatTy(shape)}</option>}
										</For>
									</select>
								</div>
							)}
						</For>

						<div class="popover-field">
							<span class="popover-label">输出</span>
							<select
								class="shape-select"
								value={shapeKey(props.spec.output)}
								onChange={(e) => {
									const found = AVAILABLE_BASE_SHAPES.find((s) => shapeKey(s) === e.currentTarget.value);
									if (found !== void 0) handleSelectOutput(found);
								}}
							>
								<For each={AVAILABLE_BASE_SHAPES}>
									{(shape) => <option value={shapeKey(shape)}>{formatTy(shape)}</option>}
								</For>
							</select>
						</div>
					</div>

					<Show when={props.onRequestVerification !== void 0}>
						<button
							type="button"
							class="nameplate-verify-btn"
							onClick={() => {
								setIsOpenEditor(false);
								props.onRequestVerification?.();
							}}
						>
							申请出厂检验
						</button>
					</Show>
				</div>
			</Show>
		</div>
	);
}
