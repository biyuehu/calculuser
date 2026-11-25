import { choicesLine, textLine } from "../types";
import type { DialogueBeat } from "../types";

const ch1BossBeat: DialogueBeat = {
	id: "ch1_boss_cleared",
	title: "初阶考核通过",
	lines: [
		textLine("真不可思议……仅凭三个公理零件，居然真能拼出任意逻辑重排！", "guest", "wow"),
		textLine("工坊的名声已经在城里传开了。", "church", "happy"),
		textLine("老师傅留下的第二间绘图室已经为你打开，去瞧瞧吧。", "church", "default"),
	],
};

export const LEVEL_DIALOGUES: Readonly<Record<string, DialogueBeat>> = {
	identity: {
		id: "identity_intro",
		title: "工坊初访",
		lines: [
			textLine("太好了，第一件机器顺利交货！", "church", "happy"),
			textLine("原样进、原样出，可别小看它——这是整座工坊流转的基石。", "church", "default"),
			choicesLine([
				["感觉并不难，接着来！", textLine("很有干劲嘛，下一张图纸已经备好了。", "church", "happy")],
				[
					"这公理零件有什么来头？",
					[
						textLine("这可是纯粹逻辑的结晶，不带半点多余机械杂质。", "church", "default"),
						textLine("后面你还会见到更多更有趣的零件！", "church", "happy"),
					],
				],
			]),
			textLine("工坊外头还有不少客人排队，我们接着下一单！", "church", "happy"),
		],
	},
	"skk-identity": ch1BossBeat,
	"ch1-boss": ch1BossBeat,
	"type-intro": {
		id: "type_intro_beat",
		title: "标准与铭牌",
		lines: [
			textLine("师傅，给！这是工坊刚拟定的「类型铭牌」。", "church", "happy"),
			textLine("以前我们造机器全凭感觉，裸机虽然自由，可一旦接错就会冒烟卡死！", "church", "wow"),
			textLine("挂上牌子、标清入口和出口形状，经出厂检验盖上合格章，就能保证安全运转！", "church", "happy"),
			textLine("随时按下键盘上的 T 键，就能开启铭牌透视视角。", "church", "default"),
		],
	},
};
