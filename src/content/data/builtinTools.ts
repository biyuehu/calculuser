import type { ToolDefinition } from "../types";

export const BUILTIN_TOOLS: readonly ToolDefinition[] = [
	{
		id: "I",
		symbol: "I",
		name: "直通管",
		shape: "circle",
		accent: "#38bdf8",
		arity: 1,
		schematic: "I x → x",
		note: "进什么吐出什么，最基础的恒等信道。",
		defText: "λx. x",
	},
	{
		id: "K",
		symbol: "K",
		name: "截留闸",
		shape: "square",
		accent: "#f59e0b",
		arity: 2,
		schematic: "K x y → x",
		note: "收下两件东西，只留第一件，丢掉第二件。",
		defText: "λx.λy. x",
	},
	{
		id: "S",
		symbol: "S",
		name: "分叉器",
		shape: "diamond",
		accent: "#10b981",
		arity: 3,
		schematic: "S x y z → x z (y z)",
		note: "把第三件东西同时分两路送给前两件再汇合。",
		defText: "λx.λy.λz. x z (y z)",
	},
];
