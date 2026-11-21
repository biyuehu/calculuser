import { PRINT_NAMES } from "../engine";

const VARIABLE_PALETTE: readonly string[] & { length: (typeof PRINT_NAMES)["length"] } = [
	"#0284c7",
	"#16a34a",
	"#eab308",
	"#8b5cf6",
	"#06b6d4",
	"#f97316",
	"#ec4899",
	"#10b981",
	"#d97706",
	"#3b82f6",
	"#a855f7",
	"#0d9488",
	"#ef4444",
	"#84cc16",
	"#e11d48",
	"#6366f1",
	"#14b8a6",
	"#f43f5e",
	"#854d0e",
	"#059669",
	"#c026d3",
	"#ea580c",
	"#2563eb",
	"#4ade80",
	"#db2777",
	"#0891b2",
];

export function getVariableColor<T extends (typeof PRINT_NAMES)[number]>(name: T): string {
	const index = PRINT_NAMES.indexOf(name);
	return index >= 0 && index < VARIABLE_PALETTE.length ? VARIABLE_PALETTE[index] : "#94a3b8";
}
