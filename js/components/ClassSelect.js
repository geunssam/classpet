/**
 * 학급 선택/생성 컴포넌트
 *
 * Google 로그인 후 표시되는 화면
 * - 기존 학급 목록 표시
 * - 새 학급 생성
 * - 학급 선택 후 대시보드로 이동
 */

import { store } from '../store.js';
import { router } from '../router.js';
import { showToast } from '../utils/animations.js';

// 상태 관리
let classes = [];
let isLoading = true;
let isCreating = false;
let studentCount = 15; // 기본 학생 수

/**
 * 학생 입력 필드 HTML 생성
 */
function generateStudentInputs(count) {
    let html = '';
    for (let i = 1; i <= count; i++) {
        html += `
            <div class="flex items-center gap-3 student-input-row">
                <span class="w-10 text-sm text-gray-500 text-right font-medium">${i}번</span>
                <input type="text"
                       class="student-name-input flex-1 p-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none text-sm"
                       placeholder="학생 이름"
                       data-student-number="${i}"
                       maxlength="20">
            </div>
        `;
    }
    return html;
}

/**
 * 렌더링
 */
export async function render() {
    // Google 로그인 확인
    if (!store.isGoogleTeacher()) {
        setTimeout(() => router.navigate('login'), 0);
        return `
            <div class="min-h-[70vh] flex items-center justify-center">
                <div class="text-center">
                    <div class="animate-spin text-4xl mb-4">🔄</div>
                    <p class="text-gray-600">로그인 페이지로 이동 중...</p>
                </div>
            </div>
        `;
    }

    const teacherSession = store.getTeacherSession();

    return `
        <div class="class-select-container min-h-[70vh] px-4 py-8">
            <!-- 헤더 -->
            <div class="max-w-lg mx-auto mb-8">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                        ${teacherSession?.photoURL
                            ? `<img src="${teacherSession.photoURL}" class="w-12 h-12 rounded-full border-2 border-primary" alt="프로필">`
                            : `<div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl">👩‍🏫</div>`
                        }
                        <div>
                            <p class="font-bold text-gray-800">${teacherSession?.displayName || '선생님'}</p>
                            <p class="text-sm text-gray-500">${teacherSession?.email || ''}</p>
                        </div>
                    </div>
                    <button id="classSelectLogoutBtn" class="px-4 py-2 text-sm text-white bg-gradient-to-r from-[#C9A8D3] to-[#9AA8DC] hover:from-[#BA96C6] hover:to-[#8A98CC] rounded-full flex items-center gap-1 transition-all">
                        <span>로그아웃</span>
                        <span>→</span>
                    </button>
                </div>

                <h1 class="text-2xl font-bold text-gray-800 mb-2">📚 학급 선택</h1>
                <p class="text-gray-500">관리할 학급을 선택하거나 새로 만드세요</p>
            </div>

            <!-- 학급 목록 -->
            <div class="max-w-lg mx-auto">
                <div id="classListContainer">
                    ${renderClassList()}
                </div>

                <!-- 새 학급 만들기 버튼 -->
                <button id="createClassBtn" class="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
                    <span class="text-2xl">➕</span>
                    <span class="font-medium">새 학급 만들기</span>
                </button>
            </div>

            <!-- 새 학급 생성 모달 -->
            <div id="createClassModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="bg-white rounded-2xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] flex flex-col">
                    <h3 class="text-xl font-bold text-gray-800 mb-6">✨ 새 학급 만들기</h3>

                    <div class="space-y-4 flex-1 overflow-hidden flex flex-col">
                        <!-- 학년도 & 학급 이름 (한 줄) -->
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">학년도</label>
                                <input type="text"
                                       id="newSchoolYear"
                                       class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-center"
                                       placeholder="2026"
                                       value="${new Date().getFullYear()}"
                                       maxlength="4">
                            </div>
                            <div class="col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-2">학급 이름 *</label>
                                <input type="text"
                                       id="newClassName"
                                       class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                                       placeholder="예: 6학년 2반"
                                       maxlength="30">
                            </div>
                        </div>

                        <!-- 구분선 -->
                        <hr class="border-gray-200">

                        <!-- 학생 명단 섹션 -->
                        <div class="flex-1 overflow-hidden flex flex-col min-h-0">
                            <div class="flex items-center justify-between mb-3">
                                <label class="text-sm font-medium text-gray-700">
                                    학생 명단 (<span id="studentCount">15</span>명)
                                </label>
                                <div class="flex items-center gap-2">
                                    <button type="button" id="removeStudentBtn" class="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-bold transition-colors">
                                        −
                                    </button>
                                    <button type="button" id="addStudentBtn" class="w-8 h-8 flex items-center justify-center bg-primary hover:bg-primary-dark rounded-lg text-white font-bold transition-colors">
                                        +
                                    </button>
                                </div>
                            </div>

                            <!-- 스크롤 가능한 학생 입력 영역 -->
                            <div id="studentInputContainer" class="flex-1 overflow-y-auto space-y-2 pr-2 min-h-[200px] max-h-[280px]">
                                ${generateStudentInputs(15)}
                            </div>

                            <p class="text-xs text-gray-400 mt-2">※ 이름을 비워두면 해당 번호는 등록되지 않습니다</p>
                        </div>

                        <div class="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                            <p>💡 학급코드가 자동으로 생성됩니다. 학생들에게 이 코드를 알려주면 학급에 접속할 수 있어요!</p>
                        </div>
                    </div>

                    <div class="flex gap-3 mt-6">
                        <button id="cancelCreateBtn" class="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                            취소
                        </button>
                        <button id="confirmCreateBtn" class="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium">
                            학급 만들기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 학급 목록 렌더링
 */
function renderClassList() {
    if (isLoading) {
        return `
            <div class="text-center py-8">
                <div class="animate-spin text-3xl mb-3">🔄</div>
                <p class="text-gray-500">학급 목록을 불러오는 중...</p>
            </div>
        `;
    }

    if (classes.length === 0) {
        return `
            <div class="text-center py-8 bg-gray-50 rounded-xl">
                <div class="text-4xl mb-3">📭</div>
                <p class="text-gray-500 mb-1">아직 학급이 없습니다</p>
                <p class="text-sm text-gray-400">아래 버튼으로 새 학급을 만들어보세요!</p>
            </div>
        `;
    }

    return `
        <div class="space-y-3">
            ${classes.map(cls => `
                <button class="class-item w-full p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-primary hover:shadow-md transition-all text-left"
                        data-class-id="${cls.id}">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xl">
                            🏫
                        </div>
                        <p class="flex-1 font-bold text-gray-800 truncate">${cls.className || '이름 없는 학급'}</p>
                        <p class="text-sm text-gray-500">${cls.studentCount || 0}명</p>
                    </div>
                </button>
            `).join('')}
        </div>
    `;
}

/**
 * 학급 목록 새로고침
 */
async function refreshClassList() {
    const container = document.getElementById('classListContainer');
    if (!container) return;

    isLoading = true;
    container.innerHTML = renderClassList();

    try {
        classes = await store.getTeacherClasses();
        isLoading = false;
        container.innerHTML = renderClassList();

        // 학급 선택 이벤트 바인딩
        bindClassItemEvents();
    } catch (error) {
        console.error('학급 목록 로드 실패:', error);
        isLoading = false;
        container.innerHTML = `
            <div class="text-center py-8 bg-red-50 rounded-xl">
                <div class="text-4xl mb-3">⚠️</div>
                <p class="text-red-600 mb-2">학급 목록을 불러올 수 없습니다</p>
                <button onclick="location.reload()" class="text-sm text-primary hover:underline">다시 시도</button>
            </div>
        `;
    }
}

/**
 * 학급 아이템 클릭 이벤트 바인딩
 */
function bindClassItemEvents() {
    const items = document.querySelectorAll('.class-item');
    items.forEach(item => {
        item.addEventListener('click', async () => {
            const classId = item.dataset.classId;
            await selectClass(classId);
        });
    });
}

/**
 * 학급 선택
 */
async function selectClass(classId) {
    try {
        // 현재 학급 설정
        store.setCurrentClassId(classId);

        // 선택된 학급 정보 찾기
        const selectedClass = classes.find(c => c.id === classId);
        if (selectedClass) {
            // teacherUid도 설정
            if (selectedClass.teacherUid) {
                store.setCurrentTeacherUid(selectedClass.teacherUid);
            }
            showToast(`${selectedClass.className} 학급이 선택되었습니다`, 'success');
        }

        // Firebase에서 학생 데이터 로드
        await store.loadClassDataFromFirebase();

        // 대시보드로 이동
        router.navigate('dashboard');
    } catch (error) {
        console.error('학급 선택 실패:', error);
        showToast('학급을 선택할 수 없습니다', 'error');
    }
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // 로그아웃 버튼 (항상 바인딩)
    const logoutBtn = document.getElementById('classSelectLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Google 로그인 확인 (학급 목록 로드용)
    if (!store.isGoogleTeacher()) {
        return;
    }

    // 학급 목록 로드
    refreshClassList();

    // 새 학급 만들기 버튼
    const createClassBtn = document.getElementById('createClassBtn');
    if (createClassBtn) {
        createClassBtn.addEventListener('click', openCreateModal);
    }

    // 모달 버튼들
    const cancelCreateBtn = document.getElementById('cancelCreateBtn');
    if (cancelCreateBtn) {
        cancelCreateBtn.addEventListener('click', closeCreateModal);
    }

    const confirmCreateBtn = document.getElementById('confirmCreateBtn');
    if (confirmCreateBtn) {
        confirmCreateBtn.addEventListener('click', handleCreateClass);
    }

    // 모달 배경 클릭으로 닫기
    const modal = document.getElementById('createClassModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCreateModal();
            }
        });
    }

    // Enter 키로 생성
    const newClassName = document.getElementById('newClassName');
    if (newClassName) {
        newClassName.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleCreateClass();
            }
        });
    }

    // 학생 수 증가 버튼
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            if (studentCount < 40) { // 최대 40명
                studentCount++;
                updateStudentInputs();
            }
        });
    }

    // 학생 수 감소 버튼
    const removeStudentBtn = document.getElementById('removeStudentBtn');
    if (removeStudentBtn) {
        removeStudentBtn.addEventListener('click', () => {
            if (studentCount > 1) { // 최소 1명
                studentCount--;
                updateStudentInputs();
            }
        });
    }
}

/**
 * 로그아웃 처리
 */
async function handleLogout() {
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
}

/**
 * 학급 생성 모달 열기
 */
function openCreateModal() {
    const modal = document.getElementById('createClassModal');
    if (modal) {
        modal.classList.remove('hidden');

        // 포커스
        setTimeout(() => {
            const input = document.getElementById('newClassName');
            if (input) input.focus();
        }, 100);
    }
}

/**
 * 학급 생성 모달 닫기
 */
function closeCreateModal() {
    const modal = document.getElementById('createClassModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    // 입력 초기화
    const nameInput = document.getElementById('newClassName');
    if (nameInput) nameInput.value = '';

    // 학생 수 초기화
    studentCount = 15;
    updateStudentInputs();
}

/**
 * 학생 입력 필드 업데이트
 */
function updateStudentInputs() {
    const container = document.getElementById('studentInputContainer');
    const countDisplay = document.getElementById('studentCount');

    if (container) {
        // 기존 입력값 저장
        const existingValues = {};
        container.querySelectorAll('.student-name-input').forEach(input => {
            const num = input.dataset.studentNumber;
            if (input.value.trim()) {
                existingValues[num] = input.value;
            }
        });

        // 새 입력 필드 생성
        container.innerHTML = generateStudentInputs(studentCount);

        // 기존 값 복원
        container.querySelectorAll('.student-name-input').forEach(input => {
            const num = input.dataset.studentNumber;
            if (existingValues[num]) {
                input.value = existingValues[num];
            }
        });
    }

    if (countDisplay) {
        countDisplay.textContent = studentCount;
    }
}

/**
 * 학생 명단 수집 (이름이 있는 학생만)
 */
function collectStudentData() {
    const students = [];
    const inputs = document.querySelectorAll('.student-name-input');

    inputs.forEach(input => {
        const number = parseInt(input.dataset.studentNumber);
        const name = input.value.trim();

        // 이름이 있는 학생만 추가 (빈 칸은 건너뛰기)
        if (name) {
            students.push({
                number: number,
                name: name,
                emoji: getRandomEmoji()
            });
        }
    });

    return students;
}

/**
 * 랜덤 이모지 반환
 */
function getRandomEmoji() {
    const emojis = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦉', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐢', '🐍', '🦎', '🐙', '🦀', '🐠', '🐟', '🐬', '🐳', '🦈', '🐊'];
    return emojis[Math.floor(Math.random() * emojis.length)];
}

/**
 * 새 학급 생성 처리
 */
async function handleCreateClass() {
    if (isCreating) return;

    const className = document.getElementById('newClassName')?.value.trim();
    const schoolYear = document.getElementById('newSchoolYear')?.value.trim();

    // 유효성 검사
    if (!className) {
        showToast('학급 이름을 입력해주세요', 'warning');
        document.getElementById('newClassName')?.focus();
        return;
    }

    // 학생 데이터 수집
    const students = collectStudentData();

    try {
        isCreating = true;
        const confirmBtn = document.getElementById('confirmCreateBtn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '생성 중...';
        }

        // 학급 생성 (학생 데이터 포함)
        const result = await store.createClass({
            className,
            schoolYear: schoolYear || String(new Date().getFullYear()),
            semester: '1', // 학기는 기본값 1로 설정
            students: students
        });

        if (result.success) {
            showToast(`${className} 학급이 생성되었습니다! (학생 ${students.length}명) 🎉`, 'success');
            closeCreateModal();

            // 목록 새로고침
            await refreshClassList();

            // 새 학급 바로 선택
            if (result.classId) {
                await selectClass(result.classId);
            }
        } else {
            throw new Error(result.error || '학급 생성에 실패했습니다');
        }
    } catch (error) {
        console.error('학급 생성 오류:', error);
        showToast(error.message || '학급 생성에 실패했습니다', 'error');
    } finally {
        isCreating = false;
        const confirmBtn = document.getElementById('confirmCreateBtn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '학급 만들기';
        }
    }
}
