import type * as babel from "@babel/core";

export function transformEffects(
	path: babel.NodePath,
	opts: { reactDefaultImportName: string }
): void {
	const effects: { path: babel.NodePath<babel.types.CallExpression>; dependencies: string[] }[] =
		[];

	// gather all giga effects
	path.traverse({
		CallExpression(path) {
			const callee = path.node.callee;

			if (callee.type === "MemberExpression") {
				if (
					callee.object.type === "Identifier" &&
					callee.object.name === "giga" &&
					callee.property.type === "Identifier" &&
					callee.property.name === "useEffect"
				) {
					if (path.node.arguments.length > 1) {
						throw new Error("Effect should only have one argument");
					}

					const body = path.get("arguments")[0];

					if (
						body.node.type !== "ArrowFunctionExpression" &&
						body.node.type !== "FunctionExpression"
					) {
						throw new Error(
							"Effect should be passed an arrow function or a function expression"
						);
					}

					let dependencies: string[] = [];

					path.traverse({
						Identifier(path) {
							// if (variablesInScope.includes(path.node.name)) {
							// 	dependencies.push(path.node.name);
							// }

							if (body.scope.hasBinding(path.node.name)) {
								dependencies.push(path.node.name);
							}
						},
					});

					effects.push({
						path,
						dependencies,
					});
				}
			}
		},
	});

	// replace all effects with a compiled useEffect
	effects.forEach((effect) => {
		const args = [effect.path.node.arguments[0]];

		if (effect.dependencies.length > 0) {
			args.push({
				type: "ArrayExpression",
				elements: effect.dependencies.map((dependency) => ({
					type: "Identifier",
					name: dependency,
				})),
			});
		}

		effect.path.replaceWith({
			type: "CallExpression",
			callee: {
				type: "MemberExpression",
				object: {
					type: "Identifier",
					name: opts.reactDefaultImportName,
				},
				property: {
					type: "Identifier",
					name: "useEffect",
				},
				computed: false,
			},
			arguments: args,
		});
	});
}
