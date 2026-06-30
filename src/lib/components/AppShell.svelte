<script lang="ts">
	import VisualBackground from '../visuals/VisualBackground.svelte';
	import PlayerCard from './PlayerCard.svelte';
	import PresetPicker from './PresetPicker.svelte';
	import MusicControls from './MusicControls.svelte';
	import AmbienceControls from './AmbienceControls.svelte';
	import VisualControls from './VisualControls.svelte';
	import SettingsDrawer from './SettingsDrawer.svelte';
	import { Play, Pause, EyeClosed, X, Sliders, Sparkle } from 'phosphor-svelte';

	import { appState } from '../state/stores.svelte';
	import { audioEngine } from '../audio/koalaFiEngine';
	import type { KoalaFiState } from '../state/koalaFiState';

	let isSettingsOpen = $state(false);
	let activePanel = $state<'vibes' | 'tune' | null>(null);
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

	function togglePanel(panel: 'vibes' | 'tune') {
		activePanel = activePanel === panel ? null : panel;
	}

	function handleShellKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			activePanel = null;
		}
	}

	// Refresh settings logs when opening drawer
	$effect(() => {
		if (isSettingsOpen) {
			settingsDrawerRef?.refresh();
		}
	});
</script>

<svelte:window onkeydown={handleShellKeydown} />

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
		<header class="top-status">
			<span class="brand-mark">KoalaFi</span>
			<button class="status-btn" onclick={() => (isSettingsOpen = true)} aria-label="Open settings">
				Settings
			</button>
		</header>

		<div class="sun-stage">
			<PlayerCard
				onOpenSettings={() => (isSettingsOpen = true)}
				onPresetSaved={handlePresetSaved}
				isDrawerOpen={activePanel === 'tune'}
				bind:isZen
			/>
		</div>

		<aside class="side-panel vibes-panel glass-panel" class:open={activePanel === 'vibes'}>
			<div class="panel-header">
				<h3>Vibes</h3>
				<button class="close-panel-btn" onclick={() => (activePanel = null)} aria-label="Close vibes">
					<X size={18} />
				</button>
			</div>
			<div class="panel-content">
				<PresetPicker
					bind:this={presetPickerRef}
					onSelect={handleSelectPreset}
					layout="grid"
				/>
			</div>
		</aside>

		<aside class="side-panel tune-panel glass-panel" class:open={activePanel === 'tune'}>
			<div class="panel-header">
				<h3>Tune</h3>
				<button
					class="close-panel-btn"
					onclick={() => (activePanel = null)}
					aria-label="Close tune controls"
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
		</aside>

		<div class="bottom-actions glass-panel" aria-label="Primary actions">
			<button class:active={activePanel === 'vibes'} onclick={() => togglePanel('vibes')}>
				<Sparkle size={16} />
				<span>Vibes</span>
			</button>
			<button class:active={activePanel === 'tune'} onclick={() => togglePanel('tune')}>
				<Sliders size={16} />
				<span>Tune</span>
			</button>
			<button onclick={() => (isZen = true)}>
				<EyeClosed size={16} />
				<span>Zen</span>
			</button>
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
		inset: 0;
		pointer-events: none;
		z-index: 10;
		display: grid;
		grid-template-columns: minmax(280px, 380px) minmax(300px, 1fr) minmax(300px, 420px);
		grid-template-rows: auto 1fr auto;
		gap: 1rem;
		padding: clamp(1rem, 2.5vw, 2rem);
	}

	.top-status {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		pointer-events: auto;
	}

	.brand-mark {
		color: var(--color-accent-cyan);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.status-btn {
		min-height: 36px;
		padding: 0 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		background: rgba(9, 9, 11, 0.35);
		color: var(--color-text-muted);
		font-size: var(--font-size-xs);
		pointer-events: auto;
	}

	.sun-stage {
		grid-column: 2;
		grid-row: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: auto;
	}

	.side-panel {
		grid-row: 2;
		align-self: center;
		max-height: min(74vh, 720px);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		pointer-events: auto;
		opacity: 0;
		visibility: hidden;
		transform: translateY(16px);
		transition:
			opacity var(--transition-normal),
			transform var(--transition-normal),
			visibility var(--transition-normal);
	}

	.side-panel.open {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
	}

	.vibes-panel {
		grid-column: 1;
	}

	.tune-panel {
		grid-column: 3;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.1rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	.panel-header h3 {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
	}

	.close-panel-btn {
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

	.close-panel-btn:hover {
		background: var(--color-bg-hover);
		color: var(--color-text-primary);
	}

	.panel-content {
		padding: 1rem;
		overflow-y: auto;
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
		padding: 1rem;
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

	.bottom-actions {
		grid-column: 2;
		grid-row: 3;
		justify-self: center;
		display: flex;
		gap: 0.4rem;
		padding: 0.35rem;
		pointer-events: auto;
	}

	.bottom-actions button {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		min-height: 38px;
		padding: 0 0.75rem;
		border-radius: var(--radius-full);
		color: var(--color-text-muted);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
	}

	.bottom-actions button:hover,
	.bottom-actions button.active {
		background: var(--color-bg-hover);
		color: var(--color-text-primary);
	}

	/* Responsive tweaks */
	@media (max-width: 1080px) {
		.app-layout {
			grid-template-columns: minmax(280px, 1fr) minmax(280px, 1fr);
		}

		.sun-stage,
		.bottom-actions {
			grid-column: 1 / -1;
		}

		.side-panel {
			grid-column: 1 / -1;
			justify-self: center;
			width: min(420px, 100%);
		}
	}

	@media (max-width: 720px) {
		.app-layout {
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			padding: 0.85rem;
		}

		.sun-stage {
			flex: 1;
			min-height: 0;
		}

		.side-panel {
			position: fixed;
			left: 0.75rem;
			right: 0.75rem;
			bottom: 0.75rem;
			width: auto;
			max-height: 72vh;
			z-index: 100;
			transform: translateY(calc(100% + 1rem));
			border-radius: var(--radius-lg);
		}

		.side-panel.open {
			transform: translateY(0);
		}

		.bottom-actions {
			align-self: center;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.side-panel,
		.side-panel.open {
			transition: none;
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
