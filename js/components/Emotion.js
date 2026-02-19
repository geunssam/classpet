/**
 * 감정 체크 컴포넌트
 * 학생들의 사회정서 관리
 * + Firebase 실시간 동기화
 */

import { store, EMOTION_TYPES } from '../store.js';
import { router } from '../router.js';
import { getPetEmoji } from '../utils/petLogic.js';
import { showToast } from '../utils/animations.js';
import { onEmotionUpdate } from '../services/EmotionService.js';
import { toDateString } from '../utils/dateUtils.js';

let viewMode = 'checkin'; // 'checkin', 'history', 'attention'
let emotionsUnsubscribe = null; // 실시간 구독 해제 함수
let isFirebaseMode = false; // Firebase 모드 여부
let selectedDate = toDateString(); // 선택된 날짜 (기본: 오늘)
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

    // sessionStorage에서 외부 학생 ID 파라미터 확인 (알림 클릭 → 채팅방 직접 이동)
    const externalStudentId = sessionStorage.getItem('emotionHistoryStudentId');
    if (externalStudentId) {
        viewMode = 'history';
        historySubView = 'chatRoom';
        selectedChatStudentId = parseInt(externalStudentId);
        sessionStorage.removeItem('emotionHistoryStudentId');
    }

    const students = store.getStudents() || [];
    const todayEmotions = store.getTodayEmotions();
    const needAttention = store.getStudentsNeedingAttention();
    const classCode = store.getClassCode();
    isFirebaseMode = store.isFirebaseEnabled() && classCode;

    // 오늘 감정 체크한 학생 ID 목록
    const checkedIds = new Set(todayEmotions.map(e => e.studentId));

    // 감정별 분포
    const emotionDistribution = {};
    Object.keys(EMOTION_TYPES).forEach(key => {
        emotionDistribution[key] = todayEmotions.filter(e => e.emotion === key).length;
    });

    // 학번 순 정렬 (감정 출석부용)
    const sortedStudents = [...students].sort((a, b) => (a.number || 0) - (b.number || 0));
    const sentStudents = sortedStudents.filter(s => checkedIds.has(s.id));
    const unsentStudents = sortedStudents.filter(s => !checkedIds.has(s.id));

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


            <!-- 오늘의 우리 반 + 감정 출석부 (2열) -->
            <div class="card bg-gradient-to-br from-secondary/10 to-danger/10 p-0 overflow-hidden">
                <div class="grid grid-cols-2" style="min-height: 0;">
                    <!-- 왼쪽: 감정 분포 -->
                    <div class="p-4 flex flex-col">
                        <h3 class="text-sm font-bold text-gray-700 mb-3">오늘의 우리 반</h3>
                        <div class="flex items-center justify-around flex-1">
                            ${Object.entries(EMOTION_TYPES).map(([key, info]) => `
                                <div class="text-center">
                                    <div class="text-2xl mb-1">${info.icon}</div>
                                    <div class="text-lg font-bold" style="color: ${info.color}">${emotionDistribution[key] || 0}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="mt-2 text-center text-xs text-gray-500">
                            ${todayEmotions.length}명 / ${students.length}명
                        </div>
                    </div>
                    <!-- 오른쪽: 감정 출석부 -->
                    <div class="p-4 border-l border-gray-200/30 flex flex-col" style="min-height: 0;">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-sm font-bold text-gray-700">감정 출석부</h3>
                            <span class="text-[10px] text-gray-400 bg-white/60 px-1.5 py-0.5 rounded-full">${sentStudents.length}/${students.length}</span>
                        </div>
                        ${students.length === 0 ? `
                            <div class="text-xs text-gray-400 text-center py-4">아직 학생이 없어요</div>
                        ` : `
                        <div class="grid grid-cols-3 gap-1.5 overflow-y-auto flex-1 -mr-1 pr-1" style="max-height: 200px;">
                            ${sortedStudents.map(student => {
                                const isSent = checkedIds.has(student.id);
                                const emotion = isSent ? todayEmotions.find(e => e.studentId === student.id) : null;
                                const eInfo = emotion ? EMOTION_TYPES[emotion.emotion] : null;
                                return isSent ? `
                                <div class="rounded-2xl py-1.5 px-2.5 flex items-center gap-1.5 cursor-pointer transition-colors" style="background-color: rgba(124,158,245,0.18);"
                                     onmouseenter="this.style.backgroundColor='rgba(124,158,245,0.3)'" onmouseleave="this.style.backgroundColor='rgba(124,158,245,0.18)'"
                                     data-action="open-chat" data-student-id="${student.id}">
                                    <span class="dash-pill-icon">${getPetEmoji(student.petType, student.level)}</span>
                                    <span class="dash-pill-label">${student.number || ''}. ${student.name}</span>
                                    <span class="dash-pill-icon">${eInfo ? eInfo.icon : ''}</span>
                                </div>` : `
                                <div class="rounded-2xl py-1.5 px-2.5 flex items-center gap-1.5 opacity-60" style="background-color: rgba(245,124,124,0.18);">
                                    <span class="dash-pill-icon">${getPetEmoji(student.petType, student.level)}</span>
                                    <span class="dash-pill-label">${student.number || ''}. ${student.name}</span>
                                    <span class="dash-pill-icon" style="visibility:hidden;">·</span>
                                </div>`;
                            }).join('')}
                        </div>
                        ${unsentStudents.length === 0 && sentStudents.length > 0 ? `
                            <div class="text-xs text-green-500 font-medium text-center pt-1.5">모두 보냈어요! 🎉</div>
                        ` : ''}
                        `}
                    </div>
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
                             data-action="open-detail" data-student-id="${student.id}">
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

            <!-- 기록 보기 -->
            <h3 class="text-sm font-semibold text-gray-600 flex items-center gap-1.5">💬 기록 보기</h3>
            ${renderHistoryView(students)}
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
        // 미답장 카운트: 학생이 보낸 감정(source=student)의 conversations에서 teacherReply가 없는 항목만
        // 교사가 메모한 감정(source=teacher)은 답장 대상이 아니므로 카운트하지 않음
        if (e.source === 'student') {
            const convos = e.conversations || [];
            convos.forEach(c => {
                if (c.studentMessage && !c.teacherReply) {
                    studentMap[sid].unreadCount++;
                }
            });
            // reply 기반 호환 (conversations가 없는 옛 데이터)
            if (!convos.length && !e.reply) {
                studentMap[sid].unreadCount++;
            }
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
                         data-action="open-chat" data-student-id="${student.id}">
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

    // 미답장 메시지 목록 수집 (학생이 보낸 감정만)
    const unrepliedList = [];
    emotions.forEach(e => {
        if (e.source !== 'student') return; // 교사 메모는 답장 대상 아님
        const convos = e.conversations || [];
        convos.forEach((c, ci) => {
            if (c.studentMessage && !c.teacherReply) {
                const emotionInfo = EMOTION_TYPES[e.emotion];
                unrepliedList.push({
                    emotionId: e.firebaseId || e.id,
                    convoIndex: ci,
                    preview: `${emotionInfo ? emotionInfo.icon + ' ' + emotionInfo.name : ''} | ${c.studentMessage}`,
                    studentMessage: c.studentMessage
                });
            }
        });
        // 구 데이터 호환
        if (!convos.length && !e.reply) {
            const emotionInfo = EMOTION_TYPES[e.emotion];
            unrepliedList.push({
                emotionId: e.firebaseId || e.id,
                convoIndex: -1,
                preview: `${emotionInfo ? emotionInfo.icon + ' ' + emotionInfo.name : ''} | ${e.note || e.memo || ''}`,
                studentMessage: e.note || e.memo || ''
            });
        }
    });
    const hasUnreplied = unrepliedList.length > 0;
    const isSingleUnreplied = unrepliedList.length === 1;

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
                ${renderTimeline(emotions, student, unrepliedList)}
            </div>

            <!-- 답장 입력창 -->
            ${hasUnreplied ? `
                <!-- 인용 프리뷰 (기본 숨김, 답장 버튼 클릭 시 표시) -->
                <div id="chatReplyPreview" class="${isSingleUnreplied ? 'hidden' : 'hidden'} bg-primary/10 rounded-t-xl px-3 py-2 flex items-center justify-between mt-2">
                    <span id="chatReplyPreviewText" class="text-xs text-gray-600 truncate flex-1"></span>
                    <button id="chatReplyCancelBtn" class="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">✕</button>
                </div>
                <div class="bg-white rounded-xl mt-2 p-3 flex items-center gap-2"
                     id="chatReplyInputWrap">
                    <input type="text" id="chatReplyInput" class="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary"
                           placeholder="${isSingleUnreplied ? '답장을 입력하세요...' : '말풍선을 눌러 답장할 메시지를 선택하세요'}"
                           data-emotion-id="${isSingleUnreplied ? unrepliedList[0].emotionId : ''}"
                           data-convo-index="${isSingleUnreplied ? unrepliedList[0].convoIndex : ''}"
                           ${isSingleUnreplied ? '' : 'disabled'} />
                    <button id="chatSendBtn" class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 flex-shrink-0 ${isSingleUnreplied ? '' : 'opacity-50'}"
                            ${isSingleUnreplied ? '' : 'disabled'}>
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
function renderTimeline(emotions, student, unrepliedList = []) {
    const multipleUnreplied = unrepliedList.length > 1;
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
        // 밝은 색상(soso 등)은 텍스트가 안 보이므로 진하게 보정
        const tagColor = emotionInfo ? darkenColor(emotionInfo.color, 0.35) : '';
        const emotionTag = emotionInfo
            ? `<span class="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1 bg-white/90 border" style="border-color: ${emotionInfo.color}; color: ${tagColor}">${emotionInfo.icon} ${emotionInfo.name}</span>`
            : '';

        // conversations 기반 말풍선
        const convos = e.conversations || [];
        let isFirstStudentMsg = true; // 첫 학생 메시지에만 감정 태그 표시

        if (convos.length > 0) {
            convos.forEach((c, ci) => {
                // 학생 메시지 (왼쪽) — 감정 이모지 + 메시지 통합 카드
                if (c.studentMessage) {
                    const time = formatChatTime(c.studentAt || e.timestamp, true);
                    const showTag = isFirstStudentMsg && emotionTag;
                    isFirstStudentMsg = false;
                    const isUnreplied = !c.teacherReply;
                    const eId = e.firebaseId || e.id;
                    const previewText = `${emotionInfo ? emotionInfo.icon + ' ' + emotionInfo.name : ''} | ${c.studentMessage}`;
                    html += `
                        <div class="flex items-end gap-2 mb-2">
                            <div class="max-w-[75%] bg-yellow-100 rounded-2xl rounded-tl-sm px-3 py-2">
                                ${showTag ? `<div>${emotionTag}</div>` : ''}
                                <p class="text-sm">${escapeHtml(c.studentMessage)}</p>
                            </div>
                            <div class="flex flex-col items-start gap-1">
                                <span class="text-xs text-gray-400 flex-shrink-0">${time}</span>
                                ${isUnreplied && multipleUnreplied ? `
                                    <button class="chat-reply-btn text-xs text-primary font-medium hover:underline"
                                            data-emotion-id="${eId}" data-convo-index="${ci}"
                                            data-preview="${escapeHtml(previewText)}">
                                        답장
                                    </button>
                                ` : ''}
                            </div>
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
            const isOldUnreplied = e.source === 'student' && !e.reply;
            const oldEId = e.firebaseId || e.id;
            if (msg) {
                const time = formatChatTime(e.timestamp, true);
                const oldPreviewText = `${emotionInfo ? emotionInfo.icon + ' ' + emotionInfo.name : ''} | ${msg}`;
                html += `
                    <div class="flex items-end gap-2 mb-2">
                        <div class="max-w-[75%] bg-yellow-100 rounded-2xl rounded-tl-sm px-3 py-2">
                            ${emotionTag ? `<div>${emotionTag}</div>` : ''}
                            <p class="text-sm">${escapeHtml(msg)}</p>
                        </div>
                        <div class="flex flex-col items-start gap-1">
                            <span class="text-xs text-gray-400 flex-shrink-0">${time}</span>
                            ${isOldUnreplied && multipleUnreplied ? `
                                <button class="chat-reply-btn text-xs text-primary font-medium hover:underline"
                                        data-emotion-id="${oldEId}" data-convo-index="-1"
                                        data-preview="${escapeHtml(oldPreviewText)}">
                                    답장
                                </button>
                            ` : ''}
                        </div>
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
 * HEX 색상을 어둡게 보정
 * @param {string} hex - #RRGGBB
 * @param {number} amount - 0~1 (클수록 더 어두움)
 */
function darkenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.floor(((num >> 16) & 0xFF) * (1 - amount)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0xFF) * (1 - amount)));
    const b = Math.max(0, Math.floor((num & 0xFF) * (1 - amount)));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
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

/**
 * 채팅방 답장 관련 이벤트 바인딩
 * (afterRender + Firebase 실시간 콜백에서 공통 사용)
 */
function bindChatReplyEvents() {
    const sendBtn = document.getElementById('chatSendBtn');
    const replyInput = document.getElementById('chatReplyInput');
    const replyPreview = document.getElementById('chatReplyPreview');
    const replyPreviewText = document.getElementById('chatReplyPreviewText');
    const replyCancelBtn = document.getElementById('chatReplyCancelBtn');
    const replyInputWrap = document.getElementById('chatReplyInputWrap');

    if (!sendBtn || !replyInput) return;

    // 답장 버튼 클릭 → 인용 프리뷰 표시 + 입력 활성화
    document.querySelectorAll('.chat-reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const emotionId = btn.dataset.emotionId;
            const convoIndex = btn.dataset.convoIndex;
            const preview = btn.dataset.preview;

            // 입력창에 대상 정보 설정
            replyInput.dataset.emotionId = emotionId;
            replyInput.dataset.convoIndex = convoIndex;
            replyInput.disabled = false;
            replyInput.placeholder = '답장을 입력하세요...';
            sendBtn.disabled = false;
            sendBtn.classList.remove('opacity-50');

            // 인용 프리뷰 표시
            if (replyPreview && replyPreviewText) {
                replyPreviewText.textContent = preview;
                replyPreview.classList.remove('hidden');
                if (replyInputWrap) {
                    replyInputWrap.classList.remove('rounded-xl', 'mt-2');
                    replyInputWrap.classList.add('rounded-b-xl');
                }
            }

            replyInput.focus();
        });
    });

    // 인용 프리뷰 취소 버튼
    if (replyCancelBtn) {
        replyCancelBtn.addEventListener('click', () => {
            if (replyPreview) replyPreview.classList.add('hidden');
            replyInput.value = '';
            replyInput.dataset.emotionId = '';
            replyInput.dataset.convoIndex = '';
            replyInput.disabled = true;
            replyInput.placeholder = '말풍선을 눌러 답장할 메시지를 선택하세요';
            sendBtn.disabled = true;
            sendBtn.classList.add('opacity-50');
            if (replyInputWrap) {
                replyInputWrap.classList.add('rounded-xl', 'mt-2');
                replyInputWrap.classList.remove('rounded-b-xl');
            }
        });
    }

    const sendReply = () => {
        const message = replyInput.value.trim();
        if (!message) return;

        const emotionId = replyInput.dataset.emotionId;
        const convoIndex = parseInt(replyInput.dataset.convoIndex);

        if (!emotionId) return;

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

export function afterRender() {
    // 이벤트 위임: data-action 클릭 처리
    const content = document.getElementById('content');
    if (content) {
        content.addEventListener('click', (e) => {
            const chatBtn = e.target.closest('[data-action="open-chat"]');
            if (chatBtn) {
                window.classpet.openChatRoom(chatBtn.dataset.studentId);
                return;
            }
            const detailBtn = e.target.closest('[data-action="open-detail"]');
            if (detailBtn) {
                router.navigate('student', { id: detailBtn.dataset.studentId });
                return;
            }
        });
    }

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

    // 채팅방 답장 이벤트 바인딩
    bindChatReplyEvents();

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
 * EmotionService의 중앙 구독에 리스너 등록 (직접 Firebase 구독 없음)
 */
function setupFirebaseSubscription() {
    if (emotionsUnsubscribe) {
        emotionsUnsubscribe();
        emotionsUnsubscribe = null;
    }

    if (isFirebaseMode) {
        emotionsUnsubscribe = onEmotionUpdate(() => {
            const content = document.getElementById('content');
            if (content) {
                content.innerHTML = render();
                // 탭 전환 + 채팅방 이벤트만 바인딩 (무한 루프 방지)
                document.querySelectorAll('.tab-item').forEach(tab => {
                    tab.addEventListener('click', () => {
                        viewMode = tab.dataset.view;
                        if (tab.dataset.view === 'history') {
                            historySubView = 'chatList';
                            selectedChatStudentId = null;
                        }
                        content.innerHTML = render();
                        afterRender();
                    });
                });
                const backBtn = document.getElementById('backToChatListBtn');
                if (backBtn) backBtn.addEventListener('click', backToChatList);
                if (historySubView === 'chatRoom') {
                    bindChatReplyEvents();
                    const timeline = document.getElementById('chatTimeline');
                    if (timeline) timeline.scrollTop = timeline.scrollHeight;
                }
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

