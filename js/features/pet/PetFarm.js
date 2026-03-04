/**
 * 펫 농장 컴포넌트
 * 전체 학생 펫 그리드 뷰
 */

import { store, PET_TYPES } from '../../store.js';
import { PRAISE_CATEGORIES } from '../../shared/constants/index.js';
import { router } from '../../router.js';

const DEFAULT_CAT_ORDER = Object.keys(PRAISE_CATEGORIES);
import {
    getPetImageHTML,
    getExpProgress,
    getGrowthStage,
    getCurrentLevelExp,
    getExpForNextLevel,
    calculateLevel,
    getLevelUpMessage
} from '../../shared/utils/petLogic.js';
import {
    bounceAnimation,
    levelUpAnimation,
    createPraiseParticles,
    showToast,
    setModalContent,
    openModal,
    closeModal
} from '../../shared/utils/animations.js';

export function render() {
    const students = store.getStudents() || [];
    const stats = store.getStats();

    // 번호순 정렬
    const sortedStudents = [...students].sort((a, b) => a.number - b.number);

    return `
        <div class="space-y-4">
            <!-- 헤더 -->
            <div class="flex items-center gap-3 pb-2">
                <h2 class="text-xl font-bold">🐾 펫 농장</h2>
                <span class="text-sm text-gray-500">전체 <span class="font-bold text-primary">${stats.totalStudents}</span></span>
            </div>

            <!-- 펫 목록 -->
            ${students.length > 0 ? `
            <div id="petContainer" class="pet-circle-grid">
                ${sortedStudents.map(student => renderPetHybridCard(student, stats)).join('')}
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

        </div>
    `;
}

/**
 * 원형 프로그레스 바 카드 렌더링
 * 중앙: 원형 프로그레스 + 펫 이모지 + 레벨 배지
 * 하단: 학생 이름 + 경험치 정보
 */
function renderPetHybridCard(student, stats) {
    const exp = student.exp || 0;
    const level = student.level || 1;
    const expProgress = getExpProgress(exp, level);
    const currentExp = getCurrentLevelExp(exp, level);
    const neededExp = getExpForNextLevel(level);
    const stage = getGrowthStage(level);
    const isMvp = stats.mvp && stats.mvp.id === student.id;

    // SVG 원형 프로그레스 계산
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (expProgress / 100) * circumference;

    return `
        <div class="pet-circle-card" data-student-id="${student.id}">
            ${isMvp ? '<span class="mvp-badge">👑</span>' : ''}

            <!-- 원형 프로그레스 바 -->
            <div class="circle-progress-container">
                <svg class="circle-progress" width="76" height="76" viewBox="0 0 76 76">
                    <circle
                        class="circle-track"
                        cx="38"
                        cy="38"
                        r="${radius}"
                        fill="none"
                        stroke="#E5E7EB"
                        stroke-width="6"
                    />
                    <circle
                        class="circle-progress-bar"
                        cx="38"
                        cy="38"
                        r="${radius}"
                        fill="none"
                        stroke="url(#gradient-${student.id})"
                        stroke-width="6"
                        stroke-linecap="round"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${strokeDashoffset}"
                        transform="rotate(-90 38 38)"
                    />
                    <defs>
                        <linearGradient id="gradient-${student.id}" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#F59E0B" />
                            <stop offset="100%" stop-color="#F97316" />
                        </linearGradient>
                    </defs>
                </svg>

                <div class="circle-center-content">
                    ${getPetImageHTML(student.petType, level, 'md')}
                    <span class="level-badge-inside">Lv.${level}</span>
                </div>
            </div>

            <div class="text-center mt-1">
                <p class="text-sm font-bold text-gray-800">${student.number}번 ${student.name}</p>
                <p class="text-xs text-gray-500">${currentExp}/${neededExp} (${expProgress}%)</p>
            </div>
        </div>
    `;
}

export function afterRender() {
    // 펫 카드 클릭
    document.querySelectorAll('.pet-circle-card').forEach(el => {
        el.addEventListener('click', () => {
            const studentId = el.dataset.studentId;
            router.navigate('student', { id: studentId });
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
                ${getPetImageHTML(student.petType, student.level, 'xl')}
                <div class="mt-2">
                    <span class="level-badge">Lv.${student.level || 1}</span>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-1.5">
                ${Object.entries(store.getPraiseCategories()).sort(([a], [b]) => {
                    const ai = DEFAULT_CAT_ORDER.indexOf(a);
                    const bi = DEFAULT_CAT_ORDER.indexOf(b);
                    if (ai !== -1 && bi !== -1) return ai - bi;
                    if (ai !== -1) return -1;
                    if (bi !== -1) return 1;
                    return a.localeCompare(b);
                }).map(([key, cat]) => `
                    <button class="category-btn flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border border-gray-300 hover:border-primary transition-all bg-white" data-category="${key}">
                        <span class="text-lg">${cat.icon}</span>
                        <span class="text-xs">${cat.name}</span>
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

    const categoryInfo = store.getPraiseCategories()[category];
    const expGain = categoryInfo.exp;
    const beforeLevel = student.level || 1;

    // totalPraises만 업데이트 (exp/level은 addPraise→addPetExp에서 처리)
    store.updateStudent(studentId, {
        totalPraises: (student.totalPraises || 0) + 1
    });

    // 칭찬 로그 추가 (내부에서 addPetExp 호출 → exp/level 업데이트)
    store.addPraise({
        studentId,
        studentName: student.name,
        studentNumber: student.number,
        category,
        expGain
    });

    // addPraise 후 업데이트된 학생 데이터 확인
    const after = store.getStudent(studentId);
    const afterLevel = after?.level || 1;

    // 레벨업 체크
    if (afterLevel > beforeLevel) {
        showToast(getLevelUpMessage(afterLevel), 'success');
    } else {
        showToast(`${student.name}에게 +${expGain} EXP! ${categoryInfo.icon}`, 'success');
    }

    closeModal();

    // 화면 갱신
    const content = document.getElementById('content');
    content.innerHTML = render();
    afterRender();
}
