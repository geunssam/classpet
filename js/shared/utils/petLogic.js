/**
 * 펫 로직 유틸리티
 * 레벨업, 경험치 계산, 성장 단계 등
 */

import { PET_TYPES } from '../../store.js';

// 레벨별 필요 경험치 (누적) - 최대 레벨 15
const LEVEL_EXP_TABLE = [
    0,      // 레벨 1
    50,     // 레벨 2
    120,    // 레벨 3
    200,    // 레벨 4
    300,    // 레벨 5
    420,    // 레벨 6
    560,    // 레벨 7
    720,    // 레벨 8
    900,    // 레벨 9
    1100,   // 레벨 10
    1320,   // 레벨 11
    1560,   // 레벨 12
    1820,   // 레벨 13
    2100,   // 레벨 14
    2400,   // 레벨 15 (최대)
];

// 성장 단계 기준 레벨
const GROWTH_STAGES = {
    egg: { minLevel: 1, maxLevel: 1 },
    baby: { minLevel: 2, maxLevel: 4 },
    growing: { minLevel: 5, maxLevel: 9 },
    adult: { minLevel: 10, maxLevel: 15 }
};

/**
 * 경험치로 레벨 계산
 */
export function calculateLevel(exp) {
    for (let i = LEVEL_EXP_TABLE.length - 1; i >= 0; i--) {
        if (exp >= LEVEL_EXP_TABLE[i]) {
            return i + 1;
        }
    }
    return 1;
}

/**
 * 현재 레벨에서 다음 레벨까지 필요한 경험치
 */
export function getExpForNextLevel(level) {
    if (level >= LEVEL_EXP_TABLE.length) {
        return 0; // 최대 레벨
    }
    return LEVEL_EXP_TABLE[level] - LEVEL_EXP_TABLE[level - 1];
}

/**
 * 현재 레벨에서 획득한 경험치 (현재 레벨 기준)
 */
export function getCurrentLevelExp(exp, level) {
    const baseExp = LEVEL_EXP_TABLE[level - 1] || 0;
    return exp - baseExp;
}

/**
 * 경험치 진행률 (퍼센트)
 */
export function getExpProgress(exp, level) {
    const currentExp = getCurrentLevelExp(exp, level);
    const neededExp = getExpForNextLevel(level);

    if (neededExp === 0) return 100;
    return Math.min(100, Math.round((currentExp / neededExp) * 100));
}

/**
 * 성장 단계 계산
 */
export function getGrowthStage(level) {
    if (level <= GROWTH_STAGES.egg.maxLevel) return 'egg';
    if (level <= GROWTH_STAGES.baby.maxLevel) return 'baby';
    if (level <= GROWTH_STAGES.growing.maxLevel) return 'growing';
    return 'adult';
}

/**
 * 펫 이모지 가져오기
 */
export function getPetEmoji(petType, level) {
    const pet = PET_TYPES[petType];
    if (!pet) return '🥚';

    const stage = getGrowthStage(level);
    return pet.stages[stage] || '🥚';
}

/**
 * 펫 이미지 경로 가져오기 (없으면 null)
 */
export function getPetImage(petType, level) {
    const pet = PET_TYPES[petType];
    if (!pet?.images) return null;
    const stage = getGrowthStage(level);
    return pet.images[stage] || null;
}

/**
 * 펫 이미지 경로 (특정 단계)
 */
export function getPetStageImage(petType, stage) {
    const pet = PET_TYPES[petType];
    if (!pet?.images) return null;
    return pet.images[stage] || null;
}

/**
 * 펫 이미지 HTML 반환 (이미지 있으면 <img>, 없으면 이모지 <span>)
 * @param {string} petType - 펫 종류
 * @param {number} level - 현재 레벨
 * @param {string} size - 크기: 'xs'(20px), 'sm'(28px), 'md'(40px), 'lg'(64px), 'xl'(96px), '2xl'(120px)
 */
export function getPetImageHTML(petType, level, size = 'md') {
    const imagePath = getPetImage(petType, level);
    if (imagePath) {
        return `<img src="${imagePath}" alt="" class="pet-img pet-img-${size}" draggable="false">`;
    }
    return `<span class="pet-emoji-text pet-emoji-${size}">${getPetEmoji(petType, level)}</span>`;
}

/**
 * 특정 단계의 펫 이미지 HTML (펫 선택, 도감 등에서 사용)
 */
export function getPetStageImageHTML(petType, stage, size = 'md') {
    const pet = PET_TYPES[petType];
    if (!pet) return '<span>🥚</span>';
    const imagePath = pet.images?.[stage];
    if (imagePath) {
        return `<img src="${imagePath}" alt="" class="pet-img pet-img-${size}" draggable="false">`;
    }
    return `<span class="pet-emoji-text pet-emoji-${size}">${pet.stages[stage] || '🥚'}</span>`;
}

/**
 * 펫 이름 가져오기
 */
export function getPetName(petType) {
    const pet = PET_TYPES[petType];
    return pet ? pet.name : '알 수 없음';
}

/**
 * 레벨업 시 효과 텍스트
 */
export function getLevelUpMessage(level) {
    const messages = {
        2: '알에서 깨어났어요! 🐣',
        5: '무럭무럭 자라고 있어요! 🌱',
        10: '다 자랐어요! 축하해요! 🎉',
        15: '최고 레벨 달성! 마스터! 👑'
    };

    if (messages[level]) return messages[level];
    return `레벨 ${level} 달성! 👏`;
}

/**
 * 펫 상태 텍스트
 */
export function getPetStatusText(level, exp) {
    const stage = getGrowthStage(level);
    const progress = getExpProgress(exp, level);

    const statusTexts = {
        egg: ['따뜻하게 품어주세요 🥚', '곧 깨어날 것 같아요 ✨'],
        baby: ['아장아장 걷고 있어요 🐾', '귀여운 아기 펫이에요 💕', '먹이를 주세요! 🍼'],
        growing: ['쑥쑥 자라고 있어요 🌿', '활발하게 움직여요 💫', '칭찬을 좋아해요 ⭐'],
        adult: ['든든한 친구가 되었어요 🏆', '최고의 파트너예요 👑', '빛나는 모습이에요 ✨']
    };

    const texts = statusTexts[stage];
    const randomIndex = Math.floor(Math.random() * texts.length);
    return texts[randomIndex];
}

/**
 * 칭찬 시 획득 경험치 계산 (보너스 포함)
 */
export function calculatePraiseExp(baseExp, student, category, consecutiveDays = 1) {
    let totalExp = baseExp;

    // 연속 칭찬 보너스 (최대 50%)
    const streakBonus = Math.min(0.5, (consecutiveDays - 1) * 0.1);
    totalExp += Math.round(baseExp * streakBonus);

    // 균형 보너스: 다양한 카테고리 칭찬 시 (최대 20%)
    // 실제 구현에서는 student의 카테고리별 칭찬 기록 확인 필요

    return totalExp;
}

/**
 * 랭크 계산 (학급 내 순위)
 */
export function calculateRank(students, studentId) {
    const sorted = [...students].sort((a, b) => {
        // 1차: 레벨
        if (b.level !== a.level) return b.level - a.level;
        // 2차: 경험치
        return b.exp - a.exp;
    });

    const rank = sorted.findIndex(s => s.id === studentId) + 1;
    return rank;
}

/**
 * 랭크 등급 (상위 퍼센트)
 */
export function getRankTier(rank, totalStudents) {
    const percentile = (rank / totalStudents) * 100;

    if (percentile <= 10) return { tier: 'S', color: '#F5A67C', label: '최상위' };
    if (percentile <= 25) return { tier: 'A', color: '#7C9EF5', label: '상위' };
    if (percentile <= 50) return { tier: 'B', color: '#7CE0A3', label: '중상위' };
    if (percentile <= 75) return { tier: 'C', color: '#F5E07C', label: '중위' };
    return { tier: 'D', color: '#9CA3AF', label: '성장 중' };
}

/**
 * 다음 성장 단계까지 남은 레벨
 */
export function getLevelsToNextStage(level) {
    const stage = getGrowthStage(level);

    switch (stage) {
        case 'egg': return 2 - level;
        case 'baby': return 5 - level;
        case 'growing': return 10 - level;
        case 'adult': return 0;
        default: return 0;
    }
}

/**
 * 펫 CSS 클래스 (크기 및 애니메이션)
 */
export function getPetSizeClass(level) {
    const stage = getGrowthStage(level);
    return `level-${stage}`;
}

/**
 * 레벨에 따른 글로우 효과 색상
 */
export function getGlowColor(level) {
    if (level >= 15) return 'rgba(245, 166, 124, 0.6)'; // 골드
    if (level >= 10) return 'rgba(124, 158, 245, 0.5)'; // 블루
    if (level >= 5) return 'rgba(124, 224, 163, 0.4)'; // 그린
    return 'transparent';
}

/**
 * 최대 레벨 여부
 */
export function isMaxLevel(level) {
    return level >= LEVEL_EXP_TABLE.length;
}

/**
 * 전체 레벨 테이블 내보내기
 */
export function getLevelTable() {
    return LEVEL_EXP_TABLE.map((exp, index) => ({
        level: index + 1,
        requiredExp: exp,
        stage: getGrowthStage(index + 1)
    }));
}

export {
    LEVEL_EXP_TABLE,
    GROWTH_STAGES
};
