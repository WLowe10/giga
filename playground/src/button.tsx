import { useEffect, useState } from "react";

const useCounter = () => {
	const [count, setCount] = useState(0);

	return {
		count,
		increment: () => setCount((prev) => prev + 1),
	};
};

export const Button = () => {
	const { count, increment } = useCounter();

	useEffect(() => {}, []);

	return <button onClick={increment}>{count}</button>;
};
