<script lang="ts">
	import { tick } from 'svelte';
	import VisualBackground from '../visuals/VisualBackground.svelte';
	import SunPlayer from './SunPlayer.svelte';
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
	let activePanel = $state<'vibes' | 'tune' | null>(null);
	let isZen = $state(false);
	let activeTab = $state<'music' | 'ambience' | 'visuals'>('music');
	let vibesPanelRef = $state<HTMLElement | null>(null);
	let tunePanelRef = $state<HTMLElement | null>(null);

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

	$effect(() => {
		const panel = activePanel;
		if (!panel) return;

		tick().then(() => {
			(panel === 'vibes' ? vibesPanelRef : tunePanelRef)?.focus();
		});
	});

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
		<div class="sun-stage">
			<SunPlayer
				onOpenSettings={() => (isSettingsOpen = true)}
				onOpenPanel={togglePanel}
				onPresetSaved={handlePresetSaved}
				bind:isZen
			/>
		</div>

		<aside
			bind:this={vibesPanelRef}
			class="side-panel vibes-panel glass-panel"
			class:open={activePanel === 'vibes'}
			aria-label="Vibes panel"
			tabindex="-1"
		>
			<div class="panel-header">
				<h3>Vibes</h3>
				<button
					class="close-panel-btn"
					onclick={() => (activePanel = null)}
					aria-label="Close vibes"
				>
					<X size={18} />
				</button>
			</div>
			<div class="panel-content">
				<PresetPicker bind:this={presetPickerRef} onSelect={handleSelectPreset} layout="grid" />
			</div>
		</aside>

		<aside
			bind:this={tunePanelRef}
			class="side-panel tune-panel glass-panel"
			class:open={activePanel === 'tune'}
			aria-label="Tune controls panel"
			tabindex="-1"
		>
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
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(1rem, 2.5vw, 2rem);
	}

	.sun-stage {
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: auto;
		transform: translateY(-2vh);
	}

	.side-panel {
		position: fixed;
		top: 50%;
		width: clamp(300px, 27vw, 380px);
		max-height: min(74vh, 720px);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		pointer-events: auto;
		opacity: 0;
		visibility: hidden;
		transform: translateY(calc(-50% + 16px));
		transition:
			opacity var(--transition-normal),
			transform var(--transition-normal),
			visibility var(--transition-normal);
	}

	.side-panel.open {
		opacity: 1;
		visibility: visible;
		transform: translateY(-50%);
	}

	.vibes-panel {
		right: calc(50% + clamp(230px, 21vw, 285px));
		border-radius: var(--radius-lg) var(--radius-sm) var(--radius-sm) var(--radius-lg);
	}

	.tune-panel {
		left: calc(50% + clamp(230px, 21vw, 285px));
		border-radius: var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-sm);
	}

	.vibes-panel::after,
	.tune-panel::after {
		content: '';
		position: absolute;
		top: 50%;
		width: 44px;
		height: 44px;
		border-radius: var(--radius-full);
		background: radial-gradient(circle, rgba(245, 158, 11, 0.2), rgba(236, 72, 153, 0.05) 70%);
		box-shadow: 0 0 34px rgba(236, 72, 153, 0.16);
		transform: translateY(-50%);
		pointer-events: none;
	}

	.vibes-panel::after {
		right: -22px;
	}

	.tune-panel::after {
		left: -22px;
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

	.side-panel:focus {
		outline: none;
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

	/* Responsive tweaks */
	@media (max-width: 1180px) {
		.side-panel {
			left: 50%;
			right: auto;
			width: min(420px, 100%);
			transform: translate(-50%, calc(-50% + 16px));
			border-radius: var(--radius-lg);
		}

		.side-panel.open {
			transform: translate(-50%, -50%);
		}

		.vibes-panel::after,
		.tune-panel::after {
			display: none;
		}
	}

	@media (max-width: 720px) {
		.app-layout {
			display: flex;
			flex-direction: column;
			justify-content: center;
			padding: 0.85rem;
		}

		.sun-stage {
			min-height: 0;
			transform: translateY(-4vh);
		}

		.side-panel {
			position: fixed;
			left: 0.75rem;
			right: 0.75rem;
			bottom: 0.75rem;
			top: auto;
			width: auto;
			max-height: min(72vh, 680px);
			max-width: none;
			z-index: 100;
			transform: translateY(calc(100% + 1rem));
			border-radius: var(--radius-lg);
			box-shadow: 0 -18px 60px rgba(0, 0, 0, 0.46);
		}

		.side-panel.open {
			transform: translateY(0);
		}

		.side-panel::before {
			content: '';
			width: 38px;
			height: 4px;
			margin: 0.55rem auto 0;
			border-radius: var(--radius-full);
			background: rgba(255, 255, 255, 0.2);
			flex: 0 0 auto;
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
