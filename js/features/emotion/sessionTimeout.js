/**
 * 세션 타임아웃 관리
 * 교사: 2시간 비활동 → 자동 로그아웃
 * 학생: 30분 비활동 → 자동 로그아웃
 */

const TEACHER_TIMEOUT = 2 * 60 * 60 * 1000; // 2시간
const STUDENT_TIMEOUT = 30 * 60 * 1000;      // 30분
const WARNING_BEFORE = 5 * 60 * 1000;         // 만료 5분 전 경고
const CHECK_INTERVAL = 60 * 1000;              // 1분마다 체크
const THROTTLE_MS = 10 * 1000;                 // 10초 throttle
const ACTIVITY_KEY = 'classpet_last_activity';

let store = null;
let checkIntervalId = null;
let warningShown = false;
let lastThrottleTime = 0;

function updateActivity() {
    const now = Date.now();
    if (now - lastThrottleTime < THROTTLE_MS) return;
    lastThrottleTime = now;
    localStorage.setItem(ACTIVITY_KEY, String(now));
    warningShown = false;
}

function getLastActivity() {
    const val = localStorage.getItem(ACTIVITY_KEY);
    return val ? parseInt(val, 10) : Date.now();
}

function getTimeout() {
    if (store.isStudentLoggedIn()) return STUDENT_TIMEOUT;
    if (store.isTeacherLoggedIn()) return TEACHER_TIMEOUT;
    return null;
}

function checkExpiry() {
    const timeout = getTimeout();
    if (!timeout) return; // 로그인 안 된 상태

    const elapsed = Date.now() - getLastActivity();
    const remaining = timeout - elapsed;

    if (remaining <= 0) {
        // 만료 → 로그아웃
        handleExpiry();
    } else if (remaining <= WARNING_BEFORE && !warningShown) {
        // 경고
        warningShown = true;
        const minutes = Math.ceil(remaining / 60000);
        import('../../shared/utils/animations.js').then(({ showToast }) => {
            showToast(`${minutes}분 후 자동 로그아웃됩니다`, 'warning');
        });
    }
}

async function handleExpiry() {
    destroySessionTimeout();

    if (store.isStudentLoggedIn()) {
        store.studentLogout();
        window.location.hash = 'student-login';
    } else if (store.isTeacherLoggedIn()) {
        await store.signOut();
        window.location.hash = 'login';
    }

    import('../../shared/utils/animations.js').then(({ showToast }) => {
        showToast('장시간 비활동으로 자동 로그아웃되었습니다', 'info');
    });
}

const ACTIVITY_EVENTS = ['click', 'touchstart', 'keydown'];

export function initSessionTimeout(storeRef) {
    store = storeRef;

    // 초기 활동 시간 기록
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));

    // 이벤트 리스너 등록
    ACTIVITY_EVENTS.forEach(evt => {
        document.addEventListener(evt, updateActivity, { passive: true });
    });

    // 주기적 만료 체크
    checkIntervalId = setInterval(checkExpiry, CHECK_INTERVAL);
}

export function destroySessionTimeout() {
    if (checkIntervalId) {
        clearInterval(checkIntervalId);
        checkIntervalId = null;
    }
    ACTIVITY_EVENTS.forEach(evt => {
        document.removeEventListener(evt, updateActivity);
    });
    localStorage.removeItem(ACTIVITY_KEY);
    warningShown = false;
}
