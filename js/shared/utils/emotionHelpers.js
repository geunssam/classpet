/**
 * 감정 헬퍼 유틸리티
 * - 이미지 경로 생성
 * - 레거시 감정 키 매핑
 * - 감정 이미지 HTML 생성
 */

import { EMOTION_TYPES, EMOTION_CATEGORIES } from '../../features/emotion/emotions.constants.js';

// ===================== 레거시 키 매핑 =====================

/**
 * Firebase에 이미 저장된 기존 5종 감정 → 새 12종 매핑
 */
const LEGACY_MAP = {
    great: 'happy',
    good: 'relaxed',
    soso: 'neutral',
    bad: 'sad',
    terrible: 'lonely'
};

/**
 * 레거시 감정 키를 새 키로 변환
 * 이미 새 키이면 그대로 반환
 */
export function mapLegacyEmotion(emotionKey) {
    if (!emotionKey) return 'neutral';
    if (EMOTION_TYPES[emotionKey]) return emotionKey;
    return LEGACY_MAP[emotionKey] || 'neutral';
}

/**
 * 감정 키가 레거시인지 확인
 */
export function isLegacyEmotion(emotionKey) {
    return !!LEGACY_MAP[emotionKey];
}

// ===================== 이미지 경로 =====================

const EMOTION_ASSET_BASE = '/emotion-assets';

/**
 * 감정 이미지 경로 반환
 * @param {string} emotionKey - 감정 키 (happy, sad 등)
 * @returns {string} 이미지 경로
 */
export function getEmotionImagePath(emotionKey) {
    const key = mapLegacyEmotion(emotionKey);
    const info = EMOTION_TYPES[key];
    if (!info?.image) return '';
    return `${EMOTION_ASSET_BASE}/${info.image}`;
}

/**
 * 감정 이미지 HTML 생성 (img 태그)
 * @param {string} emotionKey - 감정 키
 * @param {string} size - 'xs'|'sm'|'md'|'lg'|'xl' (기본 'md')
 * @returns {string} HTML 문자열
 */
const EMOTION_IMG_SIZES = {
    xs: 20,
    sm: 28,
    md: 40,
    lg: 56,
    xl: 80
};

export function getEmotionImageHTML(emotionKey, size = 'md') {
    const key = mapLegacyEmotion(emotionKey);
    const info = EMOTION_TYPES[key];
    if (!info) return '';

    const px = EMOTION_IMG_SIZES[size] || EMOTION_IMG_SIZES.md;
    const path = getEmotionImagePath(key);

    if (path) {
        return `<img src="${path}" alt="${info.name}" class="emotion-img emotion-img-${size}" width="${px}" height="${px}" style="width:${px}px;height:${px}px;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'"><span style="display:none;font-size:${Math.round(px * 0.7)}px;line-height:${px}px">${info.icon}</span>`;
    }
    // 이미지 없으면 이모지 fallback
    return `<span style="font-size:${Math.round(px * 0.7)}px;line-height:${px}px">${info.icon}</span>`;
}

/**
 * 감정 정보 가져오기 (레거시 키 자동 매핑 포함)
 */
export function getEmotionInfo(emotionKey) {
    const key = mapLegacyEmotion(emotionKey);
    return EMOTION_TYPES[key] || null;
}

/**
 * 감정의 카테고리 정보 가져오기
 */
export function getEmotionCategory(emotionKey) {
    const key = mapLegacyEmotion(emotionKey);
    const info = EMOTION_TYPES[key];
    if (!info?.category) return null;
    return EMOTION_CATEGORIES[info.category] || null;
}

/**
 * "주의 필요" 감정인지 확인
 * 흐린 기분(cloudy) 카테고리 = 교사 관심 필요
 */
export function isNegativeEmotion(emotionKey) {
    const key = mapLegacyEmotion(emotionKey);
    const info = EMOTION_TYPES[key];
    return info?.category === 'cloudy';
}
