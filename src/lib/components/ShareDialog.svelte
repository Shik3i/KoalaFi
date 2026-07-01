<script lang="ts">
	import { onDestroy } from 'svelte';
	import { generateShareUrl } from '../share/urlState';
	import { appState } from '../state/stores.svelte';
	import Copy from 'phosphor-svelte/lib/Copy';
	import X from 'phosphor-svelte/lib/X';

	let { isOpen = $bindable(false) } = $props<{ isOpen: boolean }>();

	let dialogElement = $state<HTMLDialogElement | null>(null);
	let copyStatusNormal = $state(false);
	let copyStatusSync = $state(false);
	let normalCopyTimeout: ReturnType<typeof setTimeout> | undefined;
	let syncCopyTimeout: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (!dialogElement) return;
		if (isOpen) {
			if (!dialogElement.open) {
				dialogElement.showModal();
			}
		} else {
			if (dialogElement.open) {
				dialogElement.close();
			}
		}
	});

	function getOrigin() {
		if (typeof window !== 'undefined') {
			return window.location.origin;
		}
		return 'https://lofi.koalastuff.net';
	}

	function getShareLink(mode: 'none' | 'rough-clock') {
		return generateShareUrl(getOrigin(), appState.state, mode);
	}

	async function copyLink(mode: 'none' | 'rough-clock') {
		const link = getShareLink(mode);
		try {
			await navigator.clipboard.writeText(link);
			if (mode === 'none') {
				copyStatusNormal = true;
				if (normalCopyTimeout) clearTimeout(normalCopyTimeout);
				normalCopyTimeout = setTimeout(() => (copyStatusNormal = false), 2000);
			} else {
				copyStatusSync = true;
				if (syncCopyTimeout) clearTimeout(syncCopyTimeout);
				syncCopyTimeout = setTimeout(() => (copyStatusSync = false), 2000);
			}
		} catch (err) {
			console.error('Failed to copy link:', err);
		}
	}

	function handleClose() {
		isOpen = false;
	}

	onDestroy(() => {
		if (normalCopyTimeout) clearTimeout(normalCopyTimeout);
		if (syncCopyTimeout) clearTimeout(syncCopyTimeout);
	});
</script>

<dialog
	bind:this={dialogElement}
	class="share-dialog glass-panel"
	onclose={handleClose}
	onclick={(e) => e.target === dialogElement && handleClose()}
>
	<div class="dialog-header">
		<h3>Share Vibe</h3>
		<button class="close-btn" onclick={handleClose} aria-label="Close dialog">
			<X size={18} />
		</button>
	</div>

	<div class="dialog-body">
		<!-- Option 1: Standard Link -->
		<div class="share-option">
			<div class="option-info">
				<h4>Standard Share Link</h4>
				<p>Copies all settings and seed. Opens exactly the same generated soundscape.</p>
			</div>
			<div class="copy-box">
				<input type="text" readonly value={getShareLink('none')} />
				<button class="copy-btn" onclick={() => copyLink('none')}>
					{copyStatusNormal ? 'Copied!' : 'Copy'}
					<Copy size={14} />
				</button>
			</div>
		</div>

		<div class="divider"></div>

		<!-- Option 2: Rough Clock Sync Link -->
		<div class="share-option">
			<div class="option-info">
				<h4>Listen Together (Rough-Clock Sync)</h4>
				<p>
					Aligns playheads to the UTC clock. Friends will hear roughly the same part of the
					arrangement in real-time.
				</p>
				<p class="sync-disclaimer">
					Note: Aligns playback progress using your system clock (no account or backend required).
				</p>
			</div>
			<div class="copy-box">
				<input type="text" readonly value={getShareLink('rough-clock')} />
				<button class="copy-btn sync-btn" onclick={() => copyLink('rough-clock')}>
					{copyStatusSync ? 'Copied!' : 'Copy'}
					<Copy size={14} />
				</button>
			</div>
		</div>
	</div>
</dialog>

<style>
	.share-dialog {
		border: 1px solid var(--color-border);
		background: var(--color-bg-card);
		color: var(--color-text-primary);
		padding: 1.25rem;
		max-width: 480px;
		width: calc(100% - 2rem);
		margin: auto;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
	}

	.share-dialog::backdrop {
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
		gap: 1.25rem;
	}

	.share-option {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.option-info h4 {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		margin-bottom: 0.15rem;
	}

	.option-info p {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		line-height: 1.35;
	}

	.sync-disclaimer {
		margin-top: 0.25rem;
		font-style: italic;
		color: var(--color-accent-cyan) !important;
		font-size: 11px !important;
	}

	.copy-box {
		display: flex;
		gap: 0.5rem;
		background: var(--color-bg-input);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.25rem;
	}

	.copy-box input {
		flex-grow: 1;
		font-size: var(--font-size-xs);
		font-family: monospace;
		padding: 0.35rem 0.5rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 0.8;
	}

	.copy-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: var(--color-bg-hover);
		padding: 0.35rem 0.75rem;
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		color: var(--color-accent-cyan);
		transition: var(--transition-fast);
		white-space: nowrap;
	}

	.copy-btn:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.sync-btn {
		color: var(--color-accent-pink);
	}

	.divider {
		height: 1px;
		background: var(--color-border);
	}
</style>
