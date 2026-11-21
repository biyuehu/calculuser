import type { GadgetId, JudgeTestCase, Term } from "../engine";

export type GadgetShape = "circle" | "square" | "diamond" | "hex";

export interface ToolDefinition {
	readonly id: string;
	readonly symbol: string;
	readonly name: string;
	readonly shape: GadgetShape;
	readonly accent: string;
	readonly arity: number;
	readonly schematic: string;
	readonly note: string;
	readonly defText: string;
}

export interface GadgetMeta {
	readonly id: GadgetId;
	readonly symbol: string;
	readonly name: string;
	readonly shape: GadgetShape;
	readonly accent: string;
	readonly note: string;
}

export interface ChapterDefinition {
	readonly id: number;
	readonly title: string;
}

export interface BuildOrder {
	readonly mode: "build";
	readonly id: string;
	readonly chapter?: number;
	readonly code: string;
	readonly title: string;
	readonly guestLine: string;
	readonly hintOnFail: string;
	readonly forbidden: readonly GadgetId[];
	readonly allowBlueprint: boolean;
	readonly atoms: readonly string[];
	readonly parSize: number;
	readonly tests: readonly JudgeTestCase[];
	readonly unlocksToolId?: GadgetId;
	readonly note: string;
}

export interface RunOrder {
	readonly mode: "run";
	readonly id: string;
	readonly chapter?: number;
	readonly code: string;
	readonly title: string;
	readonly guestLine: string;
	readonly hintOnFail: string;
	readonly initialTerm: Term;
	readonly targetTerm: Term;
	readonly stepBudget: number;
	readonly note: string;
}

export type OrderLevel = BuildOrder | RunOrder;
