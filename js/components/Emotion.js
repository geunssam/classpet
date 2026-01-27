/**
 * 감정 체크 컴포넌트
 * 학생들의 사회정서 관리
 * + Firebase 실시간 동기화
 */

import { store, EMOTION_TYPES } from '../store.js';
import { router } from '../router.js';
import { getPetEmoji } from '../utils/petLogic.js';
import { showToast, setModalContent, openModal, closeModal } from '../utils/animations.js';

let viewMode = 'checkin'; // 'checkin', 'history', 'attention'
let emotionsUnsubscribe = null; // 실시간 구독 해제 함수
let isFirebaseMode = false; // Firebase 모드 여부
let selectedDate = new Date().toISOString().split('T')[0]; // 선택된 날짜 (기본: 오늘)
let historySubView = 'chatList'; // 'chatList' | 'chatRoom'
let selectedChatStudentId = null;

export function render() {
    // sessionStorage에서 외부 날짜 파라미터 확인
    const externalDate = sessionStorage.getItem('emotionHistoryDate');
    if (externalDate) {
        // 파라미터가 있으면 히스토리 뷰로 전환하고 채팅 목록으로 리셋
        selectedDate = externalDate;
        viewMode = 'history';
        historySubView = 'chatList';
        // 사용 후 즉시 삭제 (일회성)
        sessionStorage.removeItem('emotionHistoryDate');
    }

    const students = store.getStudents() || [];
    const todayEmotions = store.getTodayEmotions();
    const needAttention = store.getStudentsNeedingAttention();
    const classCode = store.getClassCode();
    isFirebaseMode = store.isFirebaseEnabled() && classCode;

    // 오늘 감정 체크한 학생 ID 목록
    const checkedIds = new Set(todayEmotions.map(e => e.studentId));

    // 미체크 학생
    const uncheckedStudents = students.filter(s => !checkedIds.has(s.id));

    // 감정별 분포
    const emotionDistribution = {};
    Object.keys(EMOTION_TYPES).forEach(key => {
        emotionDistribution[key] = todayEmotions.filter(e => e.emotion === key).length;
    });

    return `
        <div class="space-y-4">
            <!-- 헤더 -->
            <div class="flex items-center justify-between pb-2">
                <h2 class="text-xl font-bold">💝 마음 관리</h2>
                ${isFirebaseMode ? `
                    <div class="flex items-center gap-2 text-xs">
                        <span class="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span class="text-gray-500">실시간</span>
                    </div>
                ` : ''}
            </div>

            
            <!-- 오늘의 감정 요약 -->
            <div class="card bg-gradient-to-br from-secondary/10 to-danger/10">
                <h3 class="section-title m-0 mb-3">오늘의 우리 반</h3>
                <div class="flex items-center justify-around">
                    ${Object.entries(EMOTION_TYPES).map(([key, info]) => `
                        <div class="text-center">
                            <div class="text-2xl mb-1">${info.icon}</div>
                            <div class="text-lg font-bold" style="color: ${info.color}">${emotionDistribution[key] || 0}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-3 text-center text-sm text-gray-500">
                    체크 완료: ${todayEmotions.length}명 / ${students.length}명
                </div>
            </div>

            ${needAttention.length > 0 ? `
            <!-- 주의 필요 학생 -->
            <div class="card bg-danger/10 border-2 border-danger/30">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xl">⚠️</span>
                    <h3 class="font-semibold text-danger">관심이 필요해요</h3>
                </div>
                <div class="space-y-3">
                    ${needAttention.map(student => {
                        const emotion = todayEmotions.find(e => e.studentId === student.id);
                        const emotionInfo = emotion ? EMOTION_TYPES[emotion.emotion] : null;
                        return `
                        <div class="bg-white rounded-xl p-3 cursor-pointer hover:bg-gray-50"
                             onclick="window.classpet.router.navigate('student', { id: '${student.id}' })">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">${getPetEmoji(student.petType, student.level)}</span>
                                <div class="flex-1">
                                    <div class="font-medium">${student.name}</div>
                                </div>
                                ${emotionInfo ? `<span class="text-2xl">${emotionInfo.icon}</span>` : ''}
                            </div>
                            ${(emotion?.note || emotion?.memo) ? `
                                <div class="mt-2 text-sm text-gray-600 bg-danger/5 rounded-lg p-2">
                                    💬 "${emotion.note || emotion.memo}"
                                </div>
                            ` : ''}
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            ` : ''}

            <!-- 탭 -->
            <div class="tab-group">
                <button class="tab-item ${viewMode === 'checkin' ? 'active' : ''}" data-view="checkin">
                    감정 체크
                </button>
                <button class="tab-item ${viewMode === 'history' ? 'active' : ''}" data-view="history">
                    기록 보기
                </button>
            </div>

            <!-- 탭 컨텐츠 -->
            ${viewMode === 'checkin' ? renderCheckinView(students, checkedIds) : ''}
            ${viewMode === 'history' ? renderHistoryView(students) : ''}
        </div>
    `;
}

/**
 * 감정 체크 뷰
 */
function renderCheckinView(students, checkedIds) {
    const uncheckedStudents = students.filter(s => !checkedIds.has(s.id));
    const checkedStudents = students.filter(s => checkedIds.has(s.id));

    return `
        <div class="space-y-4">
            ${uncheckedStudents.length > 0 ? `
            <div>
                <h3 class="text-sm font-medium text-gray-600 mb-2">체크 필요 (${uncheckedStudents.length}명)</h3>
                <div class="grid grid-cols-4 gap-2">
                    ${uncheckedStudents.map(student => `
                        <button class="pet-card py-3" onclick="window.classpet.showEmotionCheck('${student.id}')">
                            <span class="text-2xl">${getPetEmoji(student.petType, student.level)}</span>
                            <div class="text-xs mt-1 truncate">${student.name}</div>
                            <div class="text-xs text-gray-400 mt-0.5">미체크</div>
                        </button>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${checkedStudents.length > 0 ? `
            <div>
                <h3 class="text-sm font-medium text-gray-600 mb-2">체크 완료 (${checkedStudents.length}명)</h3>
                <div class="space-y-2">
                    ${checkedStudents.map(student => {
                        const todayEmotions = store.getTodayEmotions();
                        const emotion = todayEmotions.find(e => e.studentId === student.id);
                        const emotionInfo = emotion ? EMOTION_TYPES[emotion.emotion] : null;
                        return `
                        <div class="bg-white rounded-xl p-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50"
                             onclick="window.classpet.showEmotionCheck('${student.id}')">
                            <div class="relative flex-shrink-0">
                                <span class="text-2xl">${getPetEmoji(student.petType, student.level)}</span>
                                ${emotionInfo ? `<span class="absolute -top-1 -right-1 text-lg">${emotionInfo.icon}</span>` : ''}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-sm">${student.name}</div>
                                ${(emotion?.note || emotion?.memo) ? `
                                    <div class="text-xs text-gray-500 mt-1 bg-gray-50 rounded-lg p-2">"${emotion.note || emotion.memo}"</div>
                                ` : `
                                    <div class="text-xs text-gray-400 mt-1">메모 없음</div>
                                `}
                            </div>
                            <div class="text-xs text-gray-400 flex-shrink-0">
                                ${new Date(emotion?.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            ` : ''}

            ${students.length === 0 ? `
            <div class="empty-state py-8">
                <div class="text-3xl mb-2">🥚</div>
                <div class="text-gray-500">아직 학생이 없어요</div>
            </div>
            ` : ''}

            <!-- 전체 체크 버튼 -->
            ${uncheckedStudents.length > 0 ? `
            <button onclick="window.classpet.showBulkEmotionCheck()" class="btn btn-primary w-full">
                📋 전체 감정 체크하기
            </button>
            ` : ''}
        </div>
    `;
}

/**
 * 기록 보기 뷰 — 채팅방 목록 / 채팅방 분기
 */
function renderHistoryView(students) {
    if (historySubView === 'chatRoom' && selectedChatStudentId) {
        return renderChatRoom(students);
    }
    return renderChatRoomList(students);
}

/**
 * 채팅방 목록 (카카오톡 채팅 리스트 스타일)
 */
function renderChatRoomList(students) {
    const emotionLog = store.getEmotionLog() || [];

    // 학생별 그룹핑: 각 학생의 마지막 감정 기록 + 미답장 카운트
    const studentMap = {};
    emotionLog.forEach(e => {
        const sid = e.studentId;
        if (!studentMap[sid]) {
            studentMap[sid] = { lastEmotion: e, unreadCount: 0 };
        }
        // 최신 기록이 먼저 (emotionLog는 unshift로 추가되므로 첫 번째가 최신)
        // 미답장 카운트: conversations에서 teacherReply가 없는 항목
        const convos = e.conversations || [];
        convos.forEach(c => {
            if (c.studentMessage && !c.teacherReply) {
                studentMap[sid].unreadCount++;
            }
        });
        // reply 기반 호환 (conversations가 없는 옛 데이터)
        if (!e.conversations?.length && e.source === 'student' && !e.reply) {
            studentMap[sid].unreadCount++;
        }
    });

    // 최신 메시지순 정렬
    const sortedStudents = Object.entries(studentMap)
        .map(([sid, data]) => {
            const student = students.find(s => String(s.id) === String(sid));
            return student ? { student, ...data } : null;
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.lastEmotion.timestamp) - new Date(a.lastEmotion.timestamp));

    if (sortedStudents.length === 0) {
        return `
            <div class="empty-state py-8">
                <div class="text-3xl mb-2">💬</div>
                <div class="text-gray-500">아직 감정 기록이 없어요</div>
            </div>
        `;
    }

    return `
        <div class="space-y-1">
            ${sortedStudents.map(({ student, lastEmotion, unreadCount }) => {
                const emotionInfo = EMOTION_TYPES[lastEmotion.emotion];
                const lastConvo = lastEmotion.conversations?.slice(-1)[0];
                // 미리보기: 마지막 대화 내용
                let preview = '';
                if (lastConvo?.teacherReply) {
                    preview = `나: ${lastConvo.teacherReply}`;
                } else if (lastConvo?.studentMessage) {
                    preview = lastConvo.studentMessage;
                } else if (lastEmotion.note || lastEmotion.memo) {
                    preview = lastEmotion.note || lastEmotion.memo;
                } else {
                    preview = emotionInfo ? `${emotionInfo.icon} ${emotionInfo.name}` : '기록 있음';
                }
                // 미리보기 길이 제한
                if (preview.length > 25) preview = preview.slice(0, 25) + '…';

                return `
                    <div class="flex items-center gap-3 bg-white rounded-xl p-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                         onclick="window.classpet.openChatRoom('${student.id}')">
                        <div class="relative flex-shrink-0">
                            <span class="text-3xl">${getPetEmoji(student.petType, student.level)}</span>
                            ${emotionInfo ? `<span class="absolute -bottom-1 -right-1 text-sm">${emotionInfo.icon}</span>` : ''}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                                <span class="font-medium text-sm">${student.name}</span>
                                <span class="text-xs text-gray-400">${formatChatTime(lastEmotion.timestamp)}</span>
                            </div>
                            <div class="flex items-center justify-between mt-0.5">
                                <span class="text-xs text-gray-500 truncate pr-2">${preview}</span>
                                ${unreadCount > 0 ? `
                                    <span class="flex-shrink-0 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                                        ${unreadCount}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * 채팅방 뷰 (카카오톡 대화방 스타일)
 */
function renderChatRoom(students) {
    const student = students.find(s => String(s.id) === String(selectedChatStudentId));
    if (!student) {
        historySubView = 'chatList';
        return renderChatRoomList(students);
    }

    const emotions = store.getEmotionsByStudent(student.id)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // 미답장 메시지 존재 여부 확인
    let hasUnreplied = false;
    let lastUnrepliedEmotionId = null;
    let lastUnrepliedConvoIndex = -1;
    emotions.forEach(e => {
        const convos = e.conversations || [];
        convos.forEach((c, ci) => {
            if (c.studentMessage && !c.teacherReply) {
                hasUnreplied = true;
                lastUnrepliedEmotionId = e.id || e.firebaseId;
                lastUnrepliedConvoIndex = ci;
            }
        });
        // 구 데이터 호환
        if (!e.conversations?.length && e.source === 'student' && !e.reply) {
            hasUnreplied = true;
            lastUnrepliedEmotionId = e.id || e.firebaseId;
            lastUnrepliedConvoIndex = -1;
        }
    });

    return `
        <div class="flex flex-col" style="min-height: 300px;">
            <!-- 채팅방 헤더 -->
            <div class="flex items-center gap-3 bg-white rounded-xl p-3 mb-2">
                <button id="backToChatListBtn" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-lg">
                    ←
                </button>
                <span class="text-2xl">${getPetEmoji(student.petType, student.level)}</span>
                <span class="font-bold">${student.name}</span>
            </div>

            <!-- 타임라인 -->
            <div id="chatTimeline" class="flex-1 overflow-y-auto space-y-2 px-2 pb-2" style="max-height: 55vh;">
                ${renderTimeline(emotions, student)}
            </div>

            <!-- 답장 입력창 -->
            ${hasUnreplied ? `
                <div class="bg-white rounded-xl p-3 mt-2 flex items-center gap-2">
                    <input type="text" id="chatReplyInput" class="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary"
                           placeholder="답장을 입력하세요..."
                           data-emotion-id="${lastUnrepliedEmotionId}"
                           data-convo-index="${lastUnrepliedConvoIndex}" />
                    <button id="chatSendBtn" class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            ` : `
                <div class="bg-gray-50 rounded-xl p-3 mt-2 text-center text-sm text-gray-400">
                    모든 메시지에 답장 완료
                </div>
            `}
        </div>
    `;
}

/**
 * 타임라인 렌더링 (날짜 구분선 + 감정 태그 + 말풍선)
 */
function renderTimeline(emotions, student) {
    if (emotions.length === 0) {
        return `
            <div class="text-center py-8 text-gray-400">
                <div class="text-3xl mb-2">💬</div>
                <div>아직 대화가 없어요</div>
            </div>
        `;
    }

    let html = '';
    let lastDateStr = '';

    emotions.forEach(e => {
        const emotionInfo = EMOTION_TYPES[e.emotion];
        const dateObj = new Date(e.timestamp);
        const dateStr = dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

        // 날짜 구분선
        if (dateStr !== lastDateStr) {
            html += `
                <div class="flex items-center justify-center my-3">
                    <span class="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">${dateStr}</span>
                </div>
            `;
            lastDateStr = dateStr;
        }

        // 감정 태그 HTML (말풍선 안에 삽입용)
        const emotionTag = emotionInfo
            ? `<span class="inline-block text-xs px-2 py-0.5 rounded-full mb-1" style="background: ${emotionInfo.color}20; color: ${emotionInfo.color}">${emotionInfo.icon} ${emotionInfo.name}</span>`
            : '';

        // conversations 기반 말풍선
        const convos = e.conversations || [];
        let isFirstStudentMsg = true; // 첫 학생 메시지에만 감정 태그 표시

        if (convos.length > 0) {
            convos.forEach(c => {
                // 학생 메시지 (왼쪽) — 감정 이모지 + 메시지 통합 카드
                if (c.studentMessage) {
                    const time = formatChatTime(c.studentAt || e.timestamp, true);
                    const showTag = isFirstStudentMsg && emotionTag;
                    isFirstStudentMsg = false;
                    html += `
                        <div class="flex items-end gap-2 mb-2">
                            <div class="max-w-[75%] bg-yellow-100 rounded-2xl rounded-tl-sm px-3 py-2">
                                ${showTag ? `<div>${emotionTag}</div>` : ''}
                                <p class="text-sm">${escapeHtml(c.studentMessage)}</p>
                            </div>
                            <span class="text-xs text-gray-400 flex-shrink-0">${time}</span>
                        </div>
                    `;
                }
                // 선생님 답장 (오른쪽)
                if (c.teacherReply) {
                    const time = formatChatTime(c.replyAt || e.timestamp, true);
                    html += `
                        <div class="flex items-end justify-end gap-2 mb-2">
                            <span class="text-xs text-gray-400 flex-shrink-0">${time}</span>
                            <div class="max-w-[75%] bg-primary text-white rounded-2xl rounded-tr-sm px-3 py-2">
                                <p class="text-sm">${escapeHtml(c.teacherReply)}</p>
                            </div>
                        </div>
                    `;
                }
            });
            // 메시지 없이 감정만 기록된 경우 (conversations는 있지만 studentMessage가 모두 null)
            if (isFirstStudentMsg && emotionTag) {
                html += `
                    <div class="flex items-end gap-2 mb-2">
                        <div class="bg-yellow-100 rounded-2xl rounded-tl-sm px-3 py-2">
                            <div>${emotionTag}</div>
                        </div>
                    </div>
                `;
            }
        } else {
            // 구 데이터 호환: conversations가 없는 경우
            const msg = e.note || e.memo;
            if (msg) {
                const time = formatChatTime(e.timestamp, true);
                html += `
                    <div class="flex items-end gap-2 mb-2">
                        <div class="max-w-[75%] bg-yellow-100 rounded-2xl rounded-tl-sm px-3 py-2">
                            ${emotionTag ? `<div>${emotionTag}</div>` : ''}
                            <p class="text-sm">${escapeHtml(msg)}</p>
                        </div>
                        <span class="text-xs text-gray-400 flex-shrink-0">${time}</span>
                    </div>
                `;
            } else if (emotionTag) {
                // 메시지 없이 감정만 있는 경우
                html += `
                    <div class="flex items-end gap-2 mb-2">
                        <div class="bg-yellow-100 rounded-2xl rounded-tl-sm px-3 py-2">
                            <div>${emotionTag}</div>
                        </div>
                    </div>
                `;
            }
            if (e.reply?.message) {
                const time = formatChatTime(e.reply.timestamp || e.timestamp, true);
                html += `
                    <div class="flex items-end justify-end gap-2 mb-2">
                        <span class="text-xs text-gray-400 flex-shrink-0">${time}</span>
                        <div class="max-w-[75%] bg-primary text-white rounded-2xl rounded-tr-sm px-3 py-2">
                            <p class="text-sm">${escapeHtml(e.reply.message)}</p>
                        </div>
                    </div>
                `;
            }
        }
    });

    return html;
}

/**
 * 채팅 시간 포맷
 * @param {string} timestamp - ISO string
 * @param {boolean} timeOnly - true면 시간만 표시
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
 * 채팅방 열기
 */
export function openChatRoom(studentId) {
    selectedChatStudentId = studentId;
    historySubView = 'chatRoom';
    const content = document.getElementById('content');
    content.innerHTML = render();
    afterRender();
    // 스크롤 맨 아래로
    setTimeout(() => {
        const timeline = document.getElementById('chatTimeline');
        if (timeline) timeline.scrollTop = timeline.scrollHeight;
    }, 50);
}

/**
 * 채팅방 목록으로 복귀
 */
function backToChatList() {
    selectedChatStudentId = null;
    historySubView = 'chatList';
    const content = document.getElementById('content');
    content.innerHTML = render();
    afterRender();
}

export function afterRender() {
    // 탭 전환
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            viewMode = tab.dataset.view;
            // 기록 보기 탭으로 전환시 채팅 목록으로 초기화
            if (tab.dataset.view === 'history') {
                historySubView = 'chatList';
                selectedChatStudentId = null;
            }
            const content = document.getElementById('content');
            content.innerHTML = render();
            afterRender();
        });
    });

    // 채팅방 뒤로가기 버튼
    const backBtn = document.getElementById('backToChatListBtn');
    if (backBtn) {
        backBtn.addEventListener('click', backToChatList);
    }

    // 채팅방 답장 전송
    const sendBtn = document.getElementById('chatSendBtn');
    const replyInput = document.getElementById('chatReplyInput');
    if (sendBtn && replyInput) {
        const sendReply = () => {
            const message = replyInput.value.trim();
            if (!message) return;

            const emotionId = replyInput.dataset.emotionId;
            const convoIndex = parseInt(replyInput.dataset.convoIndex);

            store.addReplyToEmotion(emotionId, message, convoIndex);

            const students = store.getStudents() || [];
            const student = students.find(s => String(s.id) === String(selectedChatStudentId));
            showToast(`${student?.name || '학생'}에게 답장을 보냈어요! 💌`, 'success');

            // 리렌더
            const content = document.getElementById('content');
            content.innerHTML = render();
            afterRender();
            // 스크롤 맨 아래
            setTimeout(() => {
                const timeline = document.getElementById('chatTimeline');
                if (timeline) timeline.scrollTop = timeline.scrollHeight;
            }, 50);
        };

        sendBtn.addEventListener('click', sendReply);
        replyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendReply();
            }
        });
    }

    // 채팅방 타임라인 스크롤 맨 아래
    if (historySubView === 'chatRoom') {
        const timeline = document.getElementById('chatTimeline');
        if (timeline) timeline.scrollTop = timeline.scrollHeight;
    }

    // Firebase 실시간 구독 설정
    setupFirebaseSubscription();
}


/**
 * Firebase 실시간 구독 설정
 */
function setupFirebaseSubscription() {
    // 기존 구독 해제
    if (emotionsUnsubscribe) {
        emotionsUnsubscribe();
        emotionsUnsubscribe = null;
    }

    // Firebase가 활성화되어 있으면 실시간 구독 시작
    if (isFirebaseMode) {
        emotionsUnsubscribe = store.subscribeToTodayEmotions((emotions) => {
            console.log('실시간 감정 업데이트:', emotions.length, '개');

            // 화면 갱신 (현재 탭 유지)
            const content = document.getElementById('content');
            if (content) {
                content.innerHTML = render();
                // 실시간 구독 다시 설정하지 않음 (무한 루프 방지)
                document.querySelectorAll('.tab-item').forEach(tab => {
                    tab.addEventListener('click', () => {
                        viewMode = tab.dataset.view;
                        content.innerHTML = render();
                        afterRender();
                    });
                });
            }
        });
    }
}

/**
 * 컴포넌트 언마운트 시 호출 (구독 해제)
 */
export function unmount() {
    if (emotionsUnsubscribe) {
        emotionsUnsubscribe();
        emotionsUnsubscribe = null;
    }
}

/**
 * 감정 체크 모달 표시
 * @param {number} studentId - 학생 ID
 * @param {number|null} emotionId - 특정 감정 기록 ID (기록 보기에서 클릭 시)
 */
export function showEmotionCheck(studentId, emotionId = null) {
    const student = store.getStudent(studentId);
    if (!student) return;

    // emotionId가 있으면 해당 감정 기록을 찾고, 없으면 오늘 감정 중 첫 번째
    let existingEmotion = null;
    if (emotionId) {
        const emotionLog = store.getEmotionLog() || [];
        existingEmotion = emotionLog.find(e => e.id === emotionId);
    } else {
        const todayEmotions = store.getTodayEmotions();
        existingEmotion = todayEmotions.find(e => e.studentId === studentId);
    }
    const studentNote = existingEmotion?.note || existingEmotion?.memo || '';
    const isStudentInput = existingEmotion?.source === 'student';

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">${student.name}의 오늘 기분</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="text-center py-4">
                <span class="text-5xl">${getPetEmoji(student.petType, student.level)}</span>
            </div>

            <div class="flex justify-center gap-3">
                ${Object.entries(EMOTION_TYPES).map(([key, info]) => `
                    <button class="emotion-btn ${existingEmotion?.emotion === key ? 'selected' : ''}"
                            data-emotion="${key}" style="border-color: ${existingEmotion?.emotion === key ? info.color : 'transparent'}">
                        ${info.icon}
                    </button>
                `).join('')}
            </div>

            ${isStudentInput ? `
            <!-- 학생이 작성한 메모 표시 -->
            ${studentNote ? `
            <div class="bg-blue-50 rounded-xl p-3">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm">💬</span>
                    <span class="text-sm font-medium text-blue-700">${student.name}의 마음</span>
                </div>
                <p class="text-sm text-gray-700">"${studentNote}"</p>
            </div>
            ` : ''}

            <!-- 선생님 답장 섹션 -->
            <div class="bg-green-50 rounded-xl p-3">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm">💌</span>
                    <span class="text-sm font-medium text-green-700">선생님의 답장</span>
                </div>
                ${existingEmotion.reply ? `
                    <p class="text-sm text-gray-700 mb-2">"${existingEmotion.reply.message}"</p>
                    <p class="text-xs text-gray-400">
                        ${new Date(existingEmotion.reply.timestamp).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        ${existingEmotion.reply.read ? '· 읽음 ✓' : '· 아직 안 읽음'}
                    </p>
                ` : ''}
                <textarea id="teacherReply" class="w-full p-3 border border-green-200 rounded-xl text-sm resize-none mt-2 bg-white" rows="2"
                          placeholder="${existingEmotion.reply ? '새 답장으로 수정하기...' : '따뜻한 말 한마디를 보내주세요...'}">${existingEmotion.reply?.message || ''}</textarea>
                <button id="sendReplyBtn" class="btn bg-green-500 hover:bg-green-600 text-white w-full mt-2">
                    ${existingEmotion.reply ? '답장 수정하기' : '답장 보내기'} 💌
                </button>
            </div>
            ` : `
            <!-- 교사가 직접 입력하는 경우 -->
            <div>
                <label class="text-sm text-gray-600 mb-1 block">메모 (선택)</label>
                <textarea id="emotionNote" class="w-full p-3 border rounded-xl text-sm resize-none" rows="2"
                          placeholder="특이사항이 있으면 적어주세요...">${existingEmotion?.note || ''}</textarea>
            </div>

            <button id="saveEmotionBtn" class="btn btn-primary w-full" disabled>
                저장하기
            </button>
            `}
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 학생이 입력한 감정에 답장하는 경우
    if (isStudentInput) {
        const sendReplyBtn = document.getElementById('sendReplyBtn');
        const replyTextarea = document.getElementById('teacherReply');

        if (sendReplyBtn) {
            sendReplyBtn.addEventListener('click', () => {
                const replyMessage = replyTextarea.value.trim();
                if (!replyMessage) {
                    showToast('답장 내용을 입력해주세요', 'warning');
                    return;
                }

                // 답장 저장
                store.addReplyToEmotion(existingEmotion.id, replyMessage);
                showToast(`${student.name}에게 답장을 보냈어요! 💌`, 'success');
                closeModal();

                // 화면 갱신
                const content = document.getElementById('content');
                content.innerHTML = render();
                afterRender();
            });
        }
    } else {
        // 교사가 직접 감정 입력하는 경우 (기존 로직)
        let selectedEmotion = existingEmotion?.emotion || null;

        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.emotion-btn').forEach(b => {
                    b.classList.remove('selected');
                    b.style.borderColor = 'transparent';
                });
                btn.classList.add('selected');
                const emotionInfo = EMOTION_TYPES[btn.dataset.emotion];
                btn.style.borderColor = emotionInfo.color;
                selectedEmotion = btn.dataset.emotion;
                document.getElementById('saveEmotionBtn').disabled = false;
            });
        });

        const saveBtn = document.getElementById('saveEmotionBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                if (!selectedEmotion) return;

                const note = document.getElementById('emotionNote').value.trim();

                // 버튼 비활성화
                saveBtn.disabled = true;
                saveBtn.textContent = '저장 중...';

                try {
                    // Firebase 동기화 포함 저장
                    await store.addEmotion({
                        studentId,
                        emotion: selectedEmotion,
                        memo: note,
                        source: 'teacher'
                    });

                    const emotionInfo = EMOTION_TYPES[selectedEmotion];
                    showToast(`${student.name}: ${emotionInfo.name} ${emotionInfo.icon}`, 'info');
                    closeModal();

                    // 화면 갱신
                    const content = document.getElementById('content');
                    content.innerHTML = render();
                    afterRender();
                } catch (error) {
                    console.error('감정 저장 실패:', error);
                    saveBtn.disabled = false;
                    saveBtn.textContent = '다시 시도';
                }
            });
        }
    }
}

/**
 * 전체 감정 체크 모달
 */
export function showBulkEmotionCheck() {
    const students = store.getStudents() || [];
    const todayEmotions = store.getTodayEmotions();
    const checkedIds = new Set(todayEmotions.map(e => e.studentId));
    const uncheckedStudents = students.filter(s => !checkedIds.has(s.id));

    if (uncheckedStudents.length === 0) {
        showToast('모든 학생의 감정을 체크했어요!', 'success');
        return;
    }

    let currentIndex = 0;

    function renderCurrentStudent() {
        const student = uncheckedStudents[currentIndex];

        const modalContent = `
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-bold">전체 감정 체크</h3>
                    <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div class="text-center text-sm text-gray-500">
                    ${currentIndex + 1} / ${uncheckedStudents.length}
                </div>

                <div class="text-center py-4">
                    <span class="text-5xl">${getPetEmoji(student.petType, student.level)}</span>
                    <div class="mt-2 font-bold text-lg">${student.name}</div>
                </div>

                <div class="flex justify-center gap-3">
                    ${Object.entries(EMOTION_TYPES).map(([key, info]) => `
                        <button class="bulk-emotion-btn emotion-btn" data-emotion="${key}">
                            ${info.icon}
                        </button>
                    `).join('')}
                </div>

                <div class="flex gap-2">
                    <button id="skipBtn" class="btn btn-secondary flex-1">
                        건너뛰기
                    </button>
                </div>
            </div>
        `;

        setModalContent(modalContent);

        // 이벤트 바인딩
        document.querySelectorAll('.bulk-emotion-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const emotion = btn.dataset.emotion;

                // 버튼들 비활성화
                document.querySelectorAll('.bulk-emotion-btn').forEach(b => b.disabled = true);

                try {
                    // Firebase 동기화 포함 저장
                    await store.addEmotion({
                        studentId: student.id,
                        emotion,
                        memo: '',
                        source: 'teacher'
                    });
                } catch (error) {
                    console.error('감정 저장 실패:', error);
                }

                nextStudent();
            });
        });

        document.getElementById('skipBtn').addEventListener('click', nextStudent);
    }

    function nextStudent() {
        currentIndex++;
        if (currentIndex < uncheckedStudents.length) {
            renderCurrentStudent();
        } else {
            showToast('모든 학생의 감정을 체크했어요! 🎉', 'success');
            closeModal();

            // 화면 갱신
            const content = document.getElementById('content');
            content.innerHTML = render();
            afterRender();
        }
    }

    openModal();
    renderCurrentStudent();
}
