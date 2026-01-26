/**
 * 교사 설정 컴포넌트
 * 학급 정보, 학생 관리, 데이터 백업/복원
 */

import { store, PET_TYPES, COLOR_PRESETS } from '../store.js';
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
    const isGoogleTeacher = store.isGoogleTeacher();
    const teacherSession = store.getTeacherSession();

    return `
        <div class="settings-container pb-8">
            <!-- 헤더 -->
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold whitespace-nowrap">⚙️ 설정</h2>
            </div>

            ${isGoogleTeacher ? `
            <!-- Google 계정 정보 (Google 로그인 시) -->
            <section class="mb-6">
                <h2 class="section-title">
                    <span>👤</span>
                    <span>계정 정보</span>
                </h2>
                <div class="card">
                    <div class="flex items-center gap-3">
                        <!-- 프로필 -->
                        ${teacherSession?.photoURL
                            ? `<img src="${teacherSession.photoURL}" class="w-10 h-10 rounded-full border-2 border-primary" alt="프로필">`
                            : `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-lg">👩‍🏫</div>`
                        }
                        <div class="flex-1 min-w-0">
                            <p class="font-bold text-gray-800 truncate">${teacherSession?.displayName || '선생님'}</p>
                            <p class="text-xs text-gray-400 truncate">${teacherSession?.email || ''}</p>
                        </div>

                        <!-- 버튼 그룹 (리퀴드 글라스) -->
                        <div class="settings-btn-dock small">
                            <button id="manageClassesBtn" class="settings-header-btn small">
                                <span>학급 전환</span>
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                                </svg>
                            </button>
                            <button id="googleLogoutBtn" class="settings-header-btn small logout">
                                <span>로그아웃</span>
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            ` : ''}

            <!-- 현재 학급 정보 + QR 코드 (모든 교사에게 표시) -->
            <section class="mb-6">
                <h2 class="section-title">
                    <span>🏫</span>
                    <span>현재 학급</span>
                </h2>
                <div class="card border border-gray-100 py-3" style="background: #ffffff !important;">
                    <div class="grid grid-cols-3 items-center text-center">
                        <!-- 학급명 -->
                        <div class="border-r border-gray-200">
                            <p class="text-xs text-gray-400 mb-1">학급명</p>
                            <p class="font-bold text-gray-800">${settings?.className || '학급 이름 없음'}</p>
                        </div>

                        <!-- 학급코드 -->
                        <div class="border-r border-gray-200">
                            <p class="text-xs text-gray-400 mb-1">학급코드</p>
                            <p class="font-mono font-bold text-primary">${settings?.classCode || classCode || '------'}</p>
                        </div>

                        <!-- QR 코드 (클릭하면 전체화면) -->
                        <div>
                            <p class="text-xs text-gray-400 mb-1">QR코드</p>
                            <div id="settingsQRCodeContainer" class="w-10 h-10 mx-auto bg-white rounded-lg p-0.5 shadow-sm flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow" title="클릭하면 크게 보기">
                                <!-- QR 코드가 여기에 생성됨 -->
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- QR 코드 전체화면 모달 (칠판용) -->
            <div id="settingsQRFullscreenModal" class="hidden fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center cursor-pointer">
                <div class="text-center">
                    <p class="text-2xl font-bold text-gray-800 mb-2">${settings?.className || '학급'}</p>
                    <p class="text-gray-500 mb-6">아래 QR 코드를 스캔하여 참가하세요</p>
                    <div id="settingsQRCodeLarge" class="inline-block bg-white p-4 rounded-2xl shadow-lg mb-6"></div>
                    <p class="text-4xl font-mono font-bold text-primary mb-4">${settings?.classCode || classCode || '------'}</p>
                    <p class="text-gray-400 text-sm">화면을 클릭하면 닫힙니다</p>
                </div>
            </div>

            <!-- 학급 코드 섹션 (Google 미로그인 시에만 표시) -->
            ${!isGoogleTeacher ? (isFirebaseEnabled ? `
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
                                <button id="showQRCodeBtn" class="text-sm px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                    📱 QR 코드
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
            `) : ''}

            <!-- 기본 정보 섹션 -->
            <section class="mb-6">
                <!-- 첫 행: 제목 + 저장 버튼 -->
                <div class="flex items-center justify-between mb-3">
                    <h2 class="section-title mb-0">
                        <span>📚</span>
                        <span>기본 정보</span>
                    </h2>
                    <div class="settings-btn-dock">
                        <button id="saveBasicInfoBtn" class="settings-header-btn save">
                            <span>저장하기</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- 둘째 행: 2열 그리드 -->
                <div class="grid grid-cols-2 gap-3">
                    <!-- 학급 이름 카드 -->
                    <div class="rounded-xl py-3 px-4 shadow-sm" style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);">
                        <div class="flex items-center justify-center gap-1.5 mb-2">
                            <span class="text-sm">🏫</span>
                            <span class="text-sm font-bold text-gray-700">학급 이름</span>
                        </div>
                        <input type="text" id="settingsClassName" value="${settings?.className || '우리반'}"
                               class="w-full font-semibold text-gray-800 text-sm bg-transparent border-none outline-none p-0 mb-2 text-center"
                               placeholder="예: 4학년 2반">
                        <div class="h-0.5 rounded-full w-full" style="background: linear-gradient(90deg, #bae6fd 0%, #38bdf8 50%, #bae6fd 100%);"></div>
                    </div>

                    <!-- 선생님 이름 카드 -->
                    <div class="rounded-xl py-3 px-4 shadow-sm" style="background: linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 100%);">
                        <div class="flex items-center justify-center gap-1.5 mb-2">
                            <span class="text-sm">👩‍🏫</span>
                            <span class="text-sm font-bold text-gray-700">선생님 이름</span>
                        </div>
                        <input type="text" id="settingsTeacherName" value="${settings?.teacherName || '담임선생님'}"
                               class="w-full font-semibold text-gray-800 text-sm bg-transparent border-none outline-none p-0 mb-2 text-center"
                               placeholder="예: 김선생님">
                        <div class="h-0.5 rounded-full w-full" style="background: linear-gradient(90deg, #fbcfe8 0%, #f472b6 50%, #fbcfe8 100%);"></div>
                    </div>
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
                        <div class="grid grid-cols-2 gap-2 max-h-[176px] overflow-y-auto" id="studentList">
                            ${students.map(student => {
                                return `
                                    <div class="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                                        <span class="text-gray-600 font-medium">${student.number}번</span>
                                        <span class="text-gray-800 font-medium flex-1 text-center">${student.name}</span>
                                        <button class="pin-reset-btn text-xs bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors px-2 py-0.5 rounded"
                                                data-student-id="${student.id}"
                                                data-student-name="${student.name}"
                                                data-student-number="${student.number}">PIN</button>
                                        <button class="student-edit-btn text-xs bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors px-2 py-0.5 rounded ml-1"
                                                data-student-id="${student.id}">수정</button>
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

        </div>
    `;
}

/**
 * 과목 목록 렌더링
 */
function renderSubjectList() {
    const subjects = store.getSubjectList();
    const subjectColors = store.getSubjectColors();

    if (subjects.length === 0) {
        return `
            <div class="text-center py-8 text-gray-500">
                <div class="text-4xl mb-3">📚</div>
                <p>등록된 과목이 없어요</p>
                <p class="text-sm mt-2">과목을 추가해주세요!</p>
            </div>
        `;
    }

    return `
        <div class="space-y-2" id="subjectList">
            ${subjects.map(subject => {
                const colors = subjectColors[subject] || { bg: '#F3F4F6', text: '#4B5563' };
                const usageCount = store.countSubjectUsage(subject);
                return `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                                 style="background-color: ${colors.bg}; color: ${colors.text};">
                                ${subject.charAt(0)}
                            </div>
                            <div>
                                <span class="font-medium text-gray-800">${subject}</span>
                                ${usageCount > 0 ? `<span class="text-xs text-gray-400 ml-2">시간표 ${usageCount}회</span>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button class="subject-color-btn text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                    data-subject="${subject}">
                                🎨 색상
                            </button>
                            <button class="subject-delete-btn text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                    data-subject="${subject}"
                                    data-usage="${usageCount}">
                                삭제
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * 과목 추가 모달
 */
function showAddSubjectModal() {
    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">➕ 새 과목 추가</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">과목명</label>
                <input type="text" id="newSubjectNameInput"
                       class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                       placeholder="예: 안전교육, 보건, 방과후..."
                       maxlength="10">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">색상 선택</label>
                <div class="flex gap-2 flex-wrap" id="addSubjectColors">
                    ${COLOR_PRESETS.map((preset, index) => `
                        <button class="add-subject-color w-10 h-10 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform ${index === 0 ? 'ring-2 ring-primary ring-offset-1' : ''}"
                                data-index="${index}"
                                data-bg="${preset.bg}"
                                data-text="${preset.text}"
                                title="${preset.name}"
                                style="background-color: ${preset.bg};">
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="flex gap-2">
                <button onclick="window.classpet.closeModal()" class="btn btn-secondary flex-1">취소</button>
                <button id="confirmAddSubjectBtn" class="btn btn-primary flex-1">추가</button>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 입력창 포커스
    setTimeout(() => {
        document.getElementById('newSubjectNameInput').focus();
    }, 100);

    let selectedColorIndex = 0;

    // 색상 선택 이벤트
    document.querySelectorAll('.add-subject-color').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.add-subject-color').forEach(b => {
                b.classList.remove('ring-2', 'ring-primary', 'ring-offset-1');
            });
            btn.classList.add('ring-2', 'ring-primary', 'ring-offset-1');
            selectedColorIndex = parseInt(btn.dataset.index);
        });
    });

    // 엔터키 지원
    document.getElementById('newSubjectNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('confirmAddSubjectBtn').click();
        }
    });

    // 추가 버튼
    document.getElementById('confirmAddSubjectBtn').addEventListener('click', () => {
        const subjectName = document.getElementById('newSubjectNameInput').value.trim();

        if (!subjectName) {
            showToast('과목명을 입력해주세요', 'warning');
            document.getElementById('newSubjectNameInput').focus();
            return;
        }

        if (subjectName.length > 10) {
            showToast('과목명은 10자 이하로 입력해주세요', 'warning');
            return;
        }

        const selectedColor = COLOR_PRESETS[selectedColorIndex];
        const success = store.addSubject(subjectName, selectedColor);

        if (success) {
            showToast(`"${subjectName}" 과목이 추가되었습니다`, 'success');
            closeModal();
            router.handleRoute(); // 화면 새로고침
        } else {
            showToast('이미 존재하는 과목입니다', 'warning');
            document.getElementById('newSubjectNameInput').focus();
        }
    });
}

/**
 * 과목 색상 변경 모달
 */
function showSubjectColorModal(subject) {
    const currentColor = store.getSubjectColor(subject);

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">🎨 ${subject} 색상 변경</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="text-center py-4">
                <div id="colorPreviewBox" class="inline-block px-6 py-3 rounded-xl text-lg font-bold"
                     style="background-color: ${currentColor.bg}; color: ${currentColor.text};">
                    ${subject}
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">색상 선택</label>
                <div class="flex gap-2 flex-wrap justify-center">
                    ${COLOR_PRESETS.map((preset, index) => `
                        <button class="color-change-btn w-10 h-10 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform ${preset.bg === currentColor.bg ? 'ring-2 ring-primary ring-offset-1' : ''}"
                                data-index="${index}"
                                data-bg="${preset.bg}"
                                data-text="${preset.text}"
                                title="${preset.name}"
                                style="background-color: ${preset.bg};">
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="flex gap-2">
                <button onclick="window.classpet.closeModal()" class="btn btn-secondary flex-1">취소</button>
                <button id="confirmColorChangeBtn" class="btn btn-primary flex-1">저장</button>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    let selectedColor = currentColor;

    // 색상 선택 이벤트
    document.querySelectorAll('.color-change-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-change-btn').forEach(b => {
                b.classList.remove('ring-2', 'ring-primary', 'ring-offset-1');
            });
            btn.classList.add('ring-2', 'ring-primary', 'ring-offset-1');

            selectedColor = { bg: btn.dataset.bg, text: btn.dataset.text };

            // 미리보기 업데이트
            const previewBox = document.getElementById('colorPreviewBox');
            previewBox.style.backgroundColor = selectedColor.bg;
            previewBox.style.color = selectedColor.text;
        });
    });

    // 저장 버튼
    document.getElementById('confirmColorChangeBtn').addEventListener('click', () => {
        store.setSubjectColor(subject, selectedColor);
        showToast(`${subject} 색상이 변경되었습니다`, 'success');
        closeModal();
        router.handleRoute();
    });
}

/**
 * 과목 삭제 확인 모달
 */
function showDeleteSubjectConfirm(subject, usageCount) {
    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-red-600">⚠️ 과목 삭제</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="text-center py-4">
                <div class="text-5xl mb-4">🗑️</div>
                <p class="text-gray-700 mb-2">
                    <strong>"${subject}"</strong> 과목을 삭제할까요?
                </p>
                ${usageCount > 0 ? `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <p class="text-sm text-yellow-700">
                        ⚠️ 시간표에서 <strong>${usageCount}회</strong> 사용 중입니다.<br>
                        삭제 시 해당 시간이 비워집니다.
                    </p>
                </div>
                ` : ''}
            </div>

            <div class="flex gap-2">
                <button onclick="window.classpet.closeModal()" class="btn btn-secondary flex-1">취소</button>
                <button id="confirmDeleteSubjectBtn" class="btn btn-danger flex-1">삭제</button>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 삭제 버튼
    document.getElementById('confirmDeleteSubjectBtn').addEventListener('click', () => {
        const result = store.removeSubject(subject);

        if (result.success) {
            if (result.usageCount > 0) {
                showToast(`"${subject}" 과목이 삭제되었습니다 (시간표 ${result.usageCount}개 비움)`, 'info');
            } else {
                showToast(`"${subject}" 과목이 삭제되었습니다`, 'success');
            }
            closeModal();
            router.handleRoute();
        } else {
            showToast('과목 삭제에 실패했습니다', 'error');
        }
    });
}

/**
 * QR 코드 표시 모달
 */
function showQRCodeModal() {
    const settings = store.getSettings();
    const classCode = settings?.classCode || store.getClassCode();
    const url = `${window.location.origin}${window.location.pathname}?code=${classCode}`;

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">📱 학급 QR 코드</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div class="text-center py-4">
                <div id="qrContainer" class="mx-auto flex justify-center"></div>
                <p class="text-2xl font-mono font-bold text-primary mt-4">${classCode}</p>
                <p class="text-sm text-gray-500 mt-2">학생들이 스캔하면 바로 참가해요!</p>
                <p class="text-xs text-gray-400 mt-2 break-all">${url}</p>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // QR 코드 생성 (QRCode 라이브러리 사용 - Dashboard.js와 동일한 방식)
    setTimeout(async () => {
        // loadQRLibrary가 있으면 호출하여 라이브러리 로드
        if (typeof window.loadQRLibrary === 'function') {
            await window.loadQRLibrary();
        }

        const qrContainer = document.getElementById('qrContainer');
        if (qrContainer && typeof QRCode !== 'undefined') {
            try {
                new QRCode(qrContainer, {
                    text: url,
                    width: 200,
                    height: 200,
                    colorDark: '#6366f1',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
            } catch (error) {
                console.error('QR 코드 생성 실패:', error);
            }
        }
    }, 100);
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
 * Firebase 마이그레이션 확인 모달
 */
function showMigrationConfirm() {
    const migrationInfo = store.canMigrate();

    if (!migrationInfo.canMigrate) {
        showToast('마이그레이션을 위해 먼저 학급을 선택해주세요', 'warning');
        return;
    }

    if (!migrationInfo.hasData) {
        showToast('이전할 데이터가 없습니다', 'info');
        return;
    }

    const { counts } = migrationInfo;

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-blue-700">☁️ 클라우드로 데이터 이전</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="py-4">
                <p class="text-gray-700 mb-4 text-center">
                    다음 데이터를 Firebase로 이전합니다
                </p>

                <div class="bg-gray-50 rounded-xl p-4 space-y-2">
                    ${counts.students > 0 ? `<div class="flex justify-between"><span>👥 학생</span><span class="font-bold">${counts.students}명</span></div>` : ''}
                    ${counts.praises > 0 ? `<div class="flex justify-between"><span>⭐ 칭찬 기록</span><span class="font-bold">${counts.praises}건</span></div>` : ''}
                    ${counts.emotions > 0 ? `<div class="flex justify-between"><span>💭 감정 기록</span><span class="font-bold">${counts.emotions}건</span></div>` : ''}
                    ${counts.timetable > 0 ? `<div class="flex justify-between"><span>📅 시간표</span><span class="font-bold">${counts.timetable}개</span></div>` : ''}
                    ${counts.notes > 0 ? `<div class="flex justify-between"><span>📝 메모</span><span class="font-bold">${counts.notes}개</span></div>` : ''}
                </div>

                <p class="text-xs text-gray-400 mt-3 text-center">
                    * 기존 Firebase 데이터와 병합됩니다
                </p>
            </div>

            <!-- 진행 상황 표시 영역 (처음에는 숨김) -->
            <div id="migrationProgress" class="hidden">
                <div class="bg-blue-50 rounded-xl p-4">
                    <p id="migrationStatus" class="text-sm text-blue-700 mb-2">준비 중...</p>
                    <div class="w-full bg-blue-200 rounded-full h-2">
                        <div id="migrationProgressBar" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
            </div>

            <div id="migrationButtons" class="flex gap-2">
                <button onclick="window.classpet.closeModal()" class="flex-1 btn btn-secondary">
                    취소
                </button>
                <button id="confirmMigrateBtn" class="flex-1 btn btn-primary">
                    ☁️ 이전 시작
                </button>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 마이그레이션 시작 버튼
    document.getElementById('confirmMigrateBtn').addEventListener('click', async () => {
        const progressEl = document.getElementById('migrationProgress');
        const buttonsEl = document.getElementById('migrationButtons');
        const statusEl = document.getElementById('migrationStatus');
        const progressBar = document.getElementById('migrationProgressBar');

        // UI 전환
        buttonsEl.classList.add('hidden');
        progressEl.classList.remove('hidden');

        // 마이그레이션 실행
        const result = await store.migrateToFirebase((message, percent) => {
            statusEl.textContent = message;
            progressBar.style.width = `${percent}%`;
        });

        // 결과 처리
        if (result.success) {
            statusEl.textContent = '✅ ' + result.message;
            statusEl.classList.remove('text-blue-700');
            statusEl.classList.add('text-green-700');
            progressBar.classList.remove('bg-blue-600');
            progressBar.classList.add('bg-green-600');

            const { stats } = result;
            const summaryHtml = `
                <div class="mt-3 text-xs text-gray-500">
                    ${stats.students > 0 ? `학생 ${stats.students}명, ` : ''}
                    ${stats.praises > 0 ? `칭찬 ${stats.praises}건, ` : ''}
                    ${stats.emotions > 0 ? `감정 ${stats.emotions}건, ` : ''}
                    ${stats.timetable ? '시간표, ' : ''}
                    ${stats.notes > 0 ? `메모 ${stats.notes}개 ` : ''}
                    이전 완료
                </div>
            `;
            progressEl.querySelector('.bg-blue-50').classList.remove('bg-blue-50');
            progressEl.querySelector('.bg-green-600')?.parentElement?.classList.remove('bg-blue-200');
            progressEl.querySelector('.bg-green-600')?.parentElement?.classList.add('bg-green-200');
            progressEl.insertAdjacentHTML('beforeend', summaryHtml);

            setTimeout(() => {
                closeModal();
                showToast('데이터 이전이 완료되었습니다!', 'success');
            }, 2000);
        } else {
            statusEl.textContent = '❌ ' + result.message;
            statusEl.classList.remove('text-blue-700');
            statusEl.classList.add('text-red-700');
            progressBar.classList.remove('bg-blue-600');
            progressBar.classList.add('bg-red-600');

            // 다시 시도 버튼 표시
            buttonsEl.classList.remove('hidden');
            buttonsEl.innerHTML = `
                <button onclick="window.classpet.closeModal()" class="flex-1 btn btn-secondary">
                    닫기
                </button>
            `;
        }
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
    // Google 계정 관련 버튼들
    const manageClassesBtn = document.getElementById('manageClassesBtn');
    if (manageClassesBtn) {
        manageClassesBtn.addEventListener('click', () => {
            router.navigate('class-select');
        });
    }

    const googleLogoutBtn = document.getElementById('googleLogoutBtn');
    if (googleLogoutBtn) {
        googleLogoutBtn.addEventListener('click', async () => {
            if (confirm('로그아웃 하시겠습니까?')) {
                try {
                    await store.signOut();
                    showToast('로그아웃되었습니다', 'info');
                    router.navigate('login');
                } catch (error) {
                    console.error('로그아웃 실패:', error);
                    showToast('로그아웃에 실패했습니다', 'error');
                }
            }
        });
    }

    // 현재 학급 QR 코드 (Google 로그인 시)
    const settingsQRCodeContainer = document.getElementById('settingsQRCodeContainer');
    if (settingsQRCodeContainer) {
        const settings = store.getSettings();
        const classCode = settings?.classCode || store.getClassCode();

        if (classCode) {
            const joinUrl = `${window.location.origin}${window.location.pathname}#student-login?code=${classCode}`;

            // QR 라이브러리 로드 후 QR 코드 생성
            const generateSettingsQRCodes = async () => {
                // loadQRLibrary가 있으면 호출하여 라이브러리 로드
                if (typeof window.loadQRLibrary === 'function') {
                    await window.loadQRLibrary();
                }

                if (typeof QRCode !== 'undefined') {
                    try {
                        // 기존 QR 코드 제거 (중복 방지)
                        settingsQRCodeContainer.innerHTML = '';

                        // 작은 QR 코드 (설정 화면용)
                        new QRCode(settingsQRCodeContainer, {
                            text: joinUrl,
                            width: 36,
                            height: 36,
                            colorDark: '#6366f1',
                            colorLight: '#ffffff',
                            correctLevel: QRCode.CorrectLevel.M
                        });

                        // 큰 QR 코드 (전체화면용)
                        const settingsQRCodeLarge = document.getElementById('settingsQRCodeLarge');
                        if (settingsQRCodeLarge) {
                            settingsQRCodeLarge.innerHTML = '';
                            new QRCode(settingsQRCodeLarge, {
                                text: joinUrl,
                                width: 280,
                                height: 280,
                                colorDark: '#6366f1',
                                colorLight: '#ffffff',
                                correctLevel: QRCode.CorrectLevel.M
                            });
                        }
                    } catch (error) {
                        console.error('QR 코드 생성 실패:', error);
                        settingsQRCodeContainer.innerHTML = '<span class="text-xl">📱</span>';
                    }
                } else {
                    settingsQRCodeContainer.innerHTML = '<span class="text-xl">📱</span>';
                }
            };

            // QR 코드 생성 실행
            generateSettingsQRCodes();

            // QR 코드 클릭 → 전체화면 모달 열기
            const settingsQRFullscreenModal = document.getElementById('settingsQRFullscreenModal');
            settingsQRCodeContainer.addEventListener('click', () => {
                if (settingsQRFullscreenModal) {
                    settingsQRFullscreenModal.classList.remove('hidden');
                }
            });

            // 전체화면 모달 클릭 → 닫기
            if (settingsQRFullscreenModal) {
                settingsQRFullscreenModal.addEventListener('click', () => {
                    settingsQRFullscreenModal.classList.add('hidden');
                });
            }
        }
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

    // QR 코드 버튼
    const showQRCodeBtn = document.getElementById('showQRCodeBtn');
    if (showQRCodeBtn) {
        showQRCodeBtn.addEventListener('click', showQRCodeModal);
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
            const studentId = btn.dataset.studentId;
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

    // Firebase 마이그레이션 버튼
    const migrateToFirebaseBtn = document.getElementById('migrateToFirebaseBtn');
    if (migrateToFirebaseBtn) {
        migrateToFirebaseBtn.addEventListener('click', showMigrationConfirm);
    }
}
