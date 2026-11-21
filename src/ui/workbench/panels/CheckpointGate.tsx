import { type JSX, Show, createSignal } from "solid-js";
import { type Ty, formatTy } from "../../../engine";
import { TypeShapeGlyph } from "../term/TypeShapeGlyph";

interface CheckpointGateProps {
	readonly expectedShape: Ty;
	readonly status: "idle" | "pass" | "blame";
	readonly blameTargetName?: string;
	readonly onReset?: () => void;
}

export function CheckpointGate(props: CheckpointGateProps): JSX.Element {
	const [isDismissed, setIsDismissed] = createSignal<boolean>(false);

	return (
		<div class={`checkpoint-gate ${props.status}`} title={`安检闸机 · 检查类型: ${formatTy(props.expectedShape)}`}>
			<div class="checkpoint-frame">
				<div class="checkpoint-arch">
					<div class="checkpoint-sensor">
						<TypeShapeGlyph shape={props.expectedShape} size={14} />
					</div>
					<div class="checkpoint-indicator" />
				</div>
				<div class={`checkpoint-bar ${props.status === "blame" ? "dropped" : ""}`} />
			</div>

			<Show when={props.status === "blame" && !isDismissed()}>
				<div class="checkpoint-blame-banner">
					<div class="blame-smoke" />
					<div class="blame-text">
						<strong>质检拦截</strong>
						<span>
							责任方: <strong>{props.blameTargetName ?? "未挂牌装置"}</strong>
						</span>
					</div>
					<button type="button" class="blame-dismiss-btn" onClick={() => setIsDismissed(true)}>
						✕
					</button>
				</div>
			</Show>
		</div>
	);
}
