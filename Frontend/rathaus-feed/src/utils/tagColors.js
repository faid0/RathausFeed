export const TAG_COLORS = [
	{ bg: "#ffd166", text: "#0f172a" }, // amber
	{ bg: "#ff9f6e", text: "#0f172a" }, // soft orange
	{ bg: "#ff7eb6", text: "#0f172a" }, // soft pink
	{ bg: "#c3a3ff", text: "#1f1f2e" }, // light violet
	{ bg: "#7cc8ff", text: "#0f172a" }, // light azure
	{ bg: "#9bf6ff", text: "#0f172a" }, // aqua
	{ bg: "#caffbf", text: "#0f172a" }, // mint
	{ bg: "#fdffb6", text: "#0f172a" }, // pale yellow
	{ bg: "#ffd6a5", text: "#0f172a" }, // peach
];

export const colorIndexForTag = (tag = "", paletteSize = TAG_COLORS.length) => {
	if (!paletteSize) return 0;
	let hash = 0;
	for (let i = 0; i < tag.length; i += 1) {
		hash = (hash << 5) - hash + tag.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash) % paletteSize;
};
