/* ============================================
   ClassPet - Whistle (Web Audio API)
   휘슬 음향 합성 모듈 - DOM 접근 없음
   Sound 모듈과 별도의 AudioContext 사용
   ============================================ */

// --- 내부 상태 ---
let audioCtx = null;
let isPlaying = false;
let activeNodes = null;
let masterGain = null;
let currentMode = 'hold'; // 'hold' | 'long' | 'triple'
let firstUnlocked = false;
let volume = 1.0; // 0~1 볼륨 (외부에서 setVolume으로 설정)

// --- 오디오 유틸 ---

/** 소프트 클리핑 커브 생성 (웨이브셰이퍼용) */
function makeSoftClipCurve(amount) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/** AudioContext 생성 또는 resume */
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

/** 모바일 AudioContext 잠금 해제 (사용자 제스처에서 호출) */
async function unlockAudio() {
  if (firstUnlocked) return;
  ensureAudio();
  if (audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch (e) { /* ignore */ }
  }
  try {
    const buf = audioCtx.createBuffer(1, 1, 22050);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start(0);
  } catch (e) { /* ignore */ }
  firstUnlocked = true;
}

/** 볼륨의 큐빅 값 (인간 청각에 맞춘 비선형 곡선) */
function getCubicVol() {
  return volume * volume * volume;
}

// --- 오디오 체인 생성 ---

/** 최대 볼륨 오디오 체인 (shaper + compressor x2 + limiter) */
function createMaxChain(now) {
  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(getCubicVol() * 4.0, now);

  const shaper = audioCtx.createWaveShaper();
  shaper.curve = makeSoftClipCurve(18);
  shaper.oversample = '4x';

  const comp1 = audioCtx.createDynamicsCompressor();
  comp1.threshold.setValueAtTime(-28, now);
  comp1.knee.setValueAtTime(3, now);
  comp1.ratio.setValueAtTime(14, now);
  comp1.attack.setValueAtTime(0.001, now);
  comp1.release.setValueAtTime(0.03, now);

  const comp2 = audioCtx.createDynamicsCompressor();
  comp2.threshold.setValueAtTime(-12, now);
  comp2.knee.setValueAtTime(2, now);
  comp2.ratio.setValueAtTime(10, now);
  comp2.attack.setValueAtTime(0.001, now);
  comp2.release.setValueAtTime(0.02, now);

  const limiter = audioCtx.createDynamicsCompressor();
  limiter.threshold.setValueAtTime(-1, now);
  limiter.knee.setValueAtTime(0, now);
  limiter.ratio.setValueAtTime(20, now);
  limiter.attack.setValueAtTime(0.0005, now);
  limiter.release.setValueAtTime(0.005, now);

  const postGain = audioCtx.createGain();
  postGain.gain.setValueAtTime(2.0, now);

  masterGain.connect(shaper);
  shaper.connect(comp1);
  comp1.connect(comp2);
  comp2.connect(limiter);
  limiter.connect(postGain);
  postGain.connect(audioCtx.destination);

  return masterGain;
}

// --- 고정 길이 톤 (long, triple 모드) ---

/**
 * 지정된 시간과 길이로 휘슬 톤을 생성한다.
 * @param {number} startTime - AudioContext 시간 기준 시작 시점
 * @param {number} duration - 톤 지속 시간 (초)
 */
function createFixedTone(startTime, duration) {
  unlockAudio();
  ensureAudio();

  const now = startTime;
  const end = now + duration;
  const cv = getCubicVol();

  // 오디오 체인 (독립 인스턴스)
  const preGain = audioCtx.createGain();
  preGain.gain.setValueAtTime(cv * 4.0, now);

  const shaper = audioCtx.createWaveShaper();
  shaper.curve = makeSoftClipCurve(18);
  shaper.oversample = '4x';

  const comp1 = audioCtx.createDynamicsCompressor();
  comp1.threshold.setValueAtTime(-28, now);
  comp1.knee.setValueAtTime(3, now);
  comp1.ratio.setValueAtTime(14, now);
  comp1.attack.setValueAtTime(0.001, now);
  comp1.release.setValueAtTime(0.03, now);

  const comp2 = audioCtx.createDynamicsCompressor();
  comp2.threshold.setValueAtTime(-12, now);
  comp2.knee.setValueAtTime(2, now);
  comp2.ratio.setValueAtTime(10, now);
  comp2.attack.setValueAtTime(0.001, now);
  comp2.release.setValueAtTime(0.02, now);

  const limiter = audioCtx.createDynamicsCompressor();
  limiter.threshold.setValueAtTime(-1, now);
  limiter.knee.setValueAtTime(0, now);
  limiter.ratio.setValueAtTime(20, now);
  limiter.attack.setValueAtTime(0.0005, now);
  limiter.release.setValueAtTime(0.005, now);

  const postGain = audioCtx.createGain();
  postGain.gain.setValueAtTime(2.0, now);

  preGain.connect(shaper);
  shaper.connect(comp1);
  comp1.connect(comp2);
  comp2.connect(limiter);
  limiter.connect(postGain);
  postGain.connect(audioCtx.destination);

  // 엔벨로프 (페이드 인/아웃)
  const env = audioCtx.createGain();
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(1, now + 0.015);
  env.gain.setValueAtTime(1, end - 0.04);
  env.gain.linearRampToValueAtTime(0, end);
  env.connect(preGain);

  // 오실레이터 1: 기본 톤 (2800Hz)
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(2800, now);
  osc1.connect(env);

  // 오실레이터 2: 배음 (5600Hz)
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(5600, now);
  const g2 = audioCtx.createGain();
  g2.gain.setValueAtTime(0.2, now);
  osc2.connect(g2);
  g2.connect(env);

  // LFO: 비브라토 효과 (28Hz)
  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(28, now);
  const lfoG = audioCtx.createGain();
  lfoG.gain.setValueAtTime(80, now);
  lfo.connect(lfoG);
  lfoG.connect(osc1.frequency);
  lfoG.connect(osc2.frequency);

  // 노이즈: 호흡 질감 (하이패스 필터 적용)
  const noiseLen = Math.ceil(audioCtx.sampleRate * duration);
  const noiseBuf = audioCtx.createBuffer(1, noiseLen, audioCtx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) nd[i] = (Math.random() * 2 - 1) * 0.12;
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuf;
  const hpf = audioCtx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.setValueAtTime(2000, now);
  const nG = audioCtx.createGain();
  nG.gain.setValueAtTime(0.4, now);
  nG.gain.setValueAtTime(0.4, end - 0.04);
  nG.gain.linearRampToValueAtTime(0, end);
  noise.connect(hpf);
  hpf.connect(nG);
  nG.connect(preGain);

  // 시작 및 정지 예약
  osc1.start(now);
  osc1.stop(end + 0.01);
  osc2.start(now);
  osc2.stop(end + 0.01);
  lfo.start(now);
  lfo.stop(end + 0.01);
  noise.start(now);
  noise.stop(end + 0.01);
}

// --- Hold 모드 (누르는 동안 계속 재생) ---

/** hold 모드 시작 */
async function startHold() {
  if (isPlaying) return;
  ensureAudio();
  if (audioCtx.state !== 'running') {
    await audioCtx.resume();
  }

  isPlaying = true;
  const now = audioCtx.currentTime;
  const input = createMaxChain(now);

  // 엔벨로프
  const env = audioCtx.createGain();
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(1, now + 0.015);
  env.connect(input);

  // 오실레이터 1
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(2800, now);
  osc1.connect(env);

  // 오실레이터 2 (배음)
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(5600, now);
  const g2 = audioCtx.createGain();
  g2.gain.setValueAtTime(0.2, now);
  osc2.connect(g2);
  g2.connect(env);

  // LFO
  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(28, now);
  const lfoG = audioCtx.createGain();
  lfoG.gain.setValueAtTime(80, now);
  lfo.connect(lfoG);
  lfoG.connect(osc1.frequency);
  lfoG.connect(osc2.frequency);

  // 노이즈 (최대 30초)
  const noiseLen = audioCtx.sampleRate * 30;
  const noiseBuf = audioCtx.createBuffer(1, noiseLen, audioCtx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) nd[i] = (Math.random() * 2 - 1) * 0.12;
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuf;
  const hpf = audioCtx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.setValueAtTime(2000, now);
  const nG = audioCtx.createGain();
  nG.gain.setValueAtTime(0.4, now);
  noise.connect(hpf);
  hpf.connect(nG);
  nG.connect(input);

  osc1.start(now);
  osc2.start(now);
  lfo.start(now);
  noise.start(now);

  if (navigator.vibrate) navigator.vibrate([9999]);
  activeNodes = { osc1, osc2, lfo, noise, env, nG };
}

/** hold 모드 정지 (페이드아웃 후 노드 정리) */
function stopHold() {
  if (!isPlaying || !activeNodes) {
    isPlaying = false;
    return;
  }
  const now = audioCtx.currentTime;
  const fade = 0.03;
  try {
    activeNodes.env.gain.cancelScheduledValues(now);
    activeNodes.env.gain.setValueAtTime(activeNodes.env.gain.value, now);
    activeNodes.env.gain.linearRampToValueAtTime(0, now + fade);
    activeNodes.nG.gain.cancelScheduledValues(now);
    activeNodes.nG.gain.setValueAtTime(activeNodes.nG.gain.value, now);
    activeNodes.nG.gain.linearRampToValueAtTime(0, now + fade);
    const st = now + fade + 0.01;
    activeNodes.osc1.stop(st);
    activeNodes.osc2.stop(st);
    activeNodes.lfo.stop(st);
    activeNodes.noise.stop(st);
  } catch (e) { /* ignore */ }

  if (navigator.vibrate) navigator.vibrate(0);
  activeNodes = null;
  masterGain = null;
  isPlaying = false;
}

// --- 공개 API ---

/** AudioContext 초기화 (사용자 제스처에서 호출 권장) */
function init() {
  unlockAudio();
}

/**
 * 지정된 모드로 휘슬을 재생한다.
 * @param {string} [mode] - 'hold' | 'long' | 'triple' (생략 시 현재 모드 사용)
 */
async function play(mode) {
  const m = mode || currentMode;
  ensureAudio();
  if (audioCtx.state !== 'running') {
    await audioCtx.resume();
  }

  if (m === 'hold') {
    await startHold();
  } else if (m === 'long') {
    createFixedTone(audioCtx.currentTime, 1.5);
    if (navigator.vibrate) navigator.vibrate([80, 30, 80]);
  } else if (m === 'triple') {
    const now = audioCtx.currentTime;
    createFixedTone(now, 0.25);
    createFixedTone(now + 0.35, 0.25);
    createFixedTone(now + 0.7, 0.5);
    if (navigator.vibrate) navigator.vibrate([80, 30, 80]);
  }
}

/** 현재 재생 중인 소리를 멈춘다 (hold 모드에서 사용) */
function stop() {
  stopHold();
}

/**
 * 휘슬 모드를 변경한다.
 * @param {string} mode - 'hold' | 'long' | 'triple'
 */
function setMode(mode) {
  currentMode = mode;
}

/**
 * 현재 휘슬 모드를 반환한다.
 * @returns {string} 'hold' | 'long' | 'triple'
 */
function getMode() {
  return currentMode;
}

/**
 * 볼륨을 설정한다.
 * @param {number} v - 0~1 범위의 볼륨
 */
function setVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  // 실시간으로 masterGain에 반영 (hold 재생 중)
  if (masterGain && audioCtx) {
    const now = audioCtx.currentTime;
    const expVol = getCubicVol();
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(expVol * 4.0, now);
  }
}

/**
 * 현재 볼륨을 반환한다.
 * @returns {number} 0~1 범위의 볼륨
 */
function getVolume() {
  return volume;
}

/** 재생 상태를 반환한다. */
function getIsPlaying() {
  return isPlaying;
}

/** 리소스 정리 (AudioContext 종료) */
function destroy() {
  if (isPlaying) stopHold();
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
  }
  firstUnlocked = false;
}

export const Whistle = {
  init,
  play,
  stop,
  setMode,
  getMode,
  setVolume,
  getVolume,
  getIsPlaying,
  destroy,
};
