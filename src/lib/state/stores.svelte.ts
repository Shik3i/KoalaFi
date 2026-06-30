import type { KoalaFiState } from './koalaFiState';
import { DEFAULT_STATE } from './defaults';

// Svelte 5 Runes-based global state store
export class AppStateStore {
	// Reactive state proxy
	#state = $state<KoalaFiState>(JSON.parse(JSON.stringify(DEFAULT_STATE)));

	get state(): KoalaFiState {
		return this.#state;
	}

	set state(value: KoalaFiState) {
		this.#state = value;
	}

	// Update a portion of the state
	updateState(updater: (s: KoalaFiState) => void) {
		updater(this.#state);
	}

	// Entirely overwrite state (e.g. from preset or URL sync)
	loadState(newState: KoalaFiState) {
		// Perform deep copy to break references
		this.#state = JSON.parse(JSON.stringify(newState));
	}

	// Reset to default
	reset() {
		this.loadState(DEFAULT_STATE);
	}
}

// Singleton instance to import across components and modules
export const appState = new AppStateStore();
