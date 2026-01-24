/**
 * 펫 농장 컴포넌트
 * 전체 학생 펫 그리드 뷰
 */

import { store, PET_TYPES, PRAISE_CATEGORIES } from '../store.js';
import { router } from '../router.js';
import {
    getPetEmoji,
    getExpProgress,
    getGrowthStage,
    calculateLevel,
    getLevelUpMessage
} from '../utils/petLogic.js';
import {
    bounceAnimation,
    levelUpAnimation,
    createPraiseParticles,
    showToast,
    setModalContent,
    openModal,
    closeModal
} from '../utils/animations.js';

let viewMode = 'grid'; // 'grid' or 'list'
let sortBy = 'number'; // 'number', 'level', 'name'

export function render() {
    const students = store.getStudents() || [];
    const stats = store.getStats();

    // 정렬
    const sortedStudents = [...students].sort((a, b) => {
        switch (sortBy) {
            case 'level': return b.level - a.level || b.exp - a.exp;
            case 'name': return a.name.localeCompare(b.name);
            default: return a.number - b.number;
        }
    });

    return `
        <div class="space-y-4">
            <!-- 헤더 -->
            <div class="flex items-center justify-between sticky top-[88px] z-40 bg-white py-2 -mx-4 px-4">
                <h2 class="text-lg font-bold">🐾 펫 농장</h2>
                <div class="flex items-center gap-2">
                    <!-- 정렬 -->
                    <select id="sortSelect" class="text-sm border rounded-lg px-2 py-1 bg-white">
                        <option value="number" ${sortBy === 'number' ? 'selected' : ''}>번호순</option>
                        <option value="level" ${sortBy === 'level' ? 'selected' : ''}>레벨순</option>
                        <option value="name" ${sortBy === 'name' ? 'selected' : ''}>이름순</option>
                    </select>

                    <!-- 뷰 모드 -->
                    <div class="flex bg-gray-100 rounded-lg p-0.5">
                        <button class="view-mode-btn p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}" data-mode="grid">
                            <span class="text-sm">▦</span>
                        </button>
                        <button class="view-mode-btn p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}" data-mode="list">
                            <span class="text-sm">☰</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 요약 정보 -->
            <div class="card bg-gradient-to-r from-primary/10 to-success/10">
                <div class="flex items-center justify-around text-center">
                    <div>
                        <div class="text-2xl font-bold text-primary">${stats.totalStudents}</div>
                        <div class="text-xs text-gray-500">전체 펫</div>
                    </div>
                    <div class="w-px h-8 bg-gray-200"></div>
                    <div>
                        <div class="text-2xl font-bold text-secondary">${stats.averageLevel}</div>
                        <div class="text-xs text-gray-500">평균 레벨</div>
                    </div>
                    <div class="w-px h-8 bg-gray-200"></div>
                    <div>
                        <div class="text-2xl font-bold text-success">${stats.totalPraises}</div>
                        <div class="text-xs text-gray-500">누적 칭찬</div>
                    </div>
                </div>
            </div>

            <!-- 펫 목록 -->
            ${students.length > 0 ? `
            <div id="petContainer" class="${viewMode === 'grid' ? 'pet-grid' : 'space-y-2'}">
                ${sortedStudents.map(student => viewMode === 'grid'
                    ? renderPetCard(student, stats)
                    : renderPetListItem(student)
                ).join('')}
            </div>
            ` : `
            <div class="empty-state">
                <div class="empty-state-icon">🥚</div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">아직 펫이 없어요</h3>
                <p class="text-gray-500 mb-4">학생을 등록하면 펫이 태어나요!</p>
                <button onclick="window.classpet.showAddStudent()" class="btn btn-primary">
                    학생 추가하기
                </button>
            </div>
            `}

            <!-- 학생 추가 버튼 -->
            ${students.length > 0 ? `
            <button onclick="window.classpet.showAddStudent()" class="card w-full text-center py-4 border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors">
                <span class="text-2xl">➕</span>
                <div class="text-sm text-gray-500 mt-1">학생 추가</div>
            </button>
            ` : ''}
        </div>
    `;
}

/**
 * 펫 카드 렌더링 (그리드 뷰)
 */
function renderPetCard(student, stats) {
    const expProgress = getExpProgress(student.exp, student.level);
    const stage = getGrowthStage(student.level);
    const isMvp = stats.mvp && stats.mvp.id === student.id;

    return `
        <div class="pet-card relative" data-student-id="${student.id}">
            ${isMvp ? '<span class="mvp-badge">👑</span>' : ''}
            <div class="pet-emoji-container relative">
                <span class="pet-emoji level-${stage}">${getPetEmoji(student.petType, student.level)}</span>
            </div>
            <div class="text-sm font-medium mt-2 truncate">${student.name}</div>
            <div class="text-xs text-gray-400">${student.number}번</div>
            <div class="flex items-center justify-center gap-1 mt-1">
                <span class="level-badge">Lv.${student.level}</span>
            </div>
            <div class="exp-bar mt-2">
                <div class="exp-bar-fill" style="width: ${expProgress}%"></div>
            </div>
        </div>
    `;
}

/**
 * 펫 리스트 아이템 렌더링 (리스트 뷰)
 */
function renderPetListItem(student) {
    const expProgress = getExpProgress(student.exp, student.level);
    const stage = getGrowthStage(student.level);

    return `
        <div class="list-item" data-student-id="${student.id}">
            <div class="flex items-center gap-3 flex-1">
                <span class="text-3xl pet-emoji level-${stage}">${getPetEmoji(student.petType, student.level)}</span>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-medium">${student.name}</span>
                        <span class="text-xs text-gray-400">${student.number}번</span>
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="level-badge">Lv.${student.level}</span>
                        <div class="flex-1 exp-bar">
                            <div class="exp-bar-fill" style="width: ${expProgress}%"></div>
                        </div>
                        <span class="text-xs text-gray-400">${expProgress}%</span>
                    </div>
                </div>
            </div>
            <button class="quick-praise-btn p-2 rounded-full hover:bg-primary/10 transition-colors"
                    data-student-id="${student.id}">
                ⭐
            </button>
        </div>
    `;
}

export function afterRender() {
    // 정렬 변경
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortBy = e.target.value;
            const content = document.getElementById('content');
            content.innerHTML = render();
            afterRender();
        });
    }

    // 뷰 모드 변경
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            viewMode = btn.dataset.mode;
            const content = document.getElementById('content');
            content.innerHTML = render();
            afterRender();
        });
    });

    // 펫 카드/리스트 아이템 클릭
    document.querySelectorAll('.pet-card, .list-item').forEach(el => {
        el.addEventListener('click', (e) => {
            // 빠른 칭찬 버튼 클릭이 아닌 경우에만
            if (!e.target.closest('.quick-praise-btn')) {
                const studentId = parseInt(el.dataset.studentId);
                router.navigate('student', { id: studentId });
            }
        });
    });

    // 빠른 칭찬 버튼 (리스트 뷰)
    document.querySelectorAll('.quick-praise-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const studentId = parseInt(btn.dataset.studentId);
            showQuickPraiseForStudent(studentId);
        });
    });
}

/**
 * 특정 학생 빠른 칭찬 모달
 */
function showQuickPraiseForStudent(studentId) {
    const student = store.getStudent(studentId);
    if (!student) return;

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">⭐ ${student.name} 칭찬하기</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="text-center py-4">
                <span class="text-6xl pet-emoji">${getPetEmoji(student.petType, student.level)}</span>
                <div class="mt-2">
                    <span class="level-badge">Lv.${student.level}</span>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
                ${Object.entries(PRAISE_CATEGORIES).map(([key, cat]) => `
                    <button class="category-btn" data-category="${key}">
                        <span class="text-2xl">${cat.icon}</span>
                        <span class="text-xs mt-1">${cat.name}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 카테고리 버튼 이벤트
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            givePraise(studentId, category);
        });
    });
}

/**
 * 칭찬 주기
 */
function givePraise(studentId, category) {
    const student = store.getStudent(studentId);
    if (!student) return;

    const categoryInfo = PRAISE_CATEGORIES[category];
    const expGain = categoryInfo.exp;

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
        category,
        expGain
    });

    // 레벨업 체크
    if (newLevel > oldLevel) {
        showToast(getLevelUpMessage(newLevel), 'success');
    } else {
        showToast(`${student.name}에게 +${expGain} EXP! ${categoryInfo.icon}`, 'success');
    }

    closeModal();

    // 화면 갱신
    const content = document.getElementById('content');
    content.innerHTML = render();
    afterRender();
}
