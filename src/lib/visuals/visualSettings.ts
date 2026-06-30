export type VisualTheme = 'sunset' | 'night-rain' | 'minimal-dark' | 'neon-coast';
export type VisualMotion = 'off' | 'calm' | 'reactive';

export type ThemeColors = {
	skyStart: string;
	skyEnd: string;
	horizon: string;
	sunStart: string;
	sunEnd: string;
	waterStart: string;
	waterEnd: string;
	accent: string;
	gridColor?: string;
};

export const THEME_PALETTES: Record<VisualTheme, ThemeColors> = {
	sunset: {
		skyStart: '#ff7e5f', // Warm coral
		skyEnd: '#2c3e50', // Deep evening blue
		horizon: '#feb47b', // Soft yellow-orange
		sunStart: '#f39c12', // Golden sun
		sunEnd: '#e74c3c', // Crimson sunset
		waterStart: '#2c3e50',
		waterEnd: '#1a252f',
		accent: '#e74c3c'
	},
	'night-rain': {
		skyStart: '#0f172a', // Slate 900
		skyEnd: '#020617', // Slate 950
		horizon: '#1e293b', // Slate 800
		sunStart: '#38bdf8', // Neon sky blue moon
		sunEnd: '#0369a1', // Dark blue
		waterStart: '#020617',
		waterEnd: '#0f172a',
		accent: '#38bdf8'
	},
	'minimal-dark': {
		skyStart: '#18181b', // Zinc 900
		skyEnd: '#09090b', // Zinc 950
		horizon: '#27272a', // Zinc 800
		sunStart: '#71717a', // Zinc 500 moon/disc
		sunEnd: '#3f3f46', // Zinc 700
		waterStart: '#09090b',
		waterEnd: '#18181b',
		accent: '#a1a1aa'
	},
	'neon-coast': {
		skyStart: '#ec4899', // Pink 500
		skyEnd: '#1e1b4b', // Indigo 950
		horizon: '#06b6d4', // Cyan 500
		sunStart: '#f43f5e', // Rose 500 sun
		sunEnd: '#ec4899', // Pink 500
		waterStart: '#1e1b4b',
		waterEnd: '#0f172a',
		accent: '#06b6d4',
		gridColor: 'rgba(6, 182, 212, 0.15)'
	}
};
