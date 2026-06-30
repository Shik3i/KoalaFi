<script lang="ts">
	import { onMount } from 'svelte';
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

	let audioInitialized = $state(false);
	let errorMessage = $state<string | null>(null);
	let isShareOpen = $state(false);
	let isSaveOpen = $state(false);
	let isPlaying = $derived(appState.state.music.enabled);
	let statusLabel = $derived(isPlaying ? 'Playing' : 'Paused');

	async function handlePlayToggle() {
		try {
			errorMessage = null;
			if (!audioInitialized) {
				await audioEngine.initializeAudio();
				audioInitialized = true;
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

	onMount(() => {
		appState.updateState((s) => {
			s.music.enabled = false;
		});
	});
</script>

<section
	class="sun-player"
	class:playing={isPlaying}
	class:zen-active={isZen}
	aria-label="Sun player"
>
	<div class="sun-meta">
		<span class="brand">KoalaFi</span>
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
		<span class="play-glyph">
			{#if isPlaying}
				<Pause size={42} weight="fill" />
			{:else}
				<Play size={42} weight="fill" />
			{/if}
		</span>
	</button>

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
	</div>

	<div class="orbit-actions" aria-label="Sun actions">
		<button onclick={() => onOpenPanel('vibes')} aria-label="Open vibes">
			<Sparkle size={18} />
			<span>Vibes</span>
		</button>
		<button onclick={() => (isShareOpen = true)} aria-label="Share vibe link">
			<ShareNetwork size={18} />
			<span>Share</span>
		</button>
		<button onclick={() => (isSaveOpen = true)} aria-label="Save preset">
			<Heart size={18} />
			<span>Save</span>
		</button>
		<button onclick={() => onOpenPanel('tune')} aria-label="Open tune controls">
			<Sliders size={18} />
			<span>Tune</span>
		</button>
		<button onclick={() => (isZen = true)} aria-label="Enter Zen mode">
			<Eye size={18} />
			<span>Zen</span>
		</button>
	</div>
</section>

<ShareDialog bind:isOpen={isShareOpen} />
<SavePresetDialog bind:isOpen={isSaveOpen} onSaved={onPresetSaved} />

<style>
	.sun-player {
		width: min(82vw, 430px);
		display: grid;
		justify-items: center;
		gap: 0.9rem;
		color: var(--color-text-primary);
		text-align: center;
	}

	.sun-meta {
		width: min(100%, 320px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0.35rem 0.25rem 0.7rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: var(--radius-full);
		background: rgba(9, 9, 11, 0.32);
		backdrop-filter: blur(10px);
	}

	.brand {
		color: var(--color-accent-cyan);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.meta-btn,
	.seed-randomize,
	.orbit-actions button {
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
		width: clamp(190px, 36vw, 300px);
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
			transparent 0 64%,
			rgba(255, 255, 255, 0.18) 65% 66%,
			transparent 67% 72%,
			rgba(255, 255, 255, 0.1) 73% 74%,
			transparent 75%
		);
		mix-blend-mode: screen;
		opacity: 0.42;
	}

	.play-glyph {
		display: grid;
		place-items: center;
		filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.22));
	}

	.play-glyph :global(svg) {
		margin-left: 4px;
	}

	.sun-button.playing .play-glyph :global(svg) {
		margin-left: 0;
	}

	.vibe-copy {
		display: grid;
		gap: 0.45rem;
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
		color: var(--color-accent-cyan);
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

	.orbit-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.45rem;
		width: min(100%, 410px);
	}

	.orbit-actions button {
		gap: 0.35rem;
		min-height: 40px;
		padding: 0 0.8rem;
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: var(--radius-full);
		background: rgba(9, 9, 11, 0.36);
		backdrop-filter: blur(10px);
		color: var(--color-text-primary);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
	}

	.orbit-actions button:hover {
		border-color: rgba(255, 255, 255, 0.18);
		background: rgba(255, 255, 255, 0.08);
	}

	@media (max-width: 720px) {
		.sun-player {
			width: min(100%, 380px);
			gap: 0.75rem;
		}

		.sun-button {
			width: clamp(180px, 64vw, 260px);
		}

		.orbit-actions {
			gap: 0.35rem;
		}

		.orbit-actions button {
			min-height: 42px;
			padding: 0 0.65rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sun-button {
			transition: none;
		}
	}
</style>
