<script lang="ts">
	import Eye from 'phosphor-svelte/lib/Eye';
	import Gear from 'phosphor-svelte/lib/Gear';
	import Heart from 'phosphor-svelte/lib/Heart';
	import Pause from 'phosphor-svelte/lib/Pause';
	import Play from 'phosphor-svelte/lib/Play';
	import ShareNetwork from 'phosphor-svelte/lib/ShareNetwork';
	import Shuffle from 'phosphor-svelte/lib/Shuffle';
	import Sliders from 'phosphor-svelte/lib/Sliders';
	import Sparkle from 'phosphor-svelte/lib/Sparkle';
	import { cubicOut } from 'svelte/easing';
	import { appState } from '../state/stores.svelte';
	import { getAudioEngine, getLoadedAudioEngine } from '../audio/engineLoader';
	import { logVibePlay } from '../storage/recentVibesRepository';
	import ShareDialog from './ShareDialog.svelte';
	import SavePresetDialog from './SavePresetDialog.svelte';

	let {
		onOpenSettings,
		onOpenPanel,
		onPresetSaved,
		isZen = $bindable(false)
	} = $props<{
		onOpenSettings: () => void;
		onOpenPanel: (panel: 'vibes' | 'tune') => void;
		onPresetSaved: () => void;
		isZen?: boolean;
	}>();

	let errorMessage = $state<string | null>(null);
	let isShareOpen = $state(false);
	let isSaveOpen = $state(false);
	let isControlsOpen = $state(false);
	let controlsButtonRef = $state<HTMLButtonElement | null>(null);
	let isPlaying = $derived(appState.state.music.enabled);
	let statusLabel = $derived(isPlaying ? 'Playing' : 'Paused');
	let beatDuration = $derived(`${60 / Math.max(1, appState.state.music.bpm)}s`);
	let reflectionWaves = $state<ReflectionWave[]>([]);
	let nextReflectionWaveId = 0;

	type ReflectionWave = {
		id: number;
		delayMs: number;
		lifeMs: number;
	};

	const REFLECTION_WAVE_COUNT = 5;

	function spawnReflectionWave(lifeMs: number, ageMs = 0): ReflectionWave {
		return {
			id: nextReflectionWaveId++,
			delayMs: -ageMs,
			lifeMs
		};
	}

	function removeReflectionWave(id: number) {
		reflectionWaves = reflectionWaves.filter((wave) => wave.id !== id);
	}

	function reflectionWaveStyle(wave: ReflectionWave) {
		return `--wave-life: ${wave.lifeMs}ms; --wave-delay: ${wave.delayMs}ms`;
	}

	async function handlePlayToggle() {
		try {
			errorMessage = null;
			const audioEngine = await getAudioEngine();
			const nowPlaying = await audioEngine.togglePlayback(appState.state);
			appState.updateState((s) => {
				s.music.enabled = nowPlaying;
			});
			audioEngine.applyState(appState.state);

			if (nowPlaying) {
				await logVibePlay(appState.state);
			}
		} catch (err) {
			console.error('Audio initialization failure:', err);
			errorMessage = 'Playback blocked: click play button to allow sound';
		}
	}

	function handleRandomizeSeed() {
		const randomHex =
			typeof crypto !== 'undefined' && 'randomUUID' in crypto
				? crypto.randomUUID().slice(0, 8)
				: Date.now().toString(36).slice(-8);

		appState.updateState((s) => {
			s.seed = `vibe-${randomHex}`;
			s.presetId = undefined;
			s.title = `Vibe ${randomHex}`;
		});

		if (isPlaying) {
			getLoadedAudioEngine()?.applyState(appState.state);
			logVibePlay(appState.state);
		}
	}

	function closeControls() {
		isControlsOpen = false;
	}

	function handleMenuAction(action: () => void) {
		action();
		closeControls();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isControlsOpen) {
			closeControls();
			controlsButtonRef?.focus();
		}
	}

	function menuTransition(node: Element) {
		void node;

		const reduced =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		return {
			duration: reduced ? 1 : 170,
			easing: cubicOut,
			css: (t: number, u: number) => `
				opacity: ${t};
				transform: translateX(-50%) translateY(${u * 8}px) scale(${0.97 + t * 0.03});
			`
		};
	}

	$effect(() => {
		if (isZen) {
			closeControls();
		}
	});

	$effect(() => {
		if (typeof window === 'undefined') return;

		const motion = appState.state.visual.motion;
		if (motion === 'off') {
			reflectionWaves = [];
			return;
		}

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const beatMs = (60 / Math.max(1, appState.state.music.bpm)) * 1000;
		const spawnMs = Math.max(680, beatMs * 1.05);
		const lifeMs = spawnMs * REFLECTION_WAVE_COUNT;

		reflectionWaves = Array.from({ length: reduced ? 4 : REFLECTION_WAVE_COUNT }, (_, index) =>
			spawnReflectionWave(lifeMs, index * spawnMs)
		);

		if (reduced) return;

		const interval = window.setInterval(() => {
			reflectionWaves = [...reflectionWaves, spawnReflectionWave(lifeMs)].slice(
				-REFLECTION_WAVE_COUNT - 2
			);
		}, spawnMs);

		return () => window.clearInterval(interval);
	});
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<section
	class="sun-player"
	class:playing={isPlaying}
	class:zen-active={isZen}
	style={`--beat-duration: ${beatDuration}`}
	aria-label="Sun player"
>
	<div class="sun-meta">
		<span class="brand"
			><span>Koala</span><span>Fi</span><span
				style="font-size: 0.65rem; opacity: 0.5; margin-left: 0.25rem; font-weight: normal;"
				>DEV-V4</span
			></span
		>
		<button class="meta-btn" onclick={onOpenSettings} aria-label="Open settings">
			<Gear size={18} />
		</button>
	</div>

	<button
		class="sun-button"
		class:playing={isPlaying}
		onclick={handlePlayToggle}
		aria-label={isPlaying ? 'Pause KoalaFi' : 'Play KoalaFi'}
	>
		<span class="sun-ring"></span>
		<span class="play-glyph">
			{#if isPlaying}
				<Pause size={42} weight="fill" />
			{:else}
				<Play size={42} weight="fill" />
			{/if}
		</span>
	</button>

	<span class="scene-water" aria-hidden="true"></span>
	<svg class="sun-reflection" aria-hidden="true" viewBox="0 0 1000 280" preserveAspectRatio="none">
		<defs>
			<radialGradient id="sun-direct-reflection" cx="50%" cy="0%" r="72%">
				<stop offset="0" stop-color="#fff2b8" stop-opacity="0.36" />
				<stop offset="0.34" stop-color="#ff9ec8" stop-opacity="0.2" />
				<stop offset="0.72" stop-color="#22d3ee" stop-opacity="0.08" />
				<stop offset="1" stop-color="#6ee7f9" stop-opacity="0" />
			</radialGradient>
			<linearGradient id="sun-direct-band" x1="0" x2="1" y1="0" y2="0">
				<stop offset="0" stop-color="#ff4fa3" stop-opacity="0" />
				<stop offset="0.22" stop-color="#ff8fc5" stop-opacity="0.3" />
				<stop offset="0.5" stop-color="#fff2ae" stop-opacity="0.86" />
				<stop offset="0.78" stop-color="#6ee7f9" stop-opacity="0.28" />
				<stop offset="1" stop-color="#6ee7f9" stop-opacity="0" />
			</linearGradient>
			<filter id="mirror-blur" x="-20%" y="-80%" width="140%" height="260%">
				<feGaussianBlur stdDeviation="9" />
			</filter>
			<linearGradient id="sun-reflection-band" x1="0" x2="1" y1="0" y2="0">
				<stop offset="0" stop-color="#f472b6" stop-opacity="0" />
				<stop offset="0.24" stop-color="#ffc778" stop-opacity="0.34" />
				<stop offset="0.5" stop-color="#fff0ae" stop-opacity="0.95" />
				<stop offset="0.76" stop-color="#ffc778" stop-opacity="0.34" />
				<stop offset="1" stop-color="#f472b6" stop-opacity="0" />
			</linearGradient>
		</defs>
		<g class="direct-sun-reflection">
			<ellipse class="mirror-aura" cx="500" cy="72" rx="330" ry="128" />
			<path
				class="mirror-band mirror-band-1"
				d="M 176 4 C 316 15 684 15 824 4 C 760 16 240 16 176 4 Z"
			/>
			<path
				class="mirror-band mirror-band-2"
				d="M 206 22 C 344 34 656 34 794 22 C 726 35 274 35 206 22 Z"
			/>
			<path
				class="mirror-band mirror-band-3"
				d="M 248 43 C 366 54 634 54 752 43 C 698 55 302 55 248 43 Z"
			/>
			<path
				class="mirror-band mirror-band-4"
				d="M 296 68 C 394 77 606 77 704 68 C 660 79 340 79 296 68 Z"
			/>
			<path
				class="mirror-band mirror-band-5"
				d="M 352 96 C 430 104 570 104 648 96 C 614 106 386 106 352 96 Z"
			/>
			<path
				class="mirror-band mirror-band-6"
				d="M 410 126 C 456 133 544 133 590 126 C 568 135 432 135 410 126 Z"
			/>
		</g>
		<g class="reflection-lines">
			{#each reflectionWaves as wave (wave.id)}
				<g
					class="wave"
					style={reflectionWaveStyle(wave)}
					onanimationend={() => removeReflectionWave(wave.id)}
				>
					<path class="wave-line wave-line-main" d="M 296 2 C 414 8 586 8 704 2" />
					<path class="wave-line wave-line-left" d="M 226 2 C 282 5 338 5 394 2" />
					<path class="wave-line wave-line-right" d="M 606 2 C 662 5 718 5 774 2" />
				</g>
			{/each}
		</g>
	</svg>

	<div class="vibe-copy">
		<h1>{appState.state.title || 'Seeded Vibe'}</h1>
		<div class="seed-row">
			<span class="status-dot" class:playing={isPlaying}></span>
			<span>{statusLabel}</span>
			<span aria-hidden="true">/</span>
			<code>{appState.state.seed}</code>
			<button class="seed-randomize" onclick={handleRandomizeSeed} aria-label="Randomize seed">
				<Shuffle size={14} />
			</button>
		</div>
		{#if errorMessage}
			<p class="audio-error">{errorMessage}</p>
		{/if}

		<div class="controls-menu">
			<button
				bind:this={controlsButtonRef}
				class="controls-toggle"
				aria-label={isControlsOpen ? 'Close controls' : 'Open controls'}
				aria-controls="sun-actions-menu"
				aria-expanded={isControlsOpen}
				onclick={() => (isControlsOpen = !isControlsOpen)}
			>
				<Sliders size={18} />
				<span>Controls</span>
			</button>

			{#if isControlsOpen}
				<div
					id="sun-actions-menu"
					class="actions-popover"
					role="menu"
					aria-label="Sun actions"
					transition:menuTransition
				>
					<button role="menuitem" onclick={() => handleMenuAction(() => onOpenPanel('vibes'))}>
						<Sparkle size={18} />
						<span>Vibes</span>
					</button>
					<button role="menuitem" onclick={() => handleMenuAction(() => onOpenPanel('tune'))}>
						<Sliders size={18} />
						<span>Tune</span>
					</button>
					<button role="menuitem" onclick={() => handleMenuAction(() => (isShareOpen = true))}>
						<ShareNetwork size={18} />
						<span>Share</span>
					</button>
					<button role="menuitem" onclick={() => handleMenuAction(() => (isSaveOpen = true))}>
						<Heart size={18} />
						<span>Save</span>
					</button>
					<button role="menuitem" onclick={() => handleMenuAction(() => (isZen = true))}>
						<Eye size={18} />
						<span>Zen</span>
					</button>
				</div>
			{/if}
		</div>
	</div>
</section>

<ShareDialog bind:isOpen={isShareOpen} />
<SavePresetDialog bind:isOpen={isSaveOpen} onSaved={onPresetSaved} />

<style>
	.sun-player {
		position: relative;
		width: min(100%, 520px);
		display: grid;
		justify-items: center;
		gap: 0.85rem;
		color: var(--color-text-primary);
		text-align: center;
	}

	.sun-meta {
		position: fixed;
		top: var(--scene-header-y, clamp(1.6rem, 5vh, 4rem));
		left: 50%;
		z-index: 20;
		width: min(82vw, 320px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0.35rem 0.25rem 0.7rem;
		border: 1px solid rgba(246, 223, 178, 0.13);
		border-radius: var(--radius-full);
		background:
			linear-gradient(115deg, rgba(255, 236, 179, 0.08), transparent 34%, rgba(236, 72, 153, 0.12)),
			rgba(47, 25, 31, 0.5);
		backdrop-filter: blur(10px);
		box-shadow:
			0 12px 36px rgba(0, 0, 0, 0.18),
			inset 0 1px 0 rgba(246, 223, 178, 0.08);
		transform: translateX(-50%);
	}

	.brand {
		display: inline-flex;
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.brand span {
		color: transparent;
		background: linear-gradient(
			90deg,
			#f7dc9b 0%,
			#fff2bf 26%,
			#f6a7c6 50%,
			#a7f3d0 73%,
			#f7dc9b 100%
		);
		background-size: 240% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		text-shadow: 0 0 18px rgba(242, 207, 143, 0.16);
		animation: brandSweep 10s ease-in-out infinite;
	}

	.brand span:last-child {
		animation-delay: -1.4s;
	}

	.meta-btn,
	.seed-randomize,
	.controls-toggle,
	.actions-popover button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.meta-btn,
	.seed-randomize {
		width: 34px;
		height: 34px;
		border-radius: var(--radius-full);
		color: var(--color-text-muted);
	}

	.meta-btn:hover,
	.seed-randomize:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--color-text-primary);
	}

	.sun-button {
		position: relative;
		z-index: 3;
		width: var(--scene-sun, clamp(190px, 36vw, 300px));
		aspect-ratio: 1;
		border-radius: var(--radius-full);
		color: #170711;
		background:
			radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.28), transparent 34%),
			linear-gradient(180deg, #ffe98a 0%, #ffc174 34%, #ff7f88 67%, #ef5a9f 100%);
		box-shadow:
			0 0 30px rgba(245, 158, 11, 0.42),
			0 0 95px rgba(236, 72, 153, 0.28),
			inset 0 14px 28px rgba(255, 255, 255, 0.26);
		overflow: hidden;
		transition:
			transform var(--transition-normal),
			box-shadow var(--transition-normal),
			filter var(--transition-normal);
	}

	.sun-button::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 4;
		height: 28%;
		background: linear-gradient(
			180deg,
			rgba(13, 60, 75, 0.9),
			rgba(8, 24, 43, 0.98) 72%,
			rgba(6, 12, 27, 1)
		);
	}

	.sun-button:hover,
	.sun-button:focus-visible {
		transform: translateY(-2px) scale(1.02);
		filter: saturate(1.08);
	}

	.sun-button.playing {
		box-shadow:
			0 0 45px rgba(245, 158, 11, 0.58),
			0 0 130px rgba(236, 72, 153, 0.42),
			inset 0 14px 30px rgba(255, 255, 255, 0.28);
	}

	.sun-ring,
	.play-glyph {
		position: absolute;
		inset: 0;
	}

	.sun-ring {
		z-index: 2;
		border-radius: inherit;
		border: 1px solid rgba(255, 255, 255, 0.38);
		box-shadow: inset 0 0 0 12px rgba(255, 255, 255, 0.05);
	}

	.play-glyph {
		z-index: 6;
		display: grid;
		place-items: center;
		filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.22));
	}

	.sun-reflection {
		position: absolute;
		top: calc(var(--scene-sun, 280px) * 0.72 + 1px);
		left: 50%;
		z-index: 5;
		width: min(58vw, calc(var(--scene-sun, 280px) * 1.95));
		height: clamp(158px, 23vh, 224px);
		overflow: hidden;
		pointer-events: none;
		transform: translateX(-50%);
		opacity: 0.82;
		-webkit-mask-image: linear-gradient(180deg, #000 0, #000 68%, transparent 100%);
		mask-image: linear-gradient(180deg, #000 0, #000 68%, transparent 100%);
	}

	.reflection-lines {
		transform-origin: 50% 0;
	}

	.direct-sun-reflection {
		transform-origin: 50% 0;
		mix-blend-mode: screen;
		filter: drop-shadow(0 0 12px rgba(255, 180, 124, 0.18));
		animation: mirrorPulse calc(var(--beat-duration, 0.8s) * 7) ease-in-out infinite;
	}

	.mirror-aura {
		fill: url('#sun-direct-reflection');
		filter: url('#mirror-blur');
		opacity: 0.3;
	}

	.mirror-band {
		fill: url('#sun-direct-band');
		transform-origin: 50% 50%;
	}

	.mirror-band-1 {
		opacity: 0.9;
	}

	.mirror-band-2 {
		opacity: 0.68;
		transform: translateX(6px);
	}

	.mirror-band-3 {
		opacity: 0.5;
		transform: translateX(-8px);
	}

	.mirror-band-4 {
		opacity: 0.34;
		transform: translateX(10px);
	}

	.mirror-band-5 {
		opacity: 0.22;
		transform: translateX(-12px);
	}

	.mirror-band-6 {
		opacity: 0.14;
	}

	.wave {
		--wave-life: 3780ms;
		--wave-delay: 0ms;
		opacity: 0;
		transform-box: fill-box;
		transform-origin: 50% 0;
		mix-blend-mode: screen;
		will-change: transform, opacity;
		animation: waveForward var(--wave-life) linear var(--wave-delay) both;
	}

	.wave-line {
		fill: none;
		stroke: url('#sun-reflection-band');
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.wave-line-main {
		stroke-width: 3.1;
		opacity: 0.72;
	}

	.wave-line-left,
	.wave-line-right {
		stroke-width: 2.2;
		opacity: 0.34;
	}

	.scene-water {
		position: fixed;
		inset: calc(var(--scene-horizon-y, 56vh) - 1px) 0 0;
		z-index: 4;
		overflow: hidden;
		pointer-events: none;
		background:
			radial-gradient(
				ellipse at 50% -4%,
				rgba(255, 229, 157, 0.2),
				rgba(236, 72, 153, 0.09) 24%,
				rgba(34, 211, 238, 0.04) 43%,
				transparent 66%
			),
			linear-gradient(
				180deg,
				rgba(12, 74, 88, 1) 0,
				rgba(13, 60, 75, 1) 18px,
				rgba(8, 23, 41, 0.99) 44%,
				rgba(5, 8, 18, 1)
			);
	}

	.scene-water::before,
	.scene-water::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		pointer-events: none;
	}

	.scene-water::before {
		top: 0;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 232, 164, 0.72) 48%,
			rgba(255, 128, 176, 0.28) 60%,
			transparent
		);
	}

	.scene-water::after {
		top: -18px;
		height: 54px;
		background: radial-gradient(
			ellipse at 50% 0,
			rgba(255, 228, 154, 0.2),
			rgba(236, 72, 153, 0.09) 34%,
			transparent 72%
		);
		mix-blend-mode: screen;
	}

	.play-glyph :global(svg) {
		margin-left: 4px;
	}

	.sun-button.playing .play-glyph :global(svg) {
		margin-left: 0;
	}

	.vibe-copy {
		position: relative;
		z-index: 6;
		display: grid;
		justify-items: center;
		gap: 0.5rem;
		margin-top: var(--scene-title-gap, clamp(5rem, 11vh, 7.4rem));
		text-shadow: 0 2px 18px rgba(0, 0, 0, 0.65);
	}

	.vibe-copy h1 {
		max-width: 24ch;
		font-size: clamp(1.45rem, 4vw, 2.35rem);
		line-height: 1.05;
		letter-spacing: 0;
	}

	.seed-row {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.4rem;
		color: var(--color-text-muted);
		font-size: var(--font-size-xs);
	}

	.seed-row code {
		color: var(--brand-logo-muted);
	}

	.status-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: var(--radius-full);
		background: var(--color-text-muted);
		box-shadow: 0 0 0 transparent;
	}

	.status-dot.playing {
		background: var(--color-accent-pink);
		box-shadow: 0 0 12px var(--color-accent-pink-glow);
	}

	.audio-error {
		color: var(--color-accent-pink);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
	}

	.controls-menu {
		position: relative;
		display: grid;
		justify-items: center;
		margin-top: 0.45rem;
	}

	.controls-toggle,
	.actions-popover button {
		gap: 0.35rem;
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: var(--radius-full);
		backdrop-filter: blur(10px);
		color: var(--color-text-primary);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
	}

	.controls-toggle {
		min-height: 42px;
		padding: 0 0.95rem;
		background: rgba(9, 9, 11, 0.42);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
	}

	.controls-toggle:hover,
	.controls-toggle[aria-expanded='true'] {
		border-color: rgba(255, 255, 255, 0.18);
		background: rgba(255, 255, 255, 0.08);
	}

	.actions-popover {
		position: absolute;
		top: calc(100% + 0.6rem);
		left: 50%;
		z-index: 20;
		display: grid;
		grid-template-columns: repeat(5, max-content);
		gap: 0.35rem;
		padding: 0.45rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-full);
		background: rgba(9, 9, 11, 0.66);
		box-shadow: 0 18px 55px rgba(0, 0, 0, 0.28);
		backdrop-filter: blur(14px);
		transform: translateX(-50%);
		transform-origin: top center;
		will-change: opacity, transform;
	}

	.actions-popover button {
		min-height: 38px;
		padding: 0 0.75rem;
		background: rgba(255, 255, 255, 0.04);
		white-space: nowrap;
	}

	.actions-popover button:hover {
		border-color: rgba(255, 255, 255, 0.18);
		background: rgba(255, 255, 255, 0.09);
	}

	.sun-player.zen-active .sun-meta {
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transform: translateX(-50%) translateY(-4px);
		transition:
			opacity var(--transition-fast),
			visibility var(--transition-fast),
			transform var(--transition-fast);
	}

	.sun-player.zen-active .vibe-copy {
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transform: translateY(-4px);
		transition:
			opacity var(--transition-fast),
			visibility var(--transition-fast),
			transform var(--transition-fast);
	}

	.sun-player.zen-active .play-glyph {
		opacity: 0;
		transform: scale(0.92);
		transition:
			opacity var(--transition-fast),
			transform var(--transition-fast);
	}

	@media (max-width: 720px) {
		.sun-player {
			width: min(100%, 390px);
			gap: 0.75rem;
		}

		.sun-meta {
			top: 1.25rem;
			width: min(calc(100vw - 2rem), 300px);
		}

		.sun-reflection {
			width: min(84vw, calc(var(--scene-sun, 220px) * 1.95));
			height: 184px;
		}

		.vibe-copy {
			position: fixed;
			top: min(calc(var(--scene-horizon-y, 56vh) + 32dvh), calc(100dvh - 12rem));
			left: 50%;
			width: min(calc(100vw - 2rem), 390px);
			margin-top: 0;
			transform: translateX(-50%);
		}

		.sun-player.zen-active .vibe-copy {
			transform: translateX(-50%) translateY(-4px);
		}

		.actions-popover {
			top: calc(100% + 0.55rem);
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.35rem;
			width: min(calc(100vw - 2rem), 330px);
			border-radius: var(--radius-lg);
		}

		.actions-popover button {
			min-height: 44px;
			padding: 0 0.65rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sun-button,
		.sun-player.zen-active .sun-meta,
		.sun-player.zen-active .vibe-copy,
		.sun-player.zen-active .play-glyph {
			transition: none;
		}

		.wave {
			animation: none;
			opacity: 0.24;
			transform: translateY(112px) scaleX(1.38) scaleY(1.16);
		}
	}

	@keyframes brandSweep {
		0%,
		100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}

	@keyframes mirrorPulse {
		0%,
		100% {
			opacity: 0.72;
			transform: translateY(0) scaleX(0.98);
		}
		50% {
			opacity: 0.9;
			transform: translateY(3px) scaleX(1.04);
		}
	}

	@keyframes waveForward {
		0% {
			opacity: 0;
			transform: translateY(0) scaleX(0.95) scaleY(0.72);
		}
		8% {
			opacity: 0.86;
			transform: translateY(3px) scaleX(0.98) scaleY(0.78);
		}
		46% {
			opacity: 0.72;
			transform: translateY(92px) scaleX(1.28) scaleY(1.08);
		}
		82% {
			opacity: 0.34;
			transform: translateY(178px) scaleX(1.5) scaleY(1.28);
		}
		100% {
			opacity: 0;
			transform: translateY(236px) scaleX(1.72) scaleY(1.46);
		}
	}
</style>
