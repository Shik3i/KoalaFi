<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import AppShell from '../lib/components/AppShell.svelte';
	import { appState } from '../lib/state/stores.svelte';
	import { getStateFromUrl } from '../lib/share/urlState';
	import { disposeAudioEngineIfLoaded } from '../lib/audio/engineLoader';

	onMount(() => {
		if (typeof window === 'undefined') return;

		// Check for shared vibe in URL
		const urlState = getStateFromUrl(window.location.href);

		if (urlState) {
			// Decode, validate, and load shared state
			appState.loadState(urlState);
			console.log('Successfully loaded shared vibe from URL:', appState.state.title);

			// Clear query params from location bar for a clean URL
			const cleanUrl = window.location.origin + window.location.pathname;
			window.history.replaceState({}, document.title, cleanUrl);
		}
	});

	onDestroy(() => {
		// Stop and clean up Tone.js nodes on unmount to prevent leaks
		disposeAudioEngineIfLoaded();
	});
</script>

<AppShell />
