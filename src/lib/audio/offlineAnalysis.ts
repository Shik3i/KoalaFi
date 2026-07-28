import * as Tone from 'tone';
import type { KoalaFiState } from '../state/koalaFiState';
import { analysePcm, type AudioQualityMetrics } from './audioQuality';
import { generatePattern } from './generator';

const AUDIT_START_BAR = 24;
const AUDIT_BAR_COUNT = 8;

export async function renderMelodyAudit(
	seed: string,
	music: KoalaFiState['music']
): Promise<AudioQualityMetrics> {
	const pattern = generatePattern(seed, music);
	const melody = pattern.melody
		.filter((event) => {
			const bar = Number.parseInt(event.time.split(':')[0], 10);
			return bar >= AUDIT_START_BAR && bar < AUDIT_START_BAR + AUDIT_BAR_COUNT;
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
				frequency: 1800,
				Q: 0.8
			}).connect(limiter);
			const reverb = new Tone.Reverb({ decay: 1.8, wet: 1 }).connect(limiter);
			const reverbSend = new Tone.Gain(0.12).connect(reverb);
			const synth = new Tone.Synth({
				oscillator: { type: 'triangle' },
				envelope: {
					attack: 0.08,
					decay: 0.35,
					sustain: 0.2,
					release: 1.2
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

function shiftBar(time: string, offset: number): string {
	const [bar, beat = '0', sixteenth = '0'] = time.split(':');
	return `${Number.parseInt(bar, 10) + offset}:${beat}:${sixteenth}`;
}
