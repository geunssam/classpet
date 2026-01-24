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

export function render() {
    // sessionStorage에서 외부 날짜 파라미터 확인
    const externalDate = sessionStorage.getItem('emotionHistoryDate');
    if (externalDate) {
        // 파라미터가 있으면 히스토리 뷰로 전환하고 해당 날짜 설정
        selectedDate = externalDate;
        viewMode = 'history';
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
                             onclick="window.classpet.router.navigate('student', { id: ${student.id} })">
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
                        <button class="pet-card py-3" onclick="window.classpet.showEmotionCheck(${student.id})">
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
                             onclick="window.classpet.showEmotionCheck(${student.id})">
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
 * 기록 보기 뷰 (날짜 선택 가능)
 */
function renderHistoryView(students) {
    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;

    // 선택된 날짜의 감정 기록 가져오기
    const emotionLog = store.getEmotionLog() || [];
    const dateEmotions = emotionLog.filter(e => e.timestamp.startsWith(selectedDate));

    // 날짜 표시 포맷
    const displayDate = new Date(selectedDate + 'T00:00:00');
    const dateStr = displayDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

    return `
        <div class="space-y-3">
            <!-- 날짜 선택 -->
            <div class="flex items-center justify-between bg-white rounded-xl p-3">
                <button id="prevDateBtn" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">
                    ←
                </button>
                <div class="flex items-center gap-2">
                    <input type="date" id="datePicker" value="${selectedDate}" max="${today}"
                           class="text-center font-medium text-gray-700 bg-transparent border-none cursor-pointer" />
                    ${isToday ? '<span class="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">오늘</span>' : ''}
                </div>
                <button id="nextDateBtn" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 ${isToday ? 'opacity-30 cursor-not-allowed' : ''}">
                    →
                </button>
            </div>

            <!-- 해당 날짜 요약 -->
            <div class="bg-gray-50 rounded-xl p-3 text-center">
                <span class="text-sm text-gray-500">총 </span>
                <span class="font-bold text-primary">${dateEmotions.length}</span>
                <span class="text-sm text-gray-500">명이 마음을 기록했어요</span>
            </div>

            ${dateEmotions.length === 0 ? `
                <div class="empty-state py-8">
                    <div class="text-3xl mb-2">💭</div>
                    <div class="text-gray-500">${isToday ? '오늘' : dateStr} 감정 기록이 없어요</div>
                </div>
            ` : `
                <div class="space-y-3">
                    ${dateEmotions.map(emotion => {
                        const student = students.find(s => s.id === emotion.studentId);
                        const emotionInfo = EMOTION_TYPES[emotion.emotion];
                        if (!student || !emotionInfo) return '';

                        return `
                            <div class="bg-white rounded-xl p-3 cursor-pointer hover:bg-gray-50"
                                 onclick="window.classpet.showEmotionCheck(${student.id}, ${emotion.id})">
                                <div class="flex items-center gap-3">
                                    <span class="text-2xl">${getPetEmoji(student.petType, student.level)}</span>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2">
                                            <span class="font-medium">${student.name}</span>
                                            <span class="text-xl">${emotionInfo.icon}</span>
                                        </div>
                                        ${emotion.source === 'student' ? '<span class="text-xs text-blue-500">학생 입력</span>' : ''}
                                    </div>
                                    <div class="text-xs text-gray-400">
                                        ${new Date(emotion.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                ${(emotion.note || emotion.memo) ? `
                                    <div class="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                                        💬 "${emotion.note || emotion.memo}"
                                    </div>
                                ` : ''}
                                ${emotion.reply ? `
                                    <div class="mt-2 text-sm text-green-700 bg-green-50 rounded-lg p-2">
                                        💌 선생님: "${emotion.reply.message}"
                                        <span class="text-xs text-gray-400 ml-1">${emotion.reply.read ? '(읽음)' : '(안읽음)'}</span>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            `}
        </div>
    `;
}

export function afterRender() {
    // 탭 전환
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            viewMode = tab.dataset.view;
            // 기록 보기 탭으로 전환시 오늘 날짜로 초기화
            if (tab.dataset.view === 'history') {
                selectedDate = new Date().toISOString().split('T')[0];
            }
            const content = document.getElementById('content');
            content.innerHTML = render();
            afterRender();
        });
    });

    // 날짜 선택 이벤트 (기록 보기 탭)
    setupDateNavigation();

    // Firebase 실시간 구독 설정
    setupFirebaseSubscription();
}

/**
 * 날짜 네비게이션 설정
 */
function setupDateNavigation() {
    const prevBtn = document.getElementById('prevDateBtn');
    const nextBtn = document.getElementById('nextDateBtn');
    const datePicker = document.getElementById('datePicker');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const current = new Date(selectedDate);
            current.setDate(current.getDate() - 1);
            selectedDate = current.toISOString().split('T')[0];
            refreshHistoryView();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const today = new Date().toISOString().split('T')[0];
            if (selectedDate >= today) return; // 오늘 이후로는 이동 불가

            const current = new Date(selectedDate);
            current.setDate(current.getDate() + 1);
            selectedDate = current.toISOString().split('T')[0];
            refreshHistoryView();
        });
    }

    if (datePicker) {
        datePicker.addEventListener('change', (e) => {
            selectedDate = e.target.value;
            refreshHistoryView();
        });
    }
}

/**
 * 기록 보기 뷰만 새로고침
 */
function refreshHistoryView() {
    const content = document.getElementById('content');
    content.innerHTML = render();
    afterRender();
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

            ${isStudentInput && studentNote ? `
            <!-- 학생이 작성한 메모 표시 -->
            <div class="bg-blue-50 rounded-xl p-3">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm">💬</span>
                    <span class="text-sm font-medium text-blue-700">${student.name}의 마음</span>
                </div>
                <p class="text-sm text-gray-700">"${studentNote}"</p>
            </div>

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
    if (isStudentInput && studentNote) {
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
                    await store.addEmotionWithSync({
                        studentId,
                        emotion: selectedEmotion,
                        note,
                        source: 'teacher' // 교사가 입력
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
                    await store.addEmotionWithSync({
                        studentId: student.id,
                        emotion,
                        note: '',
                        source: 'teacher' // 교사가 입력
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
