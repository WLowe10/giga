import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import giga from "vite-plugin-giga";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [giga(), react()],
});
