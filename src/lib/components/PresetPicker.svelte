<script lang="ts">
	import { onMount } from 'svelte';
	import { BUILT_IN_PRESETS, type BuiltInPreset } from '../state/presets';
	import { getAllPresets, deletePreset, type UserPresetRecord } from '../storage/presetsRepository';
	import { appState } from '../state/stores.svelte';
	import { Trash, Sparkle, Heart } from 'phosphor-svelte';
	import type { KoalaFiState } from '../state/koalaFiState';

	// Svelte 5 component props
	let { onSelect } = $props<{ onSelect: (state: KoalaFiState) => void }>();

	let userPresets = $state<UserPresetRecord[]>([]);

	async function loadUserPresets() {
		userPresets = await getAllPresets();
	}

	async function handleDelete(id: string, event: Event) {
		event.stopPropagation();
		if (confirm('Delete this preset?')) {
			await deletePreset(id);
			await loadUserPresets();
		}
	}

	function handleSelect(preset: BuiltInPreset | UserPresetRecord) {
		onSelect(preset.state);
	}

	// Reload user presets whenever they are modified or saved
	export async function refresh() {
		await loadUserPresets();
	}

	onMount(() => {
		loadUserPresets();
	});
</script>

<div class="preset-picker">
	<section class="preset-section">
		<h3>Built-in Vibes</h3>
		<div class="preset-grid">
			{#each BUILT_IN_PRESETS as preset (preset.id)}
				<button
					class="preset-button"
					class:active={appState.state.presetId === preset.id}
					onclick={() => handleSelect(preset)}
				>
					<div class="preset-icon">
						<Sparkle
							size={16}
							weight={appState.state.presetId === preset.id ? 'fill' : 'regular'}
						/>
					</div>
					<div class="preset-info">
						<span class="preset-name">{preset.name}</span>
						<span class="preset-category">{preset.category}</span>
					</div>
				</button>
			{/each}
		</div>
	</section>

	{#if userPresets.length > 0}
		<section class="preset-section">
			<h3>Your Presets</h3>
			<div class="preset-grid">
				{#each userPresets as preset (preset.id)}
					<div class="preset-item-wrapper">
						<button
							class="preset-button user-preset"
							class:active={appState.state.presetId === preset.id}
							onclick={() => handleSelect(preset)}
						>
							<div class="preset-icon user-icon">
								<Heart size={16} weight="fill" />
							</div>
							<div class="preset-info">
								<span class="preset-name">{preset.name}</span>
								<span class="preset-category">{preset.category}</span>
							</div>
						</button>
						<button
							class="delete-btn"
							aria-label="Delete preset"
							onclick={(e) => handleDelete(preset.id, e)}
						>
							<Trash size={16} />
						</button>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.preset-picker {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-height: 400px;
		overflow-y: auto;
		padding-right: 4px;
	}

	.preset-section h3 {
		font-size: var(--font-size-xs);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
		font-weight: var(--font-weight-bold);
	}

	.preset-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.65rem;
	}

	@media (max-width: 480px) {
		.preset-grid {
			grid-template-columns: 1fr;
		}
	}

	.preset-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: var(--radius-md);
		background: var(--color-bg-input);
		border: 1px solid var(--color-border);
		text-align: left;
		transition: var(--transition-fast);
		position: relative;
	}

	.preset-button:hover {
		background: var(--color-bg-hover);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.preset-button.active {
		background: rgba(6, 182, 212, 0.1);
		border-color: var(--color-accent-cyan);
		box-shadow: var(--shadow-neon-cyan);
	}

	.preset-button.active .preset-name {
		color: var(--color-accent-cyan);
	}

	.preset-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		background: rgba(255, 255, 255, 0.05);
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.preset-button.active .preset-icon {
		background: rgba(6, 182, 212, 0.15);
		color: var(--color-accent-cyan);
	}

	.preset-info {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.preset-name {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.preset-category {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: capitalize;
		margin-top: 1px;
	}

	.preset-item-wrapper {
		position: relative;
		display: flex;
		width: 100%;
	}

	.preset-item-wrapper .preset-button {
		width: 100%;
	}

	.user-preset {
		padding-right: 2.25rem;
	}

	.user-icon {
		color: var(--color-accent-pink);
	}

	.preset-button.active.user-preset {
		background: rgba(236, 72, 153, 0.08);
		border-color: var(--color-accent-pink);
		box-shadow: var(--shadow-neon-pink);
	}

	.preset-button.active.user-preset .preset-name {
		color: var(--color-accent-pink);
	}

	.delete-btn {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		transition: var(--transition-fast);
		opacity: 0.7;
	}

	.delete-btn:hover {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		opacity: 1;
	}
</style>
