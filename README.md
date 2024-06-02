# Giga

> A transpiler that adds zero cost utilities to React.
>
> _Currently a proof of concept only adding svelte-like reactivity so far_

## Install

```sh
npm install --save-dev vite-plugin-giga
```

Then, add it to your vite config:

```js
import giga from "vite-plugin-giga";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), giga()],
});
```

Now, add the global types for type-safety when working with the Giga transpiler

```
// vite-env.d.ts

/// <reference types="vite/client" />
/// <reference types="vite-plugin-giga/client" />

```

## Features

### Giga state (Inspired by Svelte)

```tsx
// counter-button.tsx
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
```

## Planned features

-   Automatic dependency array population when using React hooks such as useEffect, useCallback, or useMemo.
-   Single File Components (SFC)
