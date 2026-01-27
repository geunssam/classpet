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
    const stage = getGrowthStage(level);
    const isMvp = stats.mvp && stats.mvp.id === student.id;
    const expNeeded = level * 100;

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
                    <!-- 배경 원 (Track) -->
                    <circle
                        class="circle-track"
                        cx="38"
                        cy="38"
                        r="${radius}"
                        fill="none"
                        stroke="#E5E7EB"
                        stroke-width="6"
                    />
                    <!-- 진행 원 (Progress) -->
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
                    <!-- 그라데이션 정의 -->
                    <defs>
                        <linearGradient id="gradient-${student.id}" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#F59E0B" />
                            <stop offset="100%" stop-color="#F97316" />
                        </linearGradient>
                    </defs>
                </svg>

                <!-- 중앙 콘텐츠: 펫 이모지 + 레벨 -->
                <div class="circle-center-content">
                    <span class="text-2xl pet-emoji level-${stage}">${getPetEmoji(student.petType, level)}</span>
                    <span class="level-badge-inside">Lv.${level}</span>
                </div>
            </div>

            <!-- 하단 텍스트 -->
            <div class="text-center mt-1">
                <p class="text-sm font-bold text-gray-800">${student.number}번 ${student.name}</p>
                <p class="text-xs text-gray-500">${exp}/${expNeeded} (${expProgress}%)</p>
            </div>
        </div>
    `;
}

export function afterRender() {
    // 펫 카드 클릭
    document.querySelectorAll('.pet-circle-card').forEach(el => {
        el.addEventListener('click', () => {
            const studentId = parseInt(el.dataset.studentId);
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
                <span class="text-6xl pet-emoji">${getPetEmoji(student.petType, student.level)}</span>
                <div class="mt-2">
                    <span class="level-badge">Lv.${student.level || 1}</span>
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
        studentName: student.name,
        studentNumber: student.number,
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
