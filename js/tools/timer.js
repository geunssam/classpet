/* ============================================
   ClassPet - Timer
   순수 타이머 로직 - DOM 접근 없음
   ============================================ */

/**
 * 범용 카운트다운 타이머 클래스
 * UI와 완전히 분리되어 콜백으로만 상태를 전달한다.
 *
 * @example
 * const timer = new Timer({
 *   seconds: 180,
 *   warningAt: 10,
 *   onTick: (remaining) => updateDisplay(remaining),
 *   onWarning: () => playWarningSound(),
 *   onComplete: () => showTimerEnd(),
 * });
 * timer.start();
 */
export class Timer {
  /**
   * @param {object} options
   * @param {number} [options.seconds=180] - 시작 시간 (초)
   * @param {number} [options.warningAt=10] - 경고 시점 (남은 초)
   * @param {function} [options.onTick] - 매초 호출 (remaining: number)
   * @param {function} [options.onWarning] - 경고 시점 1회 호출
   * @param {function} [options.onComplete] - 타이머 종료 시 호출
   */
  constructor(options = {}) {
    this.totalSeconds = options.seconds || 180;
    this.remainingSeconds = this.totalSeconds;
    this.interval = null;
    this.isRunning = false;

    this.onTick = options.onTick || null;
    this.onWarning = options.onWarning || null;
    this.onComplete = options.onComplete || null;
    this.warningAt = options.warningAt || 10;
    this.warningFired = false;
  }

  /** 시간 설정 (리셋 포함) */
  setTime(seconds) {
    this.totalSeconds = seconds;
    this.remainingSeconds = seconds;
    this.warningFired = false;
    if (this.onTick) this.onTick(this.remainingSeconds);
  }

  /** 타이머 시작 */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.interval = setInterval(() => this._tick(), 1000);
  }

  /** 일시정지 */
  pause() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /** 리셋 (선택적으로 새 시간 설정) */
  reset(seconds) {
    this.pause();
    if (seconds !== undefined) this.totalSeconds = seconds;
    this.remainingSeconds = this.totalSeconds;
    this.warningFired = false;
    if (this.onTick) this.onTick(this.remainingSeconds);
  }

  /** 시작/일시정지 토글 */
  toggle() {
    if (this.isRunning) this.pause();
    else this.start();
  }

  /** 타이머 정리 (메모리 해제) */
  destroy() {
    this.pause();
    this.onTick = null;
    this.onWarning = null;
    this.onComplete = null;
  }

  /** 내부: 매초 호출되는 틱 로직 */
  _tick() {
    if (!this.isRunning) return;
    this.remainingSeconds--;

    if (this.onTick) this.onTick(this.remainingSeconds);

    // 경고 시점 도달 시 1회 호출
    if (this.remainingSeconds <= this.warningAt && !this.warningFired) {
      this.warningFired = true;
      if (this.onWarning) this.onWarning();
    }

    // 타이머 종료
    if (this.remainingSeconds <= 0) {
      this.pause();
      if (this.onComplete) this.onComplete();
    }
  }
}

/**
 * 초를 "M:SS" 형식 문자열로 변환한다.
 * @param {number} seconds - 변환할 초
 * @returns {string} "M:SS" 형식 (예: "3:05", "0:00")
 */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}
