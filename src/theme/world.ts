import type { GadgetId } from "../engine/term";

export type GadgetShape = "circle" | "square" | "diamond" | "hex";

export interface ToolDefinition {
	readonly id: string;
	readonly orderId: string | null;
	readonly symbol: string;
	readonly name: string;
	readonly shape: GadgetShape;
	readonly accent: string;
	readonly arity: number;
	readonly isBuiltin: boolean;
	readonly schematic: string;
	readonly note: string;
	readonly defText: string | null;
}

export interface GadgetMeta {
	readonly id: GadgetId;
	readonly symbol: string;
	readonly name: string;
	readonly shape: GadgetShape;
	readonly accent: string;
	readonly note: string;
}

export interface MonsterMeta {
	readonly id: string;
	readonly symbol: string;
	readonly name: string;
	readonly termText: string;
	readonly note: string;
	readonly dangerLevel: string;
}

export const BUILTIN_TOOLS: readonly ToolDefinition[] = [
	{
		id: "I",
		orderId: null,
		symbol: "I",
		name: "直通管",
		shape: "circle",
		accent: "#38bdf8",
		arity: 1,
		isBuiltin: true,
		schematic: "I x → x",
		note: "进什么吐出什么，最基础的恒等信道。",
		defText: "\\x. x",
	},
	{
		id: "K",
		orderId: null,
		symbol: "K",
		name: "截留闸",
		shape: "square",
		accent: "#f59e0b",
		arity: 2,
		isBuiltin: true,
		schematic: "K x y → x",
		note: "收下两件东西，只留第一件，丢掉第二件。",
		defText: "\\x.\\y. x",
	},
	{
		id: "S",
		orderId: null,
		symbol: "S",
		name: "分叉器",
		shape: "diamond",
		accent: "#10b981",
		arity: 3,
		isBuiltin: true,
		schematic: "S x y z → x z (y z)",
		note: "把第三件东西同时分两路送给前两件再汇合。",
		defText: "\\x.\\y.\\z. x z (y z)",
	},
];

export const ORDER_TOOLS: readonly ToolDefinition[] = [
	{
		id: "K'",
		orderId: "1.2-drop-first-ki",
		symbol: "K'",
		name: "弃前闸",
		shape: "square",
		accent: "#f59e0b",
		arity: 2,
		isBuiltin: false,
		schematic: "K' x y → y",
		note: "丢弃第一个信号，传出第二个。",
		defText: "\\x.\\y. y",
	},
	{
		id: "I*",
		orderId: "1.3-blueprint-identity",
		symbol: "I*",
		name: "自制直通管",
		shape: "circle",
		accent: "#0284c7",
		arity: 1,
		isBuiltin: false,
		schematic: "I* x → x",
		note: "以 S 与 K 构筑的传话通道。",
		defText: "\\x. x",
	},
	{
		id: "K*",
		orderId: "1.4-const-k",
		symbol: "K*",
		name: "自制截留闸",
		shape: "square",
		accent: "#d97706",
		arity: 2,
		isBuiltin: false,
		schematic: "K* x y → x",
		note: "自主开槽封装的截留组合子。",
		defText: "\\x.\\y. x",
	},
	{
		id: "T",
		orderId: "1.5-reverse-apply",
		symbol: "T",
		name: "反喂器",
		shape: "hex",
		accent: "#8b5cf6",
		arity: 2,
		isBuiltin: false,
		schematic: "T x y → y x",
		note: "颠倒喂入次序：将 f x 变为 x f。",
		defText: "\\x.\\y. y x",
	},
	{
		id: "omega",
		orderId: "1.6-self-apply",
		symbol: "ω",
		name: "自吞环",
		shape: "hex",
		accent: "#ef4444",
		arity: 1,
		isBuiltin: false,
		schematic: "ω x → x x",
		note: "自身施加于自身的单步复制项。",
		defText: "\\x. x x",
	},
	{
		id: "omega*",
		orderId: "1.7-split-s",
		symbol: "ω*",
		name: "组合自吞环",
		shape: "hex",
		accent: "#dc2626",
		arity: 1,
		isBuiltin: false,
		schematic: "ω* x → x x",
		note: "S 与 I 拼接而成的纯粹自吞项。",
		defText: "\\x. x x",
	},
	{
		id: "I'",
		orderId: "1.8-skk-identity",
		symbol: "I'",
		name: "组合传话筒",
		shape: "circle",
		accent: "#0ea5e9",
		arity: 1,
		isBuiltin: false,
		schematic: "SKK x → x",
		note: "组合规约验算的传话筒。",
		defText: "\\x. x",
	},
	{
		id: "B",
		orderId: "2.4-compose-b",
		symbol: "B",
		name: "串联桥",
		shape: "diamond",
		accent: "#2563eb",
		arity: 3,
		isBuiltin: false,
		schematic: "B f g x → f (g x)",
		note: "组合子 B：将两个处理环节前后串联成流水线。",
		defText: "\\f.\\g.\\x. f (g x)",
	},
	{
		id: "C",
		orderId: "2.5-flip-c",
		symbol: "C",
		name: "换序器",
		shape: "diamond",
		accent: "#4f46e5",
		arity: 3,
		isBuiltin: false,
		schematic: "C f x y → f y x",
		note: "组合子 C：将两个参数的喂入位置左右对调。",
		defText: "\\f.\\x.\\y. f y x",
	},
	{
		id: "W",
		orderId: "2.6-church-two",
		symbol: "W",
		name: "二次机",
		shape: "diamond",
		accent: "#db2777",
		arity: 2,
		isBuiltin: false,
		schematic: "W f x → f x x",
		note: "组合子 W：给下游输入重复复制一次同一个项。",
		defText: "\\f.\\x. f x x",
	},
	{
		id: "succ",
		orderId: "2.7-succ",
		symbol: "+1",
		name: "后继器",
		shape: "circle",
		accent: "#059669",
		arity: 3,
		isBuiltin: false,
		schematic: "succ n f x → f (n f x)",
		note: "邱奇数后继：为既有循环迭代次数多累加一次应用。",
		defText: "\\n.\\f.\\x. f (n f x)",
	},
	{
		id: "not",
		orderId: "3.1-not",
		symbol: "¬",
		name: "反相器",
		shape: "square",
		accent: "#dc2626",
		arity: 1,
		isBuiltin: false,
		schematic: "not b → b F T",
		note: "布尔逻辑非：颠倒布尔分支选择。",
		defText: "\\b. b (\\x.\\y. y) (\\x.\\y. x)",
	},
	{
		id: "and",
		orderId: "3.2-and",
		symbol: "∧",
		name: "与门",
		shape: "square",
		accent: "#d97706",
		arity: 2,
		isBuiltin: false,
		schematic: "and p q → p q p",
		note: "布尔逻辑与：两路皆真方为真。",
		defText: "\\p.\\q. p q p",
	},
	{
		id: "or",
		orderId: "3.3-or",
		symbol: "∨",
		name: "或门",
		shape: "square",
		accent: "#ea580c",
		arity: 2,
		isBuiltin: false,
		schematic: "or p q → p p q",
		note: "布尔逻辑或：任一路为真即为真。",
		defText: "\\p.\\q. p p q",
	},
	{
		id: "pair",
		orderId: "3.4-pair",
		symbol: "P",
		name: "打包盒",
		shape: "hex",
		accent: "#0891b2",
		arity: 3,
		isBuiltin: false,
		schematic: "pair a b f → f a b",
		note: "构造复合数据对偶箱（Pair）。",
		defText: "\\x.\\y.\\f. f x y",
	},
	{
		id: "fst",
		orderId: "3.5-fst",
		symbol: "π₁",
		name: "拆第一件",
		shape: "square",
		accent: "#0284c7",
		arity: 1,
		isBuiltin: false,
		schematic: "fst p → p K",
		note: "解包打开复合数据箱，取出左侧部件。",
		defText: "\\p. p (\\x.\\y. x)",
	},
	{
		id: "snd",
		orderId: "3.6-snd",
		symbol: "π₂",
		name: "拆第二件",
		shape: "square",
		accent: "#0d9488",
		arity: 1,
		isBuiltin: false,
		schematic: "snd p → p K'",
		note: "解包打开复合数据箱，取出右侧部件。",
		defText: "\\p. p (\\x.\\y. y)",
	},
	{
		id: "fromMaybe",
		orderId: "3.7-from-maybe",
		symbol: "P*",
		name: "缺省拆包",
		shape: "hex",
		accent: "#b45309",
		arity: 2,
		isBuiltin: false,
		schematic: "fromMaybe d m → m d I",
		note: "运行检验下的完备数据解包器。",
		defText: "\\d.\\m. m d (\\x. x)",
	},
	{
		id: "add",
		orderId: "4.1-add",
		symbol: "+",
		name: "加法器",
		shape: "diamond",
		accent: "#2563eb",
		arity: 4,
		isBuiltin: false,
		schematic: "add m n f x → m f (n f x)",
		note: "邱奇加法：将两段循环迭代次数首尾拼接。",
		defText: "\\m.\\n.\\f.\\x. m f (n f x)",
	},
	{
		id: "mul",
		orderId: "4.2-mul",
		symbol: "×",
		name: "乘法器",
		shape: "diamond",
		accent: "#7c3aed",
		arity: 3,
		isBuiltin: false,
		schematic: "mul m n f → m (n f)",
		note: "邱奇乘法：外层每步执行一次内层整套迭代。",
		defText: "\\m.\\n.\\f. m (n f)",
	},
	{
		id: "exp",
		orderId: "4.3-exp",
		symbol: "^",
		name: "乘方器",
		shape: "hex",
		accent: "#db2777",
		arity: 2,
		isBuiltin: false,
		schematic: "exp m n → n m",
		note: "邱奇乘方：指数阶的超高层函数套叠。",
		defText: "\\m.\\n. n m",
	},
	{
		id: "isZero",
		orderId: "4.4-is-zero",
		symbol: "0?",
		name: "判零器",
		shape: "circle",
		accent: "#0891b2",
		arity: 1,
		isBuiltin: false,
		schematic: "isZero n → n (λx. F) T",
		note: "检测邱奇数是否为零，产出布尔判断。",
		defText: "\\n. n (\\x.\\a.\\b. b) (\\a.\\b. a)",
	},
	{
		id: "length",
		orderId: "4.5-list-length",
		symbol: "#",
		name: "列表计数",
		shape: "hex",
		accent: "#c026d3",
		arity: 1,
		isBuiltin: false,
		schematic: "length l → l (λh.λr. succ r) 0",
		note: "结合折叠算子计算任意链表的总长度。",
		defText: "\\l. l (\\h.\\r.\\f.\\x. f (r f x)) (\\f.\\x. x)",
	},
];

export const MONSTER_LIST: readonly MonsterMeta[] = [
	{
		id: "omega-infinite",
		symbol: "Ω",
		name: "无限吞噬环（Omega）",
		termText: "(λx. x x) (λx. x x)",
		note: "自身复制自身，一步β-归约后完全还原自身，永远无法停机发散。",
		dangerLevel: "极度危险 · 永动黑洞",
	},
	{
		id: "y-combinator",
		symbol: "Y",
		name: "不动点组合子（Curry Fixpoint）",
		termText: "λf. (λx. f (x x)) (λx. f (x x))",
		note: "邱奇与柯里发现的递归之根。通过自我复制实现无类型演算中的函数递归。",
		dangerLevel: "核心机密 · 递归源头",
	},
	{
		id: "turing-fixpoint",
		symbol: "Θ",
		name: "图灵不动点（Turing Fixpoint）",
		termText: "(λx.λy. y (x x y)) (λx.λy. y (x x y))",
		note: "阿兰·图灵设计的不动点项，满足经典左式展开与标准停机特性。",
		dangerLevel: "高度受控 · 计算通用",
	},
];

const ALL_TOOLS: readonly ToolDefinition[] = [...BUILTIN_TOOLS, ...ORDER_TOOLS];

const TOOL_MAP = new Map<string, ToolDefinition>();
for (const tool of ALL_TOOLS) {
	TOOL_MAP.set(tool.id, tool);
	if (tool.orderId !== null) TOOL_MAP.set(tool.orderId, tool);
}

export function getToolDefinition(idOrOrderId: string): ToolDefinition | null {
	const direct = TOOL_MAP.get(idOrOrderId);
	return direct !== undefined ? direct : null;
}

const PLAYER_SHAPES: readonly GadgetShape[] = ["hex", "circle", "square", "diamond"];
const PLAYER_ACCENTS: readonly string[] = ["#818cf8", "#f472b6", "#38bdf8", "#a78bfa"];

export function getGadgetMeta(id: GadgetId, fallbackName: string, fingerprint: string): GadgetMeta {
	const tool = getToolDefinition(id);
	if (tool !== null)
		return {
			id: tool.id,
			symbol: tool.symbol,
			name: fallbackName.length > 0 && fallbackName !== id ? fallbackName : tool.name,
			shape: tool.shape,
			accent: tool.accent,
			note: tool.note,
		};
	let hash = 0;
	for (let index = 0; index < fingerprint.length; index += 1) hash = (hash * 31 + fingerprint.charCodeAt(index)) % 997;
	return {
		id,
		symbol: fallbackName.length <= 2 && fallbackName.length > 0 ? fallbackName : "★",
		name: fallbackName,
		shape: PLAYER_SHAPES[hash % PLAYER_SHAPES.length],
		accent: PLAYER_ACCENTS[hash % PLAYER_ACCENTS.length],
		note: "工坊自制封装装置。",
	};
}

export function resolveGadgetMeta(
	id: GadgetId,
	registry: { readonly get: (id: GadgetId) => { readonly fingerprint: string } | undefined },
	customNames: ReadonlyMap<string, string>,
): GadgetMeta {
	const entry = registry.get(id);
	const custom = customNames.get(id);
	return getGadgetMeta(id, custom !== undefined ? custom : id, entry !== undefined ? entry.fingerprint : id);
}
