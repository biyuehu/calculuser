import type { GadgetId } from "../engine";
import { BUILTIN_COUNT, COMBINATORS } from "./data/combinators";
import { LEVELS } from "./data/levels";
import type { GadgetMeta, SandboxOrder, ToolDefinition } from "./types";

export * from "./types";
export { CHAPTERS, LEVELS } from "./data/levels";
export { BUILTIN_COUNT, COMBINATORS } from "./data/combinators";
export { LEVEL_DIALOGUES } from "./data/dialogue";

export const SANDBOX_ORDER: SandboxOrder = {
	mode: "sandbox",
	id: "sandbox",
	code: "∞",
	title: "自由实验台",
	guestLine: "无约束的组合项装配与逻辑推演台",
	allowBlueprint: true,
	atoms: ["A", "B", "C", "D", "x", "y", "z"],
	note: "支持任意自由组合子、开槽与规约观察",
};

function getToolSource(toolId: string): string | null {
	return LEVELS.find((item) => item.mode === "build" && item.unlocksToolId === toolId)?.id ?? null;
}

export function isOrderUnlocked(
	orderIndex: number,
	clearedStars: ReadonlyMap<string, number>,
	judgeMode: boolean,
): boolean {
	return judgeMode || orderIndex === 0 || clearedStars.has(LEVELS[orderIndex - 1].id);
}

export function isToolUnlocked(toolId: string, clearedStars: ReadonlyMap<string, number>, judgeMode: boolean): boolean {
	if (judgeMode) return true;
	for (let i = 0; i < BUILTIN_COUNT; i += 1) if (COMBINATORS[i].id === toolId) return true;
	const sourceOrderId = getToolSource(toolId);
	return sourceOrderId !== null && clearedStars.has(sourceOrderId);
}

export function getContinueOrderIndex(clearedStars: ReadonlyMap<string, number>): number {
	return Math.max(
		0,
		LEVELS.findIndex((order) => !clearedStars.has(order.id)),
	);
}

export function getOrderCode(orderId: string): string {
	return LEVELS.find((item) => item.id === orderId)?.code ?? "1.1";
}

export function getToolDefinition(id: string): ToolDefinition | null {
	return COMBINATORS.find((item) => item.id === id) ?? null;
}

export function deriveGadgetVisuals(id: string): {
	readonly symbol: string;
	readonly shape: "circle" | "square" | "diamond" | "hex";
	readonly accent: string;
} {
	let hash = 0;
	for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
	const absHash = Math.abs(hash);
	return {
		symbol: id.length > 0 ? id[0].toUpperCase() : "?",
		shape: (["circle", "square", "diamond", "hex"] as const)[absHash % 4],
		accent: `hsl(${(absHash * 137) % 360}, 68%, 52%)`,
	};
}

export function getGadgetMeta(id: GadgetId, customName?: string): GadgetMeta {
	const tool = getToolDefinition(id);
	if (tool !== null)
		return {
			id: tool.id,
			symbol: tool.symbol,
			name: tool.name,
			shape: tool.shape,
			accent: tool.accent,
			note: tool.note,
		};
	const visual = deriveGadgetVisuals(id);
	return {
		id,
		symbol: visual.symbol,
		name: customName ?? id,
		shape: visual.shape,
		accent: visual.accent,
		note: "工坊自制组合子部件",
	};
}
