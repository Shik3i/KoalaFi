<script lang="ts">
	import { onMount } from 'svelte';
	import { BUILT_IN_PRESETS, type BuiltInPreset } from '../state/presets';
	import { getAllPresets, deletePreset, type UserPresetRecord } from '../storage/presetsRepository';
	import { appState } from '../state/stores.svelte';
	import { Trash, Sparkle, Heart } from 'phosphor-svelte';
	import type { KoalaFiState } from '../state/koalaFiState';

	// Svelte 5 component props
	let { onSelect, layout = 'grid' } = $props<{
		onSelect: (state: KoalaFiState) => void;
		layout?: 'grid' | 'horizontal';
	}>();

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

<div class="preset-picker" class:layout-horizontal={layout === 'horizontal'}>
	{#if layout === 'horizontal'}
		<div class="preset-horizontal-strip" aria-label="Presets strip">
			{#each BUILT_IN_PRESETS as preset (preset.id)}
				<button
					class="preset-chip"
					class:active={appState.state.presetId === preset.id}
					onclick={() => handleSelect(preset)}
					title="{preset.name} ({preset.category})"
				>
					<Sparkle size={12} weight={appState.state.presetId === preset.id ? 'fill' : 'regular'} />
					<span>{preset.name}</span>
				</button>
			{/each}

			{#each userPresets as preset (preset.id)}
				<div class="preset-chip-wrapper">
					<button
						class="preset-chip user-chip"
						class:active={appState.state.presetId === preset.id}
						onclick={() => handleSelect(preset)}
						title={preset.name}
					>
						<Heart size={12} weight="fill" />
						<span>{preset.name}</span>
					</button>
					<button
						class="chip-delete-btn"
						onclick={(e) => handleDelete(preset.id, e)}
						aria-label="Delete preset"
					>
						<Trash size={11} />
					</button>
				</div>
			{/each}
		</div>
	{:else}
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
								</div>
							</button>
							<button
								class="delete-btn"
								onclick={(e) => handleDelete(preset.id, e)}
								aria-label="Delete preset"
							>
								<Trash size={16} />
							</button>
						</div>
					{/each}
				</div>
			</section>
		{/if}
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

	.preset-picker.layout-horizontal {
		max-height: none;
		overflow-y: visible;
		padding-right: 0;
	}

	/* Horizontal strip styles */
	.preset-horizontal-strip {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		padding: 0.25rem 0.25rem 0.5rem 0.25rem;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
	}
	.preset-horizontal-strip::-webkit-scrollbar {
		height: 4px;
	}
	.preset-horizontal-strip::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
	}

	.preset-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.75rem;
		border-radius: var(--radius-full);
		border: 1px solid var(--color-border);
		background: rgba(15, 23, 42, 0.4);
		color: var(--color-text-muted);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		white-space: nowrap;
		transition: var(--transition-fast);
		cursor: pointer;
	}
	.preset-chip:hover {
		background: var(--color-bg-hover);
		color: var(--color-text-primary);
		border-color: rgba(255, 255, 255, 0.15);
	}
	.preset-chip.active {
		background: rgba(6, 182, 212, 0.12);
		color: var(--color-accent-cyan);
		border-color: var(--color-accent-cyan);
		box-shadow: var(--shadow-neon-cyan);
	}
	.preset-chip.active.user-chip {
		background: rgba(236, 72, 153, 0.12);
		color: var(--color-accent-pink);
		border-color: var(--color-accent-pink);
		box-shadow: var(--shadow-neon-pink);
	}
	.preset-chip-wrapper {
		position: relative;
		display: inline-flex;
		align-items: center;
	}
	.preset-chip-wrapper .preset-chip {
		padding-right: 1.6rem;
	}
	.chip-delete-btn {
		position: absolute;
		right: 0.45rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-text-muted);
		opacity: 0.6;
		transition: var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		padding: 2px;
		cursor: pointer;
	}
	.chip-delete-btn:hover {
		color: var(--color-accent-pink);
		opacity: 1;
	}

	/* Existing Grid Styles */
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
		width: 100%;
		cursor: pointer;
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

	.preset-button.active.user-preset .preset-icon {
		background: rgba(236, 72, 153, 0.15);
		color: var(--color-accent-pink);
	}

	.delete-btn {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-fast);
		z-index: 2;
		border: none;
		background: transparent;
		cursor: pointer;
	}

	.delete-btn:hover {
		background: var(--color-bg-hover);
		color: var(--color-accent-pink);
	}
</style>
