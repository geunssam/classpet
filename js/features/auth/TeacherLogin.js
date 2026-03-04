/**
 * 교사 로그인 컴포넌트
 *
 * 새로운 흐름:
 * - 이미 Google 로그인 되어 있으면 → class-select로 리다이렉트
 * - 오프라인이거나 레거시 모드일 경우 → 기존 비밀번호 로그인
 */

import { store } from '../../store.js';
import { router } from '../../router.js';
import { showToast } from '../../shared/utils/animations.js';

/**
 * 렌더링
 */
export function render() {
    // Google 로그인 여부 확인
    if (store.isGoogleTeacher()) {
        // 이미 Google 로그인됨 → 학급 선택으로
        setTimeout(() => router.navigate('class-select'), 0);
        return `
            <div class="min-h-[70vh] flex items-center justify-center">
                <div class="text-center">
                    <div class="animate-spin text-4xl mb-4">🔄</div>
                    <p class="text-gray-600">학급 선택 화면으로 이동 중...</p>
                </div>
            </div>
        `;
    }

    const settings = store.getSettings();
    const hasPassword = !!settings?.teacherPassword;

    return `
        <div class="teacher-login-container min-h-[70vh] flex flex-col items-center justify-center px-4">
            <!-- 뒤로가기 버튼 -->
            <div class="w-full max-w-sm mb-8">
                <button id="backToSelectBtn" class="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <span>←</span>
                    <span>뒤로가기</span>
                </button>
            </div>

            <!-- 로고 영역 -->
            <div class="text-center mb-8">
                <div class="text-5xl mb-4">👩‍🏫</div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">선생님 로그인</h2>
                <p class="text-gray-500">${hasPassword ? '비밀번호를 입력해주세요' : '비밀번호를 설정해주세요'}</p>
            </div>

            <!-- Google 로그인 권장 안내 -->
            <div class="w-full max-w-sm mb-6">
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
                    <p class="text-blue-800 mb-3">💡 <strong>Google 계정</strong>으로 로그인하면 여러 학급을 관리하고 어디서든 접속할 수 있어요!</p>
                    <button id="switchToGoogleBtn" class="w-full py-2 bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                        Google로 로그인하기 →
                    </button>
                </div>
            </div>

            <!-- 구분선 -->
            <div class="w-full max-w-sm flex items-center gap-4 mb-6">
                <div class="flex-1 h-px bg-gray-200"></div>
                <span class="text-sm text-gray-400">또는 오프라인 모드</span>
                <div class="flex-1 h-px bg-gray-200"></div>
            </div>

            <!-- 로그인/설정 폼 -->
            <div class="w-full max-w-sm">
                ${hasPassword ? renderLoginForm() : renderSetupForm()}
            </div>
        </div>
    `;
}

/**
 * 로그인 폼 (비밀번호가 설정된 경우)
 */
function renderLoginForm() {
    return `
        <div class="space-y-4">
            <div class="relative">
                <input type="password"
                       id="passwordInput"
                       class="w-full p-4 text-center text-2xl tracking-widest border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                       placeholder="••••"
                       maxlength="6"
                       inputmode="numeric"
                       pattern="[0-9]*"
                       autofocus>
            </div>

            <button id="loginBtn" class="btn btn-primary w-full py-4 text-lg">
                로그인
            </button>

            <div class="text-center">
                <button id="resetPasswordBtn" class="text-sm text-gray-400 hover:text-gray-600">
                    비밀번호를 잊으셨나요?
                </button>
            </div>
        </div>
    `;
}

/**
 * 비밀번호 설정 폼 (최초 설정)
 */
function renderSetupForm() {
    return `
        <div class="space-y-4">
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                <p class="font-medium mb-1">🔐 처음 사용하시네요!</p>
                <p>학급 관리를 위한 간단한 비밀번호를 설정해주세요.</p>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호 (4~6자리 숫자)</label>
                <input type="password"
                       id="newPasswordInput"
                       class="w-full p-4 text-center text-2xl tracking-widest border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                       placeholder="••••"
                       maxlength="6"
                       inputmode="numeric"
                       pattern="[0-9]*"
                       autofocus>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
                <input type="password"
                       id="confirmPasswordInput"
                       class="w-full p-4 text-center text-2xl tracking-widest border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                       placeholder="••••"
                       maxlength="6"
                       inputmode="numeric"
                       pattern="[0-9]*">
            </div>

            <button id="setupBtn" class="btn btn-primary w-full py-4 text-lg">
                비밀번호 설정하기
            </button>
        </div>
    `;
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // Google 로그인 상태면 이벤트 바인딩 불필요
    if (store.isGoogleTeacher()) {
        return;
    }

    const settings = store.getSettings();
    const hasPassword = !!settings?.teacherPassword;

    // 뒤로가기 버튼
    const backBtn = document.getElementById('backToSelectBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            router.navigate('login');
        });
    }

    // Google 로그인 전환 버튼
    const switchToGoogleBtn = document.getElementById('switchToGoogleBtn');
    if (switchToGoogleBtn) {
        switchToGoogleBtn.addEventListener('click', async () => {
            try {
                const result = await store.signInWithGoogle();
                if (result.success) {
                    showToast(`환영합니다, ${result.user.displayName || '선생님'}! 🎉`, 'success');
                    router.navigate('class-select');
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                if (error.code === 'auth/popup-closed-by-user') {
                    showToast('로그인이 취소되었습니다', 'info');
                } else {
                    showToast(error.message || '로그인에 실패했어요', 'error');
                }
            }
        });
    }

    if (hasPassword) {
        bindLoginEvents();
    } else {
        bindSetupEvents();
    }
}

/**
 * 로그인 이벤트 바인딩
 */
function bindLoginEvents() {
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const resetBtn = document.getElementById('resetPasswordBtn');

    // 엔터 키로 로그인
    if (passwordInput) {
        passwordInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                attemptLogin();
            }
        });
    }

    // 로그인 버튼
    if (loginBtn) {
        loginBtn.addEventListener('click', attemptLogin);
    }

    // 비밀번호 재설정
    if (resetBtn) {
        resetBtn.addEventListener('click', showResetConfirm);
    }
}

/**
 * 비밀번호 설정 이벤트 바인딩
 */
function bindSetupEvents() {
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    const setupBtn = document.getElementById('setupBtn');

    // 엔터 키로 설정
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                attemptSetup();
            }
        });
    }

    // 설정 버튼
    if (setupBtn) {
        setupBtn.addEventListener('click', attemptSetup);
    }
}

/**
 * 로그인 시도
 */
function attemptLogin() {
    const password = document.getElementById('passwordInput').value;
    const settings = store.getSettings();

    if (!password) {
        showToast('비밀번호를 입력해주세요', 'warning');
        return;
    }

    if (password === settings.teacherPassword) {
        // 교사 세션 생성
        store.teacherLogin();
        showToast('환영합니다, 선생님! 🎉', 'success');
        router.navigate('dashboard');
    } else {
        showToast('비밀번호가 맞지 않습니다', 'error');
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
    }
}

/**
 * 비밀번호 설정 시도
 */
function attemptSetup() {
    const newPassword = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;

    if (!newPassword) {
        showToast('비밀번호를 입력해주세요', 'warning');
        return;
    }

    if (newPassword.length < 4) {
        showToast('비밀번호는 4자리 이상이어야 합니다', 'warning');
        return;
    }

    if (!/^\d+$/.test(newPassword)) {
        showToast('숫자만 입력해주세요', 'warning');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('비밀번호가 일치하지 않습니다', 'warning');
        document.getElementById('confirmPasswordInput').value = '';
        document.getElementById('confirmPasswordInput').focus();
        return;
    }

    // 비밀번호 저장
    store.updateSettings({ teacherPassword: newPassword });

    // 교사 세션 생성
    store.teacherLogin();

    showToast('비밀번호가 설정되었습니다! 🎉', 'success');
    router.navigate('dashboard');
}

/**
 * 비밀번호 재설정 확인
 */
function showResetConfirm() {
    if (confirm('비밀번호를 재설정하면 새 비밀번호를 설정해야 합니다.\n\n정말 비밀번호를 재설정하시겠습니까?')) {
        // 비밀번호 삭제
        store.updateSettings({ teacherPassword: null });
        showToast('비밀번호가 초기화되었습니다', 'info');
        router.handleRoute(); // 페이지 새로고침
    }
}
