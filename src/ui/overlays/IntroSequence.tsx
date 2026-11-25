import { For, type JSX, Show, createSignal, onCleanup, onMount } from "solid-js";
import { playBetaReductionMelody, playPassSound, playPopExplosionSound, playSnapSound } from "../../audio/synth";
import { useKeyScope } from "../../utils/keybus";

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	rotation: number;
	vRot: number;
	alpha: number;
	decay: number;
	color: string;
	kind: "orb" | "diamond" | "spark";
}

interface Shockwave {
	readonly id: number;
	readonly x: number;
	readonly y: number;
	readonly color: string;
}

interface IntroSequenceProps {
	readonly reducedMotion: boolean;
	readonly onComplete: () => void;
}

const BURST_COLORS: readonly string[] = ["#f59e0b", "#e05a36", "#38bdf8", "#fbbf24", "#ffffff", "#10b981"];

function PrimaryCrystalIcon(): JSX.Element {
	return (
		<svg class="intro-crystal-svg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
			<defs>
				<linearGradient id="introCrystalA" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
					<stop offset="0%" stop-color="#fbbf24" />
					<stop offset="55%" stop-color="#f59e0b" />
					<stop offset="100%" stop-color="#e05a36" />
				</linearGradient>
			</defs>
			<polygon points="32,4 58,24 48,58 16,58 6,24" fill="url(#introCrystalA)" stroke="#fff7ed" stroke-width="2" />
			<polygon points="32,14 48,26 41,48 23,48 16,26" fill="rgba(255,255,255,0.28)" />
			<circle cx="32" cy="33" r="6" fill="#ffffff" />
		</svg>
	);
}

function SecondaryCrystalIcon(): JSX.Element {
	return (
		<svg class="intro-crystal-svg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
			<defs>
				<linearGradient id="introCrystalB" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
					<stop offset="0%" stop-color="#38bdf8" />
					<stop offset="60%" stop-color="#0284c7" />
					<stop offset="100%" stop-color="#6366f1" />
				</linearGradient>
			</defs>
			<polygon points="32,5 55,18 55,46 32,59 9,46 9,18" fill="url(#introCrystalB)" stroke="#e0f2fe" stroke-width="2" />
			<polygon points="32,15 46,23 46,41 32,49 18,41 18,23" fill="rgba(255,255,255,0.22)" />
			<rect x="27" y="27" width="10" height="10" rx="2" transform="rotate(45 32 32)" fill="#ffffff" />
		</svg>
	);
}

export function IntroSequence(props: IntroSequenceProps): JSX.Element {
	const [stage, setStage] = createSignal<0 | 1 | 2 | 3>(0);
	const [eliminatingRight, setEliminatingRight] = createSignal<boolean>(false);
	const [collapsingLeft, setCollapsingLeft] = createSignal<boolean>(false);
	const [shaking, setShaking] = createSignal<boolean>(false);
	const [flashPos, setFlashPos] = createSignal<{ readonly x: number; readonly y: number } | null>(null);
	const [shockwaves, setShockwaves] = createSignal<readonly Shockwave[]>([]);
	const [busy, setBusy] = createSignal<boolean>(false);

	let canvasRef: HTMLCanvasElement | undefined;
	let rightItemRef: HTMLSpanElement | undefined;
	let exprStageRef: HTMLDivElement | undefined;
	let particles: Particle[] = [];
	let rafId = 0;
	let waveSeed = 0;
	const timers: number[] = [];

	const scheduleTimer = (fn: () => void, ms: number): void => {
		timers.push(window.setTimeout(fn, ms));
	};

	const spawnBurst = (cx: number, cy: number, count: number, power: number): void => {
		if (props.reducedMotion) return;
		const kinds: readonly Particle["kind"][] = ["orb", "diamond", "spark"];
		for (let i = 0; i < count; i += 1) {
			const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
			const speed = (2.8 + Math.random() * 8.5) * power;
			particles.push({
				x: cx + (Math.random() - 0.5) * 16,
				y: cy + (Math.random() - 0.5) * 16,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				size: 3.5 + Math.random() * 7.5,
				rotation: Math.random() * Math.PI * 2,
				vRot: (Math.random() - 0.5) * 0.28,
				alpha: 1,
				decay: 0.0055 + Math.random() * 0.0075,
				color: BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)],
				kind: kinds[i % kinds.length],
			});
		}
	};

	const triggerImpactFx = (cx: number, cy: number, color: string, count: number, power: number): void => {
		spawnBurst(cx, cy, count, power);
		if (props.reducedMotion) return;
		const waveId = ++waveSeed;
		setShockwaves((prev) => [...prev, { id: waveId, x: cx, y: cy, color }]);
		setFlashPos({ x: cx, y: cy });
		setShaking(true);
		scheduleTimer(() => setShaking(false), 660);
		scheduleTimer(() => setFlashPos(null), 690);
		scheduleTimer(() => setShockwaves((prev) => prev.filter((w) => w.id !== waveId)), 1480);
	};

	const getElementCenter = (el: HTMLElement | undefined): { readonly x: number; readonly y: number } => {
		if (el === void 0) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
		const rect = el.getBoundingClientRect();
		return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
	};

	const advanceStage = (): boolean => {
		if (busy()) return true;
		const current = stage();
		if (current === 0) {
			setBusy(true);
			const pos = getElementCenter(rightItemRef);
			playPopExplosionSound();
			playBetaReductionMelody(1);
			triggerImpactFx(pos.x, pos.y, "#38bdf8", 72, 1.15);
			setEliminatingRight(true);
			scheduleTimer(
				() => {
					setEliminatingRight(false);
					setStage(1);
					setBusy(false);
				},
				props.reducedMotion ? 80 : 1050,
			);
			return true;
		}
		if (current === 1) {
			setBusy(true);
			const pos = getElementCenter(exprStageRef);
			playPopExplosionSound();
			playBetaReductionMelody(4);
			triggerImpactFx(pos.x, pos.y, "#f59e0b", 88, 1.35);
			setCollapsingLeft(true);
			scheduleTimer(
				() => {
					setCollapsingLeft(false);
					setStage(2);
					setBusy(false);
				},
				props.reducedMotion ? 80 : 1050,
			);
			return true;
		}
		if (current === 2) {
			setBusy(true);
			const pos = getElementCenter(exprStageRef);
			playPassSound();
			playSnapSound(3);
			spawnBurst(pos.x, pos.y, 44, 0.9);
			setStage(3);
			scheduleTimer(() => props.onComplete(), props.reducedMotion ? 160 : 2300);
			return true;
		}
		return true;
	};

	useKeyScope({
		id: "intro-sequence",
		level: "modal",
		bindings: [{ key: " ", handle: advanceStage }],
	});

	onMount(() => {
		const canvas = canvasRef;
		if (canvas === void 0) return;
		const ctx = canvas.getContext("2d");
		if (ctx === null) return;

		const syncCanvasSize = (): void => {
			const dpr = window.devicePixelRatio ?? 1;
			canvas.width = Math.floor(window.innerWidth * dpr);
			canvas.height = Math.floor(window.innerHeight * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		syncCanvasSize();
		window.addEventListener("resize", syncCanvasSize);

		const tick = (): void => {
			ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
			const alive: Particle[] = [];
			for (const p of particles) {
				p.vx *= 0.94;
				p.vy = p.vy * 0.94 + 0.06;
				p.x += p.vx;
				p.y += p.vy;
				p.rotation += p.vRot;
				p.alpha -= p.decay;
				if (p.alpha <= 0) continue;
				alive.push(p);
				ctx.save();
				ctx.globalAlpha = Math.max(0, p.alpha);
				ctx.translate(p.x, p.y);
				ctx.rotate(p.rotation);
				ctx.fillStyle = p.color;
				ctx.shadowColor = p.color;
				ctx.shadowBlur = 12;
				if (p.kind === "orb") {
					ctx.beginPath();
					ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
					ctx.fill();
				} else if (p.kind === "diamond") {
					const r = p.size * 0.85;
					ctx.beginPath();
					ctx.moveTo(0, -r);
					ctx.lineTo(r * 0.65, 0);
					ctx.lineTo(0, r);
					ctx.lineTo(-r * 0.65, 0);
					ctx.closePath();
					ctx.fill();
				} else {
					ctx.fillRect(-p.size * 1.1, -1.6, p.size * 2.2, 3.2);
				}
				ctx.restore();
			}
			particles = alive;
			rafId = window.requestAnimationFrame(tick);
		};
		rafId = window.requestAnimationFrame(tick);

		onCleanup(() => {
			window.removeEventListener("resize", syncCanvasSize);
			window.cancelAnimationFrame(rafId);
			for (const id of timers) window.clearTimeout(id);
		});
	});

	return (
		<div
			class={`intro-overlay ${stage() === 3 ? "intro-exiting" : ""} ${shaking() ? "intro-shake" : ""}`}
			onClick={() => void advanceStage()}
			onKeyDown={(event) => {
				if (event.key === "Enter") void advanceStage();
			}}
		>
			<canvas ref={canvasRef} class="intro-particle-canvas" />

			<Show when={flashPos()}>
				{(pos) => <div class="intro-impact-flash" style={{ left: `${pos().x}px`, top: `${pos().y}px` }} />}
			</Show>

			<For each={shockwaves()}>
				{(wave) => (
					<div
						class="intro-shockwave"
						style={{ left: `${wave.x}px`, top: `${wave.y}px`, "--wave-color": wave.color }}
					/>
				)}
			</For>

			<div ref={exprStageRef} class={`intro-stage ${stage() === 3 ? "intro-finale-zoom" : ""}`}>
				<Show when={stage() === 0}>
					<div class="intro-expr-row intro-breath-enter">
						<span class="machine-lam intro-lam-hero" style={{ "--socket-color": "#f59e0b" }}>
							<span class="machine-socket">
								<span class="signal-orb" style={{ background: "#f59e0b" }} />
							</span>
							<span class="machine-chamber">
								<span class="machine-lam intro-lam-inner" style={{ "--socket-color": "#0284c7" }}>
									<span class="machine-socket">
										<span class="signal-orb" style={{ background: "#0284c7" }} />
									</span>
									<span class="machine-chamber">
										<span class="signal-orb" style={{ background: "#f59e0b" }} />
									</span>
								</span>
							</span>
						</span>

						<span class="feed-connector intro-connector">◀</span>
						<span class="intro-icon-chip intro-chip-primary">
							<PrimaryCrystalIcon />
						</span>

						<span ref={rightItemRef} class={`intro-right-group ${eliminatingRight() ? "intro-vanish-burst" : ""}`}>
							<span class="feed-connector intro-connector">◀</span>
							<span class="intro-icon-chip intro-chip-secondary">
								<SecondaryCrystalIcon />
							</span>
						</span>
					</div>
				</Show>

				<Show when={stage() === 1}>
					<div class={`intro-expr-row intro-step-pop ${collapsingLeft() ? "intro-vanish-burst" : ""}`}>
						<span class="machine-lam intro-lam-hero" style={{ "--socket-color": "#f59e0b" }}>
							<span class="machine-socket">
								<span class="signal-orb" style={{ background: "#f59e0b" }} />
							</span>
							<span class="machine-chamber">
								<span class="signal-orb" style={{ background: "#f59e0b" }} />
							</span>
						</span>
						<span class="feed-connector intro-connector">◀</span>
						<span class="intro-icon-chip intro-chip-primary">
							<PrimaryCrystalIcon />
						</span>
					</div>
				</Show>

				<Show when={stage() >= 2}>
					<div class="intro-result-core">
						<div class="intro-core-halo" />
						<span class="intro-icon-chip intro-chip-finale">
							<PrimaryCrystalIcon />
						</span>
					</div>
				</Show>
			</div>

			<div class={`intro-prompt ${stage() === 3 ? "intro-prompt-hide" : ""}`}>
				<span class="intro-keycap">SPACE</span>
			</div>
		</div>
	);
}
