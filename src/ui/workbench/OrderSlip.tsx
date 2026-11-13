import { For, type JSX, Show, createSignal } from "solid-js";
import type { OrderLevel } from "../../content";
import type { Registry } from "../../engine/gadget";
import type { JudgeTestCase, JudgeTestResult } from "../../engine/judge";
import type { Term } from "../../engine/term";
import { TermVisual } from "./TermVisual";

export interface RejectedInfo {
	readonly testCase: JudgeTestCase;
	readonly result: JudgeTestResult;
}

export interface OrderSlipProps {
	readonly order: OrderLevel;
	readonly registry: Registry;
	readonly gadgetNames: ReadonlyMap<string, string>;
	readonly rejected: RejectedInfo | null;
	readonly runSteps: number;
	readonly runFailed: boolean;
}

export function OrderSlip(props: OrderSlipProps): JSX.Element {
	const [collapsed, setCollapsed] = createSignal<boolean>(false);
	const [width, setWidth] = createSignal<number>(290);

	const handleResize = (downEvent: PointerEvent): void => {
		downEvent.preventDefault();
		downEvent.stopPropagation();
		const handle = downEvent.currentTarget as HTMLElement;
		handle.setPointerCapture(downEvent.pointerId);
		const startX = downEvent.clientX;
		const startWidth = width();

		const onPointerMove = (moveEvent: PointerEvent): void => {
			setWidth(Math.max(260, Math.min(720, startWidth - (moveEvent.clientX - startX))));
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
		<section
			class="order-slip"
			style={{ width: `${width()}px`, height: collapsed() ? "42px" : "auto" }}
			onWheel={(event) => event.stopPropagation()}
		>
			<div class="order-resize-handle" onPointerDown={handleResize} title="拖动调整订单栏宽度" />
			<div class="order-slip-header">
				<span>{props.order.mode === "run" ? "运转试炼" : "客人的订单"}</span>
				<div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
					<span style={{ color: "var(--text-muted)", "font-weight": "500" }}>
						{props.order.mode === "run"
							? `步数 ${props.runSteps} / ${props.order.stepBudget}`
							: `标准 ${props.order.parSize} 件`}
					</span>
					<button
						type="button"
						class="icon-btn"
						style={{ height: "22px", padding: "0 6px", "font-size": "11px" }}
						onClick={() => setCollapsed(!collapsed())}
					>
						{collapsed() ? "展开" : "收起"}
					</button>
				</div>
			</div>

			<Show when={!collapsed()}>
				<p class="order-guest-line">{props.order.guestLine}</p>

				<Show when={props.order.mode === "build"}>
					<For each={props.order.mode === "build" ? props.order.tests : []}>
						{(testCase) => (
							<div class="order-sample-row">
								<For each={testCase.args}>
									{(argTerm) => (
										<div class="mini-scale">
											<TermVisual
												term={argTerm}
												depth={0}
												path=""
												registry={props.registry}
												gadgetNames={props.gadgetNames}
												redexPaths={[]}
												onStepRedex={null}
											/>
										</div>
									)}
								</For>
								<span style={{ color: "var(--text-muted)" }}>→</span>
								<div class="mini-scale">
									<TermVisual
										term={testCase.expect}
										depth={0}
										path=""
										registry={props.registry}
										gadgetNames={props.gadgetNames}
										redexPaths={[]}
										onStepRedex={null}
									/>
								</div>
							</div>
						)}
					</For>
				</Show>

				<Show when={props.order.mode === "run"}>
					<div class="order-sample-row">
						<span style={{ color: "var(--text-muted)" }}>目标结果：</span>
						<div class="mini-scale">
							<TermVisual
								term={props.order.mode === "run" ? props.order.targetTerm : { kind: "atom", name: "A" }}
								depth={0}
								path=""
								registry={props.registry}
								gadgetNames={props.gadgetNames}
								redexPaths={[]}
								onStepRedex={null}
							/>
						</div>
					</div>
				</Show>

				<Show when={props.rejected !== null}>
					<div class="order-reject-box">
						<span style={{ "font-weight": "700" }}>客人退货：</span>
						<Show
							when={
								(props.rejected as RejectedInfo).result.terminated &&
								(props.rejected as RejectedInfo).result.actual !== null
							}
							fallback={<span>机器冒烟卡死了（死循环）！</span>}
						>
							<div style={{ display: "flex", "align-items": "center", gap: "6px", "flex-wrap": "wrap" }}>
								<span>实际吐出：</span>
								<div class="mini-scale">
									<TermVisual
										term={(props.rejected as RejectedInfo).result.actual as Term}
										depth={0}
										path=""
										registry={props.registry}
										gadgetNames={props.gadgetNames}
										redexPaths={[]}
										onStepRedex={null}
									/>
								</div>
							</div>
						</Show>
						<span class="order-reject-hint">{props.order.hintOnFail}</span>
					</div>
				</Show>

				<Show when={props.runFailed}>
					<div class="order-reject-box">
						<span style={{ "font-weight": "700" }}>步数预算已耗尽（仍可继续演练探索，但本轮无法交货）！</span>
						<span class="order-reject-hint">{props.order.hintOnFail}</span>
					</div>
				</Show>
			</Show>
		</section>
	);
}
