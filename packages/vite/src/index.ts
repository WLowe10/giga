import * as babel from "@babel/core";
import gigaPlugin from "giga";
import { createFilter, type Plugin } from "vite";

const defaultIncludeRegex = /\.[tj]sx?$/;
const tsRegex = /\.tsx?$/;

export default function vitePlugin(): Plugin {
	const filter = createFilter(defaultIncludeRegex /**add opts to exclude */);

	return {
		name: "giga",
		enforce: "pre",
		async transform(src, id) {
			if (id.includes("/node_modules/")) {
				return;
			}

			const [filePath] = id.split("?");

			const parserPlugins: string[] = ["jsx"];

			if (tsRegex.test(filePath)) {
				parserPlugins.push("typescript");
			}

			const result = await babel.transformAsync(src, {
				plugins: [gigaPlugin],
				parserOpts: {
					// @ts-ignore
					plugins: parserPlugins,
				},
			});

			if (result) {
				return {
					code: result?.code || "",
					map: result?.map,
				};
			}
		},
	};
}
