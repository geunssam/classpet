/**
 * 클래스펫 상태 관리 모듈 (브릿지)
 * 실제 구현은 ./store/ 폴더의 모듈들에 있음
 * 하위 호환성을 위해 기존 경로 유지
 */

export {
    store,
    PET_TYPES,
    PRAISE_CATEGORIES,
    EMOTION_TYPES,
    PET_REACTIONS,
    PET_SPEECH_STYLES,
    DEFAULT_SETTINGS,
    DEFAULT_TIMETABLE,
    DEFAULT_SUBJECT_LIST,
    DEFAULT_SUBJECT_COLORS,
    COLOR_PRESETS,
    convertToPetSpeech
} from './shared/store/index.js';
