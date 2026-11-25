import { choicesLine, textLine } from "../types";
import type { DialogueBeat } from "../types";

export const LEVEL_DIALOGUES: Readonly<Record<string, DialogueBeat>> = {
	// ==================== 第一章：密集引导 ====================
	identity: {
		id: "ch1_identity_intro",
		title: "工坊重启",
		lines: [
			textLine(
				"呼——总算把第一张订单顺利交出去了！这台直通管虽然只有圆圆一小枚，却是整座工坊流转的基石。",
				"church",
				"happy",
			),
			textLine(
				"老师傅出远门前把这间绘图室和这台助手机械臂交给你，可客人们可不管工坊刚重启，外面已经排起队了。",
				"church",
				"default",
			),
			choicesLine([
				[
					"第一单挺顺手的，接着来吧",
					textLine("有这股干劲就好，下一单我带你直接看看机器内部是怎么运转的。", "church", "happy"),
				],
				[
					"直通管内部到底做了什么？",
					[
						textLine(
							"从数学上讲，它就是恒等函数 λx. x：无论你喂给它什么信号，它都不加工、不丢弃，原封不动吐出来。",
							"church",
							"default",
						),
						textLine("下一单我把它的运转开关接上，你亲手推演一步就能看明白。", "church", "happy"),
					],
				],
			]),
		],
	},
	"run-k-drop": {
		id: "ch1_run_k_cleared",
		title: "从黑盒到图纸",
		lines: [
			textLine("你刚才看见了吗？截留闸 K 吞掉第一件包裹 A 之后，直接把还没拆封的 B 整块扔掉了。", "church", "wow"),
			textLine("这种「不到最后交货决不提前拆包裹」的脾气，就是老师傅常挂在嘴边的「惰性求值」。", "church", "default"),
			textLine(
				"不过坏消息是——货架上的现成直通管和截留闸快见底了。我已经帮你打开了「▢ 开槽」图纸台，接下来得学会自己从零敲零件。",
				"church",
				"happy",
			),
		],
	},
	"const-k": {
		id: "ch1_before_s_fork",
		title: "绿色公理零件",
		lines: [
			textLine("自己开槽造出 I 和 K 之后，是不是突然觉得那些符号也没那么神秘了？", "church", "happy"),
			textLine(
				"实际上，每个「▢ 开槽」就是在机器外壳上留一个接收口，而里面的同色信号珠就负责把接进来的东西搬到指定位置。",
				"church",
				"default",
			),
			textLine(
				"不过接下来这枚绿色的「分叉器 S」脾气有点古怪——它能把同一份信号同时复制两份送给不同机器。先跟我一起试转两步再动手。",
				"church",
				"wow",
			),
		],
	},
	"skk-identity": {
		id: "ch1_boss_cleared",
		title: "初阶考核通过",
		lines: [
			textLine("不可思议……不需要任何开槽，只用分叉器 S 和截留闸 K 居然真的拼出了直通管。", "guest", "wow"),
			textLine(
				"这在逻辑学里叫做「SKI 组合子完备性」：别看工坊里的机器花样繁多，本质上全都能被 S 和 K 两个公理零件组合出来。",
				"church",
				"happy",
			),
			textLine("工坊的名声已经在城里传开了，第二间高阶绘图室已经解锁。", "church", "default"),
		],
	},

	// ==================== 第二章：引入类型铭牌与伏笔 ====================
	"reverse-apply": {
		id: "ch2_type_intro_beat",
		title: "标准与类型铭牌",
		lines: [
			textLine("师傅，停一下！刚才整理第二间绘图室时，我翻出了老师傅拟定的「类型铭牌」。", "church", "happy"),
			textLine(
				"以前咱们拼裸机虽然自由，但随着订单越来越复杂，一旦把不兼容的接口硬塞在一起，机器当场就会冒烟卡死。",
				"church",
				"wow",
			),
			choicesLine([
				[
					"听起来像防呆质检，怎么用？",
					textLine(
						"在每个槽口上标清允许进入的信号规格（比如 A 或 A -> B），只要结构契合契约，连黑盒测试都不用跑就能签发合格章。",
						"church",
						"default",
					),
				],
				[
					"放心，我直接上手试试",
					textLine("记得随时按 T 键开启透视视角，检查铭牌与信号流的匹配情况。", "church", "happy"),
				],
			]),
			textLine("下一单正好是铭牌检定台的首次试运行，挂上牌子走一趟吧。", "church", "default"),
		],
	},
	"run-omega-preview": {
		id: "ch2_boss_cleared",
		title: "自应用的回响",
		lines: [
			textLine("S I I 展开后竟然能把输入复制成自己吃自己（A A）……", "church", "wow"),
			textLine(
				"老师傅在笔记本最后写过一句警告：「切勿把这种自复制结构直接喂给它自己，否则机器会永无止境地吞噬时间」。",
				"church",
				"default",
			),
			textLine("不过眼下先别急着碰那个禁区，第三间绘图室的客人正等着咱们做逻辑开关和打包盒呢。", "church", "happy"),
		],
	},

	// ==================== 第三章：稀疏引导 ====================
	"tb-bool-sel": {
		id: "ch3_pair_bridge",
		title: "从开关到容器",
		lines: [
			textLine(
				"布尔开关真假、与非门都已经就位。其实你有没有发现，这些开关全都是靠「选左边还是选右边」来表达信息的？",
				"church",
				"default",
			),
			textLine(
				"如果把两个包裹先存进一个函数里，等外头送进来一个二选一开关再拆封——这就是大名鼎鼎的「序对打包盒」。下一单试试看。",
				"church",
				"happy",
			),
		],
	},
	"tb-compose": {
		id: "ch3_boss_cleared",
		title: "结构封装完毕",
		lines: [
			textLine("真没想到，没有盒子也没有指针，光靠几层开槽就能把两件货物严严实实封存起来。", "guest", "happy"),
			textLine("数据与逻辑原本就是一体两面。接下来第四间屋子要迎接数字与算术的委托了。", "church", "default"),
		],
	},

	// ==================== 第四章：Nat 与滑移技巧 ====================
	"is-zero": {
		id: "ch4_pred_hint",
		title: "倒退的难题",
		lines: [
			textLine(
				"加一、加法、判零全都顺利拿下。可客人刚送来一张棘手订单：想要一台能把计数器「倒退减一」的机器。",
				"church",
				"default",
			),
			textLine(
				"邱奇数只会把动作往前多套一次，怎么才能反过来剥掉一层呢？秘密在于第三章学过的「打包盒」滑移配对。",
				"church",
				"wow",
			),
			textLine("我先摆了一小段演示机在下一关，推演几步你就能一眼看穿它的巧妙。", "church", "happy"),
		],
	},
	sub: {
		id: "ch4_boss_cleared",
		title: "算术基石落成",
		lines: [
			textLine("从零到一，再到前驱与减法——整套自然数算术体系已经在工作台上运转起来了。", "church", "happy"),
			textLine("接下来，第五间绘图室会把单个数字扩展成成串的清单与分叉树形结构。", "church", "default"),
		],
	},

	// ==================== 第五章：深层结构收尾 ====================
	"tree-size": {
		id: "ch5_boss_cleared",
		title: "抽屉深处的草图",
		lines: [
			textLine("列表映射、二叉树折叠、节点统计全都在铭牌与推演下严丝合缝地跑通了。", "church", "happy"),
			textLine("对了……我在清点第五间绘图室的抽屉时，摸到了老师傅封存的那张危险草图。", "church", "wow"),
			textLine(
				"上面没有画任何类型铭牌，只有一个首尾相连的自吞环。准备好进入最后的奇异点绘图室了吗？",
				"church",
				"default",
			),
		],
	},

	// ==================== 第六章：奇异点与全作终局 ====================
	"self-apply": {
		id: "ch6_y_warning",
		title: "驯服无限",
		lines: [
			textLine(
				"这枚小小的自吞环 ω 就是无类型 λ-演算里最具魔力的零件。直接让 ω 吃下 ω 会引发永远停不下来的爆炸复制。",
				"church",
				"wow",
			),
			textLine(
				"但只要在外面包一层控制分支，它就能化身为「柯里不动点引擎 Y」——让任何函数自己调用自己，却又在触底时安全停机。",
				"church",
				"default",
			),
			textLine("下一单先观察一次 Y 引擎的可控展开，亲眼见证递归是怎么诞生在纯粹的函数世界里的。", "church", "happy"),
		],
	},
	"fix-rec-final": {
		id: "ch6_finale",
		title: "工坊的终点与起点",
		lines: [
			textLine(
				"阶乘机顺利停机交付了！从第一单那枚简单的直通管 I 出发，你靠纯粹的开槽与喂入重建出了整个图灵完备的计算宇宙。",
				"church",
				"happy",
			),
			textLine(
				"现在我终于明白老师傅为什么放心把工坊交给你——规则越简单纯粹，能生长出的结构反而越无穷无尽。",
				"church",
				"default",
			),
			textLine(
				"所有的正式委托都已圆满收官，但自由沙盒实验台的大门永远敞开着。去组合、封装属于你自己的全新零件吧！",
				"church",
				"happy",
			),
		],
	},
};
