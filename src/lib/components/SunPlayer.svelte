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
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<section
	class="sun-player"
	class:playing={isPlaying}
	class:zen-active={isZen}
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
		<span class="sun-lines" aria-hidden="true"></span>
		<span class="sun-water" aria-hidden="true"></span>
		<span class="play-glyph">
			{#if isPlaying}
				<Pause size={42} weight="fill" />
			{:else}
				<Play size={42} weight="fill" />
			{/if}
		</span>
	</button>

	<span class="scene-water" aria-hidden="true"></span>
	<span class="sun-reflection" aria-hidden="true"></span>

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
				aria-label="Open controls"
				aria-controls="sun-actions-menu"
				aria-expanded={isControlsOpen}
				onclick={() => (isControlsOpen = !isControlsOpen)}
			>
				<Sliders size={18} />
				<span>Controls</span>
			</button>

			{#if isControlsOpen}
				<div id="sun-actions-menu" class="actions-popover" role="menu" aria-label="Sun actions">
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
		top: clamp(1.6rem, 5vh, 4rem);
		left: 50%;
		z-index: 20;
		width: min(82vw, 320px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0.35rem 0.25rem 0.7rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: var(--radius-full);
		background: rgba(9, 9, 11, 0.32);
		backdrop-filter: blur(10px);
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
		color: var(--brand-accent-cyan);
		text-shadow: 0 0 14px rgba(126, 231, 255, 0.24);
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
		background: linear-gradient(180deg, #ffe66d 0%, #fb7185 48%, #ec4899 100%);
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
	.sun-lines,
	.sun-water,
	.play-glyph {
		position: absolute;
		inset: 0;
	}

	.sun-ring {
		border-radius: inherit;
		border: 1px solid rgba(255, 255, 255, 0.38);
		box-shadow: inset 0 0 0 12px rgba(255, 255, 255, 0.05);
	}

	.sun-lines {
		background: linear-gradient(
			to bottom,
			transparent 0 55%,
			rgba(255, 255, 255, 0.22) 56% 57%,
			transparent 58% 64%,
			rgba(255, 255, 255, 0.13) 65% 66%,
			transparent 67% 74%,
			rgba(255, 255, 255, 0.08) 75% 76%,
			transparent 77%
		);
		mix-blend-mode: screen;
		opacity: 0.42;
	}

	.sun-water {
		z-index: 3;
		top: 71%;
		background:
			linear-gradient(90deg, transparent 8%, rgba(255, 237, 164, 0.2) 45% 55%, transparent 92%),
			repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.11) 0 2px, transparent 2px 17px),
			linear-gradient(180deg, rgba(28, 86, 98, 0.5), rgba(13, 34, 57, 0.74));
		box-shadow: inset 0 1px 0 rgba(255, 239, 181, 0.3);
	}

	.sun-water::before {
		content: '';
		position: absolute;
		top: -8px;
		left: 8%;
		right: 8%;
		height: 16px;
		border-radius: var(--radius-full);
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 236, 156, 0.5),
			rgba(244, 114, 182, 0.25),
			transparent
		);
		filter: blur(5px);
	}

	.play-glyph {
		z-index: 5;
		display: grid;
		place-items: center;
		filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.22));
	}

	.sun-reflection {
		position: absolute;
		top: calc(var(--scene-sun, 280px) * 0.78);
		left: 50%;
		z-index: 1;
		width: min(58vw, calc(var(--scene-sun, 280px) * 1.72));
		height: clamp(96px, 18vh, 170px);
		pointer-events: none;
		transform: translateX(-50%);
		background:
			repeating-linear-gradient(180deg, rgba(255, 230, 128, 0.2) 0 2px, transparent 2px 26px),
			radial-gradient(
				ellipse at 50% 0,
				rgba(255, 224, 135, 0.2),
				rgba(236, 72, 153, 0.1) 34%,
				transparent 68%
			);
		clip-path: ellipse(50% 44% at 50% 4%);
		filter: blur(0.6px);
		opacity: 0.7;
	}

	.scene-water {
		position: fixed;
		inset: var(--scene-horizon-y, 56vh) 0 0;
		z-index: 4;
		pointer-events: none;
		background:
			radial-gradient(
				ellipse at 50% 0,
				rgba(255, 224, 135, 0.2),
				rgba(236, 72, 153, 0.1) 28%,
				transparent 58%
			),
			linear-gradient(
				180deg,
				rgba(20, 56, 71, 0.9),
				rgba(9, 18, 35, 0.94) 44%,
				rgba(5, 8, 18, 0.98)
			);
		box-shadow: 0 -1px 0 rgba(255, 237, 180, 0.22);
	}

	.scene-water::before {
		content: '';
		position: absolute;
		top: -7px;
		left: 50%;
		width: min(72vw, calc(var(--scene-sun, 280px) * 2.5));
		height: 18px;
		border-radius: var(--radius-full);
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 238, 170, 0.44),
			rgba(236, 72, 153, 0.18),
			transparent
		);
		filter: blur(5px);
		transform: translateX(-50%);
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
		margin-top: clamp(5rem, 11vh, 7.4rem);
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
			width: min(86vw, calc(var(--scene-sun, 220px) * 2.05));
			height: 132px;
		}

		.vibe-copy {
			margin-top: clamp(3.8rem, 8vh, 5.2rem);
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
		.sun-button {
			transition: none;
		}
	}
</style>
