<script lang="ts">
	import {
		Eye,
		Gear,
		Heart,
		Pause,
		Play,
		ShareNetwork,
		Shuffle,
		Sliders,
		Sparkle
	} from 'phosphor-svelte';
	import { cubicOut } from 'svelte/easing';
	import { appState } from '../state/stores.svelte';
	import { audioEngine } from '../audio/koalaFiEngine';
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

	async function handlePlayToggle() {
		try {
			errorMessage = null;
			if (!audioEngine.isInitialized) {
				await audioEngine.initializeAudio();
				if (appState.state.sync.mode === 'rough-clock') {
					audioEngine.setPlayheadFromRoughSync(appState.state);
				}
			}

			audioEngine.toggle();
			const nowPlaying = audioEngine.playbackState === 'started';
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
			audioEngine.applyState(appState.state);
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
		<span class="brand"><span>Koala</span><span>Fi</span></span>
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
	<svg class="sun-reflection" aria-hidden="true" viewBox="0 0 1000 260" preserveAspectRatio="none">
		<g class="reflection-lines">
			<path class="wave wave-1" d="M275 8 C385 14 615 14 725 8" />
			<path class="wave wave-2" d="M245 28 C370 38 630 38 755 28" />
			<path class="wave wave-3" d="M215 58 C350 72 650 72 785 58" />
			<path class="wave wave-4" d="M170 98 C330 116 670 116 830 98" />
			<path class="wave wave-5" d="M115 148 C300 170 700 170 885 148" />
			<path class="wave wave-6" d="M60 206 C270 232 730 232 940 206" />
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
		background: rgba(47, 25, 31, 0.46);
		backdrop-filter: blur(10px);
		box-shadow:
			0 12px 36px rgba(0, 0, 0, 0.18),
			inset 0 1px 0 rgba(246, 223, 178, 0.08);
		transform: translateX(-50%);
	}

	.brand {
		display: inline-flex;
		color: var(--brand-logo);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.brand span:last-child {
		color: var(--brand-logo-muted);
		text-shadow: 0 0 14px rgba(242, 207, 143, 0.2);
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
		top: calc(var(--scene-sun, 280px) * 0.72);
		left: 50%;
		z-index: 5;
		width: min(58vw, calc(var(--scene-sun, 280px) * 1.95));
		height: clamp(118px, 17vh, 164px);
		overflow: visible;
		pointer-events: none;
		transform: translateX(-50%);
		opacity: 0.82;
	}

	.reflection-lines {
		transform-origin: 50% 0;
		animation: reflectionBeat var(--beat-duration, 0.8s) ease-in-out infinite;
	}

	.wave {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
		filter: drop-shadow(0 0 8px rgba(255, 196, 128, 0.14));
	}

	.wave-1 {
		stroke: rgba(255, 239, 176, 0.6);
		stroke-width: 3;
	}

	.wave-2 {
		stroke: rgba(255, 226, 154, 0.48);
		stroke-width: 3.2;
	}

	.wave-3 {
		stroke: rgba(255, 196, 138, 0.36);
		stroke-width: 3.5;
	}

	.wave-4 {
		stroke: rgba(255, 154, 146, 0.26);
		stroke-width: 3.8;
	}

	.wave-5 {
		stroke: rgba(255, 116, 166, 0.17);
		stroke-width: 4.1;
	}

	.wave-6 {
		stroke: rgba(255, 106, 178, 0.1);
		stroke-width: 4.5;
	}

	.scene-water {
		position: fixed;
		inset: calc(var(--scene-horizon-y, 56vh) - 1px) 0 0;
		z-index: 4;
		overflow: hidden;
		pointer-events: none;
		background:
			radial-gradient(
				ellipse at 50% 0,
				rgba(255, 224, 135, 0.12),
				rgba(236, 72, 153, 0.06) 28%,
				transparent 58%
			),
			linear-gradient(
				180deg,
				rgba(13, 60, 75, 1) 0,
				rgba(13, 60, 75, 1) 14px,
				rgba(8, 23, 41, 0.99) 44%,
				rgba(5, 8, 18, 1)
			);
	}

	.scene-water::before {
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
			rgba(255, 232, 164, 0.55) 48%,
			rgba(255, 128, 176, 0.18) 60%,
			transparent
		);
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
			height: 128px;
		}

		.vibe-copy {
			margin-top: var(--scene-title-gap, clamp(3.8rem, 8vh, 5.2rem));
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

		.reflection-lines {
			animation: none;
		}
	}

	@keyframes reflectionBeat {
		0%,
		100% {
			opacity: 0.62;
			transform: translateY(0) scaleY(0.98);
		}
		38% {
			opacity: 0.9;
			transform: translateY(3px) scaleY(1.08);
		}
		66% {
			opacity: 0.7;
			transform: translateY(-1px) scaleY(1.01);
		}
	}
</style>
