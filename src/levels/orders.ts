import type { JudgeTestCase } from "../engine/judge";
import { parseLambda } from "../engine/parse";
import type { GadgetId } from "../engine/term";

export interface OrderLevel {
	readonly id: string;
	readonly title: string;
	readonly guestLine: string;
	readonly hintOnFail: string;
	readonly toolbox: readonly GadgetId[] | "all";
	readonly allowBlueprint: boolean;
	readonly atoms: readonly string[];
	readonly parSize: number;
	readonly tests: readonly JudgeTestCase[];
	readonly unlocksName: string;
	readonly note: string;
}

const atom = (name: string) => ({ kind: "atom", name }) as const;

export const ORDERS: readonly OrderLevel[] = [
	{
		id: "first-delivery",
		title: "传话筒",
		guestLine: "我递进去什么，这台机器就原样递出来。把货架上的圆形「直通管」放到桌上交货吧！",
		hintOnFail: "点一下左侧货架上的圆形「直通管」，放到桌上空位再送到交货台。",
		toolbox: ["I"],
		allowBlueprint: false,
		atoms: ["A", "B"],
		parSize: 1,
		tests: [
			{ args: [atom("A")], expect: atom("A") },
			{ args: [atom("B")], expect: atom("B") },
		],
		unlocksName: "直通管",
		note: "第一笔订单达成！最简单的直通管（I）就是原封不动地交出收到的东西。",
	},
	{
		id: "drop-first-ki",
		title: "丢前留后",
		guestLine: "客人要一台「收两件、丢第一件、只留第二件」的机器。试着用「◀ 喂入」把截留闸和直通管接起来！",
		hintOnFail: "截留闸吃下一件东西后，会变成「永远只交出那件东西，丢掉下一个输入」的机器。先喂给它一个直通管试试！",
		toolbox: ["I", "K"],
		allowBlueprint: false,
		atoms: ["A", "B"],
		parSize: 3,
		tests: [
			{ args: [atom("A"), atom("B")], expect: atom("B") },
			{ args: [atom("B"), atom("A")], expect: atom("A") },
		],
		unlocksName: "弃前闸",
		note: "截留闸（K）吃下直通管（I）后，先吞掉 A 交出 I，I 再原样交出 B——在邱奇编码里它也代表逻辑「假」。",
	},
	{
		id: "split-self-sii",
		title: "一分二复制",
		guestLine: "货架新到了菱形「分叉器」：它会把收到的东西分两路喂给前面两件零件。试着用它造出「自己吃自己」！",
		hintOnFail: "分叉器需要前面接两件东西。如果两路都放直通管，输入就会原样同时送给两路再相吃！",
		toolbox: ["I", "S"],
		allowBlueprint: false,
		atoms: ["A", "B"],
		parSize: 5,
		tests: [
			{ args: [atom("A")], expect: parseLambda("A A") },
			{ args: [atom("B")], expect: parseLambda("B B") },
		],
		unlocksName: "自吞环",
		note: "S I I 就是自应用：分叉器把输入复制成两路直通管，再让左路吃下右路。注意：把它喂给自己会陷入死循环！",
	},
	{
		id: "skk-identity",
		title: "缺货应急",
		guestLine: "直通管卖光了，现在只有「分叉器」和「截留闸」。结合前面学到的，凑出一台传话筒吧！",
		hintOnFail: "用分叉器把输入同时送给两个截留闸，或者让第二个位置放截留闸把多余的一路吞掉。",
		toolbox: ["S", "K"],
		allowBlueprint: false,
		atoms: ["A", "B"],
		parSize: 5,
		tests: [
			{ args: [atom("A")], expect: atom("A") },
			{ args: [atom("B")], expect: atom("B") },
		],
		unlocksName: "组合传话筒",
		note: "精妙！S K K 的效果和直通管一模一样——分叉器把输入分两路，K 吃下输入并吞掉另一路的结果。",
	},
	{
		id: "const-k",
		title: "自制截留闸",
		guestLine: "图纸台解锁了！现在不用现成零件，试着用「▢ 开槽」自己造一台：收两件，只留第一件。",
		hintOnFail: "开两个不同颜色的槽，把第一个槽的信号珠放进最里面即可。",
		toolbox: ["I", "S", "K"],
		allowBlueprint: true,
		atoms: ["A", "B"],
		parSize: 3,
		tests: [
			{ args: [atom("A"), atom("B")], expect: atom("A") },
			{ args: [atom("B"), atom("A")], expect: atom("B") },
		],
		unlocksName: "自制截留闸",
		note: "你亲手造出了 K 组合子！开槽图纸台可以造出任何复杂度的机器。",
	},
	{
		id: "reverse-apply",
		title: "反喂器",
		guestLine: "客人要求：先后放入 A 和 B，出来的结果是「B 吃下 A」。",
		hintOnFail: "先开两个槽接住 A 和 B，再用「◀ 喂入」让第二个槽吃下第一个槽。",
		toolbox: "all",
		allowBlueprint: true,
		atoms: ["A", "B"],
		parSize: 5,
		tests: [
			{ args: [atom("A"), atom("B")], expect: parseLambda("B A") },
			{ args: [atom("B"), atom("A")], expect: parseLambda("A B") },
		],
		unlocksName: "反喂器",
		note: "先来的数据反而被喂进后来的机器，这就是反序应用（Thrush）。",
	},
	{
		id: "church-two",
		title: "二次机",
		guestLine: "连续放入 A 和 B，交出「A 吃下（A 吃下 B）」。",
		hintOnFail: "开两个槽，注意「◀ 喂入」是左吃右，先把 A 和 B 喂好，再在外面套一层 A。",
		toolbox: "all",
		allowBlueprint: true,
		atoms: ["A", "B"],
		parSize: 7,
		tests: [
			{ args: [atom("A"), atom("B")], expect: parseLambda("A (A B)") },
			{ args: [atom("B"), atom("A")], expect: parseLambda("B (B A)") },
		],
		unlocksName: "二次机",
		note: "这就是数字「2」的本质：把同一个动作连续施加两次。",
	},
	{
		id: "compose-b",
		title: "串联桥",
		guestLine: "依次放入 A、B、C，交出「A 吃下（B 吃下 C）」。",
		hintOnFail: "开三个槽，分别接住 A、B、C，然后从内向外组装喂入连接。",
		toolbox: "all",
		allowBlueprint: true,
		atoms: ["A", "B", "C"],
		parSize: 9,
		tests: [
			{ args: [atom("A"), atom("B"), atom("C")], expect: parseLambda("A (B C)") },
			{ args: [atom("B"), atom("A"), atom("C")], expect: parseLambda("B (A C)") },
		],
		unlocksName: "串联桥",
		note: "函数复合（B 组合子）：把两台机器串联起来，数据先过 B 再过 A。",
	},
	{
		id: "pair",
		title: "打包盒",
		guestLine: "把 A 和 B 打包存起来，等收到挑选器 F 时，交出「（F 吃下 A）再吃下 B」。",
		hintOnFail: "开三个槽，让第三个槽的 F 先吃下 A，再吃下 B。",
		toolbox: "all",
		allowBlueprint: true,
		atoms: ["A", "B", "F"],
		parSize: 8,
		tests: [
			{ args: [atom("A"), atom("B"), atom("F")], expect: parseLambda("F A B") },
			{ args: [atom("B"), atom("A"), atom("F")], expect: parseLambda("F B A") },
		],
		unlocksName: "打包盒",
		note: "邱奇序对完成！往打包盒里喂「截留闸」就取出第一件，喂「弃前闸」就取出第二件。",
	},
];
