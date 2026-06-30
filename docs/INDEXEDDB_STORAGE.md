# IndexedDB Persistence - KoalaFi

## Database Schema

KoalaFi stores presets, configuration, and logs locally using **IndexedDB** wrapped in the promise-based `idb` library.

- **Database Name**: `koalafi`
- **Version**: 1

## Object Stores

### 1. `appSettings`

- **Key Path**: `key`
- **Record Structure**:
  ```ts
  export type AppSettingsRecord = {
  	key: string;
  	value: unknown;
  	updatedAt: string;
  };
  ```
- **Usage**: Generic key/value settings storage for frontend-only preferences.

### 2. `userPresets`

- **Key Path**: `id`
- **Record Structure**:
  ```ts
  export type UserPresetRecord = {
  	id: string;
  	name: string;
  	category: 'focus' | 'relax' | 'sleep' | 'ambient' | 'synthwave';
  	state: KoalaFiState;
  	createdAt: string;
  	updatedAt: string;
  	source: 'user' | 'built-in-copy';
  	remoteId?: string;
  	syncStatus?: 'local' | 'synced' | 'dirty' | 'deleted';
  };
  ```
- **Usage**: Local presets stored by the user. Repository helpers support save, read, rename, list, and delete.

### 3. `recentVibes`

- **Key Path**: `id`
- **Record Structure**:
  ```ts
  export type RecentVibeRecord = {
  	id: string; // seed
  	state: KoalaFiState;
  	firstPlayedAt: string;
  	lastPlayedAt: string;
  	playCount: number;
  };
  ```
- **Usage**: Automatically logs played seeds to display in system history.

## Schema Versioning & Migrations

Database versioning is structured in the `db.ts` `openDB` constructor upgrade hook. Version changes (e.g. adding columns or stores) can be executed cleanly without losing user data by checking `oldVersion` and running incremental upgrades.

## Reserved Stores

Version 1 also creates `favoriteVibes`, `playSessions`, and `migrations`. They are reserved for future frontend features and backend sync migration bookkeeping; v0.1 does not depend on them for network sync.

## Reset Behavior

`deleteLocalDatabase()` closes the current connection, clears the `koalafi` database, and lets the app recreate stores on the next open. UI reset actions should use this helper instead of hand-rolling IndexedDB deletion.
