import { openDB, type IDBPDatabase } from 'idb';

export const DATABASE_NAME = 'koalafi';
const DATABASE_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB(): Promise<IDBPDatabase> {
	if (typeof globalThis.indexedDB === 'undefined') {
		return Promise.reject(new Error('IndexedDB is unavailable in this environment.'));
	}

	if (!dbPromise) {
		dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
			upgrade(db, oldVersion) {
				// Version 1 setup
				if (oldVersion < 1) {
					db.createObjectStore('appSettings', { keyPath: 'key' });
					db.createObjectStore('userPresets', { keyPath: 'id' });
					db.createObjectStore('favoriteVibes', { keyPath: 'id' });
					db.createObjectStore('recentVibes', { keyPath: 'id' });
					db.createObjectStore('playSessions', { keyPath: 'id' });
					db.createObjectStore('migrations', { keyPath: 'id' });
				}
			}
		});
	}

	return dbPromise;
}

export async function deleteLocalDatabase(): Promise<void> {
	const db = dbPromise ? await dbPromise : null;
	db?.close();
	dbPromise = null;

	await new Promise<void>((resolve, reject) => {
		const request = indexedDB.deleteDatabase(DATABASE_NAME);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
		request.onblocked = () => reject(new Error('IndexedDB delete was blocked by another tab.'));
	});
}
