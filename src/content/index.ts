import type { GadgetId } from "../engine";
import { BUILTIN_COUNT, COMBINATORS } from "./data/combinators";
import { LEVELS } from "./data/levels";
import type { GadgetMeta, ToolDefinition } from "./types";

export * from "./types";
export * from "./dialogue";
export { CHAPTERS, LEVELS } from "./data/levels";
export { BUILTIN_COUNT, COMBINATORS } from "./data/combinators";

export function getToolSource(toolId: string): string | null {
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

export function getGadgetMeta(id: GadgetId): GadgetMeta {
	const tool = getToolDefinition(id);
	return tool !== null
		? {
				id: tool.id,
				symbol: tool.symbol,
				name: tool.name,
				shape: tool.shape,
				accent: tool.accent,
				note: tool.note,
			}
		: {
				id,
				symbol: id.length <= 2 ? id : "★",
				name: id,
				shape: "circle",
				accent: "#64748b",
				note: "工坊自制组合子部件",
			};
}
