import type { KoalaFiState } from '../state/koalaFiState';
import { THEME_PALETTES } from './visualSettings';
import { SUN_LAYOUT } from './sunLayout';

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

	const horizonY = Math.round(height * SUN_LAYOUT.horizonRatio);
	const sunX = width / 2;
	const sunRadius = Math.max(90, Math.min(190, Math.min(width, height) * SUN_LAYOUT.radiusRatio));

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
		const reflectionHeight = (height - horizonY) * 0.72;
		const glowGrad = ctx.createRadialGradient(
			sunX,
			horizonY + reflectionHeight * 0.15,
			8,
			sunX,
			horizonY + reflectionHeight * 0.35,
			sunRadius * 2.2
		);
		glowGrad.addColorStop(0, `rgba(254, 180, 123, ${0.24 * glow})`);
		glowGrad.addColorStop(0.45, `rgba(236, 72, 153, ${0.12 * glow})`);
		glowGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
		ctx.fillStyle = glowGrad;
		ctx.fillRect(sunX - sunRadius * 2.2, horizonY, sunRadius * 4.4, reflectionHeight);

		const numRipples = 10;
		const speed = motion === 'off' ? 0 : motion === 'reactive' && isPlaying ? 1.4 : 0.55;

		for (let i = 0; i < numRipples; i++) {
			const phase = motion === 'off' ? 0 : (frameTime * speed + i * 0.17) % 1;
			const step = (i + phase) / numRipples;
			const rippleY = horizonY + 12 + step * reflectionHeight;
			const widthScale = 1 - step * 0.72;
			const rippleWidth = sunRadius * (2.05 * widthScale + 0.28);
			const wobble = motion !== 'off' ? Math.sin(frameTime * 1.2 + i * 1.7) * (5 + step * 8) : 0;
			const alpha = Math.max(0, 0.34 * glow * (1 - step));
			const grad = ctx.createLinearGradient(sunX - rippleWidth / 2, 0, sunX + rippleWidth / 2, 0);
			grad.addColorStop(0, 'rgba(254, 180, 123, 0)');
			grad.addColorStop(0.18, `rgba(254, 180, 123, ${alpha * 0.55})`);
			grad.addColorStop(0.5, `rgba(255, 230, 109, ${alpha})`);
			grad.addColorStop(0.82, `rgba(236, 72, 153, ${alpha * 0.55})`);
			grad.addColorStop(1, 'rgba(236, 72, 153, 0)');

			ctx.strokeStyle = grad;
			ctx.lineWidth = Math.max(1, 5 * (1 - step));
			ctx.beginPath();
			ctx.moveTo(sunX - rippleWidth / 2 + wobble, rippleY);
			ctx.quadraticCurveTo(
				sunX,
				rippleY + Math.sin(i) * 7,
				sunX + rippleWidth / 2 - wobble,
				rippleY
			);
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
