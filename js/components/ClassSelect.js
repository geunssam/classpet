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
                    <button id="logoutBtn" class="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1">
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
                <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
                    <h3 class="text-xl font-bold text-gray-800 mb-6">✨ 새 학급 만들기</h3>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">학급 이름 *</label>
                            <input type="text"
                                   id="newClassName"
                                   class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                                   placeholder="예: 6학년 3반"
                                   maxlength="30">
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">학년도</label>
                                <input type="text"
                                       id="newSchoolYear"
                                       class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                                       placeholder="2025"
                                       value="${new Date().getFullYear()}"
                                       maxlength="4">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">학기</label>
                                <select id="newSemester" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none">
                                    <option value="1">1학기</option>
                                    <option value="2">2학기</option>
                                </select>
                            </div>
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
                            만들기
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
                        <div class="flex-1 min-w-0">
                            <p class="font-bold text-gray-800 truncate">${cls.className || '이름 없는 학급'}</p>
                            <p class="text-sm text-gray-500">
                                ${cls.schoolYear || ''}년 ${cls.semester || ''}학기
                                ${cls.studentCount ? `· 학생 ${cls.studentCount}명` : ''}
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-gray-400">학급코드</p>
                            <p class="font-mono font-bold text-primary">${cls.classCode || '------'}</p>
                        </div>
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
            showToast(`${selectedClass.className} 학급이 선택되었습니다`, 'success');
        }

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
    // Google 로그인 확인
    if (!store.isGoogleTeacher()) {
        return;
    }

    // 학급 목록 로드
    refreshClassList();

    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

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
}

/**
 * 새 학급 생성 처리
 */
async function handleCreateClass() {
    if (isCreating) return;

    const className = document.getElementById('newClassName')?.value.trim();
    const schoolYear = document.getElementById('newSchoolYear')?.value.trim();
    const semester = document.getElementById('newSemester')?.value;

    // 유효성 검사
    if (!className) {
        showToast('학급 이름을 입력해주세요', 'warning');
        document.getElementById('newClassName')?.focus();
        return;
    }

    try {
        isCreating = true;
        const confirmBtn = document.getElementById('confirmCreateBtn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '생성 중...';
        }

        // 학급 생성
        const result = await store.createClass({
            className,
            schoolYear: schoolYear || String(new Date().getFullYear()),
            semester: semester || '1'
        });

        if (result.success) {
            showToast(`${className} 학급이 생성되었습니다! 🎉`, 'success');
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
            confirmBtn.innerHTML = '만들기';
        }
    }
}
