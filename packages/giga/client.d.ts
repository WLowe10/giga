type useState = <T = any>(initial: T) => T;

declare global {
	namespace globalThis {
		const giga: {
			useState: useState;
		};
	}
}

export {};
