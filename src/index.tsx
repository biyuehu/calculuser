import { render } from "solid-js/web";
import "./theme/styles.css";
import { App } from "./ui/App";

const root = document.getElementById("root");
if (root !== null) render(() => <App />, root);
