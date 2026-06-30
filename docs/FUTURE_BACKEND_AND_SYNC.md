# Future Backend & Room Sync Strategy - KoalaFi

KoalaFi v0.1 is 100% frontend-only. This document is a future design note only; it is not implemented, and agents must not add a backend, accounts, rooms, or network sync unless the user explicitly scopes that work.

## Possible Backend Stack

- **Language**: Go (Golang)
- **Database**: SQLite3 (embedded, high-performance file db)
- **Real-Time Layer**: Go's standard `net/http` WebSocket support when available, or a small WebSocket package.

## Database Mapping (SQLite to IndexedDB)

One possible backend model could mirror the local IndexedDB records while keeping imported state validation on the client:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  host_id TEXT NOT NULL,
  seed TEXT NOT NULL,
  state_json TEXT NOT NULL, -- Full serialized KoalaFiState
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE TABLE room_participants (
  room_id TEXT,
  user_id TEXT,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (room_id, user_id)
);
```

## WebSocket Synchronization Protocol

1. **Room Creation**: Host creates a room. The server stores the host's `KoalaFiState` in SQLite.
2. **Subscription**: Guest joins via URL `/rooms/<room_id>`. Guest connects to `ws://api.koalastuff.net/rooms/<room_id>/live`.
3. **State Broadcast**:
   - Host slider adjustments are throttled client-side (e.g. 50ms) and sent to the server as updates:
     `{"type": "STATE_UPDATE", "state": {...}}`
   - The server broadcasts this state to all guests in the room.
   - Guest audio engines execute `audioEngine.applyState(incomingState)` in real-time.
4. **Time Sync (Playhead Alignment)**:
   - The room state broadcast includes a `startedAtUtc` timestamp.
   - Guest client loops run the playhead mapping logic:
     `nowUtc - startedAtUtc = playheadOffset`
   - This gives guests rough alignment to the same point of the musical arrangement. It is not sample-perfect sync.
