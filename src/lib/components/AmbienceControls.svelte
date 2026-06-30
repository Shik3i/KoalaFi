<script lang="ts">
	import { appState } from '../state/stores.svelte';
	import { audioEngine } from '../audio/koalaFiEngine';
	import SliderControl from './SliderControl.svelte';

	function syncEngine() {
		audioEngine.applyState(appState.state);
	}

	$effect(() => {
		// Deep track all ambience properties reactively
		JSON.stringify(appState.state.ambience);
		syncEngine();
	});
</script>

<div class="ambience-controls">
	<div class="controls-section">
		<h4>Natural Textures</h4>
		<SliderControl
			id="ambience-rain"
			label="Rain Shower"
			bind:value={appState.state.ambience.rain}
		/>
		<SliderControl
			id="ambience-ocean"
			label="Ocean Waves"
			bind:value={appState.state.ambience.ocean}
		/>
		<SliderControl
			id="ambience-wind"
			label="Howling Wind"
			bind:value={appState.state.ambience.wind}
		/>
		<SliderControl
			id="ambience-vinyl"
			label="Vinyl Crackle"
			bind:value={appState.state.ambience.vinyl}
		/>
	</div>

	<div class="divider"></div>

	<div class="controls-section">
		<h4>Colored Noise</h4>
		<SliderControl
			id="noise-white"
			label="White Noise (Static)"
			bind:value={appState.state.ambience.whiteNoise}
		/>
		<SliderControl
			id="noise-pink"
			label="Pink Noise (Waterfall)"
			bind:value={appState.state.ambience.pinkNoise}
		/>
		<SliderControl
			id="noise-brown"
			label="Brown Noise (Deep Rumble)"
			bind:value={appState.state.ambience.brownNoise}
		/>
	</div>
</div>

<style>
	.ambience-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.controls-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	h4 {
		font-size: var(--font-size-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: 0.5rem;
	}

	.divider {
		height: 1px;
		background: var(--color-border);
		margin: 0.5rem 0;
	}
</style>
