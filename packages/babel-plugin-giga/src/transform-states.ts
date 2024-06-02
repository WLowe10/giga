const buildSetStateIdentifierName = (stateName: string) => `$$set_${stateName}`;

// const [counter, set_counter] = React.useState(0);
const buildStateVariableDeclaration = (
	stateName: string,
	init: babel.types.CallExpression["arguments"][0],
	opts: { reactDefaultImportName: string }
): babel.types.VariableDeclaration => ({
	type: "VariableDeclaration",
	kind: "const",
	declarations: [
		{
			type: "VariableDeclarator",
			id: {
				type: "ArrayPattern",
				elements: [
					{
						type: "Identifier",
						name: stateName,
					},
					{
						type: "Identifier",
						name: buildSetStateIdentifierName(stateName),
					},
				],
			},
			init: {
				type: "CallExpression",
				callee: {
					type: "MemberExpression",
					object: {
						type: "Identifier",
						name: opts.reactDefaultImportName,
					},
					property: {
						type: "Identifier",
						name: "useState",
					},
					computed: false,
				},
				arguments: [init],
			},
		},
	],
});

// set_counter(x)
const buildSetStateCallExpression = (
	stateName: string,
	args: babel.types.CallExpression["arguments"]
): babel.types.CallExpression => ({
	type: "CallExpression",
	callee: {
		type: "Identifier",
		name: buildSetStateIdentifierName(stateName),
	},
	arguments: args,
});

// set_counter(counter => x)
const buildSetStateCallExpressionWithPrev = (
	stateName: string,
	body: babel.types.ArrowFunctionExpression["body"]
) =>
	buildSetStateCallExpression(stateName, [
		{
			type: "ArrowFunctionExpression",
			expression: true,
			async: false,
			params: [
				{
					type: "Identifier",
					name: stateName,
				},
			],
			body: body,
		},
	]);

const assignmentOperators = [
	"+=",
	"-=",
	"*=",
	"/=",
	"%=",
	"**=",
	"<<=",
	">>=",
	">>>=",
	"&=",
	"^=",
	"|=",
	"&&=",
	"||=",
	"??=",
];

export function transformStates(
	path: babel.NodePath,
	opts: { reactDefaultImportName: string }
): void {
	const stateDeclarations: {
		path: babel.NodePath<babel.types.VariableDeclaration>;
		stateName: string;
		init: babel.types.ArgumentPlaceholder | babel.types.SpreadElement | babel.types.Expression;
	}[] = [];

	// gather all state variable declarations
	path.traverse({
		VariableDeclaration(path) {
			const firstDeclarator = path.node.declarations[0];

			if (firstDeclarator.id.type === "Identifier") {
				if (firstDeclarator.init && firstDeclarator.init.type === "CallExpression") {
					const callee = firstDeclarator.init.callee;

					if (
						callee.type === "MemberExpression" &&
						callee.object.type === "Identifier" &&
						callee.object.name === "giga" &&
						callee.property.type === "Identifier" &&
						callee.property.name === "useState" &&
						firstDeclarator.init.arguments.length === 1
					) {
						if (path.node.kind !== "let") {
							throw new Error("giga.useState must be declared with let");
						}

						// ! not working, important to fix to prevent misuse
						if (firstDeclarator.init.arguments.length > 1) {
							throw new Error("giga.useState only accepts one argument");
						}

						// ! not working, important to fix to prevent misuse
						if (path.node.declarations.length > 1) {
							throw new Error(
								"Only one state declarator is allowed per invocation of giga.useState"
							);
						}

						stateDeclarations.push({
							path,
							stateName: firstDeclarator.id.name,
							init: firstDeclarator.init.arguments[0],
						});
					}
				}
			}
		},
	});

	const stateNames = stateDeclarations.map((d) => d.stateName);

	// transform the state declarations into React useState calls for the scope the state was declared in
	stateDeclarations.forEach(({ path, stateName, init }) => {
		const scopePath = path.scope.path;

		path.replaceWith(
			buildStateVariableDeclaration(stateName, init, {
				reactDefaultImportName: opts.reactDefaultImportName,
			})
		);

		const stateMutations: {
			path: babel.NodePath<babel.types.AssignmentExpression | babel.types.UpdateExpression>;
			stateName: string;
		}[] = [];

		// find all of the mutations of the state
		scopePath.traverse({
			AssignmentExpression(path) {
				if (path.node.left.type === "Identifier") {
					if (stateNames.includes(path.node.left.name)) {
						stateMutations.push({
							path,
							stateName: path.node.left.name,
						});
					}
				}
			},
			UpdateExpression(path) {
				if (
					path.node.argument.type === "Identifier" &&
					stateNames.includes(path.node.argument.name)
				) {
					stateMutations.push({
						path,
						stateName: path.node.argument.name,
					});
				}
			},
		});

		// replace all state assignments to call the useState setter function
		stateMutations.forEach(({ path, stateName }) => {
			let newNode: babel.types.Node;

			if (path.node.type === "UpdateExpression") {
				// this alters ++ and -- to be p + 1 and p - 1
				newNode = buildSetStateCallExpressionWithPrev(stateName, {
					type: "BinaryExpression",
					left: {
						type: "Identifier",
						name: stateName,
					},
					operator: path.node.operator === "++" ? "+" : "-",
					right: {
						type: "NumericLiteral",
						value: 1,
					},
				});
			} else if (
				path.node.type === "AssignmentExpression" &&
				path.node.left.type === "Identifier"
			) {
				if (assignmentOperators.includes(path.node.operator)) {
					newNode = buildSetStateCallExpressionWithPrev(stateName, path.node);
				} else {
					const rightPath = path.get("right") as babel.NodePath<babel.types.Expression>;

					let hasStateIdentifierInRight = false;

					// check if the setState call should be optimized to use the prev state
					rightPath.traverse({
						Identifier(path) {
							if (path.node.name === stateName) {
								hasStateIdentifierInRight = true;

								path.stop();
							}
						},
					});

					if (hasStateIdentifierInRight) {
						// a state variable is used inside this update, we will optimize it to use a useState update fn
						newNode = buildSetStateCallExpressionWithPrev(stateName, path.node.right);
					} else {
						// a state variable isn't used in this update, no need to use the useState update fn
						newNode = buildSetStateCallExpression(stateName, [path.node]);
					}
				}
			}

			// @ts-ignore
			path.replaceWith(newNode);
		});
	});
}
