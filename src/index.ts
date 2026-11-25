import { render } from "solid-js/web";
import "./styles/index.css";
import { ACHIEVEMENTS, LEVELS } from "./content";
import { markIntroSeen, saveAchievement, saveWorkshop } from "./storage";
import { Root } from "./ui/Root";
import { isDesktop, setupDesktopGuard } from "./ui/desktopGuard";

setupDesktopGuard();

if (typeof window !== "undefined" && !isDesktop()) {
	(window as Window & { HIMENO_SENA_SUKI_DESU?: () => void }).HIMENO_SENA_SUKI_DESU = (): void => {
		saveWorkshop(new Map(LEVELS.map((level) => [level.id, 3])));
		for (const item of ACHIEVEMENTS) saveAchievement(item.id);
		markIntroSeen();
		window.location.reload();
	};
}

((root) => root !== null && render(() => Root(), root))(document.getElementById("root"));
