<script lang="ts">
	import { onMount } from 'svelte';
	import { getRecentVibes, type RecentVibeRecord } from '../storage/recentVibesRepository';
	import { deleteLocalDatabase } from '../storage/db';
	import { X, Trash, Clock, Info } from 'phosphor-svelte';
	import type { KoalaFiState } from '../state/koalaFiState';

	// Svelte 5 props
	let { isOpen = $bindable(false), onSelectVibe } = $props<{
		isOpen: boolean;
		onSelectVibe: (state: KoalaFiState) => void;
	}>();

	let recentVibes = $state<RecentVibeRecord[]>([]);

	export async function refresh() {
		recentVibes = await getRecentVibes();
	}

	async function handleClearData() {
		if (
			confirm(
				'Are you sure you want to clear all local presets, settings, and play history? This cannot be undone.'
			)
		) {
			try {
				await deleteLocalDatabase();
				alert('Local database successfully cleared. Reloading page...');
				window.location.reload();
			} catch (err) {
				console.error('Failed to clear database:', err);
				alert('Failed to clear database');
			}
		}
	}

	function handleSelect(record: RecentVibeRecord) {
		onSelectVibe(record.state);
		isOpen = false;
	}

	onMount(() => {
		refresh();
	});
</script>

<div class="settings-drawer-wrapper" class:open={isOpen}>
	<div class="drawer-backdrop" onclick={() => (isOpen = false)} role="presentation"></div>
	<aside class="settings-drawer glass-panel">
		<div class="drawer-header">
			<h3>System Settings</h3>
			<button class="close-btn" onclick={() => (isOpen = false)} aria-label="Close drawer">
				<X size={20} />
			</button>
		</div>

		<div class="drawer-body">
			<!-- Section 1: Recent Vibes -->
			<section class="drawer-section">
				<div class="section-title">
					<Clock size={16} />
					<h4>Recent Vibes</h4>
				</div>

				{#if recentVibes.length > 0}
					<div class="recent-list">
						{#each recentVibes as record (record.id)}
							<button class="recent-item" onclick={() => handleSelect(record)}>
								<span class="recent-name">{record.state.title || 'Seeded Vibe'}</span>
								<span class="recent-date">{new Date(record.lastPlayedAt).toLocaleDateString()}</span
								>
							</button>
						{/each}
					</div>
				{:else}
					<p class="empty-text">No recently played seeds yet.</p>
				{/if}
			</section>

			<!-- Section 2: Info & Details -->
			<section class="drawer-section info-section">
				<div class="section-title">
					<Info size={16} />
					<h4>About KoalaFi</h4>
				</div>
				<div class="info-card">
					<p><strong>KoalaFi v0.1.0</strong></p>
					<p class="tagline">“Endless procedural lofi & ambient noise in your browser.”</p>
					<p>
						100% offline-first, client-side procedural synthesis. No accounts, no user tracking, and
						no CDNs.
					</p>
				</div>
			</section>

			<!-- Section 3: Reset actions -->
			<section class="drawer-section danger-section">
				<h4>Database Administration</h4>
				<p class="section-desc">Clear local IndexedDB tables including presets and settings.</p>
				<button class="reset-btn" onclick={handleClearData}>
					<Trash size={16} /> Wipe Application Data
				</button>
			</section>
		</div>
	</aside>
</div>

<style>
	.settings-drawer-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 100;
		pointer-events: none;
		transition: var(--transition-normal);
	}

	.settings-drawer-wrapper.open {
		pointer-events: auto;
	}

	.drawer-backdrop {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(2, 6, 23, 0.4);
		opacity: 0;
		backdrop-filter: blur(2px);
		transition: opacity var(--transition-normal) ease;
		pointer-events: none;
	}

	.settings-drawer-wrapper.open .drawer-backdrop {
		opacity: 1;
		pointer-events: auto;
	}

	.settings-drawer {
		position: absolute;
		right: 0;
		top: 0;
		width: 100%;
		max-width: 380px;
		height: 100%;
		border-radius: 0;
		border-left: 1px solid var(--color-border);
		border-top: none;
		border-bottom: none;
		border-right: none;
		transform: translateX(100%);
		transition: transform var(--transition-normal) cubic-bezier(0.16, 1, 0.3, 1);
		display: flex;
		flex-direction: column;
		z-index: 101;
	}

	.settings-drawer-wrapper.open .settings-drawer {
		transform: translateX(0);
	}

	.drawer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem;
		border-bottom: 1px solid var(--color-border);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		transition: var(--transition-fast);
	}

	.close-btn:hover {
		background: var(--color-bg-hover);
		color: var(--color-text-primary);
	}

	.drawer-body {
		flex-grow: 1;
		overflow-y: auto;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.drawer-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-accent-cyan);
	}

	.section-title h4 {
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
	}

	.recent-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 200px;
		overflow-y: auto;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.35rem;
	}

	.recent-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		transition: var(--transition-fast);
	}

	.recent-item:hover {
		background: var(--color-bg-hover);
	}

	.recent-name {
		font-weight: var(--font-weight-medium);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		padding-right: 0.5rem;
	}

	.recent-date {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.empty-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.info-card {
		background: var(--color-bg-input);
		border: 1px solid var(--color-border);
		padding: 0.85rem;
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		line-height: 1.45;
	}

	.info-card p {
		margin-bottom: 0.4rem;
	}

	.info-card p:last-child {
		margin-bottom: 0;
	}

	.tagline {
		color: var(--color-accent-cyan);
		font-style: italic;
	}

	.danger-section h4 {
		color: #ef4444;
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.section-desc {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		line-height: 1.35;
	}

	.reset-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.25);
		color: #ef4444;
		padding: 0.6rem;
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		transition: var(--transition-fast);
		width: 100%;
		margin-top: 0.25rem;
	}

	.reset-btn:hover {
		background: #ef4444;
		color: var(--color-text-dark);
		box-shadow: 0 0 12px rgba(239, 68, 68, 0.2);
	}
</style>
