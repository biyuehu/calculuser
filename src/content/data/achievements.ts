export interface AchievementDefinition {
	readonly id: string;
	readonly title: string;
	readonly description: string;
	readonly hidden?: boolean;
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
	{ id: "first_order", title: "初入工坊", description: "成功交付第一份工坊委托订单" },
	{
		id: "one_star_identity",
		title: "绕远路大师",
		description: "在 1.1「直通管」中仅以 1 星评价完成交付",
		hidden: true,
	},
	{
		id: "pure_lambda",
		title: "纯粹之槽",
		description: "不使用任何组合子零件，仅凭 λ 开槽与喂入完成第 2 章及之后的构建订单",
	},
	{ id: "ski_purist", title: "SKI 原教旨", description: "仅使用基础零件 I、K、S 完成第 2 章及之后的构建订单" },
	{
		id: "sk_purist",
		title: "SK 完备主义",
		description: "仅使用 S 与 K（不用 I 与 λ 开槽）完成第 2 章及之后的构建订单",
	},
	{ id: "omega_paradox", title: "自吞悖论", description: "触发步数上限熔断，见证不终止的无限归约环" },
	{ id: "copy_explosion", title: "分身之术", description: "在单步归约中产生至少 4 份信号拷贝" },
	{ id: "mega_explosion", title: "指数大爆炸", description: "在单步归约中产生至少 16 份信号拷贝" },
	{ id: "marathon_tape", title: "永动纸带", description: "单次试机纸带连续推演超过 200 步仍未停机", hidden: true },
	{ id: "code_golf", title: "极致压缩", description: "在构建或类型订单中，以严格少于标准零件数的方案完成交付" },
	{
		id: "silent_craft",
		title: "默片工匠",
		description: "在主音效与背景音乐均为静音的状态下完成一次关卡交付",
		hidden: true,
	},
	{ id: "undo_maniac", title: "时光倒流", description: "在单次关卡会话中累计撤销或纸带步退达到 10 次", hidden: true },
	{ id: "title_linger", title: "门前驻足", description: "在主标题界面连续停留超过 2 分钟", hidden: true },
	{ id: "first_typebuild", title: "初识类型", description: "首次完成类型构造订单，让装置结构契合类型铭牌" },
	{ id: "custom_smith", title: "自研匠人", description: "在自由沙盒中封装并保存第一个自定义组合子零件" },
	{
		id: "nested_smith",
		title: "套娃匠人",
		description: "在自由沙盒封装自定义组合子时，内部嵌套引用了另一个自定义组合子",
	},
	{
		id: "uninhabited_proof",
		title: "不可居留",
		description: "识破无法构造的假命题类型，以空槽交付完成证明",
		hidden: true,
	},
	{
		id: "stubborn_prover",
		title: "偏要试试",
		description: "在「断流契约」中尝试提交非空结构触发校验失败后，再以空槽交付",
		hidden: true,
	},
	{ id: "xray_inspector", title: "透视质检", description: "在开启 X-Ray 透视视角的状态下完成任意工坊委托交付" },
	{ id: "fixpoint_tamer", title: "驯服无限", description: "使用 Y、Z 或 Theta 不动点组合子完成一次安全停机的构建交付" },
	{ id: "ch2_self_s", title: "自铸分叉", description: "不使用现成 S 零件，亲手从零开槽造出分叉器 S" },
	{ id: "ch3_product_pair", title: "积类型封装", description: "造出序对打包盒 pair，在纯函数世界封存第一对数据" },
	{ id: "ch4_sum_types", title: "和类型收官", description: "完成 Maybe 与 Either 的编码、消解与和类型契约" },
	{ id: "ch5_church_pred", title: "倒转齿轮", description: "借助序对滑移构造前驱器 pred，攻克邱奇数减法核心" },
	{ id: "ch6_tree_fold", title: "枝叶成林", description: "完成列表与二叉树折叠编码，打通树形递归结构" },
	{ id: "ch7_fixpoint_y", title: "不动点引擎", description: "亲手构造 Y 组合子，为纯函数点亮自指递归能力" },
	{ id: "max_lam_depth", title: "深渊开槽", description: "在工作台或沙盒中叠满 26 层 λ 插槽并触及最大深度上限" },
	{ id: "turing_complete", title: "图灵完备", description: "通关第 7 章终局试炼「斐波那契」，重建完整递归计算宇宙" },
	{ id: "all_orders_cleared", title: "全卷宗制霸", description: "通关工坊全部正式委托订单" },
	{ id: "full_compendium", title: "零件全图鉴", description: "解锁工坊图鉴中的全部内置组合子零件" },
	{ id: "secret_peek", title: "看板背后", description: "在主标题界面发现并戳中躲在角落的小丘", hidden: true },
	{
		id: "ascension",
		title: "我要登神",
		description: "在网页端打开开发者工具，窥探工坊底层的演算源码",
		hidden: true,
	},
];
