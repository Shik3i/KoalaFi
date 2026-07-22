<script lang="ts">
	import '../lib/styles/tokens.css';
	import '../lib/styles/global.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>KoalaFi - Endless Procedural Lofi & Ambient Noise</title>
	<meta
		name="description"
		content="Endless browser-generated lofi and ambient noise. 100% offline-first procedural soundscapes. No tracking, no accounts."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<meta name="theme-color" content="#09090b" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="icon" href="/icons/koalafi-icon.png" type="image/png" />
</svelte:head>

{@render children()}
