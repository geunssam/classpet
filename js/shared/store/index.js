/**
 * Store 모듈 진입점
 * Store 클래스 + Mixin 조합 → 싱글톤 인스턴스 생성
 */

import { Store } from './Store.js';
import { offlineMixin } from './offlineMixin.js';
import { authMixin } from '../../features/auth/authMixin.js';
import { classMixin } from '../../features/class/classMixin.js';
import { studentMixin } from '../../features/class/studentMixin.js';
import { petMixin } from '../../features/pet/petMixin.js';
import { timetableMixin } from '../../features/timetable/timetableMixin.js';
import { praiseMixin } from '../../features/praise/praiseMixin.js';
import { emotionMixin } from '../../features/emotion/emotionMixin.js';
import { settingsMixin } from './settingsMixin.js';
import { notificationMixin } from './notificationMixin.js';
import { thermostatMixin } from '../../features/praise/thermostatMixin.js';
import { noticeMixin } from '../../features/notice/noticeMixin.js';

// 상수 re-export (하위 호환성)
import {
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
} from '../constants/index.js';

// Mixin들을 Store.prototype에 조합
Object.assign(Store.prototype,
    offlineMixin,
    authMixin,
    classMixin,
    studentMixin,
    petMixin,
    timetableMixin,
    praiseMixin,
    emotionMixin,
    settingsMixin,
    notificationMixin,
    thermostatMixin,
    noticeMixin
);

// 싱글톤 인스턴스 생성
const store = new Store();

// 상수 및 store 내보내기 (하위 호환성 유지)
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
};
