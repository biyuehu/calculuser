import { render } from "solid-js/web";
import "./styles/index.css";
import { App } from "./ui/App";

const root = document.getElementById("root");
if (root !== null) render(() => <App />, root);
