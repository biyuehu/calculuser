import { type AchievementDefinition, getAchievementDefinition } from "../content";
import { loadAchievements, loadSettings, saveAchievement } from "../storage";

type AchievementListener = (achievement: AchievementDefinition) => void;

const listeners = new Set<AchievementListener>();

export function subscribeAchievements(listener: AchievementListener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function unlockAchievement(id: string): void {
	if (loadSettings().judgeMode) return;
	const definition = getAchievementDefinition(id);
	if (definition === null) return;
	if (!saveAchievement(id)) return;
	for (const listener of listeners) listener(definition);
}

export function getUnlockedAchievements(): Record<string, number> {
	return loadAchievements();
}
