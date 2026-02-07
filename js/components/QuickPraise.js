/**
 * 빠른 칭찬 컴포넌트
 * 플로팅 버튼에서 열리는 빠른 칭찬 모달
 */

import { store, PET_TYPES } from '../store.js';
import { getPetEmoji, calculateLevel, getLevelUpMessage, isMaxLevel } from '../utils/petLogic.js';
import { showToast, setModalContent, openModal, closeModal, createPraiseParticles } from '../utils/animations.js';

let selectedStudents = new Set();
let selectedCategory = null;

/**
 * 빠른 칭찬 모달 표시
 */
export function showQuickPraise() {
    selectedStudents.clear();
    selectedCategory = null;

    const students = store.getStudents() || [];

    const modalContent = `
        <div class="space-y-4 max-h-[70vh] overflow-y-auto">
            <div class="flex items-center justify-between sticky top-0 bg-white pb-2">
                <h3 class="text-lg font-bold">⭐ 빠른 칭찬</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <!-- Step 1: 학생 선택 -->
            <div>
                <div class="flex items-center justify-between mb-2">
                    <label class="text-sm font-medium text-gray-700">1. 학생 선택</label>
                    <button id="selectAllBtn" class="text-xs text-primary font-medium">전체 선택</button>
                </div>
                <div class="grid grid-cols-4 gap-2" id="studentGrid">
                    ${students.map(student => `
                        <button class="student-select-btn flex flex-col items-center p-2 rounded-xl border-2 border-transparent hover:border-primary/50 transition-all"
                                data-student-id="${student.id}">
                            <span class="text-2xl">${getPetEmoji(student.petType, student.level)}</span>
                            <span class="text-xs mt-1 truncate w-full text-center">${student.name}</span>
                        </button>
                    `).join('')}
                </div>
                <div id="selectedCount" class="text-xs text-gray-400 mt-2 text-center">
                    선택된 학생: 0명
                </div>
            </div>

            <!-- Step 2: 칭찬 카테고리 선택 -->
            <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">2. 칭찬 카테고리</label>
                <div class="grid grid-cols-3 gap-2" id="categoryGrid">
                    ${Object.entries(store.getPraiseCategories()).map(([key, cat]) => `
                        <button class="category-select-btn category-btn" data-category="${key}">
                            <span class="text-xl">${cat.icon}</span>
                            <span class="text-xs mt-1">${cat.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- 칭찬하기 버튼 -->
            <button id="givePraiseBtn" class="btn btn-primary w-full py-3 text-lg" disabled>
                칭찬하기
            </button>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 이벤트 바인딩
    bindQuickPraiseEvents();
}

/**
 * 빠른 칭찬 이벤트 바인딩
 */
function bindQuickPraiseEvents() {
    const students = store.getStudents() || [];

    // 학생 선택
    document.querySelectorAll('.student-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const studentId = btn.dataset.studentId;

            if (selectedStudents.has(studentId)) {
                selectedStudents.delete(studentId);
                btn.classList.remove('border-primary', 'bg-primary/10');
                btn.classList.add('border-transparent');
            } else {
                selectedStudents.add(studentId);
                btn.classList.remove('border-transparent');
                btn.classList.add('border-primary', 'bg-primary/10');
            }

            updateSelectedCount();
            updateGivePraiseBtn();
        });
    });

    // 전체 선택
    const selectAllBtn = document.getElementById('selectAllBtn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            const allSelected = selectedStudents.size === students.length;

            if (allSelected) {
                // 전체 해제
                selectedStudents.clear();
                document.querySelectorAll('.student-select-btn').forEach(btn => {
                    btn.classList.remove('border-primary', 'bg-primary/10');
                    btn.classList.add('border-transparent');
                });
                selectAllBtn.textContent = '전체 선택';
            } else {
                // 전체 선택
                students.forEach(s => selectedStudents.add(s.id));
                document.querySelectorAll('.student-select-btn').forEach(btn => {
                    btn.classList.remove('border-transparent');
                    btn.classList.add('border-primary', 'bg-primary/10');
                });
                selectAllBtn.textContent = '전체 해제';
            }

            updateSelectedCount();
            updateGivePraiseBtn();
        });
    }

    // 카테고리 선택
    document.querySelectorAll('.category-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-select-btn').forEach(b => {
                b.classList.remove('selected');
            });
            btn.classList.add('selected');
            selectedCategory = btn.dataset.category;
            updateGivePraiseBtn();
        });
    });

    // 칭찬하기 버튼
    const givePraiseBtn = document.getElementById('givePraiseBtn');
    if (givePraiseBtn) {
        givePraiseBtn.addEventListener('click', executeQuickPraise);
    }
}

/**
 * 선택된 학생 수 업데이트
 */
function updateSelectedCount() {
    const countEl = document.getElementById('selectedCount');
    if (countEl) {
        countEl.textContent = `선택된 학생: ${selectedStudents.size}명`;
    }
}

/**
 * 칭찬하기 버튼 상태 업데이트
 */
function updateGivePraiseBtn() {
    const btn = document.getElementById('givePraiseBtn');
    if (btn) {
        const isValid = selectedStudents.size > 0 && selectedCategory;
        btn.disabled = !isValid;

        if (isValid) {
            const cat = store.getPraiseCategories()[selectedCategory];
            btn.innerHTML = `${cat.icon} ${selectedStudents.size}명에게 칭찬하기`;
        } else {
            btn.innerHTML = '칭찬하기';
        }
    }
}

/**
 * 빠른 칭찬 실행
 */
function executeQuickPraise() {
    if (selectedStudents.size === 0 || !selectedCategory) return;

    const categoryInfo = store.getPraiseCategories()[selectedCategory];
    const expGain = categoryInfo.exp;

    let levelUpCount = 0;
    const studentNames = [];
    const maxLevelReached = []; // 레벨 15 달성한 학생들

    selectedStudents.forEach(studentId => {
        const student = store.getStudent(studentId);
        if (!student) return;

        studentNames.push(student.name);

        // 경험치 추가
        const newExp = student.exp + expGain;
        const oldLevel = student.level;
        const newLevel = calculateLevel(newExp);

        // 학생 업데이트
        store.updateStudent(studentId, {
            exp: newExp,
            level: newLevel,
            totalPraises: student.totalPraises + 1
        });

        // 칭찬 로그 추가
        store.addPraise({
            studentId,
            studentName: student.name,
            studentNumber: student.number,
            category: selectedCategory,
            expGain
        });

        if (newLevel > oldLevel) {
            levelUpCount++;
            // 레벨 15 달성 체크
            if (isMaxLevel(newLevel) && !isMaxLevel(oldLevel)) {
                maxLevelReached.push({
                    id: studentId,
                    name: student.name,
                    petType: student.petType,
                    petName: student.petName
                });
            }
        }
    });

    // 결과 메시지
    let message = '';
    if (selectedStudents.size === 1) {
        message = `${studentNames[0]}에게 +${expGain} EXP!`;
    } else {
        message = `${selectedStudents.size}명에게 각 +${expGain} EXP!`;
    }

    if (levelUpCount > 0) {
        message += ` 🎉 ${levelUpCount}명 레벨업!`;
    }

    showToast(message, 'success');
    closeModal();

    // 레벨 15 달성한 학생이 있으면 축하 모달 표시
    if (maxLevelReached.length > 0) {
        setTimeout(() => {
            showMaxLevelCelebration(maxLevelReached);
        }, 500);
    } else {
        // 대시보드 새로고침 (현재 페이지가 대시보드면)
        const currentRoute = window.location.hash.slice(1) || 'dashboard';
        if (['dashboard', 'petfarm'].includes(currentRoute)) {
            window.classpet.refreshCurrentView();
        }
    }
}

/**
 * 레벨 15 달성 축하 모달 표시
 */
function showMaxLevelCelebration(students) {
    const student = students[0]; // 첫 번째 학생부터 처리
    const pet = PET_TYPES[student.petType];
    const petEmoji = pet?.stages.adult || '🐾';
    const petName = student.petName || pet?.name || '펫';

    const modalContent = `
        <div class="text-center py-4">
            <div class="text-6xl mb-4 pet-collection-sparkle-border inline-block p-4 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100">
                ${petEmoji}
            </div>
            <div class="space-y-3">
                <h2 class="text-2xl font-bold text-amber-600">🎉 축하합니다! 🎉</h2>
                <p class="text-lg text-gray-700">
                    <span class="font-bold">${student.name}</span>의 <span class="font-bold text-primary">${petName}</span>가<br>
                    <span class="text-amber-600 font-bold">레벨 15</span>에 도달했어요!
                </p>
                <p class="text-sm text-gray-500">
                    ${petName}(이)가 펫 도감에 <span class="text-amber-600 font-medium">✨완성</span>으로 등록됩니다!
                </p>
            </div>

            <div class="mt-6 p-4 bg-amber-50 rounded-2xl">
                <p class="text-sm text-amber-700 mb-3">
                    ${student.name}이(가) 새로운 펫을 선택할 수 있어요!<br>
                    <span class="text-xs text-amber-600">(학생 로그인 후 직접 선택)</span>
                </p>
            </div>

            <button id="closeCelebrationBtn" class="mt-6 btn btn-primary w-full">
                확인
            </button>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 확인 버튼 이벤트
    const closeBtn = document.getElementById('closeCelebrationBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal();

            // 다음 학생이 있으면 계속 표시
            if (students.length > 1) {
                setTimeout(() => {
                    showMaxLevelCelebration(students.slice(1));
                }, 300);
            } else {
                // 모두 완료되면 화면 새로고침
                const currentRoute = window.location.hash.slice(1) || 'dashboard';
                if (['dashboard', 'petfarm'].includes(currentRoute)) {
                    window.classpet.refreshCurrentView();
                }
            }
        });
    }
}

export { selectedStudents, selectedCategory };
