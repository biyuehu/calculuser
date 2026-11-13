import type { JSX } from "solid-js";

interface AboutModalProps {
	readonly onClose: () => void;
}

export function AboutModal(props: AboutModalProps): JSX.Element {
	return (
		<div
			class="modal-backdrop"
			onClick={props.onClose}
			onKeyDown={(event) => event.key === "Escape" && props.onClose()}
		>
			<div
				class="modal-card"
				style={{ "max-width": "580px" }}
				onClick={(event) => event.stopPropagation()}
				onKeyDown={(event) => event.stopPropagation()}
			>
				<header style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
					<div>
						<h2 style={{ "font-size": "17px", "font-weight": 700 }}>关于 Calculuser</h2>
						<p style={{ "font-size": "12px", color: "var(--text-muted)" }}>λ-演算与组合逻辑的交互工坊</p>
					</div>
					<button type="button" class="icon-btn" onClick={props.onClose}>
						✕
					</button>
				</header>

				<section style={{ "font-size": "13px", "line-height": "1.65", color: "var(--text-secondary)" }}>
					<p>
						<strong>Calculuser</strong>（Calculus + User）是一款立足于
						<strong>纯无类型 λ-演算（Untyped Lambda Calculus）</strong>与
						<strong>组合子逻辑（Combinatory Logic, SKI）</strong>的解谜与构造游戏。
					</p>
					<div style={{ height: "10px" }} />
					<p>
						游戏中所有的零件并非黑盒脚本，而是严格遵循 β-归约与项代换规则的数学对象。从基础的 I、K、S
						组合子，到布尔逻辑、邱奇数（Church Numerals）、算术运算，再到递归的不动点组合子（Y / Turing
						Fixpoint），所有高级构件均由基础零件逐一封装而成。
					</p>
					<div style={{ height: "10px" }} />
					<div style={{ background: "var(--surface-2)", padding: "10px 14px", "border-radius": "8px" }}>
						<div style={{ "font-weight": 600, color: "var(--text-primary)", "margin-bottom": "4px" }}>
							理论与设计参考
						</div>
						<ul style={{ "padding-left": "18px", "font-size": "12px" }}>
							<li>
								Alonzo Church (1936): <em>An Unsolvable Problem of Elementary Number Theory</em>
							</li>
							<li>
								Moses Schönfinkel & Haskell Curry: <em>Combinatory Logic</em>
							</li>
							<li>
								Benjamin C. Pierce: <em>Types and Programming Languages</em> (TAPL)
							</li>
							<li>
								Inspirations: <em>Recursed</em>, <em>TIS-100</em>, <em>Shenzhen I/O</em>
							</li>
						</ul>
					</div>
				</section>

				<footer style={{ display: "flex", "justify-content": "flex-end", "margin-top": "6px" }}>
					<button type="button" class="order-badge-btn" onClick={props.onClose}>
						确认
					</button>
				</footer>
			</div>
		</div>
	);
}
