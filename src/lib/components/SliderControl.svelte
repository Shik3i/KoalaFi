<script lang="ts">
	// Svelte 5 Runes for component properties
	let {
		id,
		label,
		value = $bindable(0.5),
		min = 0,
		max = 1,
		step = 0.05,
		formatter = (v: number) => Math.round(v * 100) + '%'
	} = $props();
</script>

<div class="slider-control">
	<div class="slider-header">
		<label for={id}>{label}</label>
		<span class="slider-value">{formatter(value)}</span>
	</div>
	<input type="range" {id} {min} {max} {step} bind:value class="slider-input" />
</div>

<style>
	.slider-control {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		width: 100%;
		margin-bottom: 0.75rem;
	}

	.slider-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-weight: var(--font-weight-medium);
	}

	.slider-header label {
		cursor: pointer;
	}

	.slider-value {
		font-family: monospace;
		color: var(--color-accent-cyan);
		font-weight: var(--font-weight-semibold);
	}

	.slider-input {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 6px;
		border-radius: var(--radius-full);
		background: var(--color-bg-input);
		outline: none;
		transition: background var(--transition-fast);
	}

	/* Custom input range thumb styling */
	.slider-input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: var(--radius-full);
		background: var(--color-text-primary);
		cursor: pointer;
		border: 2px solid var(--color-bg-base);
		box-shadow: var(--shadow-sm);
		transition:
			background var(--transition-fast),
			transform var(--transition-fast);
	}

	.slider-input::-webkit-slider-thumb:hover {
		background: var(--color-accent-cyan);
		transform: scale(1.1);
	}

	.slider-input::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: var(--radius-full);
		background: var(--color-text-primary);
		cursor: pointer;
		border: 2px solid var(--color-bg-base);
		box-shadow: var(--shadow-sm);
		transition:
			background var(--transition-fast),
			transform var(--transition-fast);
	}

	.slider-input::-moz-range-thumb:hover {
		background: var(--color-accent-cyan);
		transform: scale(1.1);
	}
</style>
