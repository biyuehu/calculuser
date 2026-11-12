import type { GadgetId } from "../engine/term";

export type GadgetShape = "circle" | "square" | "diamond" | "hex";

export interface GadgetMeta {
	readonly id: GadgetId;
	readonly name: string;
	readonly shape: GadgetShape;
	readonly accent: string;
	readonly note: string;
}

const BUILTIN_META: Record<GadgetId, GadgetMeta> = {
	I: { id: "I", name: "直通管", shape: "circle", accent: "#38bdf8", note: "进什么就吐出什么，最基础的传话通道。" },
	K: { id: "K", name: "截留闸", shape: "square", accent: "#f59e0b", note: "收下两件东西后只留第一件，丢掉第二件。" },
	S: { id: "S", name: "分叉器", shape: "diamond", accent: "#10b981", note: "把第三件东西同时分两路送给前两件再汇合。" },
};

const PLAYER_SHAPES: readonly GadgetShape[] = ["hex", "circle", "square", "diamond"];
const PLAYER_ACCENTS: readonly string[] = ["#818cf8", "#f472b6", "#38bdf8", "#a78bfa"];

export function getGadgetMeta(id: GadgetId, fallbackName: string, fingerprint: string): GadgetMeta {
	if (BUILTIN_META[id] !== undefined) return BUILTIN_META[id];
	let hash = 0;
	for (let index = 0; index < fingerprint.length; index += 1) {
		hash = (hash * 31 + fingerprint.charCodeAt(index)) % 997;
	}
	return {
		id,
		name: fallbackName,
		shape: PLAYER_SHAPES[hash % PLAYER_SHAPES.length],
		accent: PLAYER_ACCENTS[hash % PLAYER_ACCENTS.length],
		note: "工坊自制封装装置。",
	};
}
