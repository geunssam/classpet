/**
 * 학생 로그인 컴포넌트
 * 학급 코드 입력 + 번호 선택 + PIN 입력 방식의 보안 로그인
 */

import { store, PET_TYPES } from '../../store.js';
import { router } from '../../router.js';

// 현재 선택된 학생 정보
let selectedStudent = null;
// 학급 코드 입력 모드
let showClassCodeInput = false;
// URL에서 전달된 학급 코드 (QR 스캔 시)
let urlClassCode = null;
// Firestore 새로고침 완료 플래그 (무한 루프 방지)
let dataRefreshed = false;

/**
 * 렌더링
 */
export function render(params = {}) {
    const students = store.getStudents() || [];
    const settings = store.getSettings();
    const classCode = store.getClassCode();
    const isFirebaseEnabled = store.isFirebaseEnabled();

    // URL에서 전달된 코드 파라미터 저장 (QR 코드 스캔 시)
    if (params.code) {
        urlClassCode = params.code.toUpperCase();
    }

    // URL 코드가 있고 아직 학급에 참가하지 않은 경우 → 로딩 화면 표시
    if (urlClassCode && !classCode) {
        return renderJoiningScreen(urlClassCode);
    }

    // 학급 코드가 없으면 코드 입력 화면 표시 (Firebase 여부 관계없이)
    if (!classCode) {
        showClassCodeInput = true;
    }

    // 학급 코드 입력 화면
    if (showClassCodeInput) {
        return renderClassCodeInput(settings);
    }

    return `
        <div class="student-login-container min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4">
            <!-- 헤더 -->
            <div class="text-center mb-8">
                <div class="text-6xl mb-4 animate-bounce-slow">🐾</div>
                <h1 class="text-2xl font-bold text-gray-800 mb-2">안녕!</h1>
                <p class="text-gray-600">내 펫을 만나러 가볼까요?</p>
                <p class="text-sm text-gray-400 mt-2">${settings?.className || '우리반'}</p>
                ${classCode ? `<p class="text-xs text-primary mt-1">학급 코드: ${classCode}</p>` : ''}
            </div>

            <!-- 번호 선택 그리드 -->
            <div class="w-full max-w-sm">
                <p class="text-center text-sm text-gray-500 mb-4">나의 번호를 선택해주세요</p>

                ${students.length > 0 ? `
                    <div class="grid grid-cols-5 gap-3" id="studentNumberGrid">
                        ${students.map(student => {
                            const petEmoji = PET_TYPES[student.petType]?.stages.baby || '🐾';
                            return `
                                <button
                                    class="student-number-btn aspect-square rounded-2xl bg-white border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 shadow-sm"
                                    data-student-id="${student.id}"
                                    data-student-name="${student.name}"
                                    data-student-number="${student.number}"
                                    data-pet-emoji="${petEmoji}"
                                >
                                    <span class="text-lg font-bold text-gray-700">${student.number}</span>
                                    <span class="text-xs text-gray-400">${petEmoji}</span>
                                </button>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-center py-8 text-gray-500">
                        <div class="text-4xl mb-3">🙈</div>
                        <p>아직 등록된 친구가 없어요</p>
                        <p class="text-sm mt-2">선생님에게 말해주세요!</p>
                    </div>
                `}
            </div>

            <!-- 하단 버튼들 -->
            <div class="mt-12 text-center space-y-3">
                ${isFirebaseEnabled && classCode ? `
                    <button id="changeClassCodeBtn" class="text-sm text-gray-400 hover:text-primary transition-colors">
                        🔄 다른 학급으로 변경
                    </button>
                    <br>
                ` : ''}
                <a href="#login" class="text-sm text-gray-400 hover:text-primary transition-colors">
                    ← 처음으로 돌아가기
                </a>
            </div>
        </div>

        <!-- PIN 입력 모달 -->
        <div id="pinModal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl">
                <!-- 학생 정보 -->
                <div class="text-center mb-6">
                    <div id="pinModalEmoji" class="text-5xl mb-2">🐕</div>
                    <p class="font-bold text-gray-800"><span id="pinModalName">김민준</span> (<span id="pinModalNumber">1</span>번)</p>
                </div>

                <!-- PIN 입력 안내 -->
                <p class="text-center text-sm text-gray-600 mb-4">PIN을 입력해주세요</p>

                <!-- PIN 입력 필드 -->
                <div class="flex justify-center gap-2 mb-4" id="pinInputContainer">
                    <input type="text" maxlength="1" class="pin-input" data-index="0" inputmode="numeric" pattern="[0-9]*">
                    <input type="text" maxlength="1" class="pin-input" data-index="1" inputmode="numeric" pattern="[0-9]*">
                    <input type="text" maxlength="1" class="pin-input" data-index="2" inputmode="numeric" pattern="[0-9]*">
                    <input type="text" maxlength="1" class="pin-input" data-index="3" inputmode="numeric" pattern="[0-9]*">
                </div>

                <!-- 에러 메시지 -->
                <p id="pinError" class="text-center text-sm text-red-500 mb-4 hidden">PIN이 틀렸어요. 다시 입력해주세요!</p>

                <!-- 힌트 -->
                <p class="text-center text-xs text-gray-400 mb-6">
                    처음이에요? → <span id="pinHint" class="font-mono text-primary">0001</span>
                </p>

                <!-- 버튼 -->
                <div class="modal-buttons">
                    <button id="pinCancelBtn" class="liquid-btn-student-secondary">
                        취소
                    </button>
                    <button id="pinConfirmBtn" class="liquid-btn-student">
                        확인
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * PIN 모달 열기
 */
function openPinModal(student, petEmoji) {
    selectedStudent = student;

    const modal = document.getElementById('pinModal');
    const nameEl = document.getElementById('pinModalName');
    const numberEl = document.getElementById('pinModalNumber');
    const emojiEl = document.getElementById('pinModalEmoji');
    const hintEl = document.getElementById('pinHint');
    const errorEl = document.getElementById('pinError');

    // 학생 정보 표시
    nameEl.textContent = student.name;
    numberEl.textContent = student.number;
    emojiEl.textContent = petEmoji;
    hintEl.textContent = String(student.number).padStart(4, '0');

    // 에러 숨기기
    errorEl.classList.add('hidden');

    // PIN 입력 초기화
    const pinInputs = document.querySelectorAll('.pin-input');
    pinInputs.forEach(input => {
        input.value = '';
    });

    // 모달 표시
    modal.classList.remove('hidden');

    // 첫 번째 입력 필드에 포커스
    setTimeout(() => {
        pinInputs[0].focus();
    }, 100);
}

/**
 * PIN 모달 닫기
 */
function closePinModal() {
    const modal = document.getElementById('pinModal');
    modal.classList.add('hidden');
    selectedStudent = null;
}

/**
 * PIN 검증 및 로그인
 */
function verifyAndLogin() {
    if (!selectedStudent) return;

    const pinInputs = document.querySelectorAll('.pin-input');
    const pin = Array.from(pinInputs).map(input => input.value).join('');

    // 4자리 확인
    if (pin.length !== 4) {
        showPinError();
        return;
    }

    // PIN 검증
    if (store.verifyStudentPin(selectedStudent.id, pin)) {
        // 로그인 성공
        const studentId = selectedStudent.id; // closePinModal 전에 ID 저장
        const session = store.studentLogin(studentId);

        if (session) {
            closePinModal();

            // 펫 선택 여부 확인
            const hasPet = store.hasSelectedPet(studentId);

            setTimeout(() => {
                if (hasPet) {
                    // 펫이 있으면 메인 화면으로
                    router.navigate('student-main');
                } else {
                    // 펫이 없으면 펫 선택 화면으로
                    router.navigate('pet-selection');
                }
            }, 200);
        }
    } else {
        // 로그인 실패
        showPinError();
    }
}

/**
 * PIN 에러 표시
 */
function showPinError() {
    const errorEl = document.getElementById('pinError');
    const pinInputs = document.querySelectorAll('.pin-input');

    // 에러 메시지 표시
    errorEl.classList.remove('hidden');

    // 입력 필드 흔들기 애니메이션
    const container = document.getElementById('pinInputContainer');
    container.classList.add('shake');
    setTimeout(() => {
        container.classList.remove('shake');
    }, 500);

    // 입력 초기화 및 첫 필드에 포커스
    pinInputs.forEach(input => {
        input.value = '';
        input.classList.add('border-red-400');
    });

    setTimeout(() => {
        pinInputs.forEach(input => input.classList.remove('border-red-400'));
        pinInputs[0].focus();
    }, 300);
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    console.log('🔧 StudentLogin afterRender 호출됨, urlClassCode:', urlClassCode);

    // QR 코드로 참가 중인 경우 자동 처리
    if (urlClassCode) {
        console.log('🔧 handleAutoJoin 시작');
        handleAutoJoin();
        return;
    }

    const grid = document.getElementById('studentNumberGrid');
    console.log('🔧 studentNumberGrid:', grid);

    // 학급 코드 입력 화면인 경우
    if (!grid) {
        console.log('🔧 grid 없음 - setupClassCodeInput 호출');
        setupClassCodeInput();
        return;
    }

    // 학생 전용 기기에서만 Firestore 새로고침 (교사 기기는 localStorage가 이미 최신)
    if (!dataRefreshed && store.isFirebaseEnabled() && store.getClassCode() && !store.isTeacherLoggedIn()) {
        dataRefreshed = true;
        store.loadClassDataFromFirebase().then(() => {
            router.handleRoute();
        }).catch(err => console.warn('학생 목록 새로고침 실패:', err));
    }

    console.log('🔧 번호 버튼 클릭 이벤트 바인딩 시작');

    // 번호 버튼 클릭 이벤트
    grid.addEventListener('click', (e) => {
        console.log('🔧 그리드 클릭됨', e.target);
        const btn = e.target.closest('.student-number-btn');
        console.log('🔧 찾은 버튼:', btn);
        if (!btn) return;

        const studentId = btn.dataset.studentId;
        console.log('🔧 studentId:', studentId);
        const student = store.getStudent(studentId);
        console.log('🔧 student:', student);
        const petEmoji = btn.dataset.petEmoji;

        if (student) {
            console.log('🔧 학생 찾음, PIN 모달 열기');
            // 버튼 선택 표시
            document.querySelectorAll('.student-number-btn').forEach(b => {
                b.classList.remove('ring-4', 'ring-primary', 'scale-105');
            });
            btn.classList.add('ring-4', 'ring-primary', 'scale-105');

            // PIN 모달 열기
            openPinModal(student, petEmoji);
        } else {
            console.log('🔧 학생을 찾지 못함, store.getStudents():', store.getStudents());
        }
    });

    // PIN 입력 이벤트
    const pinInputs = document.querySelectorAll('.pin-input');
    pinInputs.forEach((input, index) => {
        // 숫자만 입력
        input.addEventListener('input', (e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = value;

            // 다음 필드로 이동
            if (value && index < 3) {
                pinInputs[index + 1].focus();
            }

            // 에러 숨기기
            document.getElementById('pinError').classList.add('hidden');
        });

        // 키보드 이벤트
        input.addEventListener('keydown', (e) => {
            // 백스페이스: 이전 필드로
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                pinInputs[index - 1].focus();
            }
            // Enter: 확인
            if (e.key === 'Enter') {
                verifyAndLogin();
            }
        });

        // 포커스 시 전체 선택
        input.addEventListener('focus', () => {
            input.select();
        });
    });

    // 취소 버튼
    const cancelBtn = document.getElementById('pinCancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closePinModal();
            // 선택 해제
            document.querySelectorAll('.student-number-btn').forEach(b => {
                b.classList.remove('ring-4', 'ring-primary', 'scale-105');
            });
        });
    }

    // 확인 버튼
    const confirmBtn = document.getElementById('pinConfirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', verifyAndLogin);
    }

    // 모달 배경 클릭 시 닫기
    const modal = document.getElementById('pinModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePinModal();
                document.querySelectorAll('.student-number-btn').forEach(b => {
                    b.classList.remove('ring-4', 'ring-primary', 'scale-105');
                });
            }
        });
    }

    // 학급 코드 변경 버튼
    const changeClassCodeBtn = document.getElementById('changeClassCodeBtn');
    if (changeClassCodeBtn) {
        changeClassCodeBtn.addEventListener('click', () => {
            showClassCodeInput = true;
            dataRefreshed = false; // 다른 학급 참가 시 새로고침 필요
            router.handleRoute();
        });
    }

    // 학급 코드 입력 이벤트
    setupClassCodeInput();
}

/**
 * QR 코드 스캔 후 자동 학급 참가 처리
 */
async function handleAutoJoin() {
    const code = urlClassCode;
    if (!code) return;

    const errorDiv = document.getElementById('joiningError');
    const errorText = document.getElementById('joiningErrorText');
    const retryBtn = document.getElementById('retryJoinBtn');
    const manualBtn = document.getElementById('manualInputBtn');
    const spinner = document.getElementById('joiningSpinner');
    const title = document.getElementById('joiningTitle');
    const subtitle = document.getElementById('joiningSubtitle');

    // 에러 표시 헬퍼 함수
    function showError(message) {
        // 로딩 UI 숨기기
        if (spinner) spinner.classList.add('hidden');
        if (title) title.textContent = '참가 실패';
        if (subtitle) subtitle.textContent = '';

        // 에러 메시지 표시
        if (errorDiv) {
            errorDiv.classList.remove('hidden');
            if (errorText) {
                errorText.textContent = message;
            }
        }
    }

    try {
        // 학급 참가 시도 (10초 타임아웃)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 10000)
        );

        const success = await Promise.race([
            store.joinClass(code),
            timeoutPromise
        ]);

        if (success) {
            // 성공: URL 코드 초기화 후 화면 새로고침
            urlClassCode = null;
            showClassCodeInput = false;
            dataRefreshed = false;
            // history.replaceState로 해시 변경 (hashchange 이벤트 방지하여 중복 렌더링 방지)
            history.replaceState(null, '', '#student-login');
            // 직접 라우트 처리
            router.handleRoute();
        } else {
            // 실패: 에러 표시
            showError('학급 코드가 올바르지 않아요. 선생님에게 확인해주세요!');
        }
    } catch (error) {
        console.error('자동 학급 참가 실패:', error);
        if (error.message === 'timeout') {
            showError('연결 시간이 초과되었어요. 네트워크를 확인하고 다시 시도해주세요.');
        } else {
            showError('참가 중 오류가 발생했어요. 다시 시도해주세요.');
        }
    }

    // 버튼 이벤트 바인딩
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            // 다시 시도
            router.handleRoute();
        });
    }

    if (manualBtn) {
        manualBtn.addEventListener('click', () => {
            // 직접 입력 화면으로
            urlClassCode = null;
            showClassCodeInput = true;
            router.handleRoute();
        });
    }
}

/**
 * QR 코드 스캔 후 학급 참가 중 로딩 화면
 */
function renderJoiningScreen(code) {
    return `
        <div class="student-login-container min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4">
            <div class="text-center">
                <div class="text-6xl mb-6 animate-bounce">🐾</div>
                <h1 id="joiningTitle" class="text-2xl font-bold text-gray-800 mb-2">학급에 참가하는 중...</h1>
                <p id="joiningSubtitle" class="text-gray-500 mb-4">잠시만 기다려주세요</p>
                <p class="text-sm text-primary font-mono font-bold">${code}</p>
                <div id="joiningSpinner" class="mt-6">
                    <span class="inline-block animate-spin text-2xl">⏳</span>
                </div>
            </div>
            <!-- 에러 메시지 (숨김) -->
            <div id="joiningError" class="hidden mt-6 text-center">
                <p class="text-red-500 mb-4" id="joiningErrorText">학급 코드가 올바르지 않아요</p>
                <button id="retryJoinBtn" class="btn btn-secondary mr-2">다시 시도</button>
                <button id="manualInputBtn" class="btn btn-primary">직접 입력하기</button>
            </div>
        </div>
    `;
}

/**
 * 학급 코드 입력 화면 렌더링
 */
function renderClassCodeInput(settings) {
    return `
        <div class="student-login-container min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4">
            <!-- 헤더 -->
            <div class="text-center mb-8">
                <div class="text-6xl mb-4">🏫</div>
                <h1 class="text-2xl font-bold text-gray-800 mb-2">학급 코드 입력</h1>
                <p class="text-gray-600">선생님이 알려준 학급 코드를 입력해주세요</p>
            </div>

            <!-- 학급 코드 입력 -->
            <div class="w-full max-w-sm">
                <div class="bg-white rounded-2xl p-6 shadow-soft">
                    <div class="flex justify-center gap-2 mb-4" id="classCodeInputContainer">
                        <input type="text" maxlength="1" class="class-code-input w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 uppercase" data-index="0">
                        <input type="text" maxlength="1" class="class-code-input w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 uppercase" data-index="1">
                        <input type="text" maxlength="1" class="class-code-input w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 uppercase" data-index="2">
                        <input type="text" maxlength="1" class="class-code-input w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 uppercase" data-index="3">
                        <input type="text" maxlength="1" class="class-code-input w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 uppercase" data-index="4">
                        <input type="text" maxlength="1" class="class-code-input w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 uppercase" data-index="5">
                    </div>

                    <!-- 에러 메시지 -->
                    <p id="classCodeError" class="text-center text-sm text-red-500 mb-4 hidden">
                        학급 코드가 올바르지 않아요. 다시 확인해주세요!
                    </p>

                    <!-- 로딩 -->
                    <div id="classCodeLoading" class="text-center text-sm text-gray-500 mb-4 hidden">
                        <span class="inline-block animate-spin mr-2">⏳</span>
                        확인 중...
                    </div>

                    <button id="classCodeSubmitBtn" class="liquid-btn-student w-full" disabled>
                        학급 참가하기
                    </button>
                </div>

                <div class="mt-6 text-center">
                    <p class="text-sm text-gray-400">
                        학급 코드를 모르면 선생님께 물어보세요! 🙋
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
 * 학급 코드 입력 이벤트 설정
 */
function setupClassCodeInput() {
    const inputs = document.querySelectorAll('.class-code-input');
    const submitBtn = document.getElementById('classCodeSubmitBtn');
    const errorEl = document.getElementById('classCodeError');
    const loadingEl = document.getElementById('classCodeLoading');

    if (!inputs.length) return;

    // 버튼 상태 업데이트
    function updateSubmitButton() {
        const code = getClassCodeValue();
        if (submitBtn) {
            submitBtn.disabled = code.length !== 6;
        }
    }

    // 코드 값 가져오기
    function getClassCodeValue() {
        return Array.from(inputs).map(i => i.value).join('').toUpperCase();
    }

    // 입력 이벤트
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            // 영문+숫자만 허용
            const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            e.target.value = value;

            // 다음 필드로 이동
            if (value && index < 5) {
                inputs[index + 1].focus();
            }

            // 에러 숨기기
            if (errorEl) errorEl.classList.add('hidden');

            updateSubmitButton();
        });

        input.addEventListener('keydown', (e) => {
            // 백스페이스: 이전 필드로
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
            // Enter: 제출
            if (e.key === 'Enter') {
                submitBtn?.click();
            }
        });

        input.addEventListener('focus', () => input.select());

        // 붙여넣기 지원
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Za-z0-9]/g, '');
            if (pasteData.length === 6) {
                for (let i = 0; i < 6; i++) {
                    inputs[i].value = pasteData[i];
                }
                inputs[5].focus();
                updateSubmitButton();
            }
        });
    });

    // 첫 번째 입력에 포커스
    setTimeout(() => inputs[0]?.focus(), 100);

    // 제출 버튼
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const code = getClassCodeValue();
            if (code.length !== 6) return;

            // 로딩 표시
            if (loadingEl) loadingEl.classList.remove('hidden');
            if (errorEl) errorEl.classList.add('hidden');
            submitBtn.disabled = true;

            try {
                // 학급 코드 검증 및 참가
                const success = await store.joinClass(code);

                if (success) {
                    showClassCodeInput = false;
                    dataRefreshed = false;
                    router.handleRoute(); // 화면 새로고침
                } else {
                    // Firebase 검증 실패 시 에러 표시
                    if (store.isFirebaseEnabled()) {
                        if (errorEl) {
                            errorEl.textContent = '학급 코드가 올바르지 않아요. 선생님에게 다시 확인해주세요!';
                            errorEl.classList.remove('hidden');
                        }
                    } else {
                        // 오프라인 모드: 로컬 저장 후 진행
                        store.setClassCode(code);
                        showClassCodeInput = false;
                        router.handleRoute();
                    }
                }
            } catch (error) {
                console.error('학급 참가 실패:', error);
                if (errorEl) {
                    errorEl.textContent = '학급 참가 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
                    errorEl.classList.remove('hidden');
                }
            } finally {
                if (loadingEl) loadingEl.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });
    }
}
