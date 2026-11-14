const VARIABLE_COLORS: Record<string, string> = {
	x: "var(--var-x)",
	y: "var(--var-y)",
	z: "var(--var-z)",
	w: "var(--var-w)",
};

const VARIABLE_PALETTE: readonly string[] = [
	"var(--var-x)",
	"var(--var-y)",
	"var(--var-z)",
	"var(--var-w)",
	"#06b6d4",
	"#8b5cf6",
	"#ec4899",
	"#10b981",
	"#f59e0b",
	"#3b82f6",
	"#6366f1",
	"#14b8a6",
	"#f97316",
	"#84cc16",
	"#e11d48",
	"#0284c7",
];

export function getVariableColor(name: string): string {
	return VARIABLE_COLORS[name] ?? VARIABLE_PALETTE[name.charCodeAt(0) % VARIABLE_PALETTE.length];
}

export function getColorAtDepth(depth: number): string {
	return depth >= 0 && depth < VARIABLE_PALETTE.length ? VARIABLE_PALETTE[depth] : "#94a3b8";
}
