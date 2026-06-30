<script lang="ts">
	import { appState } from '../state/stores.svelte';
	import SliderControl from './SliderControl.svelte';

	const THEMES = [
		{ value: 'sunset', label: 'Sunset Glow' },
		{ value: 'night-rain', label: 'Indigo Rain' },
		{ value: 'minimal-dark', label: 'Minimal Dark' },
		{ value: 'neon-coast', label: 'Neon Coast' }
	];

	const MOTIONS = [
		{ value: 'off', label: 'Static (Save Battery)' },
		{ value: 'calm', label: 'Calm Drifting' },
		{ value: 'reactive', label: 'Reactive Waves' }
	];
</script>

<div class="visual-controls">
	<div class="controls-grid">
		<div class="select-item">
			<label for="visual-theme">Theme Colorway</label>
			<select id="visual-theme" bind:value={appState.state.visual.theme}>
				{#each THEMES as t (t.value)}
					<option value={t.value}>{t.label}</option>
				{/each}
			</select>
		</div>

		<div class="select-item">
			<label for="visual-motion">Animation Motion</label>
			<select id="visual-motion" bind:value={appState.state.visual.motion}>
				{#each MOTIONS as m (m.value)}
					<option value={m.value}>{m.label}</option>
				{/each}
			</select>
		</div>

		<div class="divider"></div>

		<SliderControl
			id="visual-brightness"
			label="Backdrop Brightness"
			bind:value={appState.state.visual.brightness}
		/>
		<SliderControl
			id="visual-glow"
			label="Neon Glow Intensity"
			bind:value={appState.state.visual.glow}
		/>
	</div>
</div>

<style>
	.visual-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.controls-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.select-item {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.select-item label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		font-weight: var(--font-weight-medium);
	}

	.select-item select {
		background: var(--color-bg-input);
		border: 1px solid var(--color-border);
		padding: 0.5rem;
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
		cursor: pointer;
		width: 100%;
	}

	.select-item select:focus-visible {
		border-color: var(--color-accent-cyan);
	}

	.divider {
		height: 1px;
		background: var(--color-border);
		margin: 0.25rem 0;
	}
</style>
