<script lang="ts">
	import type { AudioQualityMetrics } from '$lib/audio/audioQuality';
	import { renderBassAudit, renderMelodyAudit } from '$lib/audio/offlineAnalysis';
	import { DEFAULT_STATE } from '$lib/state/defaults';

	let metrics = $state<AudioQualityMetrics | null>(null);
	let bassMetrics = $state<AudioQualityMetrics | null>(null);
	let auditError = $state('');

	async function runOfflineAudit() {
		auditError = '';
		try {
			const music = {
				...DEFAULT_STATE.music,
				melody: 0.9,
				sleepy: 0.1
			};
			[metrics, bassMetrics] = await Promise.all([
				renderMelodyAudit('playwright-offline-audit', music),
				renderBassAudit('playwright-offline-audit', music)
			]);
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
	{#if bassMetrics}
		<output data-testid="bass-audio-metrics">{JSON.stringify(bassMetrics)}</output>
	{/if}
	{#if auditError}
		<p role="alert">{auditError}</p>
	{/if}
</main>
