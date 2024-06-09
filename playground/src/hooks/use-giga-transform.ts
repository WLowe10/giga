import { useEffect } from "react";
import { transform } from "@babel/standalone";
import gigaPlugin from "babel-plugin-giga";

export const useGigaTransform = (code: string) => {
	let outputCode = giga.useState("");

	useEffect(() => {
		try {
			const result = transform(code, {
				parserOpts: {
					plugins: ["jsx"],
				},
				plugins: [gigaPlugin({ disableReactImport: true })],
			});

			outputCode = result.code || "";
		} catch {
			// noop
		}
	}, [code]);

	return outputCode;
};
