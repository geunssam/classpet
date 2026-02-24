/**
 * 펫 도감 컴포넌트
 * 학생이 소유한 펫 컬렉션을 표시
 */

import { store, PET_TYPES } from '../../store.js';
import { router } from '../../router.js';
import { showToast } from '../../shared/utils/animations.js';

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

    // 펫 타입 목록
    const petTypes = Object.entries(PET_TYPES);
    const completedPets = student.completedPets || [];
    const completedCount = completedPets.length + (student.petType ? 1 : 0);

    // 펫 카드 생성
    const petCards = petTypes.map(([key, pet]) => {
        const isCurrentPet = student.petType === key;
        const completedPet = completedPets.find(p => p.type === key);
        const isCompleted = !!completedPet;
        const isOwned = isCurrentPet || isCompleted;

        // 상태 결정
        let status = 'locked'; // 미소유
        if (isCompleted) status = 'completed'; // 완성
        else if (isCurrentPet) status = 'current'; // 현재 키우는 중

        return renderPetCard(key, pet, status, student.level, completedPet);
    }).join('');

    return `
        <div class="pet-collection-container pb-8">
            <!-- 헤더 -->
            <div class="text-center mb-6 px-4">
                <h2 class="text-xl font-bold text-gray-800">📖 펫 도감</h2>
            </div>

            <!-- 완성 현황 -->
            <div class="px-4 mb-6">
                <div class="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 text-center">
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <span class="text-2xl">✨</span>
                        <span class="text-lg font-bold text-amber-700">완성한 펫</span>
                    </div>
                    <div class="text-3xl font-bold text-amber-600">
                        ${completedPets.length} <span class="text-lg font-normal text-amber-500">/ ${petTypes.length}</span>
                    </div>
                    <p class="text-sm text-amber-600 mt-1">레벨 15에 도달하면 펫이 완성돼요!</p>
                </div>
            </div>

            <!-- 펫 그리드 -->
            <div class="px-4">
                <div class="grid grid-cols-3 gap-3" id="petGrid">
                    ${petCards}
                </div>
            </div>

            <!-- 범례 -->
            <div class="mt-6 px-4">
                <div class="bg-gray-50 rounded-xl p-3">
                    <div class="flex justify-around text-xs text-gray-500">
                        <div class="flex items-center gap-1">
                            <span class="w-3 h-3 rounded-full bg-blue-400"></span>
                            <span>키우는 중</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 pet-collection-sparkle"></span>
                            <span>완성</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="w-3 h-3 rounded-full bg-gray-300"></span>
                            <span>미소유</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 펫 카드 렌더링
 */
function renderPetCard(petKey, pet, status, currentLevel, completedPet) {
    const emoji = pet.stages.baby; // 펫 선택 화면과 동일하게 baby 이모지 사용
    const name = pet.name;

    // 상태별 스타일
    let cardClass = 'pet-collection-card';
    let overlayContent = '';
    let borderClass = 'border-2 border-transparent';

    switch (status) {
        case 'completed':
            // 완성: 반짝이는 금색 테두리
            cardClass += ' pet-collection-completed';
            borderClass = 'border-3 border-amber-400 pet-collection-sparkle-border';
            overlayContent = `
                <div class="absolute -top-1 -right-1 bg-amber-400 rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                    <span class="text-white text-sm">👑</span>
                </div>
            `;
            break;
        case 'current':
            // 현재 키우는 중: 파란 테두리
            cardClass += ' pet-collection-current';
            borderClass = 'border-3 border-blue-400';
            overlayContent = `
                <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                    Lv.${currentLevel}
                </div>
            `;
            break;
        case 'locked':
            // 미소유: 흑백 + 자물쇠
            cardClass += ' pet-collection-locked';
            overlayContent = `
                <div class="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                    <span class="text-2xl opacity-60">🔒</span>
                </div>
            `;
            break;
    }

    return `
        <div class="${cardClass} ${borderClass} bg-white rounded-xl p-3 relative transition-all duration-300"
             data-pet="${petKey}" data-status="${status}">
            <div class="text-center">
                <span class="text-4xl inline-block ${status === 'locked' ? 'grayscale opacity-50' : ''}">${emoji}</span>
                <p class="text-xs mt-1 font-medium ${status === 'locked' ? 'text-gray-400' : 'text-gray-700'}">${name}</p>
            </div>
            ${overlayContent}
        </div>
    `;
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // 펫 카드 클릭 (상세 정보 표시)
    const petCards = document.querySelectorAll('.pet-collection-card');
    petCards.forEach(card => {
        card.addEventListener('click', () => {
            const petKey = card.dataset.pet;
            const status = card.dataset.status;
            showPetDetail(petKey, status);
        });
    });
}

/**
 * 펫 상세 정보 표시
 */
function showPetDetail(petKey, status) {
    const pet = PET_TYPES[petKey];
    if (!pet) return;

    const student = store.getCurrentStudent();
    const completedPet = student?.completedPets?.find(p => p.type === petKey);

    let statusText = '';
    let statusClass = '';

    switch (status) {
        case 'completed':
            statusText = `✨ 완성! (${completedPet?.completedAt || ''})`;
            statusClass = 'text-amber-600 bg-amber-50';
            break;
        case 'current':
            statusText = `🐾 키우는 중 (Lv.${student.level || 1})`;
            statusClass = 'text-blue-600 bg-blue-50';
            break;
        case 'locked':
            statusText = '🔒 아직 만나지 못한 펫이에요';
            statusClass = 'text-gray-500 bg-gray-50';
            break;
    }

    // 성장 단계 표시
    const stagesHtml = `
        <div class="flex justify-center gap-4 my-4">
            <div class="text-center">
                <span class="text-2xl">${pet.stages.egg}</span>
                <p class="text-xs text-gray-400">시작</p>
            </div>
            <span class="text-gray-300 self-center">→</span>
            <div class="text-center">
                <span class="text-2xl">${pet.stages.baby}</span>
                <p class="text-xs text-gray-400">아기</p>
            </div>
            <span class="text-gray-300 self-center">→</span>
            <div class="text-center">
                <span class="text-2xl">${pet.stages.growing}</span>
                <p class="text-xs text-gray-400">성장</p>
            </div>
            <span class="text-gray-300 self-center">→</span>
            <div class="text-center">
                <span class="text-2xl">${pet.stages.adult}</span>
                <p class="text-xs text-gray-400">성체</p>
            </div>
        </div>
    `;

    showToast(`${pet.name}: ${statusText.split(' ')[0]}`, 'info');
}
