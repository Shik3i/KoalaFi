<script lang="ts">
	import { appState } from '../state/stores.svelte';
	import { audioEngine } from '../audio/koalaFiEngine';
	import SliderControl from './SliderControl.svelte';
	import ToggleControl from './ToggleControl.svelte';

	const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const SCALES = ['minor', 'major', 'pentatonic', 'dorian'];

	// React to change events to update the Tone.js audio engine state
	function syncEngine() {
		audioEngine.applyState(appState.state);
	}

	// Svelte 5 effect to watch state mutations and apply to Tone.js
	$effect(() => {
		// Reference variables to trigger dependency tracking
		const m = appState.state.music;
		if (m.enabled !== undefined && m.bpm !== undefined && m.key !== undefined) {
			syncEngine();
		}
	});
</script>

<div class="music-controls">
	<div class="controls-header">
		<ToggleControl
			id="music-enabled"
			label="Procedural Music"
			bind:checked={appState.state.music.enabled}
		/>
	</div>

	{#if appState.state.music.enabled}
		<div class="controls-grid">
			<!-- Musical key and scale configuration -->
			<div class="select-group">
				<div class="select-item">
					<label for="music-key">Key</label>
					<select id="music-key" bind:value={appState.state.music.key}>
						{#each KEYS as k (k)}
							<option value={k}>{k}</option>
						{/each}
					</select>
				</div>
				<div class="select-item">
					<label for="music-scale">Scale</label>
					<select id="music-scale" bind:value={appState.state.music.scale}>
						{#each SCALES as s (s)}
							<option value={s}>{s}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- BPM slider -->
			<SliderControl
				id="music-bpm"
				label="Tempo (BPM)"
				bind:value={appState.state.music.bpm}
				min={50}
				max={110}
				step={1}
				formatter={(v: number) => `${v} bpm`}
			/>

			<div class="divider"></div>

			<!-- Track Level mix parameters -->
			<h4>Vibe Mix</h4>
			<SliderControl
				id="music-melody"
				label="Melody Complexity"
				bind:value={appState.state.music.melody}
			/>
			<SliderControl
				id="music-chords"
				label="Rhodes Chords"
				bind:value={appState.state.music.chords}
			/>
			<SliderControl id="music-bass" label="Sub Bass" bind:value={appState.state.music.bass} />
			<SliderControl id="music-drums" label="Drums Beat" bind:value={appState.state.music.drums} />

			<div class="divider"></div>

			<!-- Mood parameters -->
			<h4>Mood Settings</h4>
			<SliderControl
				id="music-focus"
				label="Focus (Lead Cutoff)"
				bind:value={appState.state.music.focus}
			/>
			<SliderControl
				id="music-cozy"
				label="Cozy (Keys Warmth)"
				bind:value={appState.state.music.cozy}
			/>
			<SliderControl
				id="music-sleepy"
				label="Sleepy (Lowpass Filter)"
				bind:value={appState.state.music.sleepy}
			/>
			<SliderControl
				id="music-energy"
				label="Energy (Drum Snap)"
				bind:value={appState.state.music.energy}
			/>
		</div>
	{/if}
</div>

<style>
	.music-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.controls-header {
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.controls-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.select-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
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

	h4 {
		font-size: var(--font-size-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-top: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.divider {
		height: 1px;
		background: var(--color-border);
		margin: 0.5rem 0;
	}
</style>
