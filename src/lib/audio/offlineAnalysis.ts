import * as Tone from 'tone';
import type { KoalaFiState } from '../state/koalaFiState';
import { analysePcm, type AudioQualityMetrics } from './audioQuality';
import { generatePattern } from './generator';

const AUDIT_START_BAR = 24;
const AUDIT_BAR_COUNT = 8;
const BASS_AUDIT_BAR_COUNT = 4;

export async function renderMelodyAudit(
	seed: string,
	music: KoalaFiState['music']
): Promise<AudioQualityMetrics> {
	const pattern = generatePattern(seed, music);
	const melody = pattern.melody
		.filter((event) => {
			const bar = Number.parseInt(event.time.split(':')[0], 10);
			return (
				bar >= AUDIT_START_BAR &&
				bar < AUDIT_START_BAR + AUDIT_BAR_COUNT &&
				(event.gate ?? 0) <= music.melody
			);
		})
		.map((event) => ({
			...event,
			time: shiftBar(event.time, -AUDIT_START_BAR)
		}));

	if (melody.length === 0) {
		throw new Error('Offline melody audit requires at least one generated melody event.');
	}

	const secondsPerBar = (60 / music.bpm) * 4;
	const renderDuration = AUDIT_BAR_COUNT * secondsPerBar + 2;
	const buffer = await Tone.Offline(
		({ transport }) => {
			transport.bpm.value = music.bpm;

			const limiter = new Tone.Limiter(-1).toDestination();
			const filter = new Tone.Filter({
				type: 'lowpass',
				frequency: 2200,
				Q: 0.8
			}).connect(limiter);
			const reverb = new Tone.Reverb({ decay: 1.8, wet: 1 }).connect(limiter);
			const reverbSend = new Tone.Gain(0.12).connect(reverb);
			const synth = new Tone.Synth({
				oscillator: { type: 'triangle8' },
				envelope: {
					attack: 0.012,
					decay: 0.16,
					sustain: 0.06,
					release: 0.32
				},
				volume: -12
			});
			synth.connect(filter);
			synth.connect(reverbSend);

			for (const event of melody) {
				transport.schedule((time) => {
					synth.triggerAttackRelease(event.note, event.duration, time, event.velocity ?? 0.4);
				}, event.time);
			}

			transport.start(0);
		},
		renderDuration,
		2,
		22050
	);

	const rawChannels = buffer.toArray();
	const channels = Array.isArray(rawChannels) ? rawChannels : [rawChannels];
	return analysePcm(channels);
}

export async function renderBassAudit(
	seed: string,
	music: KoalaFiState['music']
): Promise<AudioQualityMetrics> {
	const bassline = generatePattern(seed, music).bassline.filter((event) => {
		const bar = Number.parseInt(event.time.split(':')[0], 10);
		return bar < BASS_AUDIT_BAR_COUNT;
	});

	if (bassline.length === 0) {
		throw new Error('Offline bass audit requires at least one generated bass event.');
	}

	const secondsPerBar = (60 / music.bpm) * 4;
	const buffer = await Tone.Offline(
		({ transport }) => {
			transport.bpm.value = music.bpm;

			const limiter = new Tone.Limiter(-1).toDestination();
			const synth = new Tone.MonoSynth({
				oscillator: { type: 'sawtooth' },
				filter: { type: 'lowpass', frequency: 620, Q: 1.1 },
				envelope: {
					attack: 0.008,
					decay: 0.16,
					sustain: 0.34,
					release: 0.16
				},
				filterEnvelope: {
					attack: 0.004,
					decay: 0.14,
					sustain: 0.22,
					release: 0.18,
					baseFrequency: 180,
					octaves: 2.5
				},
				volume: -7
			}).connect(limiter);

			for (const event of bassline) {
				transport.schedule((time) => {
					synth.triggerAttackRelease(event.note, event.duration, time, event.velocity ?? 0.6);
				}, event.time);
			}

			transport.start(0);
		},
		BASS_AUDIT_BAR_COUNT * secondsPerBar + 1,
		2,
		22050
	);

	const rawChannels = buffer.toArray();
	const channels = Array.isArray(rawChannels) ? rawChannels : [rawChannels];
	return analysePcm(channels);
}

function shiftBar(time: string, offset: number): string {
	const [bar, beat = '0', sixteenth = '0'] = time.split(':');
	return `${Number.parseInt(bar, 10) + offset}:${beat}:${sixteenth}`;
}
