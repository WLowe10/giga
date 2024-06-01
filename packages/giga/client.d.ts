type useState = <T = any>(initial: T) => T;
type useEffect = (effect: () => void) => void;

declare global {
	namespace globalThis {
		const giga: {
			useState: useState;
			useEffect: useEffect;
		};
	}
}

export {};
