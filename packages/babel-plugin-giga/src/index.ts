import { addReactImport } from "./add-react-import";
import { transformStates } from "./transform-states";

export type PluginOptions = Partial<{
	disableReactImport: boolean;
}>;

// https://github.com/kentcdodds/babel-plugin-handbook?tab=readme-ov-file#introduction
export default function babelPlugin(opts?: PluginOptions) {
	return (): babel.PluginObj => {
		return {
			name: "giga",
			visitor: {
				Program(programPath) {
					let reactDefaultImportName = "React";

					if (!opts?.disableReactImport) {
						reactDefaultImportName = addReactImport(programPath).reactDefaultImportName;
					}

					const functionBodies: babel.NodePath<
						babel.types.BlockStatement | babel.types.Expression
					>[] = [];

					programPath.traverse({
						FunctionDeclaration(path) {
							functionBodies.push(path.get("body"));
						},
						FunctionExpression(path) {
							functionBodies.push(path.get("body"));
						},
						ArrowFunctionExpression(path) {
							functionBodies.push(path.get("body"));
						},
					});

					functionBodies.forEach((bodyPath) => {
						transformStates(bodyPath, {
							reactDefaultImportName,
						});
					});
				},
			},
		};
	};
}
