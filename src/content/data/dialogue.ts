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
	run_k_drop: {
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
	const_k: {
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
	skk_identity: {
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

	// ==================== 第二章：引入类型铭牌与造 S ====================
	reverse_apply: {
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
						"在每个槽口上标清允许进入的信号规格（比如 A 或 A → B），只要结构契合契约，连黑盒测试都不用跑就能签发合格章。",
						"church",
						"default",
					),
				],
				[
					"放心，我直接上手试试",
					textLine("记得随时按 X 键开启透视视角，检查铭牌与信号流的匹配情况。", "church", "happy"),
				],
			]),
			textLine("下一单正好是铭牌检定台的首次试运行，挂上牌子走一趟吧。", "church", "default"),
		],
	},
	tb_uninhabited: {
		id: "ch2_uninhabited_proof",
		title: "假命题与不可居留",
		lines: [
			textLine("……等一下，这台机器根本没有办法装出成品。", "me", "default"),
			textLine("恭喜你没有掉进陷阱！你刚才识破了一桩类型世界里最经典的迷思。", "church", "wow"),
			textLine(
				"手头有 A → B 和 B → C，看起来只差临门一脚就能产出 C；但正因为没有任何地方提供最初的原料 A，无论怎么接线都无法凭空变出一个 C。",
				"church",
				"default",
			),
			textLine(
				"在逻辑学与计算机科学中，这叫「柯里–霍华德同构（Curry-Howard Isomorphism）」：每一个类型就是一条数学命题，而能通过校验的程序就是这条命题的证明。",
				"church",
				"happy",
			),
			textLine(
				"写不出任何闭合程序的空类型（Uninhabited Type），本质上就是一条无法被证明的「假命题」。",
				"church",
				"default",
			),
			textLine(
				"「工匠的第一课是学会如何把机器接通；第二课，则是看清哪些图纸打从命题上就不成立，果断交回白卷。」",
				"master",
				"default",
			),
		],
	},
	dup_w: {
		id: "ch2_before_build_s",
		title: "最后一枚公理图纸",
		lines: [
			textLine(
				"刚才的「串联桥 B」教会了三层槽嵌套，而「二次机 W」教会了同一份信号怎样被复制使用两次。",
				"church",
				"happy",
			),
			textLine("也就是说，把“嵌套传递”和“信号复制”这两张图纸合起来，就能拼出绿色分叉器 S 了？", "me", "default"),
			textLine(
				"没错。老师傅常说：哪怕不背口诀，只要分清哪份信号要分身、哪份信号要套壳，所有组合子都能从头推出来。",
				"church",
				"default",
			),
			textLine("现在工作台上禁用了现成的绿色 S 零件，亲手从零敲出一台一样的分叉器吧。", "church", "happy"),
		],
	},
	run_omega_preview: {
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

	// ==================== 第三章：布尔分支科普与序对 ====================
	if_else: {
		id: "ch3_bool_branch_science",
		title: "开关即分支",
		lines: [
			textLine(
				"做完这个条件分流器，你大概已经发现其中的门道了——其实我们根本不需要专门造一个 if 关键字。",
				"church",
				"happy",
			),
			textLine(
				"在邱奇布尔编码里，条件开关本身就是函数：True = K 永远选中前一项，False = K' 永远选中后一项。",
				"church",
				"default",
			),
			textLine(
				"所以 cond t f 直接就是分支！开关一旦拿到手，喂给它两条候选出路，它自己就会完成分流。",
				"church",
				"happy",
			),
		],
	},
	tb_compose: {
		id: "ch3_boss_cleared",
		title: "结构封装完毕",
		lines: [
			textLine("真没想到，没有盒子也没有指针，光靠几层开槽就能把两件货物严严实实封存起来。", "guest", "happy"),
			textLine("其实连“同时拿到两件东西”也只是把开关参数反过来喂给接收方罢了。", "me", "default"),
			textLine(
				"Pair 解决的是「同时装下 A 与 B」的积类型。接下来第四间屋子要面对另一种常见需求——「要么装 A，要么装 B，甚至可能是空的」。",
				"church",
				"default",
			),
			textLine("等会见到 Maybe 和 Either，你会发现它们跟布尔开关竟然共享同一套血缘。", "church", "happy"),
		],
	},

	// ==================== 第四章：Maybe & Either ====================

	map_maybe: {
		id: "ch4_functor_intro",
		title: "不拆箱的艺术：函子",
		lines: [
			textLine(
				"干得漂亮！你看，刚才这台「可选映射 MJ」最巧妙的地方，在于它从头到尾没有破坏包裹的外壳。",
				"church",
				"happy",
			),
			textLine(
				"如果箱子里装着货物，它就把货物送进加工机 F 再原样封回箱子；如果是空箱，它就保持空箱不变。",
				"church",
				"default",
			),
			choicesLine([
				[
					"这种“保留外壳只改里面”有专有名词吗？",
					[
						textLine(
							"有！在函数式编程和范畴论里，凡是支持这种「保形映射」的结构，都叫做「函子（Functor）」。",
							"church",
							"happy",
						),
						textLine("等以后咱们造出清单（List）和二叉树（Tree）时，你还会见到一模一样的模式。", "church", "default"),
					],
				],
				[
					"如果加工机自己又吐出一个新箱子呢？",
					[
						textLine(
							"好问题！如果 F 本身也可能失败、返回一个 Maybe，那套用一次 map 就会叠成「箱子里套箱子」。",
							"church",
							"wow",
						),
						textLine(
							"怎样把双层套娃箱压扁成单层流水线？这正是后面会遇到的另一项核心抽象——「单子（Monad）」的拿手好戏。",
							"church",
							"default",
						),
					],
				],
			]),
		],
	},
	either_elim: {
		id: "ch4_sum_type_note",
		title: "积与和的对称",
		lines: [
			textLine(
				"看出来了吗？Pair 是把两件东西一起塞进箱子，而 Maybe 和 Either 则是在箱子里二选一存放。",
				"church",
				"default",
			),
			textLine(
				"在类型论里，Pair 叫「积类型（Product Type）」，而 Either 与 Maybe 叫做「和类型（Sum Type）」。这两者合起来，就能构造出任何复杂的数据结构。",
				"church",
				"happy",
			),
			textLine("换句话说，不管是“并且”还是“或者”，在 λ-演算里最终都化成了函数的分支选择。", "me", "default"),
			textLine("正是如此，所以工坊才不需要额外发明 struct 或 enum 关键字。", "church", "happy"),
		],
	},
	tb_either_right: {
		id: "ch4_boss_cleared",
		title: "安全通道落成",
		lines: [
			textLine("有了缺省箱和双路分发，工坊再也不用担心空包裹或异常件把机器卡死了。", "church", "happy"),
			textLine("而且从铭牌检定也能看出来，Left 与 Right 在消解签名上完全对称，只看谁被选中。", "me", "default"),
			textLine("「学会处理空箱与岔路，才算真正拥有构建大型系统的底气。」", "master", "default"),
			textLine("接下来第五间绘图室要迎接账房先生的硬核委托——从零搭建自然数与整套算术体系。", "church", "default"),
		],
	},

	// ==================== 第五章：Nat 算术 ====================
	is_zero: {
		id: "ch5_pred_hint",
		title: "倒退的难题",
		lines: [
			textLine(
				"加一、加法、乘法、乘方、判零全都顺利拿下。可客人刚送来一张棘手订单：想要一台能把计数器「倒退减一」的机器。",
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
	abs_diff: {
		id: "ch5_boss_cleared",
		title: "算术基石落成",
		lines: [
			textLine("加减乘方、大小比较、判等与绝对差全都在工作台上运转起来了，账房终于能喘口气了。", "guest", "happy"),
			textLine("把数字看成“把动作重复执行 n 次”之后，连 pred 和减法都能靠序对滑移硬生生磨出来。", "me", "default"),
			textLine("是的！接下来第六间绘图室会把单个数字扩展成成串的清单与分叉的二叉树结构。", "church", "happy"),
		],
	},

	// ==================== 第六章：List & Tree ====================
	list_append: {
		id: "ch6_monad_intro",
		title: "压扁套娃箱：单子",
		lines: [
			textLine(
				"刚才你先做出了列表映射（map），紧接着又造出了列表拼接（append）。把这两件零件摆在一起，其实藏着函数式编程里最出名的概念。",
				"church",
				"happy",
			),
			textLine(
				"设想一下：假如每一步加工会把一件货物裂变成一条小清单（a → List b），直接用 map 就会叠出「清单套清单」的双层嵌套。",
				"church",
				"default",
			),
			choicesLine([
				[
					"用 append 把内层清单全接起来拍平？",
					[
						textLine(
							"没错！先做 map，再用 append（或者对 Maybe 做一次解包压平）把两层外壳合并成一层，这组「映射 + 拍平（flatMap / bind）」的能力就是「单子（Monad）」。",
							"church",
							"happy",
						),
						textLine(
							"有了单子，不管是可能空箱的 Maybe 还是会产生分支的 List，都能像普通流水线一样一路串联到底。",
							"church",
							"default",
						),
					],
				],
				[
					"先记住这个思路，继续做后面的树结构",
					textLine("没问题，后面在二叉树上还会再一次验证函子的通用性。", "church", "happy"),
				],
			]),
		],
	},
	tree_sum: {
		id: "ch6_boss_cleared",
		title: "抽屉深处的草图",
		lines: [
			textLine("列表反转、过滤求和、二叉树折叠统计全都在铭牌与推演下严丝合缝地跑通了。", "church", "happy"),
			textLine("对了……我在清点第六间绘图室的抽屉时，摸到了老师傅封存的那张危险草图。", "church", "wow"),
			textLine(
				"上面没有画任何类型铭牌，只有一个首尾相连的自吞环。准备好进入最后的奇异点绘图室了吗？",
				"church",
				"default",
			),
		],
	},

	// ==================== 第七章：奇异点与全作终局 ====================
	self_apply: {
		id: "ch7_y_warning",
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
	fix_rec_final: {
		id: "ch7_finale",
		title: "工坊的终点与起点",
		lines: [
			textLine(
				"阶乘机顺利停机交付了！从第一单那枚简单的直通管 I 出发，你靠纯粹的开槽与喂入重建出了整个图灵完备的计算宇宙。",
				"church",
				"happy",
			),
			textLine(
				"「当你不再需要记住每一块零件的内部齿轮，只凭类型、开槽与不动点就能搭出任意机器时，这座工坊就已经真正属于你了。」",
				"master",
				"default",
			),
			textLine(
				"前面还有最后一道「终局试炼：斐波那契」——把算术、序对与不动点引擎全部派上用场，去给这趟旅程画上最漂亮的句号吧。",
				"church",
				"happy",
			),
			textLine("好，去把最后这台斐波那契数列机也交出去。", "me", "default"),
		],
	},
};
