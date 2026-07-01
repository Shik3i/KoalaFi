<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { appState } from '../state/stores.svelte';
	import { drawFrame } from './canvasSunset';
	import { getLoadedAudioEngine } from '../audio/engineLoader';

	let canvas: HTMLCanvasElement | null = $state(null);
	let container: HTMLDivElement | null = $state(null);

	let animationFrameId = 0;
	let resizeFrameId = 0;
	let lastTime = 0;
	let isPageVisible = true;
	let prefersReducedMotion = $state(false);
	let viewportWidth = $state(0);
	let motionQuery: MediaQueryList | null = null;

	// React to isPlaying audio state
	let isAudioPlaying = $derived(appState.state.music.enabled);

	// Dynamic config values
	let visualState = $derived(appState.state.visual);

	// FPS cap calculation
	// Target: off = 0fps, calm = ~20fps (50ms interval), reactive = ~24fps (40ms interval)
	let fpsInterval = $derived.by(() => {
		const motion = visualState.motion;
		if (prefersReducedMotion || motion === 'off') return -1; // Static render

		const isMobile = viewportWidth > 0 && viewportWidth < 768;
		if (motion === 'reactive') {
			return isMobile ? 1000 / 18 : 1000 / 24; // 18fps mobile, 24fps desktop
		} else {
			return isMobile ? 1000 / 12 : 1000 / 18; // 12fps mobile, 18fps desktop
		}
	});

	// Safe canvas resizing
	function resizeCanvas() {
		if (!canvas || !container) return;
		const rect = container.getBoundingClientRect();

		// Clamp devicePixelRatio to max 2 for battery conservation
		const dpr = Math.min(window.devicePixelRatio || 1, 2);

		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;

		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.scale(dpr, dpr);
		}

		// Force a render immediately if static
		if (fpsInterval === -1) {
			renderSingleFrame(rect.width, rect.height);
		}
	}

	function scheduleResize() {
		if (resizeFrameId) return;
		resizeFrameId = requestAnimationFrame(() => {
			resizeFrameId = 0;
			viewportWidth = window.innerWidth;
			resizeCanvas();
		});
	}

	function renderSingleFrame(width: number, height: number) {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		let audioEnergy = 0;
		if (isAudioPlaying) {
			const engine = getLoadedAudioEngine();
			if (engine) audioEnergy = engine.getAnalyserEnergy();
		}
		drawFrame(
			ctx,
			width,
			height,
			performance.now() / 1000,
			appState.state,
			isAudioPlaying,
			audioEnergy
		);
	}

	// Animation Loop
	function tick(timestamp: number) {
		if (!canvas || !container || !isPageVisible || fpsInterval === -1) {
			animationFrameId = 0;
			return;
		}

		const elapsed = timestamp - lastTime;

		if (elapsed >= fpsInterval) {
			lastTime = timestamp - (elapsed % fpsInterval);

			const rect = container.getBoundingClientRect();
			const ctx = canvas.getContext('2d');
			if (ctx) {
				// Pass cumulative time in seconds
				const frameTime = timestamp / 1000;
				let audioEnergy = 0;
				if (isAudioPlaying) {
					const engine = getLoadedAudioEngine();
					if (engine) audioEnergy = engine.getAnalyserEnergy();
				}
				drawFrame(
					ctx,
					rect.width,
					rect.height,
					frameTime,
					appState.state,
					isAudioPlaying,
					audioEnergy
				);
			}
		}

		animationFrameId = requestAnimationFrame(tick);
	}

	function startAnimation() {
		if (animationFrameId || fpsInterval === -1 || !isPageVisible) return;
		lastTime = performance.now();
		animationFrameId = requestAnimationFrame(tick);
	}

	function stopAnimation() {
		if (!animationFrameId) return;
		cancelAnimationFrame(animationFrameId);
		animationFrameId = 0;
	}

	// Visibility and Reduced Motion handlers
	function handleVisibilityChange() {
		isPageVisible = document.visibilityState === 'visible';
		if (isPageVisible) {
			startAnimation();
		} else {
			stopAnimation();
		}
	}

	function handleReducedMotionChange(e: MediaQueryListEvent) {
		prefersReducedMotion = e.matches;
		scheduleResize();
	}

	// React to theme/brightness/glow changes in static mode
	$effect(() => {
		// Triggers whenever theme/brightness/glow changes
		const theme = visualState.theme;
		const brightness = visualState.brightness;
		const glow = visualState.glow;
		const motion = visualState.motion;

		if (
			theme !== undefined &&
			brightness !== undefined &&
			glow !== undefined &&
			motion !== undefined
		) {
			if (canvas && container && (fpsInterval === -1 || prefersReducedMotion)) {
				stopAnimation();
				const rect = container.getBoundingClientRect();
				renderSingleFrame(rect.width, rect.height);
			} else {
				startAnimation();
			}
		}
	});

	onMount(() => {
		if (typeof window === 'undefined') return;

		// Detect media query prefers-reduced-motion
		motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = motionQuery.matches;
		motionQuery.addEventListener('change', handleReducedMotionChange);

		// Setup window resize and page visibility observers
		window.addEventListener('resize', scheduleResize);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		viewportWidth = window.innerWidth;
		resizeCanvas();
		lastTime = performance.now();

		if (fpsInterval === -1) {
			const rect = container?.getBoundingClientRect();
			if (rect) renderSingleFrame(rect.width, rect.height);
		} else {
			startAnimation();
		}
	});

	onDestroy(() => {
		if (typeof window === 'undefined') return;

		cancelAnimationFrame(animationFrameId);
		cancelAnimationFrame(resizeFrameId);
		window.removeEventListener('resize', scheduleResize);
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		if (motionQuery) {
			motionQuery.removeEventListener('change', handleReducedMotionChange);
		}
	});
</script>

<div class="visual-container" bind:this={container}>
	<canvas bind:this={canvas} class="background-canvas"></canvas>

	<!-- CSS Fallback styled overlays (always runs underneath canvas as fallback background) -->
	<div class="css-fallback-bg theme-{visualState.theme}"></div>
</div>

<style>
	.visual-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		overflow: hidden;
		background-color: #020617;
	}

	.background-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 2;
		display: block;
	}

	/* CSS static fallback backdrop themes */
	.css-fallback-bg {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		transition: background 0.8s ease;
	}

	.theme-sunset {
		background: linear-gradient(135deg, #2c3e50 0%, #ff7e5f 100%);
	}

	.theme-night-rain {
		background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
	}

	.theme-minimal-dark {
		background: linear-gradient(135deg, #09090b 0%, #18181b 100%);
	}

	.theme-neon-coast {
		background: linear-gradient(135deg, #1e1b4b 0%, #ec4899 100%);
	}
</style>
