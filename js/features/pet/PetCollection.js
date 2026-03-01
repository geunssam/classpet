/**
 * 펫 도감 컴포넌트
 * 학생이 소유한 펫 컬렉션을 표시
 */

import { store, PET_TYPES } from '../../store.js';
import { router } from '../../router.js';
import { showToast } from '../../shared/utils/animations.js';
import { getPetStageImageHTML, getGrowthStage, GROWTH_STAGES } from '../../shared/utils/petLogic.js';
import { getPetVideo } from '../../shared/utils/petAnimations.js';

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
            <div class="mb-6 px-4">
                <h2 class="text-xl font-bold text-gray-800 flex items-center gap-1.5"><svg class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> 펫 도감</h2>
            </div>

            <!-- 완성 현황 -->
            <div class="px-4 mb-6">
                <div class="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 text-center">
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <svg class="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
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
                <div class="grid grid-cols-4 gap-2" id="petGrid">
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
                    <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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
            // 미소유: 흑백 처리 (자물쇠 제거, 클릭하면 성장 과정 볼 수 있음)
            cardClass += ' pet-collection-locked';
            break;
    }

    return `
        <div class="${cardClass} ${borderClass} bg-white rounded-xl p-2 relative transition-all duration-300"
             data-pet="${petKey}" data-status="${status}">
            <div class="text-center flex flex-col items-center">
                ${getPetStageImageHTML(petKey, 'child', 'md')}
                <p class="text-xs mt-1 font-medium text-gray-700 leading-tight">${name}</p>
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
 * 펫 상세 정보 모달 표시
 */
export function showPetDetail(petKey, status) {
    const pet = PET_TYPES[petKey];
    if (!pet) return;

    const student = store.getCurrentStudent();
    const completedPet = student?.completedPets?.find(p => p.type === petKey);
    const isCurrentPet = student?.petType === petKey;
    const currentStage = isCurrentPet ? getGrowthStage(student.level) : null;

    // 잠금 판별용 studentLevel 계산
    let studentLevel;
    if (status === 'completed') {
        studentLevel = 15; // 완성 → 모든 단계 해제
    } else if (status === 'current') {
        studentLevel = student?.level || 1;
    } else {
        studentLevel = 0; // 미소유 → 모든 단계 잠금
    }

    let statusText = '';
    let statusClass = '';
    let badgeHtml = '';

    switch (status) {
        case 'completed':
            statusText = `완성! ${completedPet?.completedAt ? `(${completedPet.completedAt})` : ''}`;
            statusClass = 'text-amber-600 bg-amber-50';
            badgeHtml = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 완성</span>`;
            break;
        case 'current':
            statusText = `키우는 중 (Lv.${student.level || 1})`;
            statusClass = 'text-blue-600 bg-blue-50';
            badgeHtml = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">키우는 중</span>`;
            break;
        case 'locked':
            statusText = '아직 만나지 못한 펫';
            statusClass = 'text-gray-500 bg-gray-50';
            badgeHtml = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">미소유</span>`;
            break;
    }

    const modal = document.createElement('div');
    modal.id = 'petDetailModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center px-6';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm pet-detail-backdrop" style="animation: fadeIn 0.2s ease"></div>
        <div class="relative bg-white w-full max-w-sm rounded-2xl p-5 pb-5 shadow-xl" style="animation: scaleIn 0.25s ease; max-width: 380px;">
            <!-- 펫 이름 + 닫기 -->
            <div class="flex items-center justify-between mb-4">
                <div class="w-8"></div>
                <div class="text-center">
                    <h3 class="text-lg font-bold text-gray-800">${pet.name}</h3>
                    <div class="mt-1">${badgeHtml}</div>
                </div>
                <button id="closePetDetail" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            <!-- 성장 과정 -->
            <div class="bg-gray-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 text-center mb-3">성장 과정 <span class="text-gray-300">(터치하면 확대)</span></p>
                <div class="grid grid-cols-4 gap-1">
                    ${renderStageThumbnail(petKey, 'baby', '아기', currentStage, studentLevel)}
                    ${renderStageThumbnail(petKey, 'child', '어린이', currentStage, studentLevel)}
                    ${renderStageThumbnail(petKey, 'teen', '청소년', currentStage, studentLevel)}
                    ${renderStageThumbnail(petKey, 'adult', '성체', currentStage, studentLevel)}
                </div>
            </div>

            <!-- 상태 메시지 -->
            <p class="text-center text-sm ${statusClass} rounded-lg py-2 mt-3">${statusText}</p>
        </div>
    `;

    document.body.appendChild(modal);

    // 닫기 이벤트
    const close = () => {
        modal.querySelector('.pet-detail-backdrop').style.animation = 'fadeOut 0.15s ease forwards';
        modal.querySelector('.relative').style.animation = 'scaleOut 0.15s ease forwards';
        setTimeout(() => modal.remove(), 150);
    };
    modal.querySelector('#closePetDetail').addEventListener('click', close);
    modal.querySelector('.pet-detail-backdrop').addEventListener('click', close);

    // 성장 단계 이미지 클릭 → 확대 (잠금 체크)
    modal.querySelectorAll('.pet-stage-thumb').forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            e.stopPropagation();
            if (thumb.dataset.locked === 'true') {
                const minLv = thumb.dataset.minLevel;
                showToast(`레벨 ${minLv}에 도달하면 볼 수 있어요!`, 'info');
                return;
            }
            const stage = thumb.dataset.stage;
            const petK = thumb.dataset.pet;
            showZoomedImage(petK, stage);
        });
    });
}

/**
 * 성장 단계 썸네일 (잠금 판별 + 영상 재생 제어)
 */
function renderStageThumbnail(petKey, stage, label, currentStage, studentLevel) {
    const levelRanges = { baby: 'Lv.1', child: 'Lv.2~4', teen: 'Lv.5~9', adult: 'Lv.10~15' };
    const isCurrentStage = currentStage === stage;
    const isLocked = studentLevel < GROWTH_STAGES[stage].minLevel;
    const borderStyle = isCurrentStage
        ? 'border: 2px solid #60A5FA; background: #EFF6FF; border-radius: 12px;'
        : 'border: 2px solid transparent;';

    const lockIcon = `<div class="pet-stage-lock-icon"><svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>`;

    return `
        <div class="text-center pet-stage-thumb ${isLocked ? 'pet-stage-locked' : 'cursor-pointer'}" style="padding: 6px; ${borderStyle}" data-pet="${petKey}" data-stage="${stage}" data-locked="${isLocked}" data-min-level="${GROWTH_STAGES[stage].minLevel}">
            <div style="position: relative; display: inline-block;">
                ${getPetStageImageHTML(petKey, stage, 'md')}
                ${isLocked ? lockIcon : ''}
            </div>
            <p style="font-size: 11px; color: ${isLocked ? '#D1D5DB' : '#6B7280'}; margin-top: 4px;">${label}</p>
            <p style="font-size: 10px; margin-top: 2px; font-weight: ${isCurrentStage ? '700' : '500'}; color: ${isCurrentStage ? '#3B82F6' : isLocked ? '#D1D5DB' : '#9CA3AF'};">${levelRanges[stage]}</p>
        </div>
    `;
}

/**
 * 펫 이미지/영상 확대 오버레이
 */
function showZoomedImage(petKey, stage) {
    const pet = PET_TYPES[petKey];
    if (!pet) return;

    const stageNames = { baby: '아기', child: '어린이', teen: '청소년', adult: '성체' };
    const videoSrc = getPetVideo(petKey, stage);

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 flex items-center justify-center';
    overlay.style.zIndex = '60';

    const contentHtml = videoSrc
        ? `<video src="${videoSrc}" autoplay playsinline loop
                style="width: 200px; height: 200px; object-fit: cover; border-radius: 24px; box-shadow: 0 6px 24px rgba(0,0,0,0.3);"></video>`
        : getPetStageImageHTML(petKey, stage, '2xl');

    overlay.innerHTML = `
        <div class="absolute inset-0 bg-black/60 pet-zoom-backdrop" style="animation: fadeIn 0.15s ease"></div>
        <div class="relative flex flex-col items-center" style="animation: scaleIn 0.2s ease">
            ${contentHtml}
            <p class="mt-3 text-white text-sm font-medium">${pet.name} · ${stageNames[stage]}</p>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeZoom = () => {
        // 영상이면 정지
        const video = overlay.querySelector('video');
        if (video) video.pause();
        overlay.querySelector('.pet-zoom-backdrop').style.animation = 'fadeOut 0.15s ease forwards';
        overlay.querySelector('.relative').style.animation = 'scaleOut 0.15s ease forwards';
        setTimeout(() => overlay.remove(), 150);
    };
    overlay.addEventListener('click', closeZoom);
}
