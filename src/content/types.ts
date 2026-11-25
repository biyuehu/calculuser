import type { GadgetId, JudgeTestCase, Term, Ty } from "../engine";

type GadgetShape = "circle" | "square" | "diamond" | "hex";

export interface ToolDefinition {
	readonly id: string;
	readonly symbol: string;
	readonly name: string;
	readonly shape: GadgetShape;
	readonly accent: string;
	readonly arity: number;
	readonly schematic: string;
	readonly typingText: string;
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
	readonly unlocksToolId?: GadgetId | readonly GadgetId[];
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

export interface TypeBuildOrder {
	readonly mode: "typebuild";
	readonly id: string;
	readonly chapter?: number;
	readonly code: string;
	readonly title: string;
	readonly guestLine: string;
	readonly hintOnFail: string;
	readonly allowBlueprint?: boolean;
	readonly targetTy: Ty;
	readonly parSize: number;
	readonly note: string;
}

export interface SandboxOrder {
	readonly mode: "sandbox";
	readonly id: string;
	readonly code: string;
	readonly title: string;
	readonly guestLine: string;
	readonly allowBlueprint: true;
	readonly atoms: readonly string[];
	readonly note: string;
}

export type OrderLevel = BuildOrder | RunOrder | TypeBuildOrder | SandboxOrder;

export type DialogueSpeaker = "me" | "church" | "guest" | "master";

export type DialogueFace = "default" | "happy" | "wow";

export interface TextLine {
	readonly text: string;
	readonly speaker?: DialogueSpeaker;
	readonly face?: DialogueFace;
}

export type ChoiceBranch = DialogueLine | readonly DialogueLine[];

export interface ChoicesLine {
	readonly choices: readonly [string, ChoiceBranch][];
}

export type DialogueLine = TextLine | ChoicesLine;

export interface DialogueBeat {
	readonly id: string;
	readonly title?: string;
	readonly lines: readonly DialogueLine[];
}

export const textLine = (text: string, speaker?: DialogueSpeaker, face?: DialogueFace): TextLine => ({
	text,
	speaker,
	face,
});

export const choicesLine = (choices: readonly [string, ChoiceBranch][]): ChoicesLine => ({ choices });

export const isChoicesLine = (line: DialogueLine): line is ChoicesLine => "choices" in line;
