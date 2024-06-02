// 🤣 Giga brings svelte-like reactivity to React with
// zero cost abstractions, transpiles to the React you're used to

export const CounterButton = () => {
	let counter = giga.useState(0); // -> const [counter, $$set_counter] = React.useState(0);

	const onClick = () => {
		counter++; // -> $$set_counter((counter) => counter + 1)
	};

	/* Giga also understands when it makes sense to pass in an updater function to the setState fn

	counter = 5 // -> $$set_counter(5)
	counter = counter + 5 // -> $$set_counter((counter) => counter + 5)
	*/

	return (
		<div>
			<button onClick={onClick}>{counter}</button>
			{/* or update the state directly within a jsx expression */}
			<button onClick={() => counter++}>{counter}</button>
		</div>
	);
};
