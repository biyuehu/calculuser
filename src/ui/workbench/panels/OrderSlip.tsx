import { For, type JSX, Show } from "solid-js";
import type { OrderLevel } from "../../../content";
import type { JudgeTestCase, JudgeTestResult } from "../../../engine/judge";
import { startDragResize } from "../../../utils/dragResize";
import { useUiPreferences } from "../../../utils/hooks/useUiPreferences";
import { TermVisual } from "../term/TermVisual";

export interface RejectedInfo {
	readonly testCase: JudgeTestCase;
	readonly result: JudgeTestResult;
}

interface OrderSlipProps {
	readonly order: OrderLevel;
	readonly rejected?: RejectedInfo;
	readonly runSteps: number;
	readonly runFailed: boolean;
	readonly transitioning: boolean;
}

export function OrderSlip(props: OrderSlipProps): JSX.Element {
	const ui = useUiPreferences();

	const handleResize = (downEvent: PointerEvent): void =>
		startDragResize(downEvent, ui.orderSlipWidth(), -1, 260, 720, ui.setOrderSlipWidth);

	return (
		<section
			class={`order-slip ${props.transitioning ? "level-transitioning" : ""}`}
			style={{ width: `${ui.orderSlipWidth()}px`, height: ui.orderSlipCollapsed() ? "42px" : "auto" }}
			onWheel={(event) => event.stopPropagation()}
		>
			<div class="order-resize-handle" onPointerDown={handleResize} title="拖动调整订单栏宽度" />
			<div class="order-slip-header">
				<span>{props.order.mode === "run" ? "运转试炼" : "客人的订单"}</span>
				<div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
					<Show when={props.order.mode === "build" ? props.order : null}>
						{(buildOrder) => (
							<span style={{ color: "var(--text-muted)", "font-weight": "500" }}>标准 {buildOrder().parSize} 件</span>
						)}
					</Show>
					<button
						type="button"
						class="icon-btn"
						style={{ height: "22px", padding: "0 6px", "font-size": "11px" }}
						onClick={() => ui.setOrderSlipCollapsed(!ui.orderSlipCollapsed())}
					>
						{ui.orderSlipCollapsed() ? "展开" : "收起"}
					</button>
				</div>
			</div>

			<Show when={!ui.orderSlipCollapsed()}>
				<p class="order-guest-line">{props.order.guestLine}</p>

				<Show when={props.order.mode === "build" ? props.order : null}>
					{(buildOrder) => (
						<For each={buildOrder().tests}>
							{(testCase) => (
								<div class="order-sample-row">
									<For each={testCase.args}>
										{(argTerm) => (
											<div class="mini-scale">
												<TermVisual term={argTerm} depth={0} path="" redexPaths={[]} />
											</div>
										)}
									</For>
									<span class="order-case-arrow">→</span>
									<div class="mini-scale">
										<TermVisual term={testCase.expect} depth={0} path="" redexPaths={[]} />
									</div>
								</div>
							)}
						</For>
					)}
				</Show>

				<Show when={props.order.mode === "run" ? props.order : null}>
					{(runOrder) => (
						<div class="order-sample-row">
							<span style={{ color: "var(--text-muted)", "flex-shrink": 0 }}>目标结果：</span>
							<div class="mini-scale">
								<TermVisual term={runOrder().targetTerm} depth={0} path="" redexPaths={[]} />
							</div>
						</div>
					)}
				</Show>

				<Show when={props.rejected}>
					{(rejected) => {
						const result = rejected().result;
						const actual = result.actual;
						return (
							<div class="order-reject-box">
								<span style={{ "font-weight": "700" }}>客人退货：</span>
								<Show
									when={result.terminated && actual !== void 0 ? actual : void 0}
									fallback={<span>机器冒烟卡死了（死循环）！</span>}
								>
									{(actualTerm) => (
										<div style={{ display: "flex", "align-items": "center", gap: "6px", "flex-wrap": "wrap" }}>
											<span>实际吐出：</span>
											<div class="mini-scale">
												<TermVisual term={actualTerm()} depth={0} path="" redexPaths={[]} />
											</div>
										</div>
									)}
								</Show>
								<span class="order-reject-hint">{props.order.hintOnFail}</span>
							</div>
						);
					}}
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
