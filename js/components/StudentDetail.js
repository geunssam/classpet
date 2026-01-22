/**
 * 학생 상세 컴포넌트
 * 개별 학생의 펫, 칭찬 기록, 감정 기록 등
 */

import { store, PET_TYPES, PRAISE_CATEGORIES, EMOTION_TYPES } from '../store.js';
import { router } from '../router.js';
import {
    getPetEmoji,
    getPetName,
    getExpProgress,
    getGrowthStage,
    getCurrentLevelExp,
    getExpForNextLevel,
    calculateLevel,
    getLevelUpMessage,
    calculateRank,
    getRankTier,
    getPetStatusText
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

let activeTab = 'praise'; // 'praise', 'emotion', 'notes'

export function render(params) {
    const studentId = parseInt(params.id);
    const student = store.getStudent(studentId);

    if (!student) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">😢</div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">학생을 찾을 수 없어요</h3>
                <button onclick="window.classpet.router.navigate('petfarm')" class="btn btn-primary">
                    펫 농장으로
                </button>
            </div>
        `;
    }

    const students = store.getStudents() || [];
    const praises = store.getPraisesByStudent(studentId);
    const emotions = store.getEmotionsByStudent(studentId);
    const notes = store.getNotesByStudent(studentId);

    const expProgress = getExpProgress(student.exp, student.level);
    const currentExp = getCurrentLevelExp(student.exp, student.level);
    const neededExp = getExpForNextLevel(student.level);
    const stage = getGrowthStage(student.level);
    const rank = calculateRank(students, studentId);
    const rankTier = getRankTier(rank, students.length);
    const statusText = getPetStatusText(student.level, student.exp);

    // 카테고리별 칭찬 수
    const categoryCount = {};
    praises.forEach(p => {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });

    // 최근 감정
    const recentEmotion = emotions[0];
    const emotionInfo = recentEmotion ? EMOTION_TYPES[recentEmotion.emotion] : null;

    return `
        <div class="space-y-4">
            <!-- 뒤로가기 -->
            <button onclick="window.classpet.router.back()" class="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                ← 뒤로
            </button>

            <!-- 펫 프로필 카드 -->
            <div class="card bg-gradient-to-br from-primary/10 to-success/10">
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-4">
                        <div class="relative">
                            <div id="petEmojiContainer" class="relative">
                                <span id="petEmoji" class="pet-emoji level-${stage} text-6xl cursor-pointer">${getPetEmoji(student.petType, student.level)}</span>
                            </div>
                            <span class="absolute -bottom-1 -right-1 text-xl">${rankTier.tier === 'S' ? '👑' : ''}</span>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h2 class="text-xl font-bold">${student.name}</h2>
                                <span class="text-sm text-gray-400">${student.number}번</span>
                            </div>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="level-badge">Lv.${student.level}</span>
                                <span class="text-xs px-2 py-0.5 rounded-full" style="background-color: ${rankTier.color}20; color: ${rankTier.color}">
                                    ${rank}위 · ${rankTier.label}
                                </span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">${getPetName(student.petType)}</div>
                        </div>
                    </div>

                    <button onclick="window.classpet.showEditStudent(${student.id})" class="text-gray-400 hover:text-gray-600">
                        ⚙️
                    </button>
                </div>

                <!-- 상태 텍스트 -->
                <div class="mt-3 text-sm text-gray-600 text-center bg-white/50 rounded-lg py-2">
                    "${statusText}"
                </div>

                <!-- 경험치 바 -->
                <div class="mt-4">
                    <div class="flex items-center justify-between text-sm mb-1">
                        <span class="text-gray-600">경험치</span>
                        <span class="font-medium">${currentExp} / ${neededExp}</span>
                    </div>
                    <div class="exp-bar h-3">
                        <div class="exp-bar-fill" style="width: ${expProgress}%"></div>
                    </div>
                </div>

                <!-- 빠른 통계 -->
                <div class="grid grid-cols-3 gap-3 mt-4 text-center">
                    <div class="bg-white rounded-lg py-2">
                        <div class="text-lg font-bold text-primary">${student.totalPraises}</div>
                        <div class="text-xs text-gray-500">총 칭찬</div>
                    </div>
                    <div class="bg-white rounded-lg py-2">
                        <div class="text-lg font-bold text-secondary">${student.level}</div>
                        <div class="text-xs text-gray-500">레벨</div>
                    </div>
                    <div class="bg-white rounded-lg py-2">
                        <div class="text-lg font-bold text-success">${student.exp}</div>
                        <div class="text-xs text-gray-500">총 EXP</div>
                    </div>
                </div>
            </div>

            <!-- 최근 감정 -->
            ${emotionInfo ? `
            <div class="card flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-3xl">${emotionInfo.icon}</span>
                    <div>
                        <div class="font-medium">${emotionInfo.name}</div>
                        <div class="text-xs text-gray-400">${formatDate(recentEmotion.timestamp)}</div>
                    </div>
                </div>
                <button onclick="window.classpet.showEmotionCheck(${student.id})" class="btn btn-secondary text-sm">
                    업데이트
                </button>
            </div>
            ` : `
            <div class="card flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-3xl">💭</span>
                    <div class="text-gray-500">오늘 감정을 체크해주세요</div>
                </div>
                <button onclick="window.classpet.showEmotionCheck(${student.id})" class="btn btn-primary text-sm">
                    체크하기
                </button>
            </div>
            `}

            <!-- 칭찬하기 버튼 -->
            <div class="grid grid-cols-3 gap-2">
                ${Object.entries(PRAISE_CATEGORIES).map(([key, cat]) => `
                    <button class="category-btn" data-category="${key}" data-student="${student.id}">
                        <span class="text-xl">${cat.icon}</span>
                        <span class="text-xs mt-1">${cat.name}</span>
                        ${categoryCount[key] ? `<span class="text-xs text-gray-400">(${categoryCount[key]})</span>` : ''}
                    </button>
                `).join('')}
            </div>

            <!-- 탭 -->
            <div class="tab-group">
                <button class="tab-item ${activeTab === 'praise' ? 'active' : ''}" data-tab="praise">
                    칭찬 기록
                </button>
                <button class="tab-item ${activeTab === 'emotion' ? 'active' : ''}" data-tab="emotion">
                    감정 기록
                </button>
                <button class="tab-item ${activeTab === 'notes' ? 'active' : ''}" data-tab="notes">
                    메모
                </button>
            </div>

            <!-- 탭 컨텐츠 -->
            <div id="tabContent">
                ${activeTab === 'praise' ? renderPraiseHistory(praises) : ''}
                ${activeTab === 'emotion' ? renderEmotionHistory(emotions) : ''}
                ${activeTab === 'notes' ? renderNotes(notes, student.id) : ''}
            </div>
        </div>
    `;
}

/**
 * 칭찬 기록 렌더링
 */
function renderPraiseHistory(praises) {
    if (praises.length === 0) {
        return `
            <div class="empty-state py-8">
                <div class="text-3xl mb-2">⭐</div>
                <div class="text-gray-500">아직 칭찬 기록이 없어요</div>
            </div>
        `;
    }

    return `
        <div class="space-y-2">
            ${praises.slice(0, 10).map(praise => {
                const cat = PRAISE_CATEGORIES[praise.category];
                return `
                    <div class="praise-item">
                        <span class="text-xl">${cat?.icon || '⭐'}</span>
                        <div class="flex-1">
                            <div class="font-medium text-sm">${cat?.name || '칭찬'}</div>
                            <div class="text-xs text-gray-400">${formatDate(praise.timestamp)}</div>
                        </div>
                        <div class="text-sm text-primary font-medium">+${praise.expGain} EXP</div>
                    </div>
                `;
            }).join('')}
            ${praises.length > 10 ? `
                <div class="text-center text-sm text-gray-400 py-2">
                    +${praises.length - 10}개 더 있어요
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * 감정 기록 렌더링
 */
function renderEmotionHistory(emotions) {
    if (emotions.length === 0) {
        return `
            <div class="empty-state py-8">
                <div class="text-3xl mb-2">💭</div>
                <div class="text-gray-500">아직 감정 기록이 없어요</div>
            </div>
        `;
    }

    return `
        <div class="space-y-2">
            ${emotions.slice(0, 10).map(emotion => {
                const info = EMOTION_TYPES[emotion.emotion];
                return `
                    <div class="praise-item">
                        <span class="text-xl">${info?.icon || '😐'}</span>
                        <div class="flex-1">
                            <div class="font-medium text-sm">${info?.name || ''}</div>
                            <div class="text-xs text-gray-400">${formatDate(emotion.timestamp)}</div>
                        </div>
                        ${emotion.note ? `
                            <div class="text-xs text-gray-500 max-w-[120px] truncate">${emotion.note}</div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * 메모 렌더링
 */
function renderNotes(notes, studentId) {
    return `
        <div class="space-y-3">
            <button onclick="window.classpet.showAddNote(${studentId})" class="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-primary hover:text-primary transition-colors">
                + 메모 추가
            </button>

            ${notes.length === 0 ? `
                <div class="empty-state py-8">
                    <div class="text-3xl mb-2">📝</div>
                    <div class="text-gray-500">메모가 없어요</div>
                </div>
            ` : `
                <div class="space-y-2">
                    ${notes.map(note => `
                        <div class="card">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="text-sm">${note.content}</div>
                                    <div class="text-xs text-gray-400 mt-2">${formatDate(note.timestamp)}</div>
                                </div>
                                <button onclick="window.classpet.deleteNote(${note.id})" class="text-gray-300 hover:text-danger text-sm">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

/**
 * 날짜 포맷팅
 */
function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;

    return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function afterRender(params) {
    const studentId = parseInt(params.id);

    // 펫 클릭 시 바운스
    const petEmoji = document.getElementById('petEmoji');
    if (petEmoji) {
        petEmoji.addEventListener('click', () => {
            bounceAnimation(petEmoji);
        });
    }

    // 탭 전환
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            activeTab = tab.dataset.tab;
            const content = document.getElementById('content');
            content.innerHTML = render(params);
            afterRender(params);
        });
    });

    // 칭찬 버튼
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
        const petEmoji = document.getElementById('petEmoji');
        if (petEmoji) {
            levelUpAnimation(petEmoji);
        }
    } else {
        showToast(`${categoryInfo.icon} +${expGain} EXP!`, 'success');
        const container = document.getElementById('petEmojiContainer');
        if (container) {
            createPraiseParticles(container);
        }
    }

    // 화면 갱신
    const content = document.getElementById('content');
    content.innerHTML = render({ id: studentId });
    afterRender({ id: studentId });
}

// 전역 함수 내보내기 (window.classpet에서 사용)
export { givePraise, formatDate };
