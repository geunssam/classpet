/**
 * 교사 설정 컴포넌트
 * 학급 정보, 학생 관리, 데이터 백업/복원
 */

import { store, PET_TYPES } from '../store.js';
import { router } from '../router.js';
import { showToast, setModalContent, openModal, closeModal } from '../utils/animations.js';

/**
 * 렌더링
 */
export function render() {
    const settings = store.getSettings();
    const students = store.getStudents() || [];
    const classCode = store.getClassCode();
    const isFirebaseEnabled = store.isFirebaseEnabled();

    return `
        <div class="settings-container pb-8">
            <!-- 헤더 -->
            <div class="flex items-center gap-3 mb-6">
                <button id="settingsBackBtn" class="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <span class="text-xl">←</span>
                </button>
                <h1 class="text-xl font-bold text-gray-800">⚙️ 설정</h1>
            </div>

            <!-- 학급 코드 섹션 (Firebase 활성화 시) -->
            ${isFirebaseEnabled ? `
            <section class="mb-6">
                <h2 class="section-title">
                    <span>🔗</span>
                    <span>실시간 동기화</span>
                </h2>
                <div class="card">
                    ${classCode ? `
                        <div class="text-center py-4">
                            <div class="flex items-center justify-center gap-2 mb-2">
                                <span class="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span class="text-sm text-green-600 font-medium">연결됨</span>
                            </div>
                            <p class="text-sm text-gray-500 mb-3">학급 코드를 학생들에게 알려주세요</p>
                            <div class="bg-primary/10 rounded-2xl p-4 inline-block">
                                <p class="text-3xl font-mono font-bold text-primary tracking-wider">${classCode}</p>
                            </div>
                            <div class="mt-4 flex justify-center gap-2">
                                <button id="copyClassCodeBtn" class="text-sm px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                                    📋 복사하기
                                </button>
                                <button id="regenerateClassCodeBtn" class="text-sm px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                    🔄 새 코드 생성
                                </button>
                            </div>
                            <p class="text-xs text-gray-400 mt-4">
                                * 새 코드를 생성하면 기존 학생들은 다시 코드를 입력해야 해요
                            </p>
                        </div>
                    ` : `
                        <div class="text-center py-4">
                            <div class="text-4xl mb-3">🔗</div>
                            <p class="text-gray-600 mb-2">실시간 동기화 시작하기</p>
                            <p class="text-sm text-gray-400 mb-4">
                                학급 코드를 생성하면 학생들의 감정 기록이<br>
                                실시간으로 이 화면에 표시돼요!
                            </p>
                            <button id="generateClassCodeBtn" class="btn btn-primary">
                                ✨ 학급 코드 생성하기
                            </button>
                        </div>
                    `}
                </div>
            </section>
            ` : `
            <section class="mb-6">
                <div class="card bg-yellow-50 border border-yellow-200">
                    <div class="text-center py-4">
                        <div class="text-3xl mb-2">⚠️</div>
                        <p class="text-sm text-yellow-700 font-medium">Firebase 설정이 필요해요</p>
                        <p class="text-xs text-yellow-600 mt-2">
                            실시간 동기화를 사용하려면<br>
                            firebase-config.js 파일을 설정해주세요
                        </p>
                    </div>
                </div>
            </section>
            `}

            <!-- 기본 정보 섹션 -->
            <section class="mb-6">
                <h2 class="section-title">
                    <span>📚</span>
                    <span>기본 정보</span>
                </h2>
                <div class="card space-y-4">
                    <div>
                        <label class="text-sm font-medium text-gray-700 mb-1 block">학급 이름</label>
                        <input type="text" id="settingsClassName" value="${settings?.className || '우리반'}"
                               class="w-full" placeholder="예: 4학년 2반">
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-700 mb-1 block">선생님 이름</label>
                        <input type="text" id="settingsTeacherName" value="${settings?.teacherName || '담임선생님'}"
                               class="w-full" placeholder="예: 김선생님">
                    </div>
                    <button id="saveBasicInfoBtn" class="btn btn-primary w-full">
                        저장하기
                    </button>
                </div>
            </section>

            <!-- 학생 관리 섹션 -->
            <section class="mb-6">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="section-title mb-0">
                        <span>👥</span>
                        <span>학생 관리 (${students.length}명)</span>
                    </h2>
                    <button id="addStudentBtn" class="text-sm text-primary font-medium hover:text-primary-dark">
                        + 학생 추가
                    </button>
                </div>

                <div class="card">
                    ${students.length > 0 ? `
                        <div class="space-y-3" id="studentList">
                            ${students.map(student => {
                                const petEmoji = PET_TYPES[student.petType]?.stages.baby || '🐾';
                                return `
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div class="flex items-center gap-3">
                                            <span class="text-2xl">${petEmoji}</span>
                                            <div>
                                                <span class="font-medium text-gray-800">[${student.number}] ${student.name}</span>
                                                <span class="text-xs text-gray-400 ml-2">Lv.${student.level}</span>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <button class="pin-reset-btn text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                    data-student-id="${student.id}"
                                                    data-student-name="${student.name}"
                                                    data-student-number="${student.number}">
                                                PIN 초기화
                                            </button>
                                            <button class="student-edit-btn text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                    data-student-id="${student.id}">
                                                수정
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-8 text-gray-500">
                            <div class="text-4xl mb-3">🐣</div>
                            <p>등록된 학생이 없어요</p>
                            <p class="text-sm mt-2">학생을 추가해주세요!</p>
                        </div>
                    `}
                </div>
            </section>

            <!-- 데이터 관리 섹션 -->
            <section class="mb-6">
                <h2 class="section-title">
                    <span>🗂️</span>
                    <span>데이터 관리</span>
                </h2>
                <div class="card space-y-3">
                    <button id="exportDataBtn" class="w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left flex items-center gap-3">
                        <span class="text-xl">📤</span>
                        <div>
                            <p class="font-medium text-gray-800">데이터 백업</p>
                            <p class="text-xs text-gray-500">모든 데이터를 파일로 저장해요</p>
                        </div>
                    </button>
                    <button id="importDataBtn" class="w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left flex items-center gap-3">
                        <span class="text-xl">📥</span>
                        <div>
                            <p class="font-medium text-gray-800">데이터 복원</p>
                            <p class="text-xs text-gray-500">백업한 파일에서 불러와요</p>
                        </div>
                    </button>
                    <button id="resetDataBtn" class="w-full p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-left flex items-center gap-3">
                        <span class="text-xl">🗑️</span>
                        <div>
                            <p class="font-medium text-red-600">데이터 초기화</p>
                            <p class="text-xs text-red-400">모든 데이터를 삭제해요 (복구 불가)</p>
                        </div>
                    </button>
                </div>
            </section>

            <!-- 숨김 파일 입력 -->
            <input type="file" id="importFileInput" accept=".json" class="hidden">
        </div>
    `;
}

/**
 * 학급 코드 재생성 확인 모달
 */
function showRegenerateCodeConfirm() {
    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-orange-600">⚠️ 학급 코드 재생성</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="text-center py-4">
                <div class="text-5xl mb-4">🔄</div>
                <p class="text-gray-700 mb-2">
                    <strong>새 학급 코드를 생성할까요?</strong>
                </p>
                <p class="text-sm text-gray-500">
                    기존 코드로 접속한 학생들은<br>
                    새 코드를 다시 입력해야 해요.
                </p>
            </div>

            <div class="flex gap-2">
                <button onclick="window.classpet.closeModal()" class="flex-1 btn btn-secondary">
                    취소
                </button>
                <button id="confirmRegenerateBtn" class="flex-1 btn btn-warning">
                    재생성
                </button>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 확인 버튼 이벤트
    document.getElementById('confirmRegenerateBtn').addEventListener('click', async () => {
        try {
            const settings = store.getSettings();
            const classCode = await store.createClass(settings);

            if (classCode) {
                showToast(`새 학급 코드: ${classCode}`, 'success');
                await store.syncAllStudentsToFirebase();
            } else {
                const localCode = store.generateClassCode();
                store.setClassCode(localCode);
                showToast(`새 학급 코드: ${localCode}`, 'success');
            }

            closeModal();
            router.handleRoute();
        } catch (error) {
            console.error('학급 코드 재생성 실패:', error);
            showToast('학급 코드 재생성에 실패했어요', 'error');
        }
    });
}

/**
 * PIN 초기화 확인 모달
 */
function showPinResetConfirm(studentId, studentName, studentNumber) {
    const defaultPin = String(studentNumber).padStart(4, '0');

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">🔐 PIN 초기화</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="text-center py-4">
                <p class="text-gray-700 mb-2">
                    <strong>${studentName}</strong>의 PIN을 초기화할까요?
                </p>
                <p class="text-sm text-gray-500">
                    초기화 후 PIN: <span class="font-mono text-primary font-bold">${defaultPin}</span>
                </p>
            </div>

            <div class="flex gap-2">
                <button onclick="window.classpet.closeModal()" class="flex-1 btn btn-secondary">
                    취소
                </button>
                <button id="confirmPinResetBtn" class="flex-1 btn btn-primary">
                    초기화
                </button>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 확인 버튼 이벤트
    document.getElementById('confirmPinResetBtn').addEventListener('click', () => {
        const result = store.resetStudentPin(studentId);
        if (result) {
            showToast(`${studentName}의 PIN이 ${defaultPin}으로 초기화되었어요!`, 'success');
        } else {
            showToast('PIN 초기화에 실패했어요', 'error');
        }
        closeModal();
    });
}

/**
 * 데이터 초기화 확인 모달
 */
function showResetDataConfirm() {
    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-red-600">⚠️ 데이터 초기화</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="text-center py-4">
                <div class="text-5xl mb-4">🗑️</div>
                <p class="text-gray-700 mb-2">
                    <strong>모든 데이터가 삭제됩니다!</strong>
                </p>
                <p class="text-sm text-gray-500">
                    학생 정보, 칭찬 기록, 감정 기록 등<br>
                    모든 데이터가 영구적으로 삭제됩니다.
                </p>
                <p class="text-xs text-red-500 mt-3">
                    이 작업은 되돌릴 수 없어요!
                </p>
            </div>

            <div class="flex gap-2">
                <button onclick="window.classpet.closeModal()" class="flex-1 btn btn-secondary">
                    취소
                </button>
                <button id="confirmResetBtn" class="flex-1 btn btn-danger">
                    초기화
                </button>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 확인 버튼 이벤트
    document.getElementById('confirmResetBtn').addEventListener('click', () => {
        store.clearAllData();
        showToast('모든 데이터가 초기화되었어요', 'info');
        closeModal();
        router.navigate('login');
    });
}

/**
 * 데이터 내보내기
 */
function exportData() {
    const data = store.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `classpet_backup_${date}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showToast('백업 파일이 다운로드되었어요!', 'success');
}

/**
 * 데이터 가져오기
 */
function importData(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // 데이터 유효성 검사
            if (!data.students || !data.settings) {
                throw new Error('올바른 백업 파일이 아닙니다');
            }

            store.importData(data);
            showToast('데이터가 복원되었어요!', 'success');
            router.handleRoute(); // 화면 새로고침
        } catch (error) {
            showToast('파일을 읽을 수 없어요: ' + error.message, 'error');
        }
    };

    reader.onerror = () => {
        showToast('파일을 읽을 수 없어요', 'error');
    };

    reader.readAsText(file);
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // 뒤로가기 버튼
    const backBtn = document.getElementById('settingsBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            router.navigate('dashboard');
        });
    }

    // 학급 코드 생성 버튼
    const generateClassCodeBtn = document.getElementById('generateClassCodeBtn');
    if (generateClassCodeBtn) {
        generateClassCodeBtn.addEventListener('click', async () => {
            generateClassCodeBtn.disabled = true;
            generateClassCodeBtn.textContent = '생성 중...';

            try {
                const settings = store.getSettings();
                const classCode = await store.createClass(settings);

                if (classCode) {
                    showToast(`학급 코드가 생성되었어요: ${classCode}`, 'success');
                    // Firebase에 학생 데이터 동기화
                    await store.syncAllStudentsToFirebase();
                    router.handleRoute(); // 화면 새로고침
                } else {
                    // Firebase가 설정되지 않은 경우 로컬 코드만 생성
                    const localCode = store.generateClassCode();
                    store.setClassCode(localCode);
                    showToast(`학급 코드가 생성되었어요: ${localCode}`, 'success');
                    router.handleRoute();
                }
            } catch (error) {
                console.error('학급 코드 생성 실패:', error);
                showToast('학급 코드 생성에 실패했어요', 'error');
                generateClassCodeBtn.disabled = false;
                generateClassCodeBtn.textContent = '✨ 학급 코드 생성하기';
            }
        });
    }

    // 학급 코드 복사 버튼
    const copyClassCodeBtn = document.getElementById('copyClassCodeBtn');
    if (copyClassCodeBtn) {
        copyClassCodeBtn.addEventListener('click', () => {
            const classCode = store.getClassCode();
            if (classCode) {
                navigator.clipboard.writeText(classCode).then(() => {
                    showToast('학급 코드가 복사되었어요!', 'success');
                }).catch(() => {
                    showToast('복사에 실패했어요. 직접 복사해주세요.', 'warning');
                });
            }
        });
    }

    // 학급 코드 재생성 버튼
    const regenerateClassCodeBtn = document.getElementById('regenerateClassCodeBtn');
    if (regenerateClassCodeBtn) {
        regenerateClassCodeBtn.addEventListener('click', () => {
            showRegenerateCodeConfirm();
        });
    }

    // 기본 정보 저장
    const saveBasicInfoBtn = document.getElementById('saveBasicInfoBtn');
    if (saveBasicInfoBtn) {
        saveBasicInfoBtn.addEventListener('click', () => {
            const className = document.getElementById('settingsClassName').value.trim();
            const teacherName = document.getElementById('settingsTeacherName').value.trim();

            if (!className) {
                showToast('학급 이름을 입력해주세요', 'warning');
                return;
            }

            store.updateSettings({ className, teacherName });
            showToast('저장되었어요!', 'success');
        });
    }

    // 학생 추가 버튼
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            window.classpet.showAddStudent();
        });
    }

    // PIN 초기화 버튼들
    document.querySelectorAll('.pin-reset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const studentId = parseInt(btn.dataset.studentId);
            const studentName = btn.dataset.studentName;
            const studentNumber = parseInt(btn.dataset.studentNumber);
            showPinResetConfirm(studentId, studentName, studentNumber);
        });
    });

    // 학생 수정 버튼들
    document.querySelectorAll('.student-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const studentId = parseInt(btn.dataset.studentId);
            window.classpet.showEditStudent(studentId);
        });
    });

    // 데이터 백업
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }

    // 데이터 복원
    const importDataBtn = document.getElementById('importDataBtn');
    const importFileInput = document.getElementById('importFileInput');
    if (importDataBtn && importFileInput) {
        importDataBtn.addEventListener('click', () => {
            importFileInput.click();
        });

        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importData(file);
                e.target.value = ''; // 초기화
            }
        });
    }

    // 데이터 초기화
    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', showResetDataConfirm);
    }
}
