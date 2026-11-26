import { render } from "solid-js/web";
import "./styles/index.css";
import { ACHIEVEMENTS, BGM_TRACKS, LEVELS } from "./content";
import { markIntroSeen, saveAchievement, saveUnlockedMusic, saveWorkshop } from "./storage";
import { Root } from "./ui/Root";
import { isDesktop, setupDesktopGuard } from "./utils/desktopGuard";

setupDesktopGuard();

if (typeof window !== "undefined" && !isDesktop()) {
	(window as Window & { HIMENO_SENA_SUKI_DESU?: () => void }).HIMENO_SENA_SUKI_DESU = (): void => {
		saveWorkshop(new Map(LEVELS.map((level) => [level.id, 3])));
		for (const item of ACHIEVEMENTS) saveAchievement(item.id);
		for (const track of BGM_TRACKS) saveUnlockedMusic(track.id);
		markIntroSeen();
		window.location.reload();
	};
}

((root) => root !== null && render(() => Root(), root))(document.getElementById("root"));
