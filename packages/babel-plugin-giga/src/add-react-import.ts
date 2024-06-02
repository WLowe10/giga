import type * as babel from "@babel/core";

export type AddReactImportResult = {
	reactDefaultImportName: string;
};

export function addReactImport(
	programPath: babel.NodePath<babel.types.Program>
): AddReactImportResult {
	let reactDefaultImportName = "React";
	let reactImport: babel.types.ImportDeclaration | undefined;

	programPath.traverse({
		ImportDeclaration(path) {
			if (path.node.source.value === "react") {
				reactImport = path.node;

				// we found the react import, stop traversing
				path.stop();
			}
		},
	});

	if (reactImport) {
		const defaultSpecifier = reactImport.specifiers.find(
			(specifier) => specifier.type === "ImportDefaultSpecifier"
		);

		if (!defaultSpecifier) {
			reactImport.specifiers.unshift({
				type: "ImportDefaultSpecifier",
				local: {
					type: "Identifier",
					name: "React",
				},
			});
		} else if (defaultSpecifier.local.name !== "React") {
			// if React is already imported with default, we will store the identifier name for later use
			reactDefaultImportName = defaultSpecifier.local.name;
		}
	} else {
		// there is no react import, add one
		programPath.node.body.unshift({
			type: "ImportDeclaration",
			specifiers: [
				{
					type: "ImportDefaultSpecifier",
					local: {
						type: "Identifier",
						name: "React",
					},
				},
			],
			source: {
				type: "StringLiteral",
				value: "react",
			},
		});
	}

	return {
		reactDefaultImportName,
	};
}
