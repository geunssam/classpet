/**
 * 학생 상세 컴포넌트
 * 개별 학생의 펫, 칭찬 기록, 감정 기록 등
 */

import { store, PET_TYPES, EMOTION_TYPES } from '../../store.js';
import { router } from '../../router.js';
import {
    getPetEmoji,
    getPetImageHTML,
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

let activeTab = 'praise'; // 'praise', 'emotion', 'notes'
let filterDate = null; // 캘린더에서 선택한 날짜 필터

export function render(params) {
    // sessionStorage에서 날짜 필터 읽기 (한번만 읽고 삭제)
    const storedDate = sessionStorage.getItem('studentDetailDate');
    if (storedDate) {
        filterDate = new Date(storedDate + 'T00:00:00');
        sessionStorage.removeItem('studentDetailDate');
    } else if (!filterDate) {
        // 진입 경로에 상관없이 기본값은 오늘
        const now = new Date();
        filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

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
            <div class="card bg-gradient-to-br from-primary/10 to-success/10 overflow-hidden p-0">
                <!-- 3열 그리드 -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr;">
                    <!-- 1열: 펫 이모지 + 이름 + 랭크 -->
                    <div class="flex flex-col items-center justify-center py-4 px-2">
                        <div id="petEmojiContainer" class="relative">
                            <span id="petEmoji" class="cursor-pointer">${getPetImageHTML(student.petType, student.level, 'xl')}</span>
                            ${rankTier.tier === 'S' ? '<span class="absolute -bottom-0 -right-1 text-lg">👑</span>' : ''}
                        </div>
                        <h2 class="text-xl font-bold mt-1">${student.name}</h2>
                        <span class="text-xs text-gray-400">${student.number}번 · ${getPetName(student.petType)}</span>
                        <span class="text-xs mt-0.5 px-2 py-0.5 rounded-full" style="background-color: ${rankTier.color}20; color: ${rankTier.color}">
                            ${rank}위 · ${rankTier.label}
                        </span>
                    </div>

                    <!-- 2열: 레벨 + 경험치바 -->
                    <div class="flex flex-col items-center justify-center gap-2 py-4 px-3 border-l border-gray-200/50">
                        <div class="flex items-center gap-2">
                            <span class="level-badge">Lv.${student.level || 1}</span>
                            <span class="text-sm font-bold" style="color: #F59E0B">${stage === 'adult' ? '최종' : (stage === 'growing' ? '성장중' : '아기')}</span>
                        </div>
                        <div class="exp-bar-xl w-full" style="height: 28px; border-radius: 14px;">
                            <div class="exp-bar-fill-xl" style="width: ${Math.max(expProgress, 15)}%; border-radius: 14px;"></div>
                            <span class="exp-bar-percent" style="font-size: 11px;">${expProgress}% ( ${currentExp} / ${neededExp} )</span>
                        </div>
                    </div>

                    <!-- 3열: 카테고리별 칭찬 + 설정 -->
                    <div class="py-3 px-2 relative">
                        <button onclick="window.classpet.showEditStudent('${student.id}')" class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 w-5 h-5">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                            </svg>
                        </button>
                        <div class="text-xs font-medium text-gray-500 mb-1.5 text-center">칭찬 ${student.totalPraises}</div>
                        <div class="grid grid-cols-3 gap-1 overflow-y-auto" style="max-height: 108px;">
                            ${Object.entries(store.getPraiseCategories()).map(([key, cat]) => {
                                const count = categoryCount[key] || 0;
                                return `
                                <div class="bg-white/80 rounded-lg py-1 ${count > 0 ? '' : 'opacity-30'}" style="display: grid; grid-template-columns: 16px 1fr 14px; align-items: center; gap: 2px; padding-left: 4px; padding-right: 4px; font-size: 10px;">
                                    <span style="font-size: 12px; line-height: 1;">${cat.icon}</span>
                                    <span class="truncate ${count > 0 ? 'text-gray-600' : 'text-gray-400'}">${cat.name}</span>
                                    <span class="font-bold text-right ${count > 0 ? 'text-gray-700' : 'text-gray-400'}">${count}</span>
                                </div>`;
                            }).join('')}
                        </div>
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
                <button onclick="sessionStorage.setItem('emotionHistoryStudentId', '${student.id}'); window.classpet.router.navigate('emotion')" class="btn btn-secondary text-sm">
                    대화 보기
                </button>
            </div>
            ` : `
            <div class="card flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-3xl">💭</span>
                    <div class="text-gray-400 text-sm">아직 보내지 않았어요</div>
                </div>
            </div>
            `}

            <!-- 날짜 네비게이션 -->
            ${filterDate ? (() => {
                const days = ['일', '월', '화', '수', '목', '금', '토'];
                const isToday = filterDate.toDateString() === new Date().toDateString();
                return `
            <div class="flex items-center">
                <div class="flex-1 flex items-center justify-center">
                    <div class="flex items-center bg-white rounded-xl px-1 py-1 shadow-sm">
                        <button class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-800 hover:bg-gray-100 transition-colors" data-action="prevDate">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <span class="px-3 text-sm font-semibold text-gray-900">${filterDate.getFullYear()}년 ${filterDate.getMonth() + 1}월 ${filterDate.getDate()}일 (${days[filterDate.getDay()]})</span>
                        <button class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${isToday ? 'text-gray-300 cursor-not-allowed' : 'text-gray-800 hover:bg-gray-100'}" data-action="nextDate" ${isToday ? 'disabled' : ''}>
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                    </div>
                </div>
                <button class="flex-shrink-0 px-4 py-1.5 text-sm font-semibold text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors shadow-sm" data-action="clearFilter">전체</button>
            </div>`;
            })() : ''}

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
                ${activeTab === 'praise' ? renderPraiseHistory(praises, filterDate) : ''}
                ${activeTab === 'emotion' ? renderEmotionHistory(emotions, filterDate) : ''}
                ${activeTab === 'notes' ? renderNotes(notes, student.id) : ''}
            </div>
        </div>
    `;
}

/**
 * 칭찬 기록 렌더링
 */
function renderPraiseHistory(praises, dateFilter) {
    // 날짜 필터가 있으면 해당 날짜의 칭찬만 표시
    if (dateFilter) {
        praises = praises.filter(p => {
            const d = new Date(p.timestamp);
            return d.toDateString() === dateFilter.toDateString();
        });
    }

    if (praises.length === 0) {
        return `
            <div class="empty-state py-8">
                <div class="text-3xl mb-2">⭐</div>
                <div class="text-gray-500">${dateFilter ? '해당 날짜에 칭찬 기록이 없어요' : '아직 칭찬 기록이 없어요'}</div>
            </div>
        `;
    }

    return `
        <div class="grid grid-cols-3 gap-1.5">
            ${[...praises].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(0, 12).map(praise => {
                const cat = store.getPraiseCategories()[praise.category];
                const t = new Date(praise.timestamp);
                const timeStr = `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`;
                return `
                    <span class="flex items-center bg-cream rounded-lg px-1 py-1.5">
                        <span class="flex-1 text-center text-xl">${cat?.icon || '⭐'}</span>
                        <span class="flex-1 text-center text-sm font-bold text-gray-800">${cat?.name || '칭찬'}</span>
                        <span class="flex-1 text-center text-sm font-extrabold text-primary">+${praise.expGain}</span>
                        <span class="flex-1 text-center text-sm font-bold text-gray-800">${timeStr}</span>
                    </span>
                `;
            }).join('')}
        </div>
        ${praises.length > 12 ? `
            <div class="text-center text-sm text-gray-400 py-2">
                +${praises.length - 12}개 더 있어요
            </div>
        ` : ''}
    `;
}

/**
 * 감정 기록 렌더링 — 채팅 타임라인 UI
 */
function renderEmotionHistory(emotions, dateFilter) {
    // 날짜 필터가 있으면 해당 날짜의 감정만 표시
    if (dateFilter) {
        emotions = emotions.filter(e => {
            const d = new Date(e.timestamp);
            return d.toDateString() === dateFilter.toDateString();
        });
    }

    if (emotions.length === 0) {
        return `
            <div class="empty-state py-8">
                <div class="text-3xl mb-2">💭</div>
                <div class="text-gray-500">${dateFilter ? '해당 날짜에 감정 기록이 없어요' : '아직 감정 기록이 없어요'}</div>
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

    // 날짜 필터 "전체 보기" 클릭
    const clearFilterBtn = document.querySelector('[data-action="clearFilter"]');
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', () => {
            filterDate = null;
            const content = document.getElementById('content');
            content.innerHTML = render(params);
            afterRender(params);
        });
    }

    // 날짜 네비게이션 ← →
    const prevDateBtn = document.querySelector('[data-action="prevDate"]');
    const nextDateBtn = document.querySelector('[data-action="nextDate"]');
    const rerender = () => {
        const content = document.getElementById('content');
        content.innerHTML = render(params);
        afterRender(params);
    };
    if (prevDateBtn) {
        prevDateBtn.addEventListener('click', () => {
            if (!filterDate) return;
            filterDate = new Date(filterDate.getTime() - 86400000); // -1일
            rerender();
        });
    }
    if (nextDateBtn && !nextDateBtn.disabled) {
        nextDateBtn.addEventListener('click', () => {
            if (!filterDate) return;
            const tomorrow = new Date(filterDate.getTime() + 86400000);
            if (tomorrow.toDateString() === new Date().toDateString() || tomorrow < new Date()) {
                filterDate = tomorrow;
                rerender();
            }
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
