import type { GadgetId } from "../engine/term";
import { COMBINATORS } from "./data/combinators";
import { LEVELS } from "./data/levels";
import type { GadgetMeta, ToolDefinition } from "./types";

export * from "./types";
export * from "./dialogue";
export { CHAPTERS, LEVELS } from "./data/levels";
export { BUILTIN_COUNT, COMBINATORS } from "./data/combinators";

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
	return COMBINATORS.find((item) => item.id === id) ?? null;
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
