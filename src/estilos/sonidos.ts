import type { SonidoId } from "./estilos";

let ctx: AudioContext | null = null;

function contexto() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tono(c: AudioContext, tipo: OscillatorType, desde: number, hasta: number, dur: number, vol: number, t0 = 0) {
  const o = c.createOscillator();
  const g = c.createGain();
  const t = c.currentTime + t0;
  o.type = tipo;
  o.frequency.setValueAtTime(desde, t);
  o.frequency.exponentialRampToValueAtTime(hasta, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function ruido(c: AudioContext, dur: number, vol: number, frecuencia: number, t0 = 0) {
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource();
  const f = c.createBiquadFilter();
  const g = c.createGain();
  s.buffer = buf;
  f.type = "bandpass";
  f.frequency.value = frecuencia;
  g.gain.value = vol;
  s.connect(f).connect(g).connect(c.destination);
  s.start(c.currentTime + t0);
}

/**
 * Sonidos cortos sintetizados (sin archivos). Solo suenan después de un toque de la persona,
 * porque los navegadores no dejan reproducir audio antes.
 */
export function sonar(id: SonidoId, volumen = 0.25) {
  const c = contexto();
  if (!c) return;
  const v = Math.max(0, Math.min(1, volumen));
  switch (id) {
    case "pitido": tono(c, "square", 880, 1320, 0.07, v * 0.35); break;
    case "zumbido": tono(c, "sawtooth", 110, 90, 0.16, v * 0.25); tono(c, "sine", 2200, 1800, 0.05, v * 0.15); break;
    case "golpe": tono(c, "sine", 140, 45, 0.22, v); ruido(c, 0.09, v * 0.6, 1800); break;
    case "destello": tono(c, "sine", 1200, 2600, 0.12, v * 0.4); tono(c, "triangle", 2400, 3600, 0.1, v * 0.2, 0.05); break;
    case "proyector": for (let i = 0; i < 4; i++) ruido(c, 0.02, v * 0.5, 3200, i * 0.045); break;
  }
}

/** Vibración corta (solo Android y algunos navegadores; en el resto no hace nada). */
export function vibrar(ms = 12) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
}
