export type DialogueSpeaker = "hen" | "guest" | "master";

export type DialogueFace = "default" | "happy" | "wow" | "think" | "sad" | "proud";

export interface DialogueLine {
	readonly text: string;
	readonly speaker?: DialogueSpeaker;
	readonly face?: DialogueFace;
}

export interface DialogueBeat {
	readonly id: string;
	readonly title?: string;
	readonly speaker: DialogueSpeaker;
	readonly face: DialogueFace;
	readonly lines: readonly (string | DialogueLine)[];
}

export const LEVEL_DIALOGUES: Readonly<Record<string, DialogueBeat>> = {
	identity: {
		id: "identity_intro",
		title: "工坊初访",
		speaker: "hen",
		face: "happy",
		lines: [
			"太好了，第一件机器顺利交货！",
			"原样进、原样出，可别小看它——这是整座工坊流转的基石。",
			"工坊外头还有不少客人排队，我们接着下一单！",
		],
	},
	"ch1-boss": {
		id: "ch1_boss_cleared",
		title: "初阶考核通过",
		speaker: "guest",
		face: "wow",
		lines: [
			"真不可思议……仅凭三个公理零件，居然真能拼出任意逻辑重排！",
			"工坊的名声已经在城里传开了。",
			"老师傅留下的第二间绘图室已经为你打开，去瞧瞧吧。",
		],
	},
};
