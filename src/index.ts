import { render } from "solid-js/web";
import "./styles/index.css";
import { version } from "../package.json";
import { ACHIEVEMENTS, BGM_TRACKS, LEVELS, unlockAchievement } from "./content";
import { markIntroSeen, saveAchievement, saveUnlockedMusic, saveWorkshop } from "./storage";
import { Root } from "./ui/Root";
import { isDesktop, setupDesktopGuard } from "./utils/desktopGuard";

setupDesktopGuard();

if (typeof window !== "undefined") {
	console.log(
		`%c λ Calculuser %c v${version} %c`,
		"background:#2e5e53;color:#f3faf8;font-weight:700;padding:3px 8px;border-radius:4px 0 0 4px;",
		"background:#73e2c8;color:#1e4239;font-weight:700;padding:3px 8px;border-radius:0 4px 4px 0;",
		"",
	);
	console.log("%cMade ❤ By Arimura Romi | LICENSE: GPL-3.0", "color:#d4adb6;");
	console.log("%cProject: https://github.com/biyuehu/calculuser", "color:#a8ccc3;");
	console.log("%cλ is wathcing you👁️", "color:#73e2c8;font-weight:600;font-size:1rem;");
}

if (typeof window !== "undefined" && !isDesktop()) {
	window.addEventListener(
		"keydown",
		(event) => {
			if (
				event.key === "F12" ||
				((event.ctrlKey || event.metaKey) &&
					event.shiftKey &&
					(event.key.toLowerCase() === "i" || event.key.toLowerCase() === "j"))
			)
				unlockAchievement("ascension");
		},
		{ capture: true },
	);
	(window as Window & { HIMENO_SENA_SUKI_DESU?: () => void }).HIMENO_SENA_SUKI_DESU = (): void => {
		saveWorkshop(new Map(LEVELS.map((level) => [level.id, 3])));
		for (const item of ACHIEVEMENTS) saveAchievement(item.id);
		for (const track of BGM_TRACKS) saveUnlockedMusic(track.id);
		markIntroSeen();
		window.location.reload();
	};
}

((root) => root !== null && render(() => Root(), root))(document.getElementById("root"));
