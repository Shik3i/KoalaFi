# State Serialization & Link Sharing - KoalaFi

## State Schema Model

The application state is encapsulated in a central TypeScript object:

- `schemaVersion` & `generatorVersion` (version tracking)
- `seed` (string seed)
- `sync` (mode and UTC start timestamp)
- `music` (enabled, BPM, key, scale, tracks mix levels, cozy, sleepy focus parameters)
- `ambience` (rain, ocean, wind, vinyl, white/pink/brown noise volumes)
- `visual` (theme, motion speed, brightness, glow values)

## URL Compression Schema

To keep share links short, the state is mapped to a condensed key-value structure before serializing to JSON and encoding to URL-safe Base64:

```json
{
	"v": 1,
	"g": 1,
	"s": "vibe-seed",
	"p": "sunset-focus",
	"t": "Sunset Focus",
	"sm": "none",
	"ss": null,
	"m": [0, 75, "C", "minor", 50, 50, 30, 50, 40, 50, 50, 50, 50],
	"a": [30, 0, 0, 20, 0, 0, 0],
	"vi": ["sunset", "calm", 80, 50]
}
```

_Note: All values in `0..1` are scaled to integers in `0..100` before encoding to save string bytes._

## Rough-Clock Sync Calculation

When the share mode is set to `rough-clock`, the URL includes a `startedAtUtc` timestamp. On load, the client calculates the offset:
$$\text{elapsedSeconds} = \frac{\text{nowUtc} - \text{startedAtUtc}}{1000}$$

This offset is mapped onto the 64-bar arrangement duration:
$$\text{secondsPerBeat} = \frac{60}{\text{BPM}}$$
$$\text{totalLoopSeconds} = 256 \times \text{secondsPerBeat}$$
$$\text{activePlayhead} = \text{elapsedSeconds} \pmod{\text{totalLoopSeconds}}$$

The audio scheduler maps this value into `Tone.Transport.seconds` before playback starts.

This is rough wall-clock alignment only. It does not account for audio-device latency, network delay, tab throttling, user click timing, or sample-clock drift, so docs and UI must not describe it as sample-perfect sync.

## Trust Boundary

Shared URL state is untrusted input. Decode failures return `null`; valid JSON is migrated through `migrateState`, which clamps numeric ranges, trims string fields, validates enum values, normalizes UTC timestamps, and falls back to safe defaults.
