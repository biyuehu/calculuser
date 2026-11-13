let audioContext: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let masterVolume = 1;

const PENTATONIC_SCALE: readonly number[] = [
	261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0,
];

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null;
	if (audioContext === null) {
		audioContext = new window.AudioContext();
		masterGainNode = audioContext.createGain();
		masterGainNode.gain.setValueAtTime(masterVolume, audioContext.currentTime);
		masterGainNode.connect(audioContext.destination);
	}
	if (audioContext.state === "suspended") void audioContext.resume();
	return audioContext;
}

export function setMasterVolume(volume: number): void {
	masterVolume = Math.max(0, Math.min(1, volume));
	if (masterGainNode !== null && audioContext !== null)
		masterGainNode.gain.setValueAtTime(masterVolume, audioContext.currentTime);
}

function playTone(frequency: number, duration: number, type: OscillatorType, gainPeak: number): void {
	if (masterVolume <= 0) return;
	const context = getAudioContext();
	if (context === null || masterGainNode === null) return;
	const oscillator = context.createOscillator();
	const gainNode = context.createGain();
	oscillator.type = type;
	oscillator.frequency.setValueAtTime(frequency, context.currentTime);
	gainNode.gain.setValueAtTime(gainPeak, context.currentTime);
	gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
	oscillator.connect(gainNode);
	gainNode.connect(masterGainNode);
	oscillator.start();
	oscillator.stop(context.currentTime + duration);
}

export function playSnapSound(combo: number): void {
	playTone(460 + Math.min(combo, 8) * 35, 0.055, "triangle", 0.08);
}

export function playDropSound(): void {
	playTone(150, 0.09, "sine", 0.09);
}

export function playSplitSound(): void {
	playTone(620, 0.06, "triangle", 0.07);
	setTimeout(() => playTone(880, 0.07, "triangle", 0.07), 45);
}

export function playMoveSound(): void {
	playTone(540, 0.05, "sine", 0.06);
}

export function playUndoSound(): void {
	playTone(320, 0.065, "sine", 0.06);
}

export function playPassSound(): void {
	playTone(523.25, 0.14, "triangle", 0.09);
	setTimeout(() => playTone(659.25, 0.15, "triangle", 0.09), 70);
	setTimeout(() => playTone(783.99, 0.18, "triangle", 0.1), 140);
	setTimeout(() => playTone(1046.5, 0.25, "triangle", 0.09), 210);
}

export function playFailSound(): void {
	playTone(190, 0.14, "sawtooth", 0.065);
	setTimeout(() => playTone(145, 0.18, "sawtooth", 0.055), 85);
}

export function playBetaReductionMelody(stepCount: number): void {
	playTone(PENTATONIC_SCALE[stepCount % PENTATONIC_SCALE.length], 0.08, "triangle", 0.09);
}

export function playPopExplosionSound(): void {
	playTone(90, 0.25, "sawtooth", 0.14);
	setTimeout(() => playTone(140, 0.18, "triangle", 0.12), 30);
	setTimeout(() => playTone(70, 0.35, "sine", 0.16), 75);
}

export function playLoopWarningSound(): void {
	playTone(440, 0.08, "sawtooth", 0.07);
	setTimeout(() => playTone(415.3, 0.09, "sawtooth", 0.07), 90);
	setTimeout(() => playTone(440, 0.08, "sawtooth", 0.07), 180);
	setTimeout(() => playTone(415.3, 0.11, "sawtooth", 0.08), 270);
}
