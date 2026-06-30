<script lang="ts">
	import VisualBackground from '../visuals/VisualBackground.svelte';
	import PlayerCard from './PlayerCard.svelte';
	import PresetPicker from './PresetPicker.svelte';
	import MusicControls from './MusicControls.svelte';
	import AmbienceControls from './AmbienceControls.svelte';
	import VisualControls from './VisualControls.svelte';
	import SettingsDrawer from './SettingsDrawer.svelte';

	import { appState } from '../state/stores.svelte';
	import { audioEngine } from '../audio/koalaFiEngine';
	import type { KoalaFiState } from '../state/koalaFiState';

	let isSettingsOpen = $state(false);
	let activeTab = $state<'music' | 'ambience' | 'visuals'>('music');

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

	// Refresh settings logs when opening drawer
	$effect(() => {
		if (isSettingsOpen) {
			settingsDrawerRef?.refresh();
		}
	});
</script>

<VisualBackground />

<div class="app-layout">
	<main class="app-content">
		<!-- Left column: Branding, Playback Card, Presets -->
		<div class="left-column">
			<PlayerCard
				onOpenSettings={() => (isSettingsOpen = true)}
				onPresetSaved={handlePresetSaved}
			/>

			<div class="presets-container glass-panel">
				<PresetPicker bind:this={presetPickerRef} onSelect={handleSelectPreset} />
			</div>
		</div>

		<!-- Right column: Tabbed settings panels (Music / Ambience / Visuals) -->
		<div class="right-column glass-panel">
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
	</main>
</div>

<!-- Drawer Menu overlays -->
<SettingsDrawer
	bind:this={settingsDrawerRef}
	bind:isOpen={isSettingsOpen}
	onSelectVibe={handleSelectVibeFromHistory}
/>

<style>
	.app-layout {
		position: relative;
		width: 100%;
		min-height: 100vh;
		z-index: 10;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem 1.5rem;
		overflow-y: auto;
	}

	.app-content {
		display: grid;
		grid-template-columns: 380px 420px;
		gap: 2rem;
		width: 100%;
		max-width: 900px;
		margin: auto;
		align-items: start;
	}

	/* Responsive styling breakpoints */
	@media (max-width: 868px) {
		.app-content {
			grid-template-columns: 1fr;
			max-width: 480px;
			gap: 1.5rem;
		}
	}

	.left-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.presets-container {
		padding: 1.25rem;
	}

	.right-column {
		display: flex;
		flex-direction: column;
		min-height: 520px;
		height: 100%;
	}

	@media (max-width: 868px) {
		.right-column {
			min-height: auto;
		}
	}

	.tabs-nav {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-bottom: 1px solid var(--color-border);
	}

	.tab-btn {
		padding: 1rem 0;
		text-align: center;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-muted);
		border-bottom: 2px solid transparent;
		transition: var(--transition-fast);
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
		max-height: 580px;
	}

	@media (max-width: 868px) {
		.tab-content {
			max-height: none;
			overflow-y: visible;
		}
	}

	.tab-pane {
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
