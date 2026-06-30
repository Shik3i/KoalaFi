<script lang="ts">
	import VisualBackground from '../visuals/VisualBackground.svelte';
	import PlayerCard from './PlayerCard.svelte';
	import PresetPicker from './PresetPicker.svelte';
	import MusicControls from './MusicControls.svelte';
	import AmbienceControls from './AmbienceControls.svelte';
	import VisualControls from './VisualControls.svelte';
	import SettingsDrawer from './SettingsDrawer.svelte';
	import { Play, Pause, EyeClosed, X } from 'phosphor-svelte';

	import { appState } from '../state/stores.svelte';
	import { audioEngine } from '../audio/koalaFiEngine';
	import type { KoalaFiState } from '../state/koalaFiState';

	let isSettingsOpen = $state(false);
	let isDrawerOpen = $state(false);
	let isZen = $state(false);
	let activeTab = $state<'music' | 'ambience' | 'visuals'>('music');

	let isPlaying = $derived(appState.state.music.enabled);
	let presetPickerRef = $state<PresetPicker | null>(null);
	let settingsDrawerRef = $state<SettingsDrawer | null>(null);

	function handleSelectPreset(presetState: KoalaFiState) {
		appState.loadState(presetState);

		// Apply immediately to audio engine
		if (appState.state.music.enabled) {
			audioEngine.applyState(appState.state);
		}
	}

	function handlePresetSaved() {
		presetPickerRef?.refresh();
	}

	function handleSelectVibeFromHistory(historyState: KoalaFiState) {
		appState.loadState(historyState);
		if (appState.state.music.enabled) {
			audioEngine.applyState(appState.state);
		}
	}

	async function handlePlayToggle() {
		audioEngine.toggle();
		const nowPlaying = audioEngine.playbackState === 'started';
		appState.updateState((s) => {
			s.music.enabled = nowPlaying;
		});
		audioEngine.applyState(appState.state);
	}

	// Refresh settings logs when opening drawer
	$effect(() => {
		if (isSettingsOpen) {
			settingsDrawerRef?.refresh();
		}
	});
</script>

<VisualBackground />

{#if isZen}
	<!-- Zen / Minimal Mode Pill -->
	<div class="zen-mode-container">
		<div class="zen-pill glass-panel">
			<span class="zen-logo">KoalaFi</span>
			<span class="zen-title">{appState.state.title || 'Seeded Vibe'}</span>

			<div class="zen-actions">
				<button
					class="zen-btn play-btn"
					class:playing={isPlaying}
					onclick={handlePlayToggle}
					aria-label={isPlaying ? 'Pause' : 'Play'}
				>
					{#if isPlaying}
						<Pause size={14} weight="fill" />
					{:else}
						<Play size={14} weight="fill" style="margin-left: 2px;" />
					{/if}
				</button>
				<button
					class="zen-btn exit-btn"
					onclick={() => (isZen = false)}
					title="Exit Zen mode"
					aria-label="Exit Zen mode"
				>
					<EyeClosed size={16} />
				</button>
			</div>
		</div>
	</div>
{:else}
	<!-- Standard UI Layout -->
	<div class="app-layout">
		<!-- Floating bottom-left widgets -->
		<div class="floating-controls-container">
			<div class="presets-row glass-panel">
				<PresetPicker
					bind:this={presetPickerRef}
					onSelect={handleSelectPreset}
					layout="horizontal"
				/>
			</div>

			<PlayerCard
				onOpenSettings={() => (isSettingsOpen = true)}
				onPresetSaved={handlePresetSaved}
				bind:isDrawerOpen
				bind:isZen
			/>
		</div>

		<!-- Slide-out controls drawer from the right -->
		<div class="controls-drawer glass-panel" class:open={isDrawerOpen}>
			<div class="drawer-header">
				<h3>Tuning Controls</h3>
				<button
					class="close-drawer-btn"
					onclick={() => (isDrawerOpen = false)}
					aria-label="Close drawer"
				>
					<X size={18} />
				</button>
			</div>

			<nav class="tabs-nav" aria-label="Controls Navigation">
				<button
					class="tab-btn"
					class:active={activeTab === 'music'}
					onclick={() => (activeTab = 'music')}
				>
					Music
				</button>
				<button
					class="tab-btn"
					class:active={activeTab === 'ambience'}
					onclick={() => (activeTab = 'ambience')}
				>
					Ambience
				</button>
				<button
					class="tab-btn"
					class:active={activeTab === 'visuals'}
					onclick={() => (activeTab = 'visuals')}
				>
					Visuals
				</button>
			</nav>

			<div class="tab-content">
				{#if activeTab === 'music'}
					<div class="tab-pane">
						<MusicControls />
					</div>
				{:else if activeTab === 'ambience'}
					<div class="tab-pane">
						<AmbienceControls />
					</div>
				{:else if activeTab === 'visuals'}
					<div class="tab-pane">
						<VisualControls />
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Drawer Menu overlays -->
<SettingsDrawer
	bind:this={settingsDrawerRef}
	bind:isOpen={isSettingsOpen}
	onSelectVibe={handleSelectVibeFromHistory}
/>

<style>
	.app-layout {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 10;
	}

	.floating-controls-container {
		position: absolute;
		bottom: 2rem;
		left: 2rem;
		width: 380px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		pointer-events: auto;
		animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.presets-row {
		padding: 0.4rem 0.6rem;
		border-radius: var(--radius-lg);
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		max-width: 380px;
		overflow: hidden;
	}

	/* Controls Drawer on the right */
	.controls-drawer {
		position: fixed;
		top: 0;
		right: 0;
		width: 100%;
		max-width: 420px;
		height: 100%;
		background: rgba(15, 23, 42, 0.96);
		border-left: 1px solid var(--color-border);
		box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
		z-index: 100;
		display: flex;
		flex-direction: column;
		pointer-events: auto;
		transform: translateX(100%);
		transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.controls-drawer.open {
		transform: translateX(0);
	}

	.drawer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem 0.75rem 1.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.drawer-header h3 {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
	}

	.close-drawer-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		transition: var(--transition-fast);
		border: none;
		background: transparent;
		cursor: pointer;
	}

	.close-drawer-btn:hover {
		background: var(--color-bg-hover);
		color: var(--color-text-primary);
	}

	.tabs-nav {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-bottom: 1px solid var(--color-border);
		background: rgba(0, 0, 0, 0.15);
	}

	.tab-btn {
		padding: 1rem 0;
		text-align: center;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-muted);
		border: none;
		background: transparent;
		border-bottom: 2px solid transparent;
		transition: var(--transition-fast);
		cursor: pointer;
	}

	.tab-btn:hover {
		color: var(--color-text-primary);
		background: rgba(255, 255, 255, 0.02);
	}

	.tab-btn.active {
		color: var(--color-accent-cyan);
		border-bottom-color: var(--color-accent-cyan);
	}

	.tab-content {
		flex-grow: 1;
		padding: 1.5rem;
		overflow-y: auto;
	}

	.tab-pane {
		animation: fadeIn 0.25s ease;
	}

	/* Zen Mode Styles */
	.zen-mode-container {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		width: auto;
		max-width: 90%;
		pointer-events: auto;
	}

	.zen-pill {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.6rem 1.25rem;
		border-radius: var(--radius-full);
		background: rgba(15, 23, 42, 0.85);
		border: 1px solid var(--color-border);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.zen-logo {
		font-size: 11px;
		font-weight: var(--font-weight-bold);
		color: var(--color-accent-cyan);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.zen-title {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 180px;
	}

	.zen-actions {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.zen-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-full);
		border: 1px solid var(--color-border);
		background: var(--color-bg-input);
		color: var(--color-text-primary);
		transition: var(--transition-fast);
		border: none;
		cursor: pointer;
	}

	.zen-btn:hover {
		background: var(--color-bg-hover);
		border-color: rgba(255, 255, 255, 0.15);
		transform: scale(1.05);
	}

	.zen-btn.play-btn.playing {
		background: var(--color-accent-pink);
		border-color: var(--color-accent-pink);
		box-shadow: var(--shadow-neon-pink);
	}

	.zen-btn.exit-btn {
		color: var(--color-text-muted);
	}
	.zen-btn.exit-btn:hover {
		color: var(--color-accent-cyan);
	}

	/* Responsive tweaks */
	@media (max-width: 868px) {
		.floating-controls-container {
			bottom: 1rem;
			left: 1rem;
			width: calc(100% - 2rem);
			max-width: none;
		}
		.presets-row {
			max-width: none;
		}
		.controls-drawer {
			max-width: 100%;
			height: 75%;
			top: auto;
			bottom: 0;
			border-left: none;
			border-top: 1px solid var(--color-border);
			border-radius: var(--radius-lg) var(--radius-lg) 0 0;
			transform: translateY(100%);
		}
		.controls-drawer.open {
			transform: translateY(0) translateX(0);
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translate3d(0, 20px, 0);
		}
		to {
			opacity: 1;
			transform: translate3d(0, 0, 0);
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
