import * as babel from "@babel/core";
import gigaPlugin from "giga";
import { createFilter, type Plugin } from "vite";

const defaultIncludeRegex = /\.[tj]sx?$/;
const tsRegex = /\.tsx?$/;

//https://github.com/bluwy/whyframe/blob/master/packages/jsx/src/index.js#L27-L37
function repushPlugin(plugins: Plugin[], plugin: Plugin, pluginNames: string[]): void {
	const namesSet = new Set(pluginNames);

	let baseIndex = -1;
	let targetIndex = -1;

	for (let i = 0, len = plugins.length; i < len; i += 1) {
		const current = plugins[i];

		if (namesSet.has(current.name) && baseIndex === -1) {
			baseIndex = i;
		}
		if (current.name === plugin.name) {
			targetIndex = i;
		}
	}
	if (baseIndex !== -1 && targetIndex !== -1 && baseIndex < targetIndex) {
		plugins.splice(targetIndex, 1);
		plugins.splice(baseIndex, 0, plugin);
	}
}

export type PluginOptions = {
	include?: string | RegExp | Array<string | RegExp>;
	exclude?: string | RegExp | Array<string | RegExp>;
};

export default function vitePlugin(opts?: PluginOptions): Plugin {
	const filter = createFilter(opts?.include ?? defaultIncludeRegex, opts?.exclude);

	const plugin: Plugin = {
		name: "giga",
		enforce: "pre",
		configResolved(config) {
			// run our plugin before the following plugins:
			repushPlugin(config.plugins as Plugin[], plugin, [
				"astro:jsx",
				"vite:react-babel",
				"vite:react-jsx",
				"vite:preact-jsx",
			]);
		},
		async transform(src, id) {
			if (id.includes("/node_modules/")) {
				return;
			}
			const [filePath] = id.split("?");

			if (!filter(filePath)) {
				return;
			}

			const parserPlugins: string[] = ["jsx"];

			if (tsRegex.test(filePath)) {
				parserPlugins.push("typescript");
			}

			const result = await babel.transformAsync(src, {
				sourceMaps: true,
				sourceFileName: id,
				plugins: [gigaPlugin],
				parserOpts: {
					plugins: parserPlugins as any,
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

	return plugin;
}
