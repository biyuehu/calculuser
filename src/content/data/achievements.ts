export interface AchievementDefinition {
	readonly id: string;
	readonly title: string;
	readonly description: string;
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
	{ id: "first_reduction", title: "初试啼声", description: "完成首次启动的 λ 归约开场仪式" },
	{ id: "title_toy", title: "桌面把玩", description: "在主界面拨动过 K 组合子小玩具" },
	{ id: "first_order", title: "初入工坊", description: "成功交付第一份工坊委托订单" },
	{ id: "three_star_craft", title: "精工细作", description: "以三星最佳零件数交付任意构建或类型订单" },
	{ id: "pure_lambda", title: "纯粹之槽", description: "不使用任何组合子零件，仅凭 λ 开槽与喂入完成构建订单" },
	{ id: "ski_purist", title: "SKI 原教旨", description: "仅使用基础零件 I、K、S 完成第 2 章及之后的构建订单" },
	{ id: "omega_paradox", title: "自吞悖论", description: "触发步数上限熔断，见证不终止的无限归约环" },
	{ id: "copy_explosion", title: "分身之术", description: "在单步归约中产生至少 4 份信号拷贝" },
	{ id: "static_typist", title: "静态契约", description: "不使用动态类型 ? 完成任意渐进类型构造订单" },
	{ id: "custom_smith", title: "自研匠人", description: "在自由沙盒中封装并保存第一个自定义组合子零件" },
	{ id: "uninhabited_proof", title: "不可居留", description: "识破无法构造的假命题类型，以空槽交付完成证明" },
];
