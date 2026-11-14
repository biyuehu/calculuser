import type { GadgetId } from "../engine/term";
import { COMBINATORS } from "./data/combinators";
import { LEVELS } from "./data/levels";
import type { GadgetMeta, ToolDefinition } from "./types";

export * from "./types";
export { CHAPTERS, LEVELS } from "./data/levels";
export { COMBINATORS } from "./data/combinators";

export const BUILTIN_COUNT = 3;
export const BUILTIN_TOOLS: readonly ToolDefinition[] = COMBINATORS.slice(0, BUILTIN_COUNT);
export const ORDER_TOOLS: readonly ToolDefinition[] = COMBINATORS.slice(BUILTIN_COUNT);
export const ALL_TOOLS: readonly ToolDefinition[] = COMBINATORS;

export function getToolSource(toolId: string): string | null {
	return LEVELS.find((item) => item.mode === "build" && item.unlocksToolId === toolId)?.id ?? null;
}

export function getContinueOrderIndex(clearedStars: ReadonlyMap<string, number>): number {
	const firstIncomplete = LEVELS.findIndex((order) => !clearedStars.has(order.id));
	return firstIncomplete >= 0 ? firstIncomplete : 0;
}

export function getOrderCode(orderId: string): string {
	return LEVELS.find((item) => item.id === orderId)?.code ?? "1.1";
}

export function getToolDefinition(id: string): ToolDefinition | null {
	const tool = ALL_TOOLS.find((item) => item.id === id);
	return tool !== void 0 ? tool : null;
}

export function getGadgetMeta(id: GadgetId): GadgetMeta {
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
	return {
		id,
		symbol: id.length <= 2 ? id : "★",
		name: id,
		shape: "circle",
		accent: "#64748b",
		note: "工坊自制组合子部件",
	};
}
