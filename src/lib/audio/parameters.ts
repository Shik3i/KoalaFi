export type FrequencyRange = {
	min: number;
	max: number;
};

export function getMelodyFilterRange(focusLevel: number): FrequencyRange {
	const focus = Math.max(0, Math.min(1, focusLevel));
	const center = 500 + focus * 1400;
	const sweep = 80 + focus * 70;

	return {
		min: center - sweep,
		max: center + sweep
	};
}
