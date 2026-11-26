export interface AchievementDefinition {
	readonly id: string;
	readonly title: string;
	readonly description: string;
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
	{ id: "first_reduction", title: "初试啼声", description: "完成首次启动的 λ 归约开场仪式" },
	{ id: "first_order", title: "初入工坊", description: "成功交付第一份工坊委托订单" },
	{ id: "three_star_craft", title: "精工细作", description: "以三星最佳零件数交付任意构建或类型订单" },
	{ id: "pure_lambda", title: "纯粹之槽", description: "不使用任何组合子零件，仅凭 λ 开槽与喂入完成构建订单" },
	{ id: "ski_purist", title: "SKI 原教旨", description: "仅使用基础零件 I、K、S 完成第 2 章及之后的构建订单" },
	{
		id: "sk_purist",
		title: "SK 完备主义",
		description: "仅使用 S 与 K（不用 I 与 λ 开槽）完成第 2 章及之后的构建订单",
	},
	{ id: "omega_paradox", title: "自吞悖论", description: "触发步数上限熔断，见证不终止的无限归约环" },
	{ id: "copy_explosion", title: "分身之术", description: "在单步归约中产生至少 4 份信号拷贝" },
	{ id: "static_typist", title: "静态契约", description: "不使用动态类型 ? 完成任意渐进类型构造订单" },
	{ id: "custom_smith", title: "自研匠人", description: "在自由沙盒中封装并保存第一个自定义组合子零件" },
	{
		id: "nested_smith",
		title: "套娃匠人",
		description: "在自由沙盒封装自定义组合子时，内部嵌套引用了另一个自定义组合子",
	},
	{ id: "uninhabited_proof", title: "不可居留", description: "识破无法构造的假命题类型，以空槽交付完成证明" },
	{
		id: "stubborn_prover",
		title: "偏要试试",
		description: "在「断流契约」中尝试提交非空结构触发校验失败后，再以空槽交付",
	},
	{ id: "xray_inspector", title: "透视质检", description: "在开启 X-Ray 透视视角的状态下完成任意工坊委托交付" },
	{ id: "fixpoint_tamer", title: "驯服无限", description: "使用 Y、Z 或 Theta 不动点组合子完成一次安全停机的构建交付" },
	{ id: "turing_complete", title: "图灵完备", description: "通关第 7 章终局试炼「斐波那契」，重建完整递归计算宇宙" },
	{ id: "all_orders_cleared", title: "全卷宗制霸", description: "通关工坊全部正式委托订单" },
	{ id: "full_compendium", title: "零件全图鉴", description: "解锁工坊图鉴中的全部内置组合子零件" },
];
