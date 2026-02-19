/**
 * 타이머 컴포넌트
 * 전체화면 카운트다운 타이머 + 휘슬 통합
 */

import { Timer, formatTime } from '../tools/timer.js';
import { Whistle } from '../tools/whistle.js';
import { Sound } from '../tools/sound.js';

// --- 내부 상태 ---
let timer = null;
let currentSeconds = 300; // 기본 5분
let phase = 'setup'; // 'setup' | 'running' | 'completed'
let whistleMode = 'long';
let whistlePressing = false;
let cleanupFns = [];

/** 이벤트 리스너를 등록하고 cleanup 배열에 추가 */
function listen(el, event, handler, options) {
  if (!el) return;
  el.addEventListener(event, handler, options);
  cleanupFns.push(() => el.removeEventListener(event, handler, options));
}

// === render ===

export function render() {
  const timeStr = formatTime(currentSeconds);

  return `
    <div class="timer-view">
      <!-- 셋업 화면 -->
      <div class="timer-setup" id="timerSetup">
        <button class="timer-back-btn" id="timerBackBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          돌아가기
        </button>

        <div class="timer-setup-display" id="timerSetupDisplay">${timeStr}</div>

        <div class="timer-presets">
          <button class="timer-preset-btn" data-seconds="60">1분</button>
          <button class="timer-preset-btn" data-seconds="180">3분</button>
          <button class="timer-preset-btn timer-preset-btn--active" data-seconds="300">5분</button>
          <button class="timer-preset-btn" data-seconds="600">10분</button>
          <button class="timer-preset-btn" data-seconds="900">15분</button>
          <button class="timer-preset-btn" data-seconds="1200">20분</button>
        </div>

        <div class="timer-custom">
          <div class="timer-custom-group">
            <span class="timer-custom-label">분</span>
            <div class="timer-custom-controls">
              <button class="timer-adj-btn" id="minDown">-</button>
              <span class="timer-custom-value" id="minValue">${Math.floor(currentSeconds / 60)}</span>
              <button class="timer-adj-btn" id="minUp">+</button>
            </div>
          </div>
          <div class="timer-custom-group">
            <span class="timer-custom-label">초</span>
            <div class="timer-custom-controls">
              <button class="timer-adj-btn" id="secDown">-</button>
              <span class="timer-custom-value" id="secValue">${currentSeconds % 60}</span>
              <button class="timer-adj-btn" id="secUp">+</button>
            </div>
          </div>
        </div>

        <button class="timer-start-btn" id="timerStartBtn">시작</button>
      </div>

      <!-- 실행 화면 -->
      <div class="timer-running hidden" id="timerRunning">
        <div class="timer-countdown-display timer-state-normal" id="timerCountdown">${timeStr}</div>

        <div class="timer-run-controls">
          <button class="timer-ctrl-btn timer-ctrl-reset" id="timerResetBtn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
          <button class="timer-ctrl-btn timer-ctrl-toggle" id="timerToggleBtn">
            <svg id="timerPauseIcon" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            <svg id="timerPlayIcon" class="hidden" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <button class="timer-ctrl-btn timer-ctrl-stop" id="timerStopBtn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
          </button>
        </div>

        <!-- 휘슬 섹션 -->
        <div class="timer-whistle-section">
          <div class="timer-whistle-modes">
            <button class="timer-wmode-btn" data-wmode="hold">꾹</button>
            <button class="timer-wmode-btn timer-wmode-btn--active" data-wmode="long">길게</button>
            <button class="timer-wmode-btn" data-wmode="triple">삐삐삐</button>
          </div>
          <div class="timer-whistle-btn-wrap">
            <div class="timer-whistle-ring" id="twRing1"></div>
            <div class="timer-whistle-ring" id="twRing2"></div>
            <button class="timer-whistle-btn" id="timerWhistleBtn">
              <span style="font-size:28px">📣</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 완료 화면 -->
      <div class="timer-completed hidden" id="timerCompleted">
        <div class="timer-done-text">시간 종료!</div>
        <button class="timer-start-btn" id="timerResetToSetupBtn">다시 설정</button>
      </div>
    </div>
  `;
}

// === afterRender ===

export function afterRender() {
  // --- 요소 참조 ---
  const setupEl = document.getElementById('timerSetup');
  const runningEl = document.getElementById('timerRunning');
  const completedEl = document.getElementById('timerCompleted');
  const setupDisplay = document.getElementById('timerSetupDisplay');
  const countdownDisplay = document.getElementById('timerCountdown');
  const minValue = document.getElementById('minValue');
  const secValue = document.getElementById('secValue');
  const pauseIcon = document.getElementById('timerPauseIcon');
  const playIcon = document.getElementById('timerPlayIcon');

  /** 셋업 화면의 시간 표시 업데이트 */
  function updateSetupDisplay() {
    if (setupDisplay) setupDisplay.textContent = formatTime(currentSeconds);
    if (minValue) minValue.textContent = Math.floor(currentSeconds / 60);
    if (secValue) secValue.textContent = currentSeconds % 60;
  }

  /** 화면 전환 */
  function showPhase(p) {
    phase = p;
    setupEl?.classList.toggle('hidden', p !== 'setup');
    runningEl?.classList.toggle('hidden', p !== 'running');
    completedEl?.classList.toggle('hidden', p !== 'completed');
  }

  /** 타이머 토글 아이콘 업데이트 */
  function updateToggleIcon(isRunning) {
    pauseIcon?.classList.toggle('hidden', !isRunning);
    playIcon?.classList.toggle('hidden', isRunning);
  }

  // --- 프리셋 버튼 ---
  document.querySelectorAll('.timer-preset-btn').forEach(btn => {
    listen(btn, 'click', () => {
      const secs = parseInt(btn.dataset.seconds, 10);
      if (!isNaN(secs) && secs > 0) {
        currentSeconds = secs;
        updateSetupDisplay();
        // 활성 상태 업데이트
        document.querySelectorAll('.timer-preset-btn').forEach(b =>
          b.classList.toggle('timer-preset-btn--active', b === btn)
        );
      }
    });
  });

  // --- 분/초 조정 ---
  listen(document.getElementById('minUp'), 'click', () => {
    currentSeconds = Math.min(currentSeconds + 60, 5999);
    updateSetupDisplay();
    clearPresetActive();
  });
  listen(document.getElementById('minDown'), 'click', () => {
    currentSeconds = Math.max(currentSeconds - 60, 0);
    if (currentSeconds === 0) currentSeconds = 1;
    updateSetupDisplay();
    clearPresetActive();
  });
  listen(document.getElementById('secUp'), 'click', () => {
    currentSeconds = Math.min(currentSeconds + 10, 5999);
    updateSetupDisplay();
    clearPresetActive();
  });
  listen(document.getElementById('secDown'), 'click', () => {
    currentSeconds = Math.max(currentSeconds - 10, 1);
    updateSetupDisplay();
    clearPresetActive();
  });

  function clearPresetActive() {
    document.querySelectorAll('.timer-preset-btn').forEach(b =>
      b.classList.remove('timer-preset-btn--active')
    );
  }

  // --- 시작 버튼 ---
  listen(document.getElementById('timerStartBtn'), 'click', () => {
    if (currentSeconds <= 0) return;

    // 타이머 생성
    timer = new Timer({
      seconds: currentSeconds,
      warningAt: 10,
      onTick: (remaining) => {
        if (countdownDisplay) {
          countdownDisplay.textContent = formatTime(remaining);

          // 색상 상태 전환
          countdownDisplay.classList.remove('timer-state-normal', 'timer-state-warning', 'timer-state-danger');
          if (remaining > 30) {
            countdownDisplay.classList.add('timer-state-normal');
          } else if (remaining > 10) {
            countdownDisplay.classList.add('timer-state-warning');
          } else {
            countdownDisplay.classList.add('timer-state-danger');
          }

          // 마지막 10초 비프음
          if (remaining <= 10 && remaining > 0) {
            Sound.playBeep();
          }
        }
      },
      onWarning: () => {
        Sound.playWarning();
      },
      onComplete: () => {
        Sound.playEndAlarm();
        showPhase('completed');
        updateToggleIcon(false);
      },
    });

    // 카운트다운 초기 표시
    if (countdownDisplay) {
      countdownDisplay.textContent = formatTime(currentSeconds);
      countdownDisplay.classList.remove('timer-state-warning', 'timer-state-danger');
      countdownDisplay.classList.add('timer-state-normal');
    }

    showPhase('running');
    timer.start();
    updateToggleIcon(true);

    // 오디오 활성화
    Sound.activate();
    Whistle.init();
  });

  // --- 일시정지/재개 ---
  listen(document.getElementById('timerToggleBtn'), 'click', () => {
    if (!timer) return;
    timer.toggle();
    updateToggleIcon(timer.isRunning);
  });

  // --- 리셋 (같은 시간으로) ---
  listen(document.getElementById('timerResetBtn'), 'click', () => {
    if (!timer) return;
    timer.reset(currentSeconds);
    if (countdownDisplay) {
      countdownDisplay.textContent = formatTime(currentSeconds);
      countdownDisplay.classList.remove('timer-state-warning', 'timer-state-danger');
      countdownDisplay.classList.add('timer-state-normal');
    }
    updateToggleIcon(false);
  });

  // --- 정지 (셋업으로 돌아가기) ---
  listen(document.getElementById('timerStopBtn'), 'click', () => {
    if (timer) {
      timer.destroy();
      timer = null;
    }
    Sound.stopEndAlarm();
    showPhase('setup');
  });

  // --- 완료 후 다시 설정 ---
  listen(document.getElementById('timerResetToSetupBtn'), 'click', () => {
    if (timer) {
      timer.destroy();
      timer = null;
    }
    Sound.stopEndAlarm();
    showPhase('setup');
  });

  // --- 뒤로가기 ---
  listen(document.getElementById('timerBackBtn'), 'click', () => {
    if (window.classpet && window.classpet.router) {
      window.history.back();
    }
  });

  // --- 휘슬 모드 ---
  document.querySelectorAll('.timer-wmode-btn').forEach(btn => {
    listen(btn, 'click', () => {
      whistleMode = btn.dataset.wmode;
      Whistle.setMode(whistleMode);
      document.querySelectorAll('.timer-wmode-btn').forEach(b =>
        b.classList.toggle('timer-wmode-btn--active', b === btn)
      );
    });
  });

  // --- 휘슬 버튼 (터치 + 마우스) ---
  const whistleBtn = document.getElementById('timerWhistleBtn');
  const ring1 = document.getElementById('twRing1');
  const ring2 = document.getElementById('twRing2');

  function startRipple() {
    ring1?.classList.add('tw-ring--continuous');
    if (ring2) setTimeout(() => ring2.classList.add('tw-ring--continuous'), 400);
  }

  function stopRipple() {
    ring1?.classList.remove('tw-ring--continuous');
    ring2?.classList.remove('tw-ring--continuous');
  }

  function pulseRipple() {
    [ring1, ring2].forEach((r, i) => {
      if (!r) return;
      r.classList.remove('tw-ring--animate');
      void r.offsetWidth;
      setTimeout(() => r.classList.add('tw-ring--animate'), i * 120);
    });
  }

  async function whistleDown(e) {
    e.preventDefault();
    if (whistlePressing) return;
    whistlePressing = true;
    whistleBtn?.classList.add('timer-whistle-btn--pressed');

    if (whistleMode === 'hold') {
      await Whistle.play('hold');
      startRipple();
    } else {
      await Whistle.play(whistleMode);
      pulseRipple();
      setTimeout(() => {
        whistlePressing = false;
        whistleBtn?.classList.remove('timer-whistle-btn--pressed');
      }, 300);
    }
  }

  function whistleUp(e) {
    if (e) e.preventDefault();
    if (!whistlePressing) return;
    if (whistleMode === 'hold') {
      whistlePressing = false;
      whistleBtn?.classList.remove('timer-whistle-btn--pressed');
      Whistle.stop();
      stopRipple();
    }
  }

  if (whistleBtn) {
    listen(whistleBtn, 'touchstart', whistleDown, { passive: false });
    listen(whistleBtn, 'touchend', whistleUp, { passive: false });
    listen(whistleBtn, 'touchcancel', whistleUp, { passive: false });

    listen(whistleBtn, 'mousedown', (e) => {
      if ('ontouchstart' in window) return;
      whistleDown(e);
    });

    // mouseup은 document에서 감지 (버튼 밖에서 손을 뗄 수 있으므로)
    const mouseUpHandler = (e) => {
      if ('ontouchstart' in window) return;
      whistleUp(e);
    };
    document.addEventListener('mouseup', mouseUpHandler);
    cleanupFns.push(() => document.removeEventListener('mouseup', mouseUpHandler));
  }

  // --- visibility / blur 시 휘슬 정지 ---
  const visHandler = () => { if (document.hidden) whistleUp(); };
  const blurHandler = () => whistleUp();
  document.addEventListener('visibilitychange', visHandler);
  window.addEventListener('blur', blurHandler);
  cleanupFns.push(() => {
    document.removeEventListener('visibilitychange', visHandler);
    window.removeEventListener('blur', blurHandler);
  });
}

// === unmount ===

export function unmount() {
  // 타이머 정리
  if (timer) {
    timer.destroy();
    timer = null;
  }
  Sound.stopEndAlarm();

  // 휘슬 정지 (destroy는 하지 않음 - 다른 곳에서 재사용할 수 있으므로)
  Whistle.stop();
  whistlePressing = false;

  // 이벤트 리스너 정리
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];

  // 상태 초기화
  phase = 'setup';
}
