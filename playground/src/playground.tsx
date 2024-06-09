import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";
import { useGigaTransform } from "./hooks/use-giga-transform";

const defaultCode = `const Counter = () => {
    let count = giga.useState(0);

    return (
        <button onClick={() => count++}>
            {count}
        </button>
    )
}

render(<Counter />)
`;

export const Playground = () => {
	let inputCode = giga.useState(defaultCode);
	const outputCode = useGigaTransform(inputCode);

	// remove one line, starting at the first position

	return (
		<div>
			<textarea value={inputCode} onChange={(e) => (inputCode = e.target.value)} />
			{/* <pre>{outputCode}</pre> */}
			<LiveProvider code={outputCode} noInline>
				<div className="grid grid-cols-2 gap-4">
					{/* <LiveEditor className="font-mono" /> */}
					<LivePreview />
					<LiveEditor className="liveEditor" />
					<LiveError className="liveError" />
				</div>
			</LiveProvider>
		</div>
	);
};
