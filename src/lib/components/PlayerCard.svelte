<script lang="ts">
	import { onMount } from 'svelte';
	import { appState } from '../state/stores.svelte';
	import { audioEngine } from '../audio/koalaFiEngine';
	import { logVibePlay } from '../storage/recentVibesRepository';
	import { Play, Pause, Shuffle, ShareNetwork, Heart, Gear, Sliders, Eye } from 'phosphor-svelte';
	import ShareDialog from './ShareDialog.svelte';
	import SavePresetDialog from './SavePresetDialog.svelte';

	// Svelte 5 props
	let {
		onOpenSettings,
		onPresetSaved,
		isDrawerOpen = $bindable(false),
		isZen = $bindable(false)
	} = $props<{
		onOpenSettings: () => void;
		onPresetSaved: () => void;
		isDrawerOpen?: boolean;
		isZen?: boolean;
	}>();

	let audioInitialized = $state(false);
	let isPlaying = $derived(appState.state.music.enabled);
	let errorMessage = $state<string | null>(null);

	let isShareOpen = $state(false);
	let isSaveOpen = $state(false);

	async function handlePlayToggle() {
		try {
			errorMessage = null;
			if (!audioInitialized) {
				await audioEngine.initializeAudio();
				audioInitialized = true;

				// Handle rough-clock sync start
				if (appState.state.sync.mode === 'rough-clock') {
					audioEngine.setPlayheadFromRoughSync(appState.state);
				}
			}

			audioEngine.toggle();
			const nowPlaying = audioEngine.playbackState === 'started';

			appState.updateState((s) => {
				s.music.enabled = nowPlaying;
			});

			// Update engine state
			audioEngine.applyState(appState.state);

			if (nowPlaying) {
				// Log to recent vibes
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
		const newSeed = `vibe-${randomHex}`;

		appState.updateState((s) => {
			s.seed = newSeed;
			s.presetId = undefined; // Cleared active preset ID
			s.title = `Vibe ${randomHex}`;
		});

		if (isPlaying) {
			audioEngine.applyState(appState.state);
			logVibePlay(appState.state);
		}
	}

	onMount(() => {
		// Check if initial URL had state and if music was enabled
		// Wait, let's keep it stopped by default due to browser security
		appState.updateState((s) => {
			s.music.enabled = false;
		});
	});
</script>

<div class="player-card glass-panel" class:zen-active={isZen}>
	<div class="header-vibe">
		<span class="logo-text">KoalaFi</span>
		<button class="icon-btn" onclick={onOpenSettings} aria-label="Settings">
			<Gear size={20} />
		</button>
	</div>

	<!-- Title section -->
	<div class="vibe-title-section">
		<h2>{appState.state.title || 'Seeded Vibe'}</h2>
		<div class="seed-badge">
			<span>Seed: <code>{appState.state.seed}</code></span>
			<button class="seed-randomize" onclick={handleRandomizeSeed} aria-label="Randomize Seed">
				<Shuffle size={14} />
			</button>
		</div>
	</div>

	<!-- Playback controls -->
	<div class="playback-controls">
		<button
			class="play-btn"
			class:playing={isPlaying}
			onclick={handlePlayToggle}
			aria-label={isPlaying ? 'Pause' : 'Play'}
		>
			{#if isPlaying}
				<Pause size={28} weight="fill" />
			{:else}
				<Play size={28} weight="fill" style="margin-left: 4px;" />
			{/if}
		</button>
		{#if errorMessage}
			<div class="audio-error-msg">{errorMessage}</div>
		{/if}
	</div>

	<!-- Bottom toolbar action buttons -->
	<div class="action-toolbar">
		<button class="action-btn" onclick={() => (isShareOpen = true)} title="Share Vibe Link">
			<ShareNetwork size={16} />
			<span>Share</span>
		</button>
		<button class="action-btn" onclick={() => (isSaveOpen = true)} title="Save Preset">
			<Heart size={16} />
			<span>Save</span>
		</button>
		<button
			class="action-btn"
			class:active={isDrawerOpen}
			onclick={() => (isDrawerOpen = !isDrawerOpen)}
			title="Tune controls"
		>
			<Sliders size={16} />
			<span>Tune</span>
		</button>
		<button class="action-btn" onclick={() => (isZen = true)} title="Zen mode">
			<Eye size={16} />
			<span>Zen</span>
		</button>
	</div>
</div>

<!-- Modal Dialogs -->
<ShareDialog bind:isOpen={isShareOpen} />
<SavePresetDialog bind:isOpen={isSaveOpen} onSaved={onPresetSaved} />

<style>
	.player-card {
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		width: 100%;
		max-width: 380px;
		margin: 0 auto;
		border-radius: var(--radius-lg);
		background: var(--color-bg-card);
		z-index: 10;
	}

	.header-vibe {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.logo-text {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-bold);
		color: var(--color-accent-cyan);
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.icon-btn {
		color: var(--color-text-muted);
		transition: var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
	}

	.icon-btn:hover {
		background: var(--color-bg-hover);
		color: var(--color-text-primary);
	}

	.vibe-title-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.vibe-title-section h2 {
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
	}

	.seed-badge {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		background: var(--color-bg-input);
		border: 1px solid var(--color-border);
		padding: 0.2rem 0.5rem;
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.seed-badge code {
		font-family: monospace;
		color: var(--color-accent-cyan);
	}

	.seed-randomize {
		display: flex;
		align-items: center;
		color: var(--color-text-muted);
		transition: var(--transition-fast);
	}

	.seed-randomize:hover {
		color: var(--color-accent-cyan);
	}

	.playback-controls {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.audio-error-msg {
		font-size: var(--font-size-xs);
		color: var(--color-accent-pink);
		font-weight: var(--font-weight-medium);
		text-align: center;
	}

	.play-btn {
		width: 72px;
		height: 72px;
		border-radius: var(--radius-full);
		background: var(--color-accent-cyan);
		color: var(--color-bg-base);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-normal);
		box-shadow: var(--shadow-neon-cyan);
	}

	.play-btn:hover {
		background: #0ea5e9;
		transform: scale(1.05);
	}

	.play-btn.playing {
		background: var(--color-accent-pink);
		color: var(--color-text-primary);
		box-shadow: var(--shadow-neon-pink);
	}

	.play-btn.playing:hover {
		background: #f43f5e;
	}

	.action-toolbar {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
		border-top: 1px solid var(--color-border);
		padding-top: 1.25rem;
	}

	.action-btn {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		background: var(--color-bg-input);
		border: 1px solid var(--color-border);
		padding: 0.5rem 0.2rem;
		border-radius: var(--radius-sm);
		font-size: 10px;
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		transition: var(--transition-fast);
		cursor: pointer;
	}

	.action-btn:hover {
		background: var(--color-bg-hover);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.action-btn.active {
		border-color: var(--color-accent-cyan);
		color: var(--color-accent-cyan);
		background: rgba(6, 182, 212, 0.05);
	}
</style>
