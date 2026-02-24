/**
 * 상수 모듈 통합 인덱스
 * 모든 상수를 한 곳에서 가져올 수 있는 목차
 */

export { STORAGE_KEYS, SESSION_KEYS } from './storageKeys.js';
export { DEFAULT_SUBJECT_LIST, DEFAULT_SUBJECT_COLORS, COLOR_PRESETS } from '../utils/subjects.constants.js';
export { PET_TYPES, PET_SPEECH_STYLES, PET_REACTIONS, convertToPetSpeech } from '../../features/pet/pets.constants.js';
export { PRAISE_CATEGORIES } from '../../features/praise/praise.constants.js';
export { EMOTION_TYPES } from '../../features/emotion/emotions.constants.js';
export { DEFAULT_TIMETABLE, SAMPLE_TIMETABLE } from '../../features/timetable/timetable.constants.js';
export { DEFAULT_SETTINGS, SAMPLE_STUDENTS } from './settings.js';
