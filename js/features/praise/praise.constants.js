/**
 * 칭찬 카테고리 상수
 */

export const PRAISE_CATEGORIES = {
    selfManagement: { icon: '🎯', name: '자기관리', exp: 10, color: '#fbbf24' },
    knowledge: { icon: '📚', name: '지식정보', exp: 10, color: '#60a5fa' },
    creative: { icon: '💡', name: '창의적사고', exp: 10, color: '#a78bfa' },
    aesthetic: { icon: '🎨', name: '심미적감성', exp: 10, color: '#34d399' },
    cooperation: { icon: '🤝', name: '협력적소통', exp: 10, color: '#f87171' },
    community: { icon: '🏠', name: '공동체', exp: 10, color: '#fb923c' }
};

/** 컬러 팔레트 (카테고리 추가/편집 시 선택용, 8×2) */
export const PRAISE_COLOR_PALETTE = [
    '#fbbf24', '#60a5fa', '#a78bfa', '#34d399', '#f87171', '#fb923c', '#e879f9', '#38bdf8',
    '#facc15', '#2dd4bf', '#818cf8', '#c084fc', '#f472b6', '#4ade80', '#fb7185', '#f97316'
];
