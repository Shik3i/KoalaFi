<script lang="ts">
	import { tick } from 'svelte';
	import VisualBackground from '../visuals/VisualBackground.svelte';
	import SunPlayer from './SunPlayer.svelte';
	import PresetPicker from './PresetPicker.svelte';
	import MusicControls from './MusicControls.svelte';
	import AmbienceControls from './AmbienceControls.svelte';
	import VisualControls from './VisualControls.svelte';
	import SettingsDrawer from './SettingsDrawer.svelte';
	import EyeClosed from 'phosphor-svelte/lib/EyeClosed';
	import Pause from 'phosphor-svelte/lib/Pause';
	import Play from 'phosphor-svelte/lib/Play';
	import X from 'phosphor-svelte/lib/X';

	import { appState } from '../state/stores.svelte';
	import { getAudioEngine, getLoadedAudioEngine } from '../audio/engineLoader';
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
			getLoadedAudioEngine()?.applyState(appState.state);
		}
	}

	function handlePresetSaved() {
		presetPickerRef?.refresh();
	}

	function handleSelectVibeFromHistory(historyState: KoalaFiState) {
		appState.loadState(historyState);
		if (appState.state.music.enabled) {
			getLoadedAudioEngine()?.applyState(appState.state);
		}
	}

	async function handlePlayToggle() {
		try {
			const audioEngine = await getAudioEngine();
			const nowPlaying = await audioEngine.togglePlayback(appState.state);
			appState.updateState((s) => {
				s.music.enabled = nowPlaying;
			});
			audioEngine.applyState(appState.state);
		} catch (err) {
			console.error('Audio initialization failure in Zen mode:', err);
		}
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

	$effect(() => {
		if (isZen) {
			activePanel = null;
		}
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

<div class="app-layout" class:zen-active={isZen} data-mode={isZen ? 'zen' : 'default'}>
	<div class="sun-stage">
		<SunPlayer
			onOpenSettings={() => (isSettingsOpen = true)}
			onOpenPanel={togglePanel}
			onPresetSaved={handlePresetSaved}
			bind:isZen
		/>
	</div>

	{#if !isZen}
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
	{/if}
</div>

{#if isZen}
	<div class="zen-mode-container">
		<div class="zen-pill glass-panel">
			<span class="zen-logo"><span>Koala</span><span>Fi</span></span>
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
{/if}

<!-- Drawer Menu overlays -->
<SettingsDrawer
	bind:this={settingsDrawerRef}
	bind:isOpen={isSettingsOpen}
	onSelectVibe={handleSelectVibeFromHistory}
/>

<style>
	.app-layout {
		--scene-center-x: 50vw;
		--scene-sun: clamp(224px, 21vw, 292px);
		--scene-sun-y: clamp(304px, 42dvh, 430px);
		--scene-horizon-y: calc(var(--scene-sun-y) + var(--scene-sun) * 0.22);
		--scene-title-gap: clamp(4.8rem, 9dvh, 6.9rem);
		--scene-header-y: clamp(1.35rem, 4.7dvh, 3.35rem);
		--scene-panel-y: var(--scene-sun-y);
		--scene-panel-width: clamp(340px, 30vw, 440px);
		--scene-panel-overlap: clamp(28px, 3vw, 42px);
		--panel-bite: calc(var(--scene-sun) / 2);
		--panel-bite-offset: calc(var(--panel-bite) - var(--scene-panel-overlap));
		--panel-notch-gutter: calc(var(--scene-panel-overlap) + 1.25rem);
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 10;
	}

	.sun-stage {
		position: absolute;
		top: calc(var(--scene-sun-y) - var(--scene-sun) / 2);
		left: 0;
		right: 0;
		z-index: 2;
		width: min(88vw, 520px);
		margin-inline: auto;
		pointer-events: auto;
	}

	.side-panel {
		position: fixed;
		top: var(--scene-panel-y);
		z-index: 3;
		width: var(--scene-panel-width);
		max-height: min(54vh, 500px);
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
		right: calc(100vw - var(--scene-center-x) + var(--scene-sun) / 2 - var(--scene-panel-overlap));
		border-radius: var(--radius-lg);
		box-shadow:
			28px 0 55px rgba(251, 191, 36, 0.12),
			var(--shadow-lg);
		-webkit-mask-image: radial-gradient(
			circle var(--panel-bite) at calc(100% + var(--panel-bite-offset)) 50%,
			transparent calc(var(--panel-bite) - 1px),
			#000 var(--panel-bite)
		);
		mask-image: radial-gradient(
			circle var(--panel-bite) at calc(100% + var(--panel-bite-offset)) 50%,
			transparent calc(var(--panel-bite) - 1px),
			#000 var(--panel-bite)
		);
	}

	.tune-panel {
		left: calc(var(--scene-center-x) + var(--scene-sun) / 2 - var(--scene-panel-overlap));
		border-radius: var(--radius-lg);
		box-shadow:
			-28px 0 55px rgba(251, 191, 36, 0.12),
			var(--shadow-lg);
		-webkit-mask-image: radial-gradient(
			circle var(--panel-bite) at calc(var(--panel-bite-offset) * -1) 50%,
			transparent calc(var(--panel-bite) - 1px),
			#000 var(--panel-bite)
		);
		mask-image: radial-gradient(
			circle var(--panel-bite) at calc(var(--panel-bite-offset) * -1) 50%,
			transparent calc(var(--panel-bite) - 1px),
			#000 var(--panel-bite)
		);
	}

	.vibes-panel::before,
	.tune-panel::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		width: 42%;
		pointer-events: none;
	}

	.vibes-panel::before {
		right: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 222, 118, 0.07));
	}

	.tune-panel::before {
		left: 0;
		background: linear-gradient(90deg, rgba(255, 222, 118, 0.07), transparent);
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

	.vibes-panel .panel-content {
		padding-right: var(--panel-notch-gutter);
	}

	.vibes-panel :global(.preset-grid) {
		grid-template-columns: 1fr;
	}

	.tune-panel .panel-header,
	.tune-panel .tabs-nav,
	.tune-panel .tab-content {
		padding-left: var(--panel-notch-gutter);
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
		border: 1px solid rgba(246, 223, 178, 0.16);
		box-shadow:
			0 4px 20px rgba(0, 0, 0, 0.3),
			0 0 28px rgba(242, 207, 143, 0.08);
		animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.zen-logo {
		display: inline-flex;
		font-size: 11px;
		font-weight: var(--font-weight-bold);
		color: var(--brand-logo);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.zen-logo span:last-child {
		color: var(--brand-logo-muted);
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
			-webkit-mask-image: none;
			mask-image: none;
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
			--scene-sun: clamp(184px, 61vw, 248px);
			--scene-sun-y: clamp(250px, 34dvh, 320px);
			--scene-title-gap: clamp(6rem, 12dvh, 7rem);
			--scene-header-y: 1.25rem;
		}

		.sun-stage {
			top: calc(var(--scene-sun-y) - var(--scene-sun) / 2);
			width: min(calc(100vw - 1.5rem), 390px);
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
			background: #0d0f18;
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
			box-shadow: 0 -18px 60px rgba(0, 0, 0, 0.46);
		}

		.side-panel.open {
			transform: translateY(0);
		}

		.side-panel::before {
			content: '';
			position: static;
			display: block;
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
