import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import giga from "@giga/plugin-vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [giga(), react()],
});
