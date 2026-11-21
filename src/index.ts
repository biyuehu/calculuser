import { render } from "solid-js/web";
import "./styles/index.css";
import { Root } from "./ui/Root";

((root) => root !== null && render(() => Root(), root))(document.getElementById("root"));
