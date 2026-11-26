import { BGM_TRACKS, type BgmTrackId, unlockMusicTrack } from "../content";
import { DEFAULT_SETTINGS } from "../storage";

const FADE_MS = 600;
const FADE_STEP_MS = 30;

export interface BgmSceneTarget {
	readonly mode: "scene" | "sandbox";
	readonly trackId: BgmTrackId;
	readonly unlockedIds: readonly BgmTrackId[];
}

type PreviewListener = (trackId: BgmTrackId | null) => void;

let targetVolume = DEFAULT_SETTINGS.bgmVolume;
let currentAudio: HTMLAudioElement | null = null;
let currentTrackId: BgmTrackId | null = null;
let currentIsSandbox = false;
let previewTrackId: BgmTrackId | null = null;
let lastSceneTarget: BgmSceneTarget | null = null;
let pendingBlockedPlay = false;
let autoplayHooked = false;
const resumePositions = new Map<BgmTrackId, number>();
const fadeTimers = new Set<number>();
const previewListeners = new Set<PreviewListener>();

function getTrackSrc(id: BgmTrackId): string {
	return BGM_TRACKS.find((t) => t.id === id)?.src ?? "/music/intro.mp3";
}

function notifyPreviewListeners(): void {
	for (const listener of previewListeners) listener(previewTrackId);
}

function fadeAudio(audio: HTMLAudioElement, from: number, to: number, onDone?: () => void): void {
	const steps = Math.max(1, Math.round(FADE_MS / FADE_STEP_MS));
	let step = 0;
	audio.volume = Math.max(0, Math.min(1, from));
	const timer = window.setInterval(() => {
		step += 1;
		const ratio = Math.min(1, step / steps);
		audio.volume = Math.max(0, Math.min(1, from + (to - from) * ratio));
		if (step >= steps) {
			window.clearInterval(timer);
			fadeTimers.delete(timer);
			if (onDone !== void 0) onDone();
		}
	}, FADE_STEP_MS);
	fadeTimers.add(timer);
}

function stopWithFade(audio: HTMLAudioElement | null, trackId: BgmTrackId | null): void {
	if (audio === null) return;
	if (trackId !== null && audio.currentTime > 0 && !audio.ended) resumePositions.set(trackId, audio.currentTime);
	const startVol = audio.volume;
	fadeAudio(audio, startVol, 0, () => {
		audio.pause();
		audio.src = "";
	});
}

function ensureAutoplayUnlock(): void {
	if (autoplayHooked || typeof window === "undefined") return;
	autoplayHooked = true;
	const resume = (): void => {
		if (!pendingBlockedPlay || currentAudio === null) return;
		pendingBlockedPlay = false;
		void currentAudio
			.play()
			.then(() => {
				if (currentAudio !== null) fadeAudio(currentAudio, 0, targetVolume);
			})
			.catch(() => {
				pendingBlockedPlay = true;
			});
	};
	window.addEventListener("pointerdown", resume, { passive: true });
	window.addEventListener("keydown", resume, { passive: true });
}

function pickRandomTrack(unlockedIds: readonly BgmTrackId[], avoid: BgmTrackId | null): BgmTrackId {
	const pool = unlockedIds.length > 0 ? unlockedIds : (["intro"] as const);
	const filtered = pool.length >= 2 && avoid !== null ? pool.filter((id) => id !== avoid) : pool;
	return filtered[Math.floor(Math.random() * filtered.length)];
}

function switchTrack(trackId: BgmTrackId, loop: boolean, startFromZero: boolean): void {
	if (typeof window === "undefined" || typeof Audio === "undefined") return;
	ensureAutoplayUnlock();
	const prevAudio = currentAudio;
	const prevTrack = currentTrackId;
	const nextAudio = new Audio(getTrackSrc(trackId));
	nextAudio.loop = loop;
	nextAudio.volume = 0;
	const savedPos = startFromZero ? 0 : (resumePositions.get(trackId) ?? 0);
	if (savedPos > 0)
		nextAudio.addEventListener(
			"loadedmetadata",
			() => {
				if (savedPos < nextAudio.duration - 1) nextAudio.currentTime = savedPos;
			},
			{ once: true },
		);
	if (!loop)
		nextAudio.addEventListener("ended", () => {
			if (previewTrackId !== null || !currentIsSandbox || lastSceneTarget === null) return;
			const nextRandom = pickRandomTrack(lastSceneTarget.unlockedIds, currentTrackId);
			switchTrack(nextRandom, false, true);
		});
	currentAudio = nextAudio;
	currentTrackId = trackId;
	stopWithFade(prevAudio, prevTrack);
	pendingBlockedPlay = false;
	void nextAudio
		.play()
		.then(() => {
			if (currentAudio === nextAudio) fadeAudio(nextAudio, 0, targetVolume);
		})
		.catch(() => {
			if (currentAudio === nextAudio) pendingBlockedPlay = true;
		});
}

export function setBgmVolume(volume: number): void {
	targetVolume = Math.max(0, Math.min(1, volume));
	if (currentAudio !== null && !pendingBlockedPlay) currentAudio.volume = targetVolume;
}

export function syncSceneBgm(target: BgmSceneTarget): void {
	lastSceneTarget = target;
	if (previewTrackId !== null) return;
	if (target.mode === "sandbox") {
		if (currentIsSandbox && currentAudio !== null) return;
		currentIsSandbox = true;
		const chosen = pickRandomTrack(target.unlockedIds, currentTrackId);
		switchTrack(chosen, false, true);
		return;
	}
	currentIsSandbox = false;
	unlockMusicTrack(target.trackId);
	if (currentTrackId === target.trackId && currentAudio !== null) {
		currentAudio.loop = true;
		return;
	}
	switchTrack(target.trackId, true, false);
}

export function startBgmPreview(trackId: BgmTrackId): void {
	previewTrackId = trackId;
	notifyPreviewListeners();
	switchTrack(trackId, true, true);
}

export function stopBgmPreview(): void {
	if (previewTrackId === null) return;
	previewTrackId = null;
	notifyPreviewListeners();
	if (lastSceneTarget !== null) {
		currentIsSandbox = false;
		syncSceneBgm(lastSceneTarget);
	}
}

export function getPreviewingTrackId(): BgmTrackId | null {
	return previewTrackId;
}

export function subscribeBgmPreview(listener: PreviewListener): () => void {
	previewListeners.add(listener);
	return () => {
		previewListeners.delete(listener);
	};
}
