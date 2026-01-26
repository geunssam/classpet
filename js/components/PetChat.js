/**
 * 펫과의 대화 기록 컴포넌트
 * 학생이 펫에게 전달한 감정 히스토리
 */

import { store, PET_TYPES, EMOTION_TYPES, PET_REACTIONS } from '../store.js';
import { router } from '../router.js';
import { getPetEmoji, getGrowthStage } from '../utils/petLogic.js';

/**
 * 렌더링
 */
export function render() {
    // 로그인 확인
    if (!store.isStudentLoggedIn()) {
        setTimeout(() => router.navigate('student-login'), 0);
        return '<div class="text-center p-8">로그인이 필요합니다...</div>';
    }

    const student = store.getCurrentStudent();
    if (!student) {
        store.studentLogout();
        setTimeout(() => router.navigate('student-login'), 0);
        return '<div class="text-center p-8">학생 정보를 찾을 수 없습니다...</div>';
    }

    // 학생의 감정 기록 가져오기 (최근 30개)
    const emotions = store.getEmotionsByStudent(student.id).slice(0, 30);
    const petType = PET_TYPES[student.petType];
    const petStage = getGrowthStage(student.level);
    const petEmoji = petType?.stages[petStage] || '🐾';

    return `
        <div class="pet-chat-container pb-8">
            <!-- 헤더 -->
            <div class="flex items-center justify-between mb-6">
                <button id="backToMainBtn" class="liquid-btn-student-sm">
                    <span>←</span>
                    <span>돌아가기</span>
                </button>
                <h2 class="text-lg font-bold text-gray-800">펫과의 대화</h2>
                <div class="w-24"></div>
            </div>

            <!-- 펫 미니 프로필 -->
            <div class="flex items-center gap-3 bg-cream rounded-2xl p-3 mb-6">
                <span class="text-4xl">${petEmoji}</span>
                <div>
                    <p class="font-bold text-gray-800">${petType?.name || '펫'}</p>
                    <p class="text-sm text-gray-500">${student.name}의 친구</p>
                </div>
            </div>

            <!-- 대화 기록 -->
            ${emotions.length > 0 ? `
                <div class="space-y-4">
                    ${emotions.map(emotion => renderChatItem(emotion, student, petEmoji)).join('')}
                </div>
            ` : `
                <div class="text-center py-12 text-gray-500">
                    <div class="text-5xl mb-4">💬</div>
                    <p>아직 펫과 나눈 이야기가 없어요</p>
                    <p class="text-sm mt-2">오늘의 기분을 펫에게 알려주세요!</p>
                    <button id="goToChatBtn" class="liquid-btn-student mt-4">
                        기분 알려주기
                    </button>
                </div>
            `}
        </div>
    `;
}

/**
 * 대화 아이템 렌더링
 */
function renderChatItem(emotion, student, petEmoji) {
    const emotionType = EMOTION_TYPES[emotion.emotion];
    const reaction = PET_REACTIONS[emotion.emotion];
    const date = new Date(emotion.timestamp);
    const dateStr = formatDate(date);

    return `
        <div class="chat-item">
            <!-- 날짜 구분선 -->
            <div class="text-center text-xs text-gray-400 mb-3">${dateStr}</div>

            <!-- 학생 말풍선 (오른쪽) -->
            <div class="flex justify-end mb-2">
                <div class="student-bubble bg-primary text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]">
                    <div class="flex items-center gap-2">
                        <span class="text-xl">${emotionType?.icon || '😊'}</span>
                        <span>${emotionType?.name || '기분'}</span>
                    </div>
                    ${emotion.memo ? `
                        <p class="text-sm mt-1 opacity-90">${emotion.memo}</p>
                    ` : ''}
                </div>
            </div>

            <!-- 펫 말풍선 (왼쪽) -->
            <div class="flex items-start gap-2">
                <span class="text-2xl">${petEmoji}</span>
                <div class="pet-bubble bg-gray-100 text-gray-700 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[80%]">
                    <p>${reaction?.message || '알겠어!'}</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * 날짜 포맷
 */
function formatDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) {
        return '오늘';
    } else if (isSameDay(date, yesterday)) {
        return '어제';
    } else {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}월 ${day}일`;
    }
}

/**
 * 같은 날짜인지 확인
 */
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // 돌아가기 버튼
    const backBtn = document.getElementById('backToMainBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            router.navigate('student-main');
        });
    }

    // 기분 알려주기 버튼
    const goToChatBtn = document.getElementById('goToChatBtn');
    if (goToChatBtn) {
        goToChatBtn.addEventListener('click', () => {
            router.navigate('student-main');
        });
    }
}
