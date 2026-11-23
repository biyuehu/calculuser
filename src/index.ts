import { render } from "solid-js/web";
import "./styles/index.css";
import { Root } from "./ui/Root";
import { setupDesktopGuard } from "./ui/desktopGuard";

setupDesktopGuard();

((root) => root !== null && render(() => Root(), root))(document.getElementById("root"));
