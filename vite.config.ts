/// <reference types="vitest" />
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
	plugins: [solidPlugin()],
	test: {
		environment: "node",
	},
	server: {
		port: 3000,
	},
	build: {
		target: "esnext",
	},
});
