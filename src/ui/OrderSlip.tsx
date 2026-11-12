import type { JSX } from "solid-js";
import { For, Show } from "solid-js";
import type { Registry } from "../engine/gadget";
import type { JudgeTestCase, JudgeTestResult } from "../engine/judge";
import type { Term } from "../engine/term";
import type { OrderLevel } from "../levels/orders";
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
}

export function OrderSlip(props: OrderSlipProps): JSX.Element {
	return (
		<section class="order-slip">
			<div class="order-slip-header">
				<span>客人的订单</span>
				<span style={{ color: "var(--text-muted)", "font-weight": "500" }}>标准 {props.order.parSize} 件</span>
			</div>

			<p class="order-guest-line">{props.order.guestLine}</p>

			<For each={props.order.tests}>
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
		</section>
	);
}
