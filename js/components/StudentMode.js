/**
 * 학생 모드 메인 화면 컴포넌트
 * 내 펫과 대화하기 인터페이스
 */

import { store, PET_TYPES, EMOTION_TYPES, PET_REACTIONS, PET_SPEECH_STYLES, convertToPetSpeech } from '../store.js';
import { router } from '../router.js';
import { getPetEmoji, getGrowthStage, getExpProgress, getCurrentLevelExp, getExpForNextLevel, isMaxLevel, calculateLevel } from '../utils/petLogic.js';
import { showToast } from '../utils/animations.js';
import { getNameWithSuffix } from '../utils/nameUtils.js';

/**
 * 렌더링
 */
export function render() {
    // 로그인 확인
    if (!store.isStudentLoggedIn()) {
        // 로그인 안 되어 있으면 로그인 페이지로
        setTimeout(() => router.navigate('student-login'), 0);
        return '<div class="text-center p-8">로그인이 필요합니다...</div>';
    }

    const student = store.getCurrentStudent();
    if (!student) {
        store.studentLogout();
        setTimeout(() => router.navigate('student-login'), 0);
        return '<div class="text-center p-8">학생 정보를 찾을 수 없습니다...</div>';
    }

    const petType = PET_TYPES[student.petType];
    const petStage = getGrowthStage(student.level);
    const petEmoji = petType?.stages[petStage] || '🐾';
    const petName = student.petName || petType?.name || '펫';

    // 경험치 계산
    const expPercent = getExpProgress(student.exp, student.level);

    // 오늘 감정 기록 (복수)
    const todayEmotions = store.getStudentTodayEmotions(student.id);
    const hasEmotionsToday = todayEmotions.length > 0;

    return `
        <div class="student-mode-container pb-8">
            <!-- 로그아웃 버튼 -->
            <div class="flex justify-end mb-4">
                <button id="studentLogoutBtn" class="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                    <span>👋</span>
                    <span>나가기</span>
                </button>
            </div>

            <!-- 펫 영역 -->
            <div class="pet-display-area text-center mb-8">
                <!-- 펫 이모지 (큰 사이즈) -->
                <div id="petEmojiContainer" class="relative inline-block">
                    <span id="petEmoji" class="text-8xl inline-block pet-pulse">${petEmoji}</span>

                    <!-- 반응 이모지 (숨김 상태) -->
                    <span id="reactionEmoji" class="absolute -top-4 -right-4 text-3xl opacity-0 transition-all duration-500"></span>
                </div>

                <!-- 펫 정보 -->
                <div class="mt-4">
                    <h2 class="text-2xl font-bold text-gray-800">${petName}</h2>
                    <p class="text-sm text-gray-500">${student.name}의 펫</p>
                </div>

                <!-- 레벨 & 경험치 -->
                <div class="mt-4 px-8">
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <span class="level-badge">Lv.${student.level}</span>
                        <span class="text-sm text-gray-500">${expPercent}%</span>
                    </div>
                    <div class="exp-bar">
                        <div class="exp-bar-fill" style="width: ${expPercent}%"></div>
                    </div>
                </div>
            </div>

            <!-- 펫 말풍선 -->
            <div id="petSpeechBubble" class="pet-speech-bubble bg-white rounded-2xl p-4 shadow-soft mx-4 mb-6 relative">
                <div class="speech-arrow"></div>
                <p id="petMessage" class="text-center text-gray-700">
                    ${hasEmotionsToday
                        ? `또 이야기하고 싶은 거야? ${getNameWithSuffix(student.name)}! 언제든 말해줘! 💕`
                        : `안녕, ${getNameWithSuffix(student.name)}! 오늘 기분이 어때? 🐾`
                    }
                </p>
            </div>

            ${hasEmotionsToday ? `
                <!-- 오늘 보낸 마음 목록 -->
                <div class="px-4 mb-6">
                    <div class="bg-blue-50 rounded-2xl p-4">
                        <p class="text-blue-600 font-medium text-center mb-3">📝 오늘 보낸 마음 (${todayEmotions.length}개)</p>
                        <div class="space-y-3 max-h-64 overflow-y-auto">
                            ${todayEmotions.map(emotion => {
                                const emotionTime = new Date(emotion.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                                const hasReply = !!emotion.reply;
                                const petSpeech = hasReply ? convertToPetSpeech(emotion.reply.message, student.petType, petName) : null;
                                const petStyle = PET_SPEECH_STYLES[student.petType] || {};
                                return `
                                <div class="bg-white rounded-xl p-3 shadow-sm">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="text-xl">${EMOTION_TYPES[emotion.emotion]?.icon || '😊'}</span>
                                        <span class="text-xs text-gray-400">${emotionTime}</span>
                                        ${hasReply ? `<span class="ml-auto text-xs ${!emotion.reply.read ? 'text-red-500 font-bold' : 'text-green-500'}">💌 ${!emotion.reply.read ? 'NEW' : '답장 있음'}</span>` : ''}
                                    </div>
                                    ${(emotion.note || emotion.memo) ? `
                                        <p class="text-sm text-gray-600 italic pl-7">"${emotion.note || emotion.memo}"</p>
                                    ` : ''}
                                    ${hasReply ? `
                                        <div class="mt-2 pl-7 pt-2 border-t border-gray-100">
                                            <div class="flex items-center gap-1 mb-1">
                                                <span class="text-sm">${petEmoji}</span>
                                                <span class="text-xs text-amber-600 font-medium">${petName}의 답장</span>
                                            </div>
                                            <p class="text-sm text-gray-700">"${petSpeech.petMessage}"</p>
                                        </div>
                                    ` : ''}
                                </div>
                            `;}).join('')}
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- 감정 선택 (항상 표시) -->
            <div class="emotion-check-area px-4">
                <p class="text-center text-sm text-gray-500 mb-4">
                    ${hasEmotionsToday ? '💭 지금 기분도 알려줘!' : '오늘 기분을 펫에게 알려주세요'}
                </p>

                <!-- 감정 버튼들 -->
                <div class="flex justify-center gap-3 mb-6" id="emotionButtons">
                    ${Object.entries(EMOTION_TYPES).map(([key, emotion]) => `
                        <button
                            class="emotion-select-btn w-14 h-14 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-3xl transition-all border-3 border-transparent hover:scale-110"
                            data-emotion="${key}"
                            title="${emotion.name}"
                        >
                            ${emotion.icon}
                        </button>
                    `).join('')}
                </div>

                <!-- 감정 선택 이유 -->
                <div class="mb-4">
                    <textarea
                        id="petMemo"
                        class="w-full p-4 border-2 border-gray-200 rounded-2xl resize-none focus:border-primary focus:ring-0 transition-colors"
                        rows="3"
                        placeholder="그 감정을 선택한 이유는 뭘까? 왜 그런 감정을 느꼈어?"
                    ></textarea>
                </div>

                <!-- 전송 버튼 -->
                <button
                    id="sendEmotionBtn"
                    class="w-full btn btn-primary opacity-50 cursor-not-allowed transition-all"
                    disabled
                >
                    펫에게 말하기
                </button>
            </div>

            ${isMaxLevel(student.level) ? `
                <!-- 레벨 15 달성 - 새 펫 선택 안내 -->
                <div class="mt-6 px-4">
                    <div class="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-2xl p-4 border-2 border-amber-300 pet-collection-sparkle-border">
                        <div class="text-center">
                            <div class="text-3xl mb-2">🎉👑🎉</div>
                            <h3 class="text-lg font-bold text-amber-700">축하해요!</h3>
                            <p class="text-sm text-amber-600 mt-1">
                                ${petName}(이)가 최고 레벨에 도달했어요!<br>
                                이제 새로운 펫을 키울 수 있어요!
                            </p>
                            <button id="selectNewPetBtn" class="mt-4 btn bg-gradient-to-r from-amber-400 to-yellow-400 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all">
                                ✨ 새 펫 선택하기
                            </button>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- 펫 통계 (간단히) -->
            <div class="mt-8 px-4">
                <div class="bg-cream rounded-2xl p-4">
                    <div class="flex justify-around text-center">
                        <div>
                            <div class="text-2xl font-bold text-primary">${student.totalPraises || 0}</div>
                            <div class="text-xs text-gray-500">받은 칭찬</div>
                        </div>
                        <div class="w-px bg-gray-200"></div>
                        <div>
                            <div class="text-2xl font-bold text-success">${student.level}</div>
                            <div class="text-xs text-gray-500">현재 레벨</div>
                        </div>
                        <div class="w-px bg-gray-200"></div>
                        <div>
                            <div class="text-2xl font-bold text-secondary">${petStage === 'adult' ? '최종' : (petStage === 'growing' ? '성장중' : '아기')}</div>
                            <div class="text-xs text-gray-500">펫 단계</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 하단 버튼 영역 -->
            <div class="mt-6 px-4 space-y-3">
                <!-- 펫 도감 버튼 -->
                <button id="petCollectionBtn" class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 text-amber-700 text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-amber-200">
                    <span>📖</span>
                    <span>펫 도감</span>
                </button>

                <!-- PIN 변경 버튼 -->
                <button id="changePinBtn" class="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <span>🔐</span>
                    <span>내 PIN 변경하기</span>
                </button>
            </div>
        </div>

        <!-- PIN 변경 모달 -->
        <div id="changePinModal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl">
                <div class="text-center mb-6">
                    <div class="text-4xl mb-2">🔐</div>
                    <h3 class="text-lg font-bold text-gray-800">PIN 변경</h3>
                    <p class="text-sm text-gray-500 mt-1">새로운 PIN을 설정해주세요</p>
                </div>

                <!-- 현재 PIN -->
                <div class="mb-4">
                    <label class="text-sm font-medium text-gray-700 mb-2 block">현재 PIN</label>
                    <div class="flex justify-center gap-2" id="currentPinInputs">
                        <input type="text" maxlength="1" class="pin-input pin-change-input" data-group="current" data-index="0" inputmode="numeric">
                        <input type="text" maxlength="1" class="pin-input pin-change-input" data-group="current" data-index="1" inputmode="numeric">
                        <input type="text" maxlength="1" class="pin-input pin-change-input" data-group="current" data-index="2" inputmode="numeric">
                        <input type="text" maxlength="1" class="pin-input pin-change-input" data-group="current" data-index="3" inputmode="numeric">
                    </div>
                </div>

                <!-- 새 PIN -->
                <div class="mb-4">
                    <label class="text-sm font-medium text-gray-700 mb-2 block">새 PIN</label>
                    <div class="flex justify-center gap-2" id="newPinInputs">
                        <input type="text" maxlength="1" class="pin-input pin-change-input" data-group="new" data-index="0" inputmode="numeric">
                        <input type="text" maxlength="1" class="pin-input pin-change-input" data-group="new" data-index="1" inputmode="numeric">
                        <input type="text" maxlength="1" class="pin-input pin-change-input" data-group="new" data-index="2" inputmode="numeric">
                        <input type="text" maxlength="1" class="pin-input pin-change-input" data-group="new" data-index="3" inputmode="numeric">
                    </div>
                </div>

                <!-- 새 PIN 확인 -->
                <div class="mb-4">
                    <label class="text-sm font-medium text-gray-700 mb-2 block">새 PIN 확인</label>
                    <div class="flex justify-center gap-2" id="confirmPinInputs">
                        <input type="text" maxlength="1" class="pin-input pin-change-input" data-group="confirm" data-index="0" inputmode="numeric">
                        <input type="text" maxlength="1" class="pin-input pin-change-input" data-group="confirm" data-index="1" inputmode="numeric">
                        <input type="text" maxlength="1" class="pin-input pin-change-input" data-group="confirm" data-index="2" inputmode="numeric">
                        <input type="text" maxlength="1" class="pin-input pin-change-input" data-group="confirm" data-index="3" inputmode="numeric">
                    </div>
                </div>

                <!-- 에러 메시지 -->
                <p id="changePinError" class="text-center text-sm text-red-500 mb-4 hidden"></p>

                <!-- 버튼 -->
                <div class="flex gap-2">
                    <button id="cancelChangePinBtn" class="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors">
                        취소
                    </button>
                    <button id="confirmChangePinBtn" class="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors">
                        변경하기
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // 선생님 답장 읽음 처리 (복수 기록 지원)
    const student = store.getCurrentStudent();
    if (student) {
        const todayEmotions = store.getStudentTodayEmotions(student.id);
        // 읽지 않은 답장들 자동 읽음 처리
        todayEmotions.forEach(emotion => {
            if (emotion.reply && !emotion.reply.read) {
                store.markReplyAsRead(emotion.id);
            }
        });
    }

    // 로그아웃 버튼
    const logoutBtn = document.getElementById('studentLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            store.studentLogout();
            router.navigate('login');
        });
    }

    // 펫 도감 버튼
    const collectionBtn = document.getElementById('petCollectionBtn');
    if (collectionBtn) {
        collectionBtn.addEventListener('click', () => {
            router.navigate('pet-collection');
        });
    }

    // 새 펫 선택 버튼 (레벨 15 달성 시)
    const selectNewPetBtn = document.getElementById('selectNewPetBtn');
    if (selectNewPetBtn) {
        selectNewPetBtn.addEventListener('click', () => {
            showNewPetSelectionModal();
        });
    }

    // 감정 버튼들
    const emotionButtons = document.querySelectorAll('.emotion-select-btn');
    const sendBtn = document.getElementById('sendEmotionBtn');
    const memoTextarea = document.getElementById('petMemo');
    let selectedEmotion = null;

    // 전송 버튼 활성화 상태 체크 함수
    function updateSendButtonState() {
        const memoValue = memoTextarea?.value.trim() || '';
        const isValid = selectedEmotion && memoValue.length > 0;

        if (sendBtn) {
            sendBtn.disabled = !isValid;
            if (isValid) {
                sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }
    }

    emotionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 이전 선택 해제
            emotionButtons.forEach(b => {
                b.classList.remove('border-primary', 'bg-primary/10', 'scale-110');
                b.classList.add('border-transparent');
            });

            // 현재 선택
            btn.classList.remove('border-transparent');
            btn.classList.add('border-primary', 'bg-primary/10', 'scale-110');
            selectedEmotion = btn.dataset.emotion;

            // 전송 버튼 상태 업데이트
            updateSendButtonState();

            // 펫 미리 반응 (약한 반응)
            previewPetReaction(selectedEmotion);
        });
    });

    // 메모 입력 시 전송 버튼 상태 업데이트
    if (memoTextarea) {
        memoTextarea.addEventListener('input', updateSendButtonState);
    }

    // 전송 버튼
    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const memo = memoTextarea?.value.trim() || '';
            if (!selectedEmotion || !memo) return;

            const student = store.getCurrentStudent();
            if (!student) return;

            // 버튼 비활성화 (중복 클릭 방지)
            sendBtn.disabled = true;
            sendBtn.textContent = '전송 중...';

            try {
                // 감정 저장 (Firebase 동기화 포함)
                await store.addEmotionWithSync({
                    studentId: student.id,
                    emotion: selectedEmotion,
                    note: memo,  // Emotion.js와 키 이름 통일 (note)
                    source: 'student' // 학생이 직접 입력
                });

                // 교사에게 알림 전송
                store.createEmotionNotification(student.id, selectedEmotion, memo);

                // 펫 경험치 +5 추가
                const newExp = student.exp + 5;
                const oldLevel = student.level;
                const newLevel = calculateLevel(newExp);

                // 학생 정보 업데이트 (Firebase 동기화 포함)
                await store.saveStudentWithSync({
                    ...student,
                    exp: newExp,
                    level: newLevel
                });

                // 펫 반응 애니메이션
                showPetReaction(selectedEmotion);

                // 레벨업 메시지
                let resultMessage = '펫에게 마음을 전달했어요! +5 EXP';
                if (newLevel > oldLevel) {
                    resultMessage = `🎉 레벨업! Lv.${newLevel} +5 EXP`;
                }

                sendBtn.textContent = resultMessage;
                sendBtn.classList.add('opacity-50');
            } catch (error) {
                console.error('감정 저장 실패:', error);
                sendBtn.disabled = false;
                sendBtn.textContent = '다시 시도하기';
                sendBtn.classList.remove('opacity-50');
            }
        });
    }

    // PIN 변경 기능
    setupPinChangeModal();
}

/**
 * PIN 변경 모달 설정
 */
function setupPinChangeModal() {
    const changePinBtn = document.getElementById('changePinBtn');
    const modal = document.getElementById('changePinModal');
    const cancelBtn = document.getElementById('cancelChangePinBtn');
    const confirmBtn = document.getElementById('confirmChangePinBtn');
    const errorEl = document.getElementById('changePinError');

    if (!changePinBtn || !modal) return;

    // PIN 변경 버튼 클릭
    changePinBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        // 입력 초기화
        document.querySelectorAll('.pin-change-input').forEach(input => {
            input.value = '';
        });
        errorEl.classList.add('hidden');
        // 첫 번째 입력에 포커스
        const firstInput = document.querySelector('[data-group="current"][data-index="0"]');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    });

    // 취소 버튼
    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // 모달 배경 클릭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // PIN 입력 이벤트
    const allInputs = document.querySelectorAll('.pin-change-input');
    allInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = value;

            // 다음 필드로 이동
            if (value && index < allInputs.length - 1) {
                allInputs[index + 1].focus();
            }

            errorEl.classList.add('hidden');
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                if (index > 0) {
                    allInputs[index - 1].focus();
                }
            }
            if (e.key === 'Enter') {
                confirmBtn.click();
            }
        });

        input.addEventListener('focus', () => input.select());
    });

    // 확인 버튼
    confirmBtn.addEventListener('click', () => {
        const student = store.getCurrentStudent();
        if (!student) return;

        // PIN 값 가져오기
        const currentPin = getPinValue('current');
        const newPin = getPinValue('new');
        const confirmPin = getPinValue('confirm');

        // 유효성 검사
        if (currentPin.length !== 4) {
            showChangePinError('현재 PIN을 입력해주세요');
            return;
        }

        if (newPin.length !== 4) {
            showChangePinError('새 PIN을 입력해주세요');
            return;
        }

        if (confirmPin.length !== 4) {
            showChangePinError('새 PIN 확인을 입력해주세요');
            return;
        }

        // 현재 PIN 확인
        if (!store.verifyStudentPin(student.id, currentPin)) {
            showChangePinError('현재 PIN이 틀렸어요');
            clearPinGroup('current');
            return;
        }

        // 새 PIN 일치 확인
        if (newPin !== confirmPin) {
            showChangePinError('새 PIN이 일치하지 않아요');
            clearPinGroup('confirm');
            return;
        }

        // 같은 PIN인지 확인
        if (currentPin === newPin) {
            showChangePinError('현재와 다른 PIN을 입력해주세요');
            return;
        }

        // PIN 변경
        const result = store.updateStudentPin(student.id, newPin);
        if (result) {
            modal.classList.add('hidden');
            showToast('PIN이 변경되었어요! 🔐', 'success');
        } else {
            showChangePinError('PIN 변경에 실패했어요');
        }
    });
}

/**
 * PIN 그룹 값 가져오기
 */
function getPinValue(group) {
    const inputs = document.querySelectorAll(`[data-group="${group}"]`);
    return Array.from(inputs).map(input => input.value).join('');
}

/**
 * PIN 그룹 초기화
 */
function clearPinGroup(group) {
    const inputs = document.querySelectorAll(`[data-group="${group}"]`);
    inputs.forEach(input => input.value = '');
    if (inputs[0]) inputs[0].focus();
}

/**
 * PIN 변경 에러 표시
 */
function showChangePinError(message) {
    const errorEl = document.getElementById('changePinError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

/**
 * 펫 미리 반응 (감정 선택 시)
 */
function previewPetReaction(emotion) {
    const petEmoji = document.getElementById('petEmoji');
    if (!petEmoji) return;

    // 기존 애니메이션 제거
    petEmoji.classList.remove('pet-pulse', 'pet-wiggle');

    // 간단한 흔들림
    petEmoji.classList.add('pet-wiggle');
    setTimeout(() => {
        petEmoji.classList.remove('pet-wiggle');
        petEmoji.classList.add('pet-pulse');
    }, 300);
}

/**
 * 펫 반응 보여주기 (전송 시)
 */
function showPetReaction(emotion) {
    const reaction = PET_REACTIONS[emotion];
    if (!reaction) return;

    const petEmoji = document.getElementById('petEmoji');
    const reactionEmoji = document.getElementById('reactionEmoji');
    const petMessage = document.getElementById('petMessage');
    const petBubble = document.getElementById('petSpeechBubble');

    // 펫 애니메이션
    if (petEmoji) {
        petEmoji.classList.remove('pet-pulse');
        petEmoji.classList.add(reaction.animation);
    }

    // 반응 이모지 표시
    if (reactionEmoji) {
        reactionEmoji.textContent = reaction.emoji;
        reactionEmoji.classList.remove('opacity-0');
        reactionEmoji.classList.add('opacity-100', 'animate-bounce');
    }

    // 말풍선 메시지 변경
    if (petMessage) {
        petMessage.innerHTML = reaction.message;
    }

    // 말풍선 강조
    if (petBubble) {
        petBubble.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
    }

    // 토스트 메시지
    showToast('펫에게 기분을 전달했어요! 💕', 'success');

    // 2초 후 화면 새로고침
    setTimeout(() => {
        router.handleRoute();
    }, 2500);
}

/**
 * 새 펫 선택 모달 표시 (레벨 15 달성 후)
 */
function showNewPetSelectionModal() {
    const student = store.getCurrentStudent();
    if (!student) return;

    const completedPets = student.completedPets || [];
    const currentPetType = student.petType;

    // 선택 가능한 펫 목록 (이미 완성한 펫, 현재 펫 제외)
    const availablePets = Object.entries(PET_TYPES).filter(([key, pet]) => {
        const isCompleted = completedPets.some(p => p.type === key);
        const isCurrent = key === currentPetType;
        return !isCompleted && !isCurrent;
    });

    // 모달 내용
    const modalContent = document.createElement('div');
    modalContent.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modalContent.id = 'newPetSelectionModal';

    modalContent.innerHTML = `
        <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] overflow-y-auto">
            <div class="text-center mb-6">
                <div class="text-4xl mb-2">🐣✨</div>
                <h3 class="text-lg font-bold text-gray-800">새 펫 선택</h3>
                <p class="text-sm text-gray-500 mt-1">
                    ${student.petName || PET_TYPES[currentPetType]?.name}(이)가 도감에 완성으로 등록돼요!
                </p>
            </div>

            ${availablePets.length > 0 ? `
                <div class="grid grid-cols-3 gap-3 mb-6">
                    ${availablePets.map(([key, pet]) => `
                        <button class="new-pet-option p-3 rounded-xl border-2 border-gray-200 hover:border-primary transition-all text-center"
                                data-pet-type="${key}">
                            <span class="text-3xl block">${pet.stages.egg}</span>
                            <span class="text-xs text-gray-600 mt-1 block">${pet.name}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- 펫 이름 입력 -->
                <div class="mb-4 hidden" id="newPetNameSection">
                    <label class="text-sm font-medium text-gray-700 mb-2 block">새 펫 이름</label>
                    <input type="text" id="newPetNameInput" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0"
                           placeholder="펫 이름을 지어주세요">
                </div>

                <button id="confirmNewPetBtn" class="btn btn-primary w-full py-3 opacity-50 cursor-not-allowed" disabled>
                    선택하기
                </button>
            ` : `
                <div class="text-center py-8">
                    <div class="text-4xl mb-3">🎊</div>
                    <p class="text-gray-600">와! 모든 펫을 완성했어요!</p>
                    <p class="text-sm text-gray-400 mt-1">대단해요! 👑</p>
                </div>
            `}

            <button id="cancelNewPetBtn" class="mt-3 w-full py-2 text-gray-500 text-sm hover:text-gray-700">
                나중에 선택하기
            </button>
        </div>
    `;

    document.body.appendChild(modalContent);

    // 이벤트 바인딩
    let selectedPetType = null;

    // 펫 선택
    modalContent.querySelectorAll('.new-pet-option').forEach(btn => {
        btn.addEventListener('click', () => {
            modalContent.querySelectorAll('.new-pet-option').forEach(b => {
                b.classList.remove('border-primary', 'bg-primary/10');
                b.classList.add('border-gray-200');
            });
            btn.classList.remove('border-gray-200');
            btn.classList.add('border-primary', 'bg-primary/10');
            selectedPetType = btn.dataset.petType;

            // 이름 입력 섹션 표시
            const nameSection = document.getElementById('newPetNameSection');
            if (nameSection) nameSection.classList.remove('hidden');

            // 확인 버튼 활성화
            const confirmBtn = document.getElementById('confirmNewPetBtn');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });
    });

    // 확인 버튼
    const confirmBtn = document.getElementById('confirmNewPetBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (!selectedPetType) return;

            const newPetName = document.getElementById('newPetNameInput')?.value.trim() || '';

            // 기존 펫 완성 처리 & 새 펫 선택
            const result = store.completeAndChangePet(student.id, selectedPetType, newPetName);

            if (result) {
                document.body.removeChild(modalContent);
                showToast(`새로운 ${PET_TYPES[selectedPetType].name}(이)가 태어났어요! 🐣`, 'success');
                router.handleRoute(); // 화면 새로고침
            }
        });
    }

    // 취소 버튼
    const cancelBtn = document.getElementById('cancelNewPetBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modalContent);
        });
    }

    // 배경 클릭 시 닫기
    modalContent.addEventListener('click', (e) => {
        if (e.target === modalContent) {
            document.body.removeChild(modalContent);
        }
    });
}
