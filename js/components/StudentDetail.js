/**
 * 학생 상세 컴포넌트
 * 개별 학생의 펫, 칭찬 기록, 감정 기록 등
 */

import { store, PET_TYPES, EMOTION_TYPES } from '../store.js';
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
    const rawId = params.id;
    const parsedId = parseInt(rawId);
    const studentId = isNaN(parsedId) ? rawId : parsedId;
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
                                <span class="level-badge">Lv.${student.level || 1}</span>
                                <span class="text-xs px-2 py-0.5 rounded-full" style="background-color: ${rankTier.color}20; color: ${rankTier.color}">
                                    ${rank}위 · ${rankTier.label}
                                </span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">${getPetName(student.petType)}</div>
                        </div>
                    </div>

                    <button onclick="window.classpet.showEditStudent('${student.id}')" class="text-gray-400 hover:text-gray-600 w-6 h-6">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
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
                <button onclick="window.classpet.showEmotionCheck('${student.id}')" class="btn btn-secondary text-sm">
                    업데이트
                </button>
            </div>
            ` : `
            <div class="card flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-3xl">💭</span>
                    <div class="text-gray-500">오늘 감정을 체크해주세요</div>
                </div>
                <button onclick="window.classpet.showEmotionCheck('${student.id}')" class="btn btn-primary text-sm">
                    체크하기
                </button>
            </div>
            `}

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
                const cat = store.getPraiseCategories()[praise.category];
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
 * 감정 기록 렌더링 — 채팅 타임라인 UI
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

    // 시간순 정렬 (오래된 것 먼저 → 최신이 아래)
    const sorted = [...emotions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let html = '';
    let lastDateStr = '';

    for (const emotion of sorted) {
        const emotionInfo = EMOTION_TYPES[emotion.emotion];
        const dateObj = new Date(emotion.timestamp);
        const dateStr = dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

        // 날짜 구분선
        if (dateStr !== lastDateStr) {
            html += `
                <div class="flex items-center justify-center my-3">
                    <span class="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">${dateStr}</span>
                </div>
            `;
            lastDateStr = dateStr;
        }

        const tagColor = emotionInfo ? darkenColor(emotionInfo.color, 0.35) : '';
        const emotionTag = emotionInfo
            ? `<span class="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1 bg-white/90 border" style="border-color: ${emotionInfo.color}; color: ${tagColor}">${emotionInfo.icon} ${emotionInfo.name}</span>`
            : '';

        // conversations 배열이 있는 신규 데이터
        if (emotion.conversations && emotion.conversations.length > 0) {
            for (const convo of emotion.conversations) {
                const time = formatChatTime(convo.timestamp || emotion.timestamp, true);

                // 학생 메시지 (좌측)
                if (convo.studentMessage) {
                    const showTag = convo === emotion.conversations[0];
                    html += `
                        <div class="flex items-end gap-2 mb-2">
                            <div class="max-w-[75%] bg-yellow-100 rounded-2xl rounded-tl-sm px-3 py-2">
                                ${showTag ? `<div>${emotionTag}</div>` : ''}
                                <p class="text-sm">${escapeHtml(convo.studentMessage)}</p>
                            </div>
                            <span class="text-xs text-gray-400 flex-shrink-0">${time}</span>
                        </div>
                    `;
                }

                // 교사 답장 (우측)
                if (convo.teacherReply) {
                    const replyTime = formatChatTime(convo.replyTimestamp || convo.timestamp || emotion.timestamp, true);
                    html += `
                        <div class="flex items-end justify-end gap-2 mb-2">
                            <span class="text-xs text-gray-400 flex-shrink-0">${replyTime}</span>
                            <div class="max-w-[75%] bg-primary text-white rounded-2xl rounded-tr-sm px-3 py-2">
                                <p class="text-sm">${escapeHtml(convo.teacherReply)}</p>
                            </div>
                        </div>
                    `;
                }
            }
        } else {
            // 구 데이터 호환: note/memo + reply
            const time = formatChatTime(emotion.timestamp, true);
            const message = emotion.note || emotion.memo || '';

            if (message) {
                html += `
                    <div class="flex items-end gap-2 mb-2">
                        <div class="max-w-[75%] bg-yellow-100 rounded-2xl rounded-tl-sm px-3 py-2">
                            <div>${emotionTag}</div>
                            <p class="text-sm">${escapeHtml(message)}</p>
                        </div>
                        <span class="text-xs text-gray-400 flex-shrink-0">${time}</span>
                    </div>
                `;
            } else {
                // 메시지 없이 감정만 기록된 경우
                html += `
                    <div class="flex items-end gap-2 mb-2">
                        <div class="max-w-[75%] bg-yellow-100 rounded-2xl rounded-tl-sm px-3 py-2">
                            <div>${emotionTag}</div>
                        </div>
                        <span class="text-xs text-gray-400 flex-shrink-0">${time}</span>
                    </div>
                `;
            }

            // 교사 답장이 있는 경우
            if (emotion.reply) {
                const replyTime = formatChatTime(emotion.replyTimestamp || emotion.timestamp, true);
                html += `
                    <div class="flex items-end justify-end gap-2 mb-2">
                        <span class="text-xs text-gray-400 flex-shrink-0">${replyTime}</span>
                        <div class="max-w-[75%] bg-primary text-white rounded-2xl rounded-tr-sm px-3 py-2">
                            <p class="text-sm">${escapeHtml(emotion.reply)}</p>
                        </div>
                    </div>
                `;
            }
        }
    }

    return `
        <div id="emotionTimeline" class="px-1 py-2 overflow-y-auto" style="max-height: 50vh">
            ${html}
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

/**
 * 채팅 시간 포맷
 */
function formatChatTime(timestamp, timeOnly = false) {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today - target) / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (timeOnly) return timeStr;

    if (diffDays === 0) return timeStr;
    if (diffDays === 1) return '어제';
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    }
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

/**
 * HTML 이스케이프
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * HEX 색상을 어둡게 보정
 */
function darkenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.floor(((num >> 16) & 0xFF) * (1 - amount)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0xFF) * (1 - amount)));
    const b = Math.max(0, Math.floor((num & 0xFF) * (1 - amount)));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

export function afterRender(params) {
    const parsedId = parseInt(params.id);
    const studentId = isNaN(parsedId) ? params.id : parsedId;

    // 펫 클릭 시 바운스
    const petEmoji = document.getElementById('petEmoji');
    if (petEmoji) {
        petEmoji.addEventListener('click', () => {
            bounceAnimation(petEmoji);
        });
    }

    // 감정 탭 타임라인 스크롤 → 맨 아래
    const timeline = document.getElementById('emotionTimeline');
    if (timeline) {
        timeline.scrollTop = timeline.scrollHeight;
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

}

/**
 * 칭찬 주기
 */
function givePraise(studentId, category) {
    const student = store.getStudent(studentId);
    if (!student) return;

    const categoryInfo = store.getPraiseCategories()[category];
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
