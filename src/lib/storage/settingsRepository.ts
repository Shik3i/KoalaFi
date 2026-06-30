import { getDB } from './db';

export type AppSettingsRecord = {
	key: string;
	value: unknown;
	updatedAt: string;
};

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
	try {
		const db = await getDB();
		const record = (await db.get('appSettings', key)) as AppSettingsRecord | undefined;
		if (record) {
			return record.value as T;
		}
		return defaultValue;
	} catch (err) {
		console.error(`Failed to get setting for key ${key}:`, err);
		return defaultValue;
	}
}

export async function setSetting(key: string, value: unknown): Promise<void> {
	try {
		const db = await getDB();
		await db.put('appSettings', {
			key,
			value,
			updatedAt: new Date().toISOString()
		});
	} catch (err) {
		console.error(`Failed to save setting for key ${key}:`, err);
	}
}
