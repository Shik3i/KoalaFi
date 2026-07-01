import type { KoalaFiEngine } from './koalaFiEngine';

let enginePromise: Promise<KoalaFiEngine> | null = null;
let loadedEngine: KoalaFiEngine | null = null;
let loadVersion = 0;

export async function getAudioEngine(): Promise<KoalaFiEngine> {
	if (loadedEngine) return loadedEngine;
	if (!enginePromise) {
		const version = loadVersion;
		enginePromise = import('./koalaFiEngine')
			.then((module) => {
				if (version !== loadVersion) {
					throw new Error('Audio engine load was cancelled.');
				}
				loadedEngine = module.audioEngine;
				return loadedEngine;
			})
			.catch((error) => {
				if (version === loadVersion) enginePromise = null;
				throw error;
			});
	}
	return enginePromise;
}

export function getLoadedAudioEngine(): KoalaFiEngine | null {
	return loadedEngine;
}

export function disposeAudioEngineIfLoaded() {
	loadVersion += 1;
	loadedEngine?.dispose();
	loadedEngine = null;
	enginePromise = null;
}
