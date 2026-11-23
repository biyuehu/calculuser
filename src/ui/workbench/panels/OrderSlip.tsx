import { For, type JSX, Show } from "solid-js";
import type { OrderLevel } from "../../../content";
import { type JudgeTestCase, type JudgeTestResult, formatTy } from "../../../engine";
import { useUiPreferences } from "../../../hooks/useUiPreferences";
import { startDragResize } from "../../../utils/dragResize";
import { TermVisual } from "../term/TermVisual";

export interface RejectedInfo {
	readonly testCase: JudgeTestCase;
	readonly result: JudgeTestResult;
}

interface OrderSlipProps {
	readonly order: OrderLevel;
	readonly rejected?: RejectedInfo;
	readonly typeError?: string | null;
	readonly runSteps: number;
	readonly runFailed: boolean;
	readonly transitioning: boolean;
	readonly showHint?: boolean;
	readonly onToggleHint?: () => void;
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
				<span>
					{props.order.mode === "run"
						? "运转试炼"
						: props.order.mode === "typebuild"
							? "类型构筑"
							: props.order.mode === "sandbox"
								? "自由实验"
								: "客人的订单"}
				</span>
				<div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
					<Show when={props.order.mode !== "sandbox"}>
						<button
							type="button"
							class={`icon-btn ${props.showHint ? "active" : ""}`}
							style={{ height: "22px", padding: "0 6px", "font-size": "11px" }}
							onClick={props.onToggleHint}
							title="切换提示 (H)"
						>
							💡
						</button>
					</Show>
					<Show when={props.order.mode === "build" || props.order.mode === "typebuild" ? props.order : null}>
						{(buildOrder) => (
							<span style={{ color: "var(--text-muted)", "font-weight": "500" }}>标准 {buildOrder().parSize} 件</span>
						)}
					</Show>
					<Show when={props.order.mode === "sandbox"}>
						<span style={{ color: "var(--text-muted)", "font-weight": "500" }}>自由测试</span>
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

				<Show when={props.showHint && props.order.mode !== "sandbox"}>
					<div class="order-hint-box">
						<span class="order-hint-label">💡 提示：</span>
						<span class="order-reject-hint">{props.order.mode !== "sandbox" ? props.order.hintOnFail : ""}</span>
					</div>
				</Show>

				<Show when={props.order.mode === "build" ? props.order : null}>
					{(buildOrder) => (
						<div class="order-samples-container">
							<For each={buildOrder().tests}>
								{(testCase) => (
									<div class="order-sample-row">
										<For each={testCase.args}>
											{(argTerm) => (
												<div class="mini-scale">
													<TermVisual term={argTerm} path="" redexPaths={[]} />
												</div>
											)}
										</For>
										<span class="order-case-arrow">→</span>
										<div class="mini-scale">
											<TermVisual term={testCase.expect} path="" redexPaths={[]} />
										</div>
									</div>
								)}
							</For>
						</div>
					)}
				</Show>

				<Show when={props.order.mode === "run" ? props.order : null}>
					{(runOrder) => (
						<div class="order-samples-container">
							<div class="order-sample-row">
								<span style={{ color: "var(--text-muted)", "flex-shrink": 0 }}>目标结果：</span>
								<div class="mini-scale">
									<TermVisual term={runOrder().targetTerm} path="" redexPaths={[]} />
								</div>
							</div>
						</div>
					)}
				</Show>

				<Show when={props.order.mode === "typebuild" ? props.order : null}>
					{(typeOrder) => (
						<div class="order-samples-container">
							<div
								class="order-sample-row"
								style={{ "flex-direction": "column", "align-items": "flex-start", gap: "4px" }}
							>
								<span style={{ color: "var(--text-muted)", "font-size": "11px" }}>目标类型签名：</span>
								<div
									style={{
										"font-family": "monospace",
										"font-size": "13px",
										"font-weight": "600",
										color: "var(--accent)",
									}}
								>
									{formatTy(typeOrder().targetTy)}
								</div>
							</div>
						</div>
					)}
				</Show>

				<Show when={props.order.mode === "sandbox"}>
					<div
						class="order-samples-container"
						style={{ padding: "8px 12px", "font-size": "12px", color: "var(--text-muted)" }}
					>
						<p style={{ margin: "0 0 6px 0" }}>
							⚡ <strong>测试运行方式：</strong>
						</p>
						<p style={{ margin: "0 0 4px 0" }}>
							• 按 <code>Space</code> 或点击下方运行栏开始逐步规约
						</p>
						<p style={{ margin: "0 0 4px 0" }}>• 点击桌面发光红色节点可进行指定单步规约</p>
						<p style={{ margin: 0 }}>
							• 按 <code>X</code> 展开/收起项透视查看 De Bruijn 索引结构
						</p>
					</div>
				</Show>

				<Show when={props.typeError}>
					{(err) => (
						<div class="order-reject-box">
							<span style={{ "font-weight": "700" }}>类型检验未通过：</span>
							<span class="order-reject-hint">{err()}</span>
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
										<div class="order-reject-actual-wrap">
											<span style={{ "font-weight": "600", "flex-shrink": 0 }}>实际吐出：</span>
											<div class="order-reject-actual-row">
												<div class="mini-scale">
													<TermVisual term={actualTerm()} path="" redexPaths={[]} />
												</div>
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
