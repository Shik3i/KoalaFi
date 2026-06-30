import type { KoalaFiState } from '../state/koalaFiState';
import { THEME_PALETTES } from './visualSettings';

/**
 * Renders a single frame of the background animation onto the 2D canvas context.
 */
export function drawFrame(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	frameTime: number,
	state: KoalaFiState,
	isPlaying: boolean
) {
	const theme = state.visual.theme;
	const motion = state.visual.motion;
	const brightness = state.visual.brightness;
	const glow = state.visual.glow;

	const colors = THEME_PALETTES[theme];

	// Adjust overall canvas opacity based on brightness
	ctx.globalAlpha = brightness;

	// Clear background
	ctx.clearRect(0, 0, width, height);

	// 1. Sky Gradient
	const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
	skyGrad.addColorStop(0, colors.skyStart);
	skyGrad.addColorStop(0.55, colors.skyEnd);
	ctx.fillStyle = skyGrad;
	ctx.fillRect(0, 0, width, height);

	const horizonY = Math.round(height * 0.55);

	// 2. Draw Sun/Moon Disc
	ctx.save();
	const sunX = width / 2;
	const sunY = horizonY - (theme === 'night-rain' || theme === 'minimal-dark' ? 40 : 20);
	const sunRadius = Math.min(width, height) * 0.15;

	if (sunRadius > 20) {
		// Add glow filter if set
		if (glow > 0.1) {
			ctx.shadowBlur = Math.round(glow * 40);
			ctx.shadowColor = colors.sunStart;
		}

		const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
		sunGrad.addColorStop(0, colors.sunStart);
		sunGrad.addColorStop(1, colors.sunEnd);
		ctx.fillStyle = sunGrad;

		// Draw outrun sliced sun for sunset and neon-coast
		if (theme === 'sunset' || theme === 'neon-coast') {
			ctx.beginPath();
			ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
			ctx.clip();

			// Slices: draw rectangle bars matching outrun grid
			ctx.beginPath();
			ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
			ctx.fill();

			// Cut out lines increasing in size towards bottom
			ctx.fillStyle = colors.skyEnd;
			const numCuts = 6;
			for (let i = 0; i < numCuts; i++) {
				const cutY = sunY + sunRadius * (i / numCuts);
				// Animate cut heights if motion is enabled
				const drift = motion !== 'off' ? Math.sin(frameTime * 0.5 + i) * 2 : 0;
				const cutHeight = 3 + i * 2.5 + drift;
				ctx.fillRect(sunX - sunRadius - 10, cutY, sunRadius * 2 + 20, Math.max(1, cutHeight));
			}
		} else {
			// Normal solid round moon/disc
			ctx.beginPath();
			ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
			ctx.fill();
		}
	}
	ctx.restore();

	// 3. Water/Ground Gradient below horizon
	const waterGrad = ctx.createLinearGradient(0, horizonY, 0, height);
	waterGrad.addColorStop(0, colors.waterStart);
	waterGrad.addColorStop(1, colors.waterEnd);
	ctx.fillStyle = waterGrad;
	ctx.fillRect(0, horizonY, width, height - horizonY);

	// 4. Outrun Grid for neon-coast theme
	if (theme === 'neon-coast') {
		ctx.save();
		ctx.strokeStyle = colors.gridColor || 'rgba(6, 182, 212, 0.2)';
		ctx.lineWidth = 1;

		// Perspective lines originating from vanishing point on horizon
		const numVanishingLines = 24;
		const vanishingX = width / 2;
		for (let i = 0; i <= numVanishingLines; i++) {
			const xRatio = i / numVanishingLines;
			const bottomX = xRatio * width;
			ctx.beginPath();
			ctx.moveTo(vanishingX, horizonY);
			ctx.lineTo(bottomX, height);
			ctx.stroke();
		}

		// Scrolling horizontal lines
		const numHorizontalLines = 10;
		const scrollSpeed = motion === 'off' ? 0 : motion === 'reactive' && isPlaying ? 35 : 15;
		const progress = (frameTime * scrollSpeed) % 100;

		for (let i = 0; i < numHorizontalLines; i++) {
			// Expponential spacing to simulate 3D perspective depth
			const rawY = (i + progress / 100) / numHorizontalLines;
			const t = Math.pow(rawY, 2.5); // Curved perspective spacing
			const lineY = horizonY + t * (height - horizonY);

			ctx.beginPath();
			ctx.moveTo(0, lineY);
			ctx.lineTo(width, lineY);
			ctx.stroke();
		}
		ctx.restore();
	}

	// 5. Draw reflection ripples for sunset / calm themes
	if (theme === 'sunset' || theme === 'minimal-dark') {
		ctx.save();
		ctx.strokeStyle = colors.horizon;
		ctx.globalAlpha = 0.3 * glow;

		const numRipples = 6;
		const speed = motion === 'off' ? 0 : motion === 'reactive' && isPlaying ? 1.8 : 0.8;

		for (let i = 0; i < numRipples; i++) {
			const step = (i + ((frameTime * speed) % 1)) / numRipples;
			const w = sunRadius * 1.8 * (1 - step * 0.5);
			const rippleY = horizonY + step * (height - horizonY) * 0.8;
			const rx = sunX;
			// Slight wave wobble
			const wobble = motion !== 'off' ? Math.sin(frameTime * 1.5 + i) * 6 : 0;

			ctx.beginPath();
			ctx.moveTo(rx - w / 2 + wobble, rippleY);
			ctx.lineTo(rx + w / 2 + wobble, rippleY);
			ctx.lineWidth = Math.max(1, 4 * (1 - step));
			ctx.stroke();
		}
		ctx.restore();
	}

	// 6. Draw rain overlay for night-rain theme
	if (theme === 'night-rain') {
		ctx.save();
		ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
		ctx.lineWidth = 1;

		const numRainDrops = 35;
		const speed = motion === 'off' ? 0 : motion === 'reactive' && isPlaying ? 800 : 450;

		// Deterministic droplet distribution based on index
		for (let i = 0; i < numRainDrops; i++) {
			const seedX = (Math.sin(i * 123.4) * 0.5 + 0.5) * width;
			const seedY = (Math.cos(i * 567.8) * 0.5 + 0.5) * height;

			const fall = motion !== 'off' ? (frameTime * speed) % height : 0;

			const dx = (seedX - fall * 0.15) % width; // Wind angle
			const dy = (seedY + fall) % height;

			ctx.beginPath();
			ctx.moveTo(dx, dy);
			ctx.lineTo(dx - 3, dy + 20); // 20px long drop lines
			ctx.stroke();
		}
		ctx.restore();
	}

	// Restore opacity
	ctx.globalAlpha = 1.0;
}
