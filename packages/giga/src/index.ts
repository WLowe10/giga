import { addReactImport } from "./add-react-import";
import { transformStates } from "./transform-states";
import { transformEffects } from "./transform-effects";

// todo start using babel t utility as used below, adds nice utility like t.isIdentifier
// https://github.com/kentcdodds/babel-plugin-handbook?tab=readme-ov-file#introduction
// the article also has scoping examples

// keep in mind path.isReferencedIdentifier
// babel uid

export default function babelPlugin(): babel.PluginObj {
	return {
		name: "babel-plugin-giga",
		visitor: {
			Program(programPath) {
				const { reactDefaultImportName } = addReactImport(programPath);

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

					transformEffects(bodyPath, {
						reactDefaultImportName,
					});
				});
			},
		},
	};
}
