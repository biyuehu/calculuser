import { type JSX, Show } from "solid-js";
import { type AchievementDefinition, deriveAchievementVisuals } from "../../content";

interface AchievementToastProps {
	readonly achievement: AchievementDefinition | null;
	readonly exiting: boolean;
}

export function AchievementToast(props: AchievementToastProps): JSX.Element {
	return (
		<Show when={props.achievement}>
			{(item) => {
				const visual = deriveAchievementVisuals(item().id);
				return (
					<output class={`achievement-toast ${props.exiting ? "toast-exit" : ""}`} aria-live="polite">
						<span class={`gadget-glyph lg ${visual.shape}`} style={{ background: visual.accent }}>
							{visual.symbol}
						</span>
						<div style={{ display: "flex", "flex-direction": "column", gap: "1px" }}>
							<span style={{ "font-size": "10.5px", "font-weight": 700, color: "var(--accent-clay-strong)" }}>
								成就解锁
							</span>
							<span style={{ "font-size": "14px", "font-weight": 800, color: "var(--text-primary)" }}>
								{item().title}
							</span>
							<span style={{ "font-size": "11.5px", color: "var(--text-secondary)" }}>{item().description}</span>
						</div>
					</output>
				);
			}}
		</Show>
	);
}
