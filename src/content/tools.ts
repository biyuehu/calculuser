import type { GadgetId } from "../engine/term";
import { BUILTIN_TOOLS } from "./data/builtinTools";
import { ORDER_TOOLS } from "./data/orderTools";
import type { GadgetMeta, GadgetShape, ToolDefinition } from "./types";

export const ALL_TOOLS: readonly ToolDefinition[] = [...BUILTIN_TOOLS, ...ORDER_TOOLS];

const TOOL_MAP = new Map<string, ToolDefinition>();
for (const tool of ALL_TOOLS) TOOL_MAP.set(tool.id, tool);

export function getToolDefinition(id: string): ToolDefinition | null {
	const direct = TOOL_MAP.get(id);
	return direct !== undefined ? direct : null;
}

const PLAYER_SHAPES: readonly GadgetShape[] = ["hex", "circle", "square", "diamond"];
const PLAYER_ACCENTS: readonly string[] = ["#818cf8", "#f472b6", "#38bdf8", "#a78bfa"];

export function getGadgetMeta(id: GadgetId, fallbackName: string, fingerprint: string): GadgetMeta {
	const tool = getToolDefinition(id);
	if (tool !== null)
		return {
			id: tool.id,
			symbol: tool.symbol,
			name: fallbackName.length > 0 && fallbackName !== id ? fallbackName : tool.name,
			shape: tool.shape,
			accent: tool.accent,
			note: tool.note,
		};
	let hash = 0;
	for (let index = 0; index < fingerprint.length; index += 1) hash = (hash * 31 + fingerprint.charCodeAt(index)) % 997;
	return {
		id,
		symbol: fallbackName.length <= 2 && fallbackName.length > 0 ? fallbackName : "★",
		name: fallbackName,
		shape: PLAYER_SHAPES[hash % PLAYER_SHAPES.length],
		accent: PLAYER_ACCENTS[hash % PLAYER_ACCENTS.length],
		note: "工坊自制封装装置。",
	};
}

export function resolveGadgetMeta(
	id: GadgetId,
	registry: { readonly get: (id: GadgetId) => { readonly fingerprint: string } | undefined },
	customNames: ReadonlyMap<string, string>,
): GadgetMeta {
	const entry = registry.get(id);
	const custom = customNames.get(id);
	return getGadgetMeta(id, custom !== undefined ? custom : id, entry !== undefined ? entry.fingerprint : id);
}
