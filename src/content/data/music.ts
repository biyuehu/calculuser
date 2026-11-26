import type { OrderLevel } from "../types";

export type BgmTrackId = "intro" | "tadayohu_hito" | "coeax" | "toudai" | "rain" | "outro";

export interface BgmTrackDefinition {
	readonly id: BgmTrackId;
	readonly title: string;
	readonly src: string;
	readonly scene: string;
	readonly description: string;
}

export const BGM_TRACKS: readonly BgmTrackDefinition[] = [
	{
		id: "intro",
		title: "Intro –トリス[シクロペンタジエニル]スカンジウム–",
		src: "/music/intro.mp3",
		scene: "开场仪式 · 主标题界面",
		description: "工坊大门开启与标题画面的序曲。",
	},
	{
		id: "tadayohu_hito",
		title: "動かない魂と漂う人",
		src: "/music/tadayohu_hito.mp3",
		scene: "常规构建订单",
		description: "日常拼装、开槽与喂入推导时的轻缓工坊曲。",
	},
	{
		id: "coeax",
		title: "不思議の国のコーイアックス",
		src: "/music/coeax.mp3",
		scene: "类型契约 · 推演关卡",
		description: "铭牌检定（typebuild）与单步归约试机（run）的专注旋律。",
	},
	{
		id: "toudai",
		title: "灯台の謎めいた少女",
		src: "/music/toudai.mp3",
		scene: "第 1～6 章终关",
		description: "每一章压轴委托响起的灯塔主题曲。",
	},
	{
		id: "rain",
		title: "Rain –Kävellä Sateessa–",
		src: "/music/rain.mp3",
		scene: "终章深处（7.9 / 7.10）",
		description: "奇异点终局两道试炼——阶乘与斐波那契的雨夜协奏。",
	},
	{
		id: "outro",
		title: "Outro –Fantasia On Hävinnyt–",
		src: "/music/outro.mp3",
		scene: "接待台剧情对话",
		description: "工坊接待台与小丘、来客及旧信件交谈时的伴奏。",
	},
];

export function resolveOrderBgm(order: OrderLevel, allLevels: readonly OrderLevel[]): BgmTrackId {
	if (order.mode === "sandbox") return "tadayohu_hito";
	const chapter = order.chapter;
	if (chapter !== void 0) {
		const chapterOrders = allLevels.filter((lvl) => lvl.mode !== "sandbox" && lvl.chapter === chapter);
		const idx = chapterOrders.findIndex((lvl) => lvl.id === order.id);
		if (chapter === 7 && idx >= chapterOrders.length - 2) return "rain";
		if (idx === chapterOrders.length - 1) return "toudai";
	}
	return order.mode === "typebuild" || order.mode === "run" ? "coeax" : "tadayohu_hito";
}
