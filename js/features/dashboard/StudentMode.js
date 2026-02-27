/**
 * 학생 모드 메인 화면 컴포넌트
 * 내 펫과 대화하기 인터페이스
 */

import { store, PET_TYPES, EMOTION_TYPES, PET_REACTIONS, PET_SPEECH_STYLES, convertToPetSpeech } from '../../store.js';
import { router } from '../../router.js';
import { getPetEmoji, getPetImageHTML, getPetImage, getGrowthStage, getExpProgress, getCurrentLevelExp, getExpForNextLevel, isMaxLevel } from '../../shared/utils/petLogic.js';
import { showToast } from '../../shared/utils/animations.js';
import { getNameWithSuffix } from '../../shared/utils/nameUtils.js';
import { playPetClickAnimation } from '../../shared/utils/petAnimations.js';

let currentStudentTab = 'send'; // 'send' | 'history'

export function setStudentTab(tab) {
    currentStudentTab = tab;
}

export function setHistoryDate(date) {
    historyDate = date;
}

let historyDate = new Date();
let studentEmotionsUnsubscribe = null; // Firebase 실시간 구독 해제 함수
let studentPraiseUnsubscribe = null;   // 칭찬 실시간 구독
let studentPetUnsubscribe = null;      // 펫 경험치 실시간 구독
let lastEmotionsSnapshot = ''; // 데이터 변경 감지용
let lastPraiseCount = -1; // -1 = 초기 로드 전

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
    const petImageHTML = getPetImageHTML(student.petType, student.level, 'xl');
    const petName = student.petName || petType?.name || '펫';

    // 경험치 계산
    const expPercent = getExpProgress(student.exp, student.level);
    const currentExp = getCurrentLevelExp(student.exp, student.level);
    const neededExp = getExpForNextLevel(student.level);

    // 오늘 감정 기록 (복수)
    const todayEmotions = store.getStudentTodayEmotions(student.id);
    const hasEmotionsToday = todayEmotions.length > 0;

    return `
        <div class="student-mode-container pb-8">
            <!-- 펫 영역 (2열 그리드) -->
            <div class="pet-display-area px-4 py-6 mb-6">
                <div class="pet-grid">
                    <!-- 왼쪽: 펫 이모지 + 이름 -->
                    <div class="pet-left-column">
                        <div id="petEmojiContainer" class="relative">
                            <span id="petEmoji" class="pet-emoji-large inline-block pet-pulse">${petImageHTML}</span>
                            <span id="reactionEmoji" class="absolute -top-3 -right-3 text-2xl opacity-0 transition-all duration-500"></span>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800 mt-3">${petName}</h2>
                    </div>
                    
                    <!-- 오른쪽: 레벨+단계 (상단) + 경험치바 (하단) -->
                    <div class="pet-right-column">
                        <!-- 상단: 레벨 + 단계 -->
                        <div class="flex items-center gap-3 mb-4">
                            <span class="level-badge-lg">Lv.${student.level || 1}</span>
                            <span class="pet-stage-text">${petStage === 'adult' ? '성체' : (petStage === 'teen' ? '청소년' : (petStage === 'child' ? '어린이' : '아기'))}</span>
                        </div>
                        <!-- 하단: 경험치바 (% 내부 중앙) -->
                        <div class="exp-bar-xl">
                            <div class="exp-bar-fill-xl" style="width: ${Math.max(expPercent, 15)}%"></div>
                            <span class="exp-bar-percent">${expPercent}% ( ${currentExp} / ${neededExp} )</span>
                        </div>
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

            <!-- 탭 UI -->
            <div class="flex gap-2 mx-4 mb-6">
                <button id="tabSendEmotion" class="student-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${currentStudentTab === 'send' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600'}">
                    💝 마음 보내기
                </button>
                <button id="tabHistory" class="student-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${currentStudentTab === 'history' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600'}">
                    📜 기록 보기
                </button>
            </div>

            <!-- 마음 보내기 탭 -->
            <div id="sendEmotionContent" class="${currentStudentTab !== 'send' ? 'hidden' : ''}">
                <!-- 감정 선택 -->
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
                        class="w-full liquid-btn-student"
                        disabled
                    >
                        펫에게 말하기
                    </button>
                </div>
            </div>

            <!-- 기록 보기 탭 -->
            <div id="historyContent" class="${currentStudentTab !== 'history' ? 'hidden' : ''}">
                ${renderHistoryTab(student, petEmoji, petName, getPetImageHTML(student.petType, student.level, 'sm'))}
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
                            <button id="selectNewPetBtn" class="mt-4 liquid-btn-student-gold">
                                ✨ 새 펫 선택하기
                            </button>
                        </div>
                    </div>
                </div>
            ` : ''}

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
                <div class="modal-buttons">
                    <button id="cancelChangePinBtn" class="liquid-btn-student-secondary">
                        취소
                    </button>
                    <button id="confirmChangePinBtn" class="liquid-btn-student">
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

    // 탭 전환
    document.getElementById('tabSendEmotion')?.addEventListener('click', () => {
        currentStudentTab = 'send';
        router.handleRoute();
    });
    document.getElementById('tabHistory')?.addEventListener('click', () => {
        currentStudentTab = 'history';
        router.handleRoute();
    });

    // 기록 보기 날짜 네비게이션
    document.getElementById('historyPrevDay')?.addEventListener('click', () => {
        historyDate.setDate(historyDate.getDate() - 1);
        router.handleRoute();
    });
    document.getElementById('historyNextDay')?.addEventListener('click', () => {
        const tomorrow = new Date(historyDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow <= new Date()) {
            historyDate = tomorrow;
            router.handleRoute();
        }
    });

    // 로그아웃 버튼은 header.js에서 처리

    // 펫 이미지 클릭 애니메이션
    const petEmoji = document.getElementById('petEmoji');
    if (petEmoji) {
        petEmoji.style.cursor = 'pointer';
        petEmoji.addEventListener('click', () => {
            const currentStudent = store.getCurrentStudent();
            playPetClickAnimation(petEmoji, currentStudent?.petType, currentStudent?.level);
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

    // 감정/전송 이벤트 바인딩
    bindEmotionSendEvents();

    // PIN 변경 기능
    setupPinChangeModal();

    // Firebase 실시간 구독 (교사 답장 반영)
    setupStudentEmotionSubscription();

    // Firebase 실시간 구독 (칭찬 알림 + 경험치 반영)
    setupStudentPraiseSubscription();
    setupStudentPetSubscription();
}

/**
 * 감정 선택/전송 이벤트 바인딩
 */
function bindEmotionSendEvents() {
    const emotionButtons = document.querySelectorAll('.emotion-select-btn');
    const sendBtn = document.getElementById('sendEmotionBtn');
    const memoTextarea = document.getElementById('petMemo');
    let selectedEmotion = null;

    function updateSendButtonState() {
        const memoValue = memoTextarea?.value.trim() || '';
        const isValid = selectedEmotion && memoValue.length > 0;
        if (sendBtn) sendBtn.disabled = !isValid;
    }

    emotionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            emotionButtons.forEach(b => {
                b.classList.remove('selected', 'scale-110');
            });
            btn.classList.add('selected', 'scale-110');
            selectedEmotion = btn.dataset.emotion;
            updateSendButtonState();
            previewPetReaction(selectedEmotion);
        });
    });

    if (memoTextarea) {
        memoTextarea.addEventListener('input', updateSendButtonState);
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const memo = memoTextarea?.value.trim() || '';
            if (!selectedEmotion || !memo) return;

            const student = store.getCurrentStudent();
            if (!student) return;

            sendBtn.disabled = true;
            sendBtn.textContent = '전송 중...';

            try {
                await store.addEmotion({
                    studentId: student.id,
                    studentName: student.name,
                    studentNumber: student.number,
                    emotion: selectedEmotion,
                    memo: memo,
                    source: 'student'
                });
                store.createEmotionNotification(student.id, selectedEmotion, memo);
                const petResult = await store.addPetExp(student.id, 5);
                showPetReaction(selectedEmotion);

                let resultMessage = '펫에게 마음을 전달했어요! +5 EXP';
                if (petResult && petResult.levelUp) {
                    resultMessage = `🎉 레벨업! Lv.${petResult.newLevel} +5 EXP`;
                }
                sendBtn.textContent = resultMessage;
            } catch (error) {
                console.error('감정 저장 실패:', error);
                sendBtn.disabled = false;
                sendBtn.textContent = '다시 시도하기';
            }
        });
    }
}

/**
 * 학생 감정 Firebase 실시간 구독 설정
 * 교사가 답장하면 자동으로 로컬에 반영 + 화면 갱신
 */
function setupStudentEmotionSubscription() {
    // 기존 구독 해제
    if (studentEmotionsUnsubscribe) {
        studentEmotionsUnsubscribe();
        studentEmotionsUnsubscribe = null;
    }

    const student = store.getCurrentStudent();
    if (!student || !store.isFirebaseEnabled() || !store.getClassCode()) return;

    studentEmotionsUnsubscribe = store.subscribeToStudentEmotions(student.id, (emotions) => {
        // 데이터 변경 여부 체크 (불필요한 리렌더링 방지 → 플리커링 해결)
        const snapshot = JSON.stringify(emotions.map(e => ({
            id: e.firebaseId || e.id,
            convos: e.conversations,
            reply: e.reply
        })));
        if (snapshot === lastEmotionsSnapshot) return;
        lastEmotionsSnapshot = snapshot;

        console.log('학생 감정 실시간 업데이트:', emotions.length, '개');
        // 기록 보기 탭일 때만 해당 영역만 갱신
        if (currentStudentTab === 'history') {
            const historyContent = document.getElementById('historyContent');
            if (historyContent) {
                const student = store.getCurrentStudent();
                const petEmoji = getPetEmoji(student.petType, student.level);
                const petName = student.petName || PET_TYPES[student.petType]?.name || '펫';
                const petImageSm = getPetImageHTML(student.petType, student.level, 'sm');
                historyContent.innerHTML = renderHistoryTab(student, petEmoji, petName, petImageSm);
                // 날짜 네비게이션 이벤트만 재바인딩
                document.getElementById('historyPrevDay')?.addEventListener('click', () => {
                    historyDate.setDate(historyDate.getDate() - 1);
                    router.handleRoute();
                });
                document.getElementById('historyNextDay')?.addEventListener('click', () => {
                    const tomorrow = new Date(historyDate);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    if (tomorrow <= new Date()) {
                        historyDate = tomorrow;
                        router.handleRoute();
                    }
                });
            }
        }
    });
}

/**
 * 학생 칭찬 Firebase 실시간 구독
 * 교사가 칭찬을 보내면 알림 토스트 표시
 */
function setupStudentPraiseSubscription() {
    if (studentPraiseUnsubscribe) {
        studentPraiseUnsubscribe();
        studentPraiseUnsubscribe = null;
    }

    const student = store.getCurrentStudent();
    if (!student || !store.isFirebaseEnabled() || !store.getClassCode()) return;

    studentPraiseUnsubscribe = store.subscribeToStudentPraises(student.id, (praises) => {
        const currentCount = praises.length;

        // 초기 로드 후에만 알림 표시 (첫 구독 시에는 스킵)
        if (lastPraiseCount >= 0 && currentCount > lastPraiseCount) {
            const categories = store.getPraiseCategories();
            const latest = praises[0]; // 최신이 맨 앞
            if (latest) {
                const cat = categories[latest.category];
                const icon = cat?.icon || '⭐';
                const name = cat?.name || '칭찬';
                const exp = latest.expGain || cat?.exp || 10;
                showToast(`${icon} ${name} 칭찬을 받았어요! +${exp} EXP`, 'success');
            }
        }

        lastPraiseCount = currentCount;
    });
}

/**
 * 학생 펫 Firebase 실시간 구독
 * 경험치/레벨 변경 시 화면 자동 갱신
 */
function setupStudentPetSubscription() {
    if (studentPetUnsubscribe) {
        studentPetUnsubscribe();
        studentPetUnsubscribe = null;
    }

    const student = store.getCurrentStudent();
    if (!student || !store.isFirebaseEnabled() || !store.getClassCode()) return;

    studentPetUnsubscribe = store.subscribeToStudentPets(student.id, (pets) => {
        const activePet = pets.find(p => p.status === 'active');
        if (!activePet) return;

        const currentStudent = store.getCurrentStudent();
        if (!currentStudent) return;

        // exp/level이 변경된 경우에만 업데이트
        if (currentStudent.exp !== activePet.exp || currentStudent.level !== activePet.level) {
            store.updateStudent(currentStudent.id, {
                exp: activePet.exp || 0,
                level: activePet.level || 1
            });

            // 펫 디스플레이 영역만 부분 갱신
            refreshPetDisplay();
        }
    });
}

/**
 * 펫 디스플레이 영역 부분 갱신 (전체 리렌더링 없이)
 */
function refreshPetDisplay() {
    const student = store.getCurrentStudent();
    if (!student) return;

    const expPercent = getExpProgress(student.exp, student.level);
    const currentExp = getCurrentLevelExp(student.exp, student.level);
    const neededExp = getExpForNextLevel(student.level);
    const petStage = getGrowthStage(student.level);

    // 경험치바 업데이트
    const expFill = document.querySelector('.exp-bar-fill-xl');
    const expText = document.querySelector('.exp-bar-percent');
    if (expFill) expFill.style.width = `${Math.max(expPercent, 15)}%`;
    if (expText) expText.textContent = `${expPercent}% ( ${currentExp} / ${neededExp} )`;

    // 레벨 배지 업데이트
    const levelBadge = document.querySelector('.level-badge-lg');
    if (levelBadge) levelBadge.textContent = `Lv.${student.level || 1}`;

    // 성장 단계 텍스트 업데이트
    const stageText = document.querySelector('.pet-stage-text');
    if (stageText) stageText.textContent = petStage === 'adult' ? '성체' : (petStage === 'teen' ? '청소년' : (petStage === 'child' ? '어린이' : '아기'));

    // 펫 이미지/이모지 업데이트
    const petEmojiEl = document.getElementById('petEmoji');
    if (petEmojiEl) {
        petEmojiEl.innerHTML = getPetImageHTML(student.petType, student.level, 'xl');
    }
}

/**
 * 컴포넌트 언마운트 시 구독 해제
 */
export function unmount() {
    if (studentEmotionsUnsubscribe) {
        studentEmotionsUnsubscribe();
        studentEmotionsUnsubscribe = null;
    }
    if (studentPraiseUnsubscribe) {
        studentPraiseUnsubscribe();
        studentPraiseUnsubscribe = null;
    }
    if (studentPetUnsubscribe) {
        studentPetUnsubscribe();
        studentPetUnsubscribe = null;
    }
    lastPraiseCount = -1;
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
                            ${pet.images?.baby
                                ? `<img src="${pet.images.baby}" alt="" class="pet-img pet-img-md mx-auto" draggable="false">`
                                : `<span class="text-3xl block">${pet.stages.baby}</span>`
                            }
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

                <button id="confirmNewPetBtn" class="liquid-btn-student w-full" disabled>
                    선택하기
                </button>
            ` : `
                <div class="text-center py-8">
                    <div class="text-4xl mb-3">🎊</div>
                    <p class="text-gray-600">와! 모든 펫을 완성했어요!</p>
                    <p class="text-sm text-gray-400 mt-1">대단해요! 👑</p>
                </div>
            `}

            <button id="cancelNewPetBtn" class="mt-3 w-full liquid-btn-student-sm justify-center">
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

/**
 * 기록 보기 탭 렌더링 (카톡 스타일)
 */
function renderHistoryTab(student, petEmoji, petName, petImageSm) {
    // 로컬 시간대 기준 날짜 문자열 (UTC가 아닌 사용자 시간대)
    const month = historyDate.getMonth() + 1;
    const date = historyDate.getDate();
    const dateStr = `${historyDate.getFullYear()}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const day = days[historyDate.getDay()];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;

    // 해당 날짜 감정 기록 필터 (로컬 시간대 기준)
    const allEmotions = store.getEmotionsByStudent(student.id);
    const dayEmotions = allEmotions.filter(e => {
        // timestamp를 로컬 Date 객체로 변환 후 로컬 날짜 비교
        const d = e.timestamp?.toDate ? e.timestamp.toDate() : new Date(e.timestamp);
        const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return localDateStr === dateStr;
    }).sort((a, b) => {
        const tA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const tB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return tA - tB;
    });

    return `
        <div class="px-4">
            <!-- 날짜 네비게이션 -->
            <div class="flex items-center justify-center gap-4 mb-4">
                <button id="historyPrevDay" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <span class="text-base font-medium text-gray-800">${month}월 ${date}일 (${day})</span>
                <button id="historyNextDay" class="p-2 rounded-full hover:bg-gray-100 transition-colors ${isToday ? 'opacity-30 cursor-not-allowed' : ''}">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
            </div>

            <!-- 대화 내용 -->
            <div class="space-y-4 pb-4">
                ${dayEmotions.length > 0 ? dayEmotions.map(emotion => {
        const emotionIcon = EMOTION_TYPES[emotion.emotion]?.icon || '😊';
        const emotionName = EMOTION_TYPES[emotion.emotion]?.name || '';
        const convos = emotion.conversations || [];

        // conversations 배열 기반 렌더링
        if (convos.length > 0) {
            let isFirst = true;
            return convos.map(c => {
                let html = '';
                // 학생 메시지 (오른쪽)
                if (c.studentMessage) {
                    const time = new Date(c.studentAt || emotion.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                    const showTag = isFirst;
                    isFirst = false;
                    html += `
                                    <div class="flex justify-end gap-2">
                                        <div class="flex flex-col items-end">
                                            <div class="bg-primary/10 rounded-2xl rounded-tr-sm p-3 max-w-[75%]">
                                                ${showTag ? `<div class="flex items-center gap-1 mb-1">
                                                    <span class="text-lg">${emotionIcon}</span>
                                                    <span class="text-xs text-gray-500">${emotionName}</span>
                                                </div>` : ''}
                                                <p class="text-sm text-gray-700">${c.studentMessage}</p>
                                            </div>
                                            <span class="text-xs text-gray-400 mt-1">${time}</span>
                                        </div>
                                    </div>
                                `;
                }
                // 선생님 답장 (왼쪽)
                if (c.teacherReply) {
                    const replyTime = new Date(c.replyAt || emotion.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                    const petSpeech = convertToPetSpeech(c.teacherReply, student.petType, petName);
                    html += `
                                    <div class="flex justify-start gap-2">
                                        <span class="flex-shrink-0 mt-1">${petImageSm || petEmoji}</span>
                                        <div class="flex flex-col">
                                            <div class="bg-white rounded-2xl rounded-tl-sm p-3 max-w-[75%] shadow-sm border border-gray-100">
                                                <p class="text-sm text-gray-700">${petSpeech.petMessage}</p>
                                            </div>
                                            <span class="text-xs text-gray-400 mt-1">${replyTime}</span>
                                        </div>
                                    </div>
                                `;
                }
                return html;
            }).join('');
        }

        // 구 데이터 호환: conversations가 없는 경우
        const emotionTime = new Date(emotion.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        const hasReply = !!emotion.reply;
        const petSpeech = hasReply ? convertToPetSpeech(emotion.reply.message, student.petType, petName) : null;

        return `
                        <div class="flex justify-end gap-2">
                            <div class="flex flex-col items-end">
                                <div class="bg-primary/10 rounded-2xl rounded-tr-sm p-3 max-w-[75%]">
                                    <div class="flex items-center gap-1 mb-1">
                                        <span class="text-lg">${emotionIcon}</span>
                                        <span class="text-xs text-gray-500">${emotionName}</span>
                                    </div>
                                    ${(emotion.note || emotion.memo) ? `
                                        <p class="text-sm text-gray-700">${emotion.note || emotion.memo}</p>
                                    ` : ''}
                                </div>
                                <span class="text-xs text-gray-400 mt-1">${emotionTime}</span>
                            </div>
                        </div>
                        ${hasReply ? `
                            <div class="flex justify-start gap-2">
                                <span class="flex-shrink-0 mt-1">${petImageSm || petEmoji}</span>
                                <div class="flex flex-col">
                                    <div class="bg-white rounded-2xl rounded-tl-sm p-3 max-w-[75%] shadow-sm border border-gray-100">
                                        <p class="text-sm text-gray-700">${petSpeech.petMessage}</p>
                                    </div>
                                    <span class="text-xs text-gray-400 mt-1">${new Date(emotion.reply.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ` : ''}
                    `;
    }).join('') : `
                    <div class="text-center py-12">
                        <div class="text-4xl mb-3">📭</div>
                        <p class="text-gray-400">이 날은 기록이 없어요</p>
                    </div>
                `}
            </div>
        </div>
    `;
}
