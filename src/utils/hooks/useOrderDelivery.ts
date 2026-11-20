import { type Accessor, createMemo, createSignal } from "solid-js";
import { playFailSound, playPassSound, playPopExplosionSound } from "../../audio/synth";
import { BUILTIN_COUNT, COMBINATORS, LEVELS, type OrderLevel, getToolDefinition, getToolSource } from "../../content";
import { type DraftTerm, draftToTerm } from "../../engine/draft";
import { type Registry, registerGadget } from "../../engine/gadget";
import { judgeOrder } from "../../engine/judge";
import { saveLevelDraft } from "../../engine/storage";
import type { GadgetId } from "../../engine/term";
import type { RejectedInfo } from "../../ui/workbench/panels/OrderSlip";

interface UseOrderDeliveryOptions {
	readonly order: Accessor<OrderLevel>;
	readonly registry: Registry;
	readonly judgeMode: Accessor<boolean>;
	readonly clearedStars: Accessor<ReadonlyMap<string, number>>;
	readonly onRecordStars: (orderId: string, stars: number) => void;
}

interface OrderDelivery {
	readonly rejected: Accessor<RejectedInfo | null>;
	readonly deliveredStars: Accessor<number | null>;
	readonly shelfUnlockedIds: Accessor<readonly GadgetId[]>;
	readonly shelfLockedCount: Accessor<number>;
	readonly deliverBuildOrder: (draft: DraftTerm, partCount: number) => void;
	readonly deliverRunSuccess: () => void;
	readonly deliverRunExceeded: () => void;
	readonly resetDelivery: () => void;
	readonly setDeliveredStars: (stars: number | null) => void;
}

export function useOrderDelivery(options: UseOrderDeliveryOptions): OrderDelivery {
	const [rejected, setRejected] = createSignal<RejectedInfo | null>(null);
	const [deliveredStars, setDeliveredStars] = createSignal<number | null>(null);

	const shelfUnlockedIds = createMemo((): readonly GadgetId[] => {
		const order = options.order();
		if (order.mode !== "build") return [];
		const forbiddenSet = new Set(order.forbidden);
		const judgeAll = options.judgeMode();
		const currentOrderIndex = LEVELS.findIndex((item) => item.id === order.id);
		const rawCandidates =
			order.toolbox === "all"
				? [
						...COMBINATORS.slice(0, BUILTIN_COUNT).map((tool) => tool.id),
						...COMBINATORS.slice(BUILTIN_COUNT)
							.filter((tool) => {
								if (tool.id === order.id) return false;
								if (judgeAll) return true;
								const sourceOrderId = getToolSource(tool.id);
								if (sourceOrderId === null) return false;
								const sourceIndex = LEVELS.findIndex((item) => item.id === sourceOrderId);
								return (
									sourceIndex >= 0 && (sourceIndex < currentOrderIndex || options.clearedStars().has(sourceOrderId))
								);
							})
							.map((tool) => tool.id),
					]
				: order.toolbox;
		const seen = new Set<string>();
		const unique: GadgetId[] = [];
		for (const id of rawCandidates) {
			if (forbiddenSet.has(id) || seen.has(id) || getToolDefinition(id) === null) continue;
			seen.add(id);
			unique.push(id);
		}
		return unique;
	});

	const shelfLockedCount = createMemo(() => {
		const order = options.order();
		return order.mode === "build" && order.toolbox === "all"
			? Math.max(0, COMBINATORS.length - BUILTIN_COUNT - options.clearedStars().size)
			: 0;
	});

	const deliverBuildOrder = (draft: DraftTerm, partCount: number): void => {
		const order = options.order();
		if (order.mode !== "build") return;
		const candidate = draftToTerm(draft, []);
		const results = judgeOrder(candidate, order.tests, options.registry, 300);
		const firstFailIndex = results.findIndex((item) => !item.passed);
		if (firstFailIndex >= 0) {
			playFailSound();
			setRejected({ testCase: order.tests[firstFailIndex], result: results[firstFailIndex] });
			return;
		}
		playPassSound();
		setRejected(null);
		const stars = partCount <= order.parSize ? 3 : partCount <= order.parSize + 2 ? 2 : 1;
		setDeliveredStars(stars);
		if (order.unlocksToolId !== void 0 && !options.registry.has(order.unlocksToolId)) {
			const canonicalTool = getToolDefinition(order.unlocksToolId);
			if (canonicalTool !== null) registerGadget(options.registry, canonicalTool.id, candidate, "level");
		}
		options.onRecordStars(order.id, stars);
		saveLevelDraft(order.id, draft);
	};

	const deliverRunSuccess = (): void => {
		playPassSound();
		setDeliveredStars(3);
		options.onRecordStars(options.order().id, 3);
	};

	const deliverRunExceeded = (): void => {
		playPopExplosionSound();
	};

	const resetDelivery = (): void => {
		setRejected(null);
		setDeliveredStars(null);
	};

	return {
		rejected,
		deliveredStars,
		shelfUnlockedIds,
		shelfLockedCount,
		deliverBuildOrder,
		deliverRunSuccess,
		deliverRunExceeded,
		resetDelivery,
		setDeliveredStars,
	};
}
