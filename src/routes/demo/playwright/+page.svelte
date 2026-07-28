<script lang="ts">
	import type { AudioQualityMetrics } from '$lib/audio/audioQuality';
	import { renderMelodyAudit } from '$lib/audio/offlineAnalysis';
	import { DEFAULT_STATE } from '$lib/state/defaults';

	let metrics = $state<AudioQualityMetrics | null>(null);
	let auditError = $state('');

	async function runOfflineAudit() {
		auditError = '';
		try {
			metrics = await renderMelodyAudit('playwright-offline-audit', {
				...DEFAULT_STATE.music,
				melody: 0.9,
				sleepy: 0.1
			});
		} catch (error) {
			auditError = error instanceof Error ? error.message : String(error);
		}
	}
</script>

<svelte:head>
	<title>KoalaFi audio QA</title>
</svelte:head>

<main>
	<h1>KoalaFi audio QA</h1>
	<button onclick={runOfflineAudit}>Run offline melody audit</button>
	{#if metrics}
		<output data-testid="audio-metrics">{JSON.stringify(metrics)}</output>
	{/if}
	{#if auditError}
		<p role="alert">{auditError}</p>
	{/if}
</main>
