import type { MonsterMeta } from "../types";

export const MONSTER_LIST: readonly MonsterMeta[] = [
	{
		id: "omega-infinite",
		symbol: "Ω",
		name: "无限吞噬环（Omega）",
		termText: "(λx. x x) (λx. x x)",
		note: "自身复制自身，一步β-归约后完全还原自身，永远无法停机发散。",
		dangerLevel: "极度危险 · 永动黑洞",
	},
	{
		id: "y-combinator",
		symbol: "Y",
		name: "不动点组合子（Curry Fixpoint）",
		termText: "λf. (λx. f (x x)) (λx. f (x x))",
		note: "邱奇与柯里发现的递归之根。通过自我复制实现无类型演算中的函数递归。",
		dangerLevel: "核心机密 · 递归源头",
	},
	{
		id: "turing-fixpoint",
		symbol: "Θ",
		name: "图灵不动点（Turing Fixpoint）",
		termText: "(λx.λy. y (x x y)) (λx.λy. y (x x y))",
		note: "阿兰·图灵设计的不动点项，满足经典左式展开与标准停机特性。",
		dangerLevel: "高度受控 · 计算通用",
	},
];
