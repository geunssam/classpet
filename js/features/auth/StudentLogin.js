/**
 * 학생 로그인 컴포넌트
 * 4자리 개인코드 입력으로 1단계 로그인
 */

import { store } from '../../store.js';
import { router } from '../../router.js';
import { getStudentByCode } from '../class/students.firebase.js';
import { signInAnonymouslyIfNeeded } from '../auth/auth.firebase.js';
import { ensureFirebaseReady } from '../../shared/firebase/init.js';

// URL에서 전달된 개인코드 (QR 스캔 시)
let urlStudentCode = null;
// 로그인 처리 중 플래그
let isLoggingIn = false;

/**
 * 렌더링
 */
export function render(params = {}) {
    // URL에서 전달된 코드 파라미터 저장
    if (params.code) {
        urlStudentCode = params.code;
    }

    // URL 코드가 있으면 자동 로그인 시도 → 로딩 화면
    if (urlStudentCode) {
        return renderAutoLoginScreen(urlStudentCode);
    }

    return `
        <div class="student-login-container min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4">
            <!-- 헤더 -->
            <div class="text-center mb-8">
                <div class="text-6xl mb-4 animate-bounce-slow">🐾</div>
                <h1 class="text-2xl font-bold text-gray-800 mb-2">안녕!</h1>
                <p class="text-gray-600">내 코드를 입력해주세요</p>
            </div>

            <!-- 코드 입력 -->
            <div class="w-full max-w-xs">
                <div class="bg-white rounded-2xl p-6 shadow-soft">
                    <div class="flex justify-center gap-3 mb-4" id="codeInputContainer">
                        <input type="text" maxlength="1" class="student-code-input w-14 h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0" data-index="0" inputmode="numeric" pattern="[0-9]*">
                        <input type="text" maxlength="1" class="student-code-input w-14 h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0" data-index="1" inputmode="numeric" pattern="[0-9]*">
                        <input type="text" maxlength="1" class="student-code-input w-14 h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0" data-index="2" inputmode="numeric" pattern="[0-9]*">
                        <input type="text" maxlength="1" class="student-code-input w-14 h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0" data-index="3" inputmode="numeric" pattern="[0-9]*">
                    </div>

                    <!-- 에러 메시지 -->
                    <p id="codeError" class="text-center text-sm text-red-500 mb-4 hidden">코드를 확인해주세요!</p>

                    <!-- 로딩 -->
                    <div id="codeLoading" class="text-center text-sm text-gray-500 mb-4 hidden">
                        <span class="inline-block animate-spin mr-2">⏳</span>
                        확인 중...
                    </div>

                    <button id="codeSubmitBtn" class="liquid-btn-student w-full" disabled>
                        입장하기
                    </button>
                </div>

                <div class="mt-6 text-center">
                    <p class="text-sm text-gray-400">
                        코드를 모르면 선생님께 물어보세요!
                    </p>
                </div>
            </div>

            <!-- 돌아가기 -->
            <div class="mt-8 text-center">
                <a href="#login" class="text-sm text-gray-400 hover:text-primary transition-colors">
                    ← 처음으로 돌아가기
                </a>
            </div>
        </div>
    `;
}

/**
 * QR 스캔 자동 로그인 화면
 */
function renderAutoLoginScreen(code) {
    return `
        <div class="student-login-container min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4">
            <div class="text-center">
                <div class="text-6xl mb-6 animate-bounce">🐾</div>
                <h1 id="autoLoginTitle" class="text-2xl font-bold text-gray-800 mb-2">로그인 중...</h1>
                <p id="autoLoginSubtitle" class="text-gray-500 mb-4">잠시만 기다려주세요</p>
                <div id="autoLoginSpinner" class="mt-6">
                    <span class="inline-block animate-spin text-2xl">⏳</span>
                </div>
            </div>
            <!-- 에러 메시지 (숨김) -->
            <div id="autoLoginError" class="hidden mt-6 text-center">
                <p class="text-red-500 mb-4" id="autoLoginErrorText">코드가 올바르지 않아요</p>
                <button id="manualInputBtn" class="liquid-btn-student">직접 입력하기</button>
            </div>
        </div>
    `;
}

/**
 * 개인코드 검증 및 로그인
 */
async function verifyAndLogin(code) {
    if (isLoggingIn) return;
    isLoggingIn = true;

    const errorEl = document.getElementById('codeError');
    const loadingEl = document.getElementById('codeLoading');
    const submitBtn = document.getElementById('codeSubmitBtn');

    if (errorEl) errorEl.classList.add('hidden');
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (submitBtn) submitBtn.disabled = true;

    try {
        // Firebase 준비
        await ensureFirebaseReady();
        // 익명 인증
        await signInAnonymouslyIfNeeded();

        // 개인코드로 학생 정보 조회
        const studentInfo = await getStudentByCode(code);
        if (!studentInfo) {
            showCodeError('코드를 확인해주세요!');
            return;
        }

        const { teacherUid, classId, studentId } = studentInfo;

        // 학급 정보 설정
        store.setCurrentClass(teacherUid, classId);
        store.firebaseEnabled = true;

        // 학급 데이터 로드
        await store.loadClassDataFromFirebase();

        // 학생 로그인 세션 설정
        const session = store.studentLogin(studentId);
        if (!session) {
            showCodeError('학생 정보를 찾을 수 없어요');
            return;
        }

        // 펫 선택 여부 확인
        const hasPet = store.hasSelectedPet(studentId);
        const student = store.getStudent(studentId);

        setTimeout(() => {
            if (hasPet) {
                if (student?.petCompleted) {
                    // 펫 완성 상태 → 메인으로 (축하 UI 표시됨)
                    router.navigate('student-main');
                } else {
                    router.navigate('student-home');
                }
            } else {
                router.navigate('pet-selection');
            }
        }, 200);

    } catch (error) {
        console.error('로그인 실패:', error);
        showCodeError('로그인에 실패했어요. 다시 시도해주세요.');
    } finally {
        isLoggingIn = false;
        if (loadingEl) loadingEl.classList.add('hidden');
        if (submitBtn) submitBtn.disabled = false;
    }
}

/**
 * 에러 표시
 */
function showCodeError(message) {
    const errorEl = document.getElementById('codeError');
    const inputs = document.querySelectorAll('.student-code-input');

    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }

    // 흔들기 애니메이션
    const container = document.getElementById('codeInputContainer');
    if (container) {
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 500);
    }

    // 입력 초기화
    inputs.forEach(input => {
        input.value = '';
        input.classList.add('border-red-400');
    });

    setTimeout(() => {
        inputs.forEach(input => input.classList.remove('border-red-400'));
        if (inputs[0]) inputs[0].focus();
    }, 300);
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // QR 코드 자동 로그인
    if (urlStudentCode) {
        handleAutoLogin();
        return;
    }

    setupCodeInput();
}

/**
 * QR 스캔 자동 로그인 처리
 */
async function handleAutoLogin() {
    const code = urlStudentCode;
    if (!code) return;

    const errorDiv = document.getElementById('autoLoginError');
    const errorText = document.getElementById('autoLoginErrorText');
    const spinner = document.getElementById('autoLoginSpinner');
    const title = document.getElementById('autoLoginTitle');
    const subtitle = document.getElementById('autoLoginSubtitle');

    function showError(message) {
        if (spinner) spinner.classList.add('hidden');
        if (title) title.textContent = '로그인 실패';
        if (subtitle) subtitle.textContent = '';
        if (errorDiv) {
            errorDiv.classList.remove('hidden');
            if (errorText) errorText.textContent = message;
        }
    }

    try {
        // 타임아웃 10초
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 10000)
        );

        await ensureFirebaseReady();
        await signInAnonymouslyIfNeeded();

        const studentInfo = await Promise.race([
            getStudentByCode(code),
            timeoutPromise
        ]);

        if (!studentInfo) {
            showError('코드가 올바르지 않아요. 선생님에게 확인해주세요!');
            setupManualInputBtn();
            return;
        }

        const { teacherUid, classId, studentId } = studentInfo;
        store.setCurrentClass(teacherUid, classId);
        store.firebaseEnabled = true;
        await store.loadClassDataFromFirebase();

        const session = store.studentLogin(studentId);
        if (!session) {
            showError('학생 정보를 찾을 수 없어요');
            setupManualInputBtn();
            return;
        }

        // 성공 — URL 코드 초기화
        urlStudentCode = null;
        const hasPet = store.hasSelectedPet(studentId);
        const student = store.getStudent(studentId);

        setTimeout(() => {
            if (hasPet) {
                if (student?.petCompleted) {
                    router.navigate('student-main');
                } else {
                    router.navigate('student-home');
                }
            } else {
                router.navigate('pet-selection');
            }
        }, 200);

    } catch (error) {
        console.error('자동 로그인 실패:', error);
        if (error.message === 'timeout') {
            showError('연결 시간이 초과되었어요. 네트워크를 확인하고 다시 시도해주세요.');
        } else {
            showError('로그인 중 오류가 발생했어요. 다시 시도해주세요.');
        }
        setupManualInputBtn();
    }
}

/**
 * 직접 입력 버튼 바인딩
 */
function setupManualInputBtn() {
    const manualBtn = document.getElementById('manualInputBtn');
    if (manualBtn) {
        manualBtn.addEventListener('click', () => {
            urlStudentCode = null;
            router.handleRoute();
        });
    }
}

/**
 * 코드 입력 이벤트 설정
 */
function setupCodeInput() {
    const inputs = document.querySelectorAll('.student-code-input');
    const submitBtn = document.getElementById('codeSubmitBtn');
    const errorEl = document.getElementById('codeError');

    if (!inputs.length) return;

    function getCodeValue() {
        return Array.from(inputs).map(i => i.value).join('');
    }

    function updateSubmitButton() {
        if (submitBtn) {
            submitBtn.disabled = getCodeValue().length !== 4;
        }
    }

    // 입력 이벤트
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = value;

            if (value && index < 3) {
                inputs[index + 1].focus();
            }

            if (errorEl) errorEl.classList.add('hidden');
            updateSubmitButton();

            // 4자리 입력 완료 시 자동 제출
            const code = getCodeValue();
            if (code.length === 4) {
                verifyAndLogin(code);
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
            if (e.key === 'Enter') {
                const code = getCodeValue();
                if (code.length === 4) {
                    verifyAndLogin(code);
                }
            }
        });

        input.addEventListener('focus', () => input.select());

        // 붙여넣기 지원
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
            if (pasteData.length >= 4) {
                for (let i = 0; i < 4; i++) {
                    inputs[i].value = pasteData[i];
                }
                inputs[3].focus();
                updateSubmitButton();
                // 자동 제출
                verifyAndLogin(pasteData.slice(0, 4));
            }
        });
    });

    // 첫 번째 입력에 포커스
    setTimeout(() => inputs[0]?.focus(), 100);

    // 제출 버튼
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const code = getCodeValue();
            if (code.length === 4) {
                verifyAndLogin(code);
            }
        });
    }
}
