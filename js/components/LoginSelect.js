/**
 * 로그인 선택 컴포넌트
 * 교사/학생 로그인 선택 화면
 */

import { store } from '../store.js';
import { router } from '../router.js';

/**
 * 렌더링
 */
export function render() {
    const settings = store.getSettings();
    const className = settings?.className || '우리 반';

    return `
        <div class="login-select-container min-h-[70vh] flex flex-col items-center justify-center px-4">
            <!-- 로고 영역 -->
            <div class="text-center mb-10">
                <div class="text-6xl mb-4 animate-bounce-slow">🐾</div>
                <h1 class="text-3xl font-bold text-gray-800 mb-2">클래스펫</h1>
                <p class="text-gray-500">${className}</p>
            </div>

            <!-- 로그인 선택 버튼 -->
            <div class="w-full max-w-sm space-y-4">
                <!-- 교사 로그인 -->
                <button id="teacherLoginBtn" class="login-select-btn w-full p-6 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div class="flex items-center gap-4">
                        <span class="text-4xl">👩‍🏫</span>
                        <div class="text-left">
                            <p class="font-bold text-lg">선생님 로그인</p>
                            <p class="text-sm opacity-80">학급 관리 및 칭찬하기</p>
                        </div>
                        <span class="ml-auto text-2xl">→</span>
                    </div>
                </button>

                <!-- 학생 로그인 -->
                <button id="studentLoginBtn" class="login-select-btn w-full p-6 bg-gradient-to-r from-success to-primary text-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div class="flex items-center gap-4">
                        <span class="text-4xl">🧒</span>
                        <div class="text-left">
                            <p class="font-bold text-lg">학생 로그인</p>
                            <p class="text-sm opacity-80">내 펫에게 기분 말하기</p>
                        </div>
                        <span class="ml-auto text-2xl">→</span>
                    </div>
                </button>
            </div>

            <!-- 하단 안내 -->
            <div class="mt-12 text-center text-sm text-gray-400">
                <p>펫과 함께 즐거운 학교생활 만들기</p>
            </div>
        </div>
    `;
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // 교사 로그인 버튼
    const teacherBtn = document.getElementById('teacherLoginBtn');
    if (teacherBtn) {
        teacherBtn.addEventListener('click', () => {
            router.navigate('teacher-login');
        });
    }

    // 학생 로그인 버튼
    const studentBtn = document.getElementById('studentLoginBtn');
    if (studentBtn) {
        studentBtn.addEventListener('click', () => {
            router.navigate('student-login');
        });
    }
}
