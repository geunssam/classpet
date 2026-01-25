/**
 * 로그인 선택 컴포넌트
 * 교사/학생 로그인 선택 화면
 *
 * 새로운 흐름:
 * - 교사: Google 로그인 → 학급 선택/생성 → 대시보드
 * - 학생: 학급코드 입력 → 번호 선택 → PIN → 학생 메인
 */

import { store } from '../store.js';
import { router } from '../router.js';
import { showToast } from '../utils/animations.js';

/**
 * 렌더링
 */
export function render() {
    return `
        <div class="login-select-container flex flex-col items-center justify-center px-4 overflow-hidden" style="min-height: 100dvh;">
            <!-- 로고 영역 -->
            <div class="text-center mb-10">
                <div class="text-6xl mb-4 animate-bounce-slow">🐾</div>
                <h1 class="text-3xl font-bold text-gray-800 mb-2">클래스펫</h1>
                <p class="text-gray-500">펫과 함께 즐거운 학교생활</p>
            </div>

            <!-- 로그인 선택 버튼 -->
            <div class="w-full max-w-sm space-y-4">
                <!-- Google 로그인 (교사) -->
                <button id="googleLoginBtn" class="login-select-btn w-full p-5 bg-gradient-to-r from-purple-300/10 via-blue-300/10 to-pink-200/10 backdrop-blur-sm text-gray-700 rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 border-2 border-purple-400/50">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" class="w-7 h-7">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        </div>
                        <div class="text-left flex-1">
                            <p class="font-bold text-lg">Google로 로그인</p>
                            <p class="text-sm text-gray-600">선생님 전용</p>
                        </div>
                        <span class="text-2xl text-gray-600">→</span>
                    </div>
                </button>

                <!-- 구분선 -->
                <div class="flex items-center gap-4 my-6">
                    <div class="flex-1 h-px bg-gray-200"></div>
                    <span class="text-sm text-gray-400">또는</span>
                    <div class="flex-1 h-px bg-gray-200"></div>
                </div>

                <!-- 학생 로그인 -->
                <button id="studentLoginBtn" class="login-select-btn w-full p-5 bg-gradient-to-r from-purple-300/10 via-blue-300/10 to-pink-200/10 backdrop-blur-sm text-gray-700 rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 border-2 border-purple-400/50">
                    <div class="flex items-center gap-4">
                        <span class="text-4xl">👦</span>
                        <div class="text-left flex-1">
                            <p class="font-bold text-lg">학생으로 입장</p>
                            <p class="text-sm text-gray-600">학급코드로 접속하기</p>
                        </div>
                        <span class="text-2xl text-gray-600">→</span>
                    </div>
                </button>
            </div>

            <!-- 하단 안내 -->
            <div class="mt-12 text-center text-sm text-gray-400">
                <p>🔒 안전한 Google 계정으로 로그인하세요</p>
            </div>

            <!-- 로딩 오버레이 -->
            <div id="loginLoadingOverlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-2xl p-8 text-center">
                    <div class="animate-spin text-4xl mb-4">🔄</div>
                    <p class="text-gray-700 font-medium">로그인 중...</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // Google 로그인 버튼
    const googleBtn = document.getElementById('googleLoginBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
    }

    // 학생 로그인 버튼
    const studentBtn = document.getElementById('studentLoginBtn');
    if (studentBtn) {
        studentBtn.addEventListener('click', () => {
            router.navigate('student-login');
        });
    }
}

/**
 * Google 로그인 처리
 */
async function handleGoogleLogin() {
    const loadingOverlay = document.getElementById('loginLoadingOverlay');

    try {
        // 로딩 표시
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }

        // Google 로그인 시도
        const result = await store.signInWithGoogle();

        if (result.success) {
            showToast(`환영합니다, ${result.user.displayName || '선생님'}! 🎉`, 'success');

            // 학급 선택 화면으로 이동
            router.navigate('class-select');
        } else {
            throw new Error(result.error || '로그인에 실패했습니다');
        }
    } catch (error) {
        console.error('Google 로그인 오류:', error);

        // 사용자가 취소한 경우
        if (error.code === 'auth/popup-closed-by-user') {
            showToast('로그인이 취소되었습니다', 'info');
        } else {
            showToast(error.message || '로그인에 실패했습니다', 'error');
        }
    } finally {
        // 로딩 숨기기
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }
}
