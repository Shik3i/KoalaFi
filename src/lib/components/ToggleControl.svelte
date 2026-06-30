<script lang="ts">
	let { id, label, checked = $bindable(false) } = $props();
</script>

<div class="toggle-control">
	<label class="toggle-label" for={id}>{label}</label>
	<label class="switch" for={id}>
		<input type="checkbox" {id} bind:checked />
		<span class="slider"></span>
	</label>
</div>

<style>
	.toggle-control {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		margin-bottom: 0.75rem;
	}

	.toggle-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-weight: var(--font-weight-medium);
	}

	/* Switch layout styling */
	.switch {
		position: relative;
		display: inline-block;
		width: 40px;
		height: 20px;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--color-bg-input);
		transition: var(--transition-normal);
		border-radius: var(--radius-full);
	}

	.slider::before {
		position: absolute;
		content: '';
		height: 14px;
		width: 14px;
		left: 3px;
		bottom: 3px;
		background-color: var(--color-text-primary);
		transition: var(--transition-normal);
		border-radius: var(--radius-full);
	}

	input:checked + .slider {
		background-color: var(--color-accent-cyan);
	}

	input:checked + .slider::before {
		transform: translateX(20px);
		background-color: var(--color-bg-base);
	}
</style>
