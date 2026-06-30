<script lang="ts">
	import { savePreset } from '../storage/presetsRepository';
	import { appState } from '../state/stores.svelte';
	import { FloppyDisk, X } from 'phosphor-svelte';

	// Svelte 5 component props
	let { isOpen = $bindable(false), onSaved } = $props<{
		isOpen: boolean;
		onSaved: () => void;
	}>();

	let presetName = $state('');
	let category = $state<'focus' | 'relax' | 'sleep' | 'ambient' | 'synthwave'>('focus');
	let dialogElement = $state<HTMLDialogElement | null>(null);

	// Watch isOpen prop to trigger native dialog show/close
	$effect(() => {
		if (!dialogElement) return;
		if (isOpen) {
			if (!dialogElement.open) {
				dialogElement.showModal();
				presetName = appState.state.title || '';
			}
		} else {
			if (dialogElement.open) {
				dialogElement.close();
			}
		}
	});

	async function handleSave() {
		if (!presetName.trim()) {
			alert('Please enter a preset name');
			return;
		}

		const id = `user-${Date.now()}`;
		const savedState = JSON.parse(JSON.stringify(appState.state));
		savedState.presetId = id;
		savedState.title = presetName;

		await savePreset({
			id,
			name: presetName,
			category,
			state: savedState,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			source: 'user'
		});

		// Update active state titles
		appState.updateState((s) => {
			s.presetId = id;
			s.title = presetName;
		});

		isOpen = false;
		onSaved();
	}

	function handleClose() {
		isOpen = false;
	}
</script>

<dialog
	bind:this={dialogElement}
	class="save-dialog glass-panel"
	onclose={handleClose}
	onclick={(e) => e.target === dialogElement && handleClose()}
>
	<div class="dialog-header">
		<h3>Save Custom Vibe</h3>
		<button class="close-btn" onclick={handleClose} aria-label="Close dialog">
			<X size={18} />
		</button>
	</div>

	<div class="dialog-body">
		<div class="input-group">
			<label for="save-preset-name">Preset Name</label>
			<input
				type="text"
				id="save-preset-name"
				bind:value={presetName}
				placeholder="My Relax Vibe..."
				maxlength="40"
			/>
		</div>

		<div class="input-group">
			<label for="save-preset-category">Category</label>
			<select id="save-preset-category" bind:value={category}>
				<option value="focus">Focus</option>
				<option value="relax">Relax</option>
				<option value="sleep">Sleep</option>
				<option value="ambient">Ambient</option>
				<option value="synthwave">Synthwave</option>
			</select>
		</div>
	</div>

	<div class="dialog-footer">
		<button class="btn btn-secondary" onclick={handleClose}>Cancel</button>
		<button class="btn btn-primary" onclick={handleSave}>
			<FloppyDisk size={16} /> Save Vibe
		</button>
	</div>
</dialog>

<style>
	.save-dialog {
		border: 1px solid var(--color-border);
		background: var(--color-bg-card);
		color: var(--color-text-primary);
		padding: 1.25rem;
		max-width: 400px;
		width: calc(100% - 2rem);
		margin: auto;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
	}

	/* Backdrop styling */
	.save-dialog::backdrop {
		background: rgba(2, 6, 23, 0.7);
		backdrop-filter: blur(4px);
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.dialog-header h3 {
		font-size: var(--font-size-lg);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		transition: var(--transition-fast);
	}

	.close-btn:hover {
		background: var(--color-bg-hover);
		color: var(--color-text-primary);
	}

	.dialog-body {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		margin-bottom: 1.25rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.input-group label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		font-weight: var(--font-weight-medium);
	}

	.input-group input,
	.input-group select {
		background: var(--color-bg-input);
		border: 1px solid var(--color-border);
		padding: 0.55rem 0.75rem;
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
		width: 100%;
	}

	.input-group input:focus-visible,
	.input-group select:focus-visible {
		border-color: var(--color-accent-cyan);
	}

	.dialog-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.55rem 1rem;
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		transition: var(--transition-fast);
	}

	.btn-secondary {
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text-muted);
	}

	.btn-secondary:hover {
		background: var(--color-bg-hover);
		color: var(--color-text-primary);
	}

	.btn-primary {
		background: var(--color-accent-cyan);
		color: var(--color-bg-base);
	}

	.btn-primary:hover {
		background: #0ea5e9;
		box-shadow: var(--shadow-neon-cyan);
	}
</style>
