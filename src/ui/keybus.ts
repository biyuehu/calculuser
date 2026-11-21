import { onCleanup, onMount } from "solid-js";

export type KeyScopeLevel = "modal" | "view" | "global";

export interface KeyBinding {
	readonly key?: string | readonly string[];
	readonly predicate?: (event: KeyboardEvent) => boolean;
	// biome-ignore lint/suspicious/noConfusingVoidType: handle can return boolean to control propagation or void
	readonly handle: (event: KeyboardEvent) => boolean | void;
}

export interface KeyScope {
	readonly id: string;
	readonly level: KeyScopeLevel;
	readonly active?: () => boolean;
	readonly bindings: readonly KeyBinding[];
}

const LEVEL_WEIGHT: Record<KeyScopeLevel, number> = {
	modal: 200,
	view: 100,
	global: 0,
};

let registeredScopes: readonly KeyScope[] = [];
let isListenerAttached = false;

function matchBinding(event: Pick<KeyboardEvent, "key">, binding: KeyBinding): boolean {
	if (binding.predicate !== void 0) return binding.predicate(event as KeyboardEvent);
	if (binding.key === void 0) return false;
	const matchKey = (target: string): boolean =>
		target === " " ? event.key === " " : target.toLowerCase() === event.key.toLowerCase();
	return typeof binding.key === "string" ? matchKey(binding.key) : binding.key.some(matchKey);
}

function isInputTarget(target: unknown): boolean {
	return (
		typeof HTMLElement !== "undefined" &&
		target instanceof HTMLElement &&
		(target.tagName === "INPUT" || target.tagName === "TEXTAREA")
	);
}

export function dispatchKeyEvent(event: Pick<KeyboardEvent, "key" | "target" | "preventDefault">): boolean {
	if (isInputTarget(event.target)) return false;
	const activeScopes = registeredScopes
		.filter((scope) => scope.active === void 0 || scope.active())
		.sort((a, b) => LEVEL_WEIGHT[b.level] - LEVEL_WEIGHT[a.level]);
	const hasActiveModal = activeScopes.some((s) => s.level === "modal");
	for (const scope of activeScopes) {
		if (hasActiveModal && scope.level === "view") break;
		for (const binding of scope.bindings)
			if (matchBinding(event, binding) && binding.handle(event as KeyboardEvent) !== false) {
				event.preventDefault();
				return true;
			}
	}
	return false;
}

function ensureListener(): void {
	if (isListenerAttached || typeof window === "undefined") return;
	window.addEventListener("keydown", dispatchKeyEvent);
	isListenerAttached = true;
}

export function registerKeyScope(scope: KeyScope): () => void {
	ensureListener();
	registeredScopes = [scope, ...registeredScopes];
	return () => {
		registeredScopes = registeredScopes.filter((s) => s !== scope);
	};
}

export function useKeyScope(scope: KeyScope): void {
	onMount(() => onCleanup(registerKeyScope(scope)));
}
