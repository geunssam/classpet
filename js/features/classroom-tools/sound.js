/* ============================================
   ClassPet - Sound (Web Audio API)
   효과음 모듈 - DOM 접근 없음
   ============================================ */

// AudioContext 싱글톤
let audioCtx = null;

/**
 * AudioContext를 가져오거나 생성한다.
 * suspended 상태이면 자동으로 resume한다.
 */
function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * 주파수 배열과 지속시간 배열로 톤을 재생한다.
 * @param {number[]} frequencies - 주파수 배열 (Hz)
 * @param {number[]} durations - 각 주파수의 지속시간 (초)
 * @param {number} volume - 볼륨 (0~1)
 */
function playTone(frequencies, durations, volume = 0.3) {
  try {
    const ctx = getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';

    let time = now;
    frequencies.forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, time);
      time += durations[i] || durations[0];
    });

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, time);

    osc.start(now);
    osc.stop(time);
  } catch (e) {
    console.log('Sound 재생 실패:', e);
  }
}

// --- 효과음 함수들 ---

/** 클릭음 (짧은 터치 피드백) */
function playClick() {
  playTone([600], [0.05], 0.1);
}

/** 카운트다운 비프음 (타이머 마지막 10초) */
function playBeep() {
  playTone([880], [0.08], 0.25);
}

/** 경고음 (타이머 경고 시점) */
function playWarning() {
  playTone([800, 600, 800], [0.1, 0.1, 0.1], 0.3);
}

/** 종료음 (타이머 완료) */
function playEnd() {
  playTone([400, 300, 200], [0.2, 0.2, 0.2], 0.5);
}

/** 종료 알림음 (5초간 높-낮 교대 반복) */
let endAlarmTimer = null;

function playEndAlarm() {
  stopEndAlarm();
  let count = 0;
  const maxCount = 10; // 0.5초 x 10 = 5초
  endAlarmTimer = setInterval(() => {
    if (count >= maxCount) {
      stopEndAlarm();
      return;
    }
    const freq = count % 2 === 0 ? 880 : 660;
    playTone([freq], [0.3], 0.5);
    count++;
  }, 500);
}

function stopEndAlarm() {
  if (endAlarmTimer) {
    clearInterval(endAlarmTimer);
    endAlarmTimer = null;
  }
}

/** 뽑기 효과음 (도-미-솔 상승) */
function playPickSound() {
  playTone([523, 659, 784], [0.1, 0.1, 0.15], 0.2);
}

/** 에러음 */
function playError() {
  playTone([300, 200], [0.15, 0.15], 0.2);
}

/**
 * AudioContext 활성화 (사용자 제스처에서 호출)
 * 모바일에서는 첫 터치/클릭 시 호출해야 소리가 난다.
 */
function activate() {
  getContext();
}

export const Sound = {
  playClick,
  playBeep,
  playWarning,
  playEnd,
  playEndAlarm,
  stopEndAlarm,
  playPickSound,
  playError,
  activate,
};
