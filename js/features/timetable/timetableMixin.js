/**
 * 시간표 관리 Mixin
 * 시간표 CRUD, 주간 오버라이드, 과목 목록/색상, Firebase 동기화
 */

import { firebase, STORAGE_KEYS } from '../../shared/store/Store.js';
import { DEFAULT_SUBJECT_LIST, DEFAULT_SUBJECT_COLORS } from '../../shared/constants/index.js';

export const timetableMixin = {
    // ==================== 과목 목록 관련 ====================

    /**
     * 과목 목록 가져오기
     */
    getSubjectList() {
        const data = localStorage.getItem(STORAGE_KEYS.SUBJECT_LIST);
        return data ? JSON.parse(data) : [...DEFAULT_SUBJECT_LIST];
    },

    /**
     * 과목 목록 저장
     */
    saveSubjectList(list) {
        localStorage.setItem(STORAGE_KEYS.SUBJECT_LIST, JSON.stringify(list));
        this.notify('subjectList', list);
    },

    /**
     * 과목 추가
     * @param {string} subject - 추가할 과목명
     * @param {Object} color - 색상 (선택사항) { bg, text }
     * @returns {boolean} 성공 여부
     */
    addSubject(subject, color = null) {
        const trimmed = subject.trim();
        if (!trimmed) return false;

        const list = this.getSubjectList();

        // 중복 체크
        if (list.includes(trimmed)) {
            return false;
        }

        // 과목 추가
        list.push(trimmed);
        this.saveSubjectList(list);

        // 색상 설정 (기본 색상 할당)
        if (color) {
            this.setSubjectColor(trimmed, color);
        } else {
            // 기본 색상 중 하나 자동 할당
            const defaultColors = [
                { bg: '#E0E7FF', text: '#3730A3' },  // 인디고
                { bg: '#FEF3C7', text: '#92400E' },  // 앰버
                { bg: '#D1FAE5', text: '#065F46' },  // 에메랄드
                { bg: '#FCE7F3', text: '#9D174D' },  // 핑크
                { bg: '#E0F2FE', text: '#0369A1' },  // 스카이
            ];
            const colorIndex = (list.length - 1) % defaultColors.length;
            this.setSubjectColor(trimmed, defaultColors[colorIndex]);
        }

        return true;
    },

    /**
     * 과목 삭제
     * @param {string} subject - 삭제할 과목명
     * @returns {Object} { success, usageCount } - 성공 여부 및 시간표에서 사용 중인 횟수
     */
    removeSubject(subject) {
        const list = this.getSubjectList();
        const index = list.indexOf(subject);

        if (index === -1) {
            return { success: false, usageCount: 0 };
        }

        // 시간표에서 사용 중인지 확인
        const usageCount = this.countSubjectUsage(subject);

        // 과목 삭제
        list.splice(index, 1);
        this.saveSubjectList(list);

        // 시간표에서 해당 과목 제거
        if (usageCount > 0) {
            this.removeSubjectFromTimetable(subject);
        }

        // 색상 데이터도 삭제
        this.resetSubjectColor(subject);

        return { success: true, usageCount };
    },

    /**
     * 시간표에서 과목 사용 횟수 카운트
     */
    countSubjectUsage(subject) {
        const timetable = this.getTimetable() || {};
        let count = 0;

        Object.values(timetable).forEach(cell => {
            if (cell?.subject === subject) {
                count++;
            }
        });

        return count;
    },

    /**
     * 시간표에서 특정 과목 제거
     */
    removeSubjectFromTimetable(subject) {
        const timetable = this.getTimetable() || {};
        let modified = false;

        Object.keys(timetable).forEach(key => {
            if (timetable[key]?.subject === subject) {
                delete timetable[key];
                modified = true;
            }
        });

        if (modified) {
            this.saveTimetable(timetable);
        }
    },

    /**
     * 과목 목록 초기화 (기본값으로)
     */
    resetSubjectList() {
        localStorage.removeItem(STORAGE_KEYS.SUBJECT_LIST);
        this.notify('subjectList', DEFAULT_SUBJECT_LIST);
    },

    // ==================== 과목 색상 관련 ====================

    /**
     * 과목별 색상 가져오기 (저장된 커스텀 + 기본값 병합)
     */
    getSubjectColors() {
        const data = localStorage.getItem(STORAGE_KEYS.SUBJECT_COLORS);
        const customColors = data ? JSON.parse(data) : {};
        // 기본값과 커스텀 색상 병합 (커스텀이 우선)
        return { ...DEFAULT_SUBJECT_COLORS, ...customColors };
    },

    /**
     * 특정 과목 색상 가져오기
     */
    getSubjectColor(subject) {
        const colors = this.getSubjectColors();
        return colors[subject] || { bg: '#F3F4F6', text: '#4B5563' };
    },

    /**
     * 특정 과목 색상 저장
     */
    setSubjectColor(subject, colors) {
        const data = localStorage.getItem(STORAGE_KEYS.SUBJECT_COLORS);
        const customColors = data ? JSON.parse(data) : {};
        customColors[subject] = colors;
        localStorage.setItem(STORAGE_KEYS.SUBJECT_COLORS, JSON.stringify(customColors));
        this.notify('subjectColors', this.getSubjectColors());

        // Firebase 동기화
        this.syncSubjectColorsToFirebase(customColors);
    },

    /**
     * 모든 과목 색상 기본값으로 초기화
     */
    resetSubjectColors() {
        localStorage.removeItem(STORAGE_KEYS.SUBJECT_COLORS);
        this.notify('subjectColors', DEFAULT_SUBJECT_COLORS);
    },

    /**
     * 특정 과목 색상만 기본값으로 초기화
     */
    resetSubjectColor(subject) {
        const data = localStorage.getItem(STORAGE_KEYS.SUBJECT_COLORS);
        const customColors = data ? JSON.parse(data) : {};
        delete customColors[subject];
        localStorage.setItem(STORAGE_KEYS.SUBJECT_COLORS, JSON.stringify(customColors));
        this.notify('subjectColors', this.getSubjectColors());
    },

    /**
     * Firebase에 과목 색상 동기화
     */
    async syncSubjectColorsToFirebase(colors) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return;

        if (this.isOnline) {
            try {
                await firebase.saveSubjectColors(teacherUid, classId, colors);
            } catch (error) {
                console.warn('과목 색상 Firebase 동기화 실패:', error);
            }
        }
    },

    /**
     * Firebase에서 과목 색상 로드
     */
    async loadSubjectColorsFromFirebase() {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            const colors = await firebase.getSubjectColors(teacherUid, classId);
            if (colors) {
                localStorage.setItem(STORAGE_KEYS.SUBJECT_COLORS, JSON.stringify(colors));
                return colors;
            }
            return null;
        } catch (error) {
            console.error('Firebase 과목 색상 로드 실패:', error);
            return null;
        }
    },

    // ==================== 시간표 관련 ====================

    /**
     * 기본 시간표 가져오기
     */
    getTimetable() {
        const data = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
        return data ? JSON.parse(data) : null;
    },

    /**
     * 기본 시간표 저장
     */
    saveTimetable(timetable) {
        localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
        this.notify('timetable', timetable);

        // Firebase 동기화
        this.syncTimetableToFirebase(timetable);
    },

    /**
     * 기본 시간표 셀 업데이트
     */
    updateTimetableCell(key, value) {
        const timetable = this.getTimetable() || {};
        timetable[key] = value;
        this.saveTimetable(timetable);
    },

    // ==================== 주간 오버라이드 관련 ====================

    /**
     * ISO 주차 키 생성 (예: "2025-W04")
     */
    getWeekKey(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    },

    /**
     * 월요일 날짜로 주차 키 생성
     */
    getWeekKeyFromMonday(monday) {
        return this.getWeekKey(monday);
    },

    /**
     * 모든 주간 오버라이드 가져오기
     */
    getWeeklyOverrides() {
        const data = localStorage.getItem(STORAGE_KEYS.TIMETABLE_OVERRIDES);
        return data ? JSON.parse(data) : {};
    },

    /**
     * 모든 주간 오버라이드 저장
     */
    saveWeeklyOverrides(overrides) {
        localStorage.setItem(STORAGE_KEYS.TIMETABLE_OVERRIDES, JSON.stringify(overrides));
        this.notify('timetableOverrides', overrides);

        // Firebase 동기화
        this.syncWeeklyOverridesToFirebase(overrides);
    },

    /**
     * 특정 주의 오버라이드 가져오기
     */
    getWeekOverride(weekKey) {
        const overrides = this.getWeeklyOverrides();
        return overrides[weekKey] || null;
    },

    /**
     * 특정 주의 특정 셀 오버라이드 설정
     */
    setWeekOverride(weekKey, cellKey, data) {
        const overrides = this.getWeeklyOverrides();

        if (!overrides[weekKey]) {
            overrides[weekKey] = {
                cells: {},
                updatedAt: new Date().toISOString()
            };
        }

        if (data === null) {
            // null이면 해당 셀의 오버라이드 삭제 (기본으로 복원)
            delete overrides[weekKey].cells[cellKey];
            // 셀이 없으면 주차 자체 삭제
            if (Object.keys(overrides[weekKey].cells).length === 0) {
                delete overrides[weekKey];
            }
        } else {
            overrides[weekKey].cells[cellKey] = data;
            overrides[weekKey].updatedAt = new Date().toISOString();
        }

        this.saveWeeklyOverrides(overrides);
        return overrides;
    },

    /**
     * 특정 주의 시간표 가져오기 (기본 + 오버라이드 병합)
     */
    getTimetableForWeek(weekKey) {
        const baseTimetable = this.getTimetable() || {};
        const weekOverride = this.getWeekOverride(weekKey);

        if (!weekOverride || !weekOverride.cells) {
            return { timetable: baseTimetable, overriddenCells: [] };
        }

        // 기본 시간표 복사 후 오버라이드 적용
        const merged = { ...baseTimetable };
        const overriddenCells = [];

        Object.entries(weekOverride.cells).forEach(([cellKey, cellData]) => {
            merged[cellKey] = cellData;
            overriddenCells.push(cellKey);
        });

        return { timetable: merged, overriddenCells };
    },

    /**
     * 특정 주의 오버라이드 전체 삭제 (기본으로 복원)
     */
    clearWeekOverride(weekKey) {
        const overrides = this.getWeeklyOverrides();
        delete overrides[weekKey];
        this.saveWeeklyOverrides(overrides);
    },

    /**
     * 오버라이드 히스토리 가져오기 (최근 N개 주)
     */
    getOverrideHistory(limit = 10) {
        const overrides = this.getWeeklyOverrides();
        return Object.entries(overrides)
            .map(([weekKey, data]) => ({
                weekKey,
                ...data,
                cellCount: Object.keys(data.cells || {}).length
            }))
            .sort((a, b) => b.weekKey.localeCompare(a.weekKey))
            .slice(0, limit);
    },

    async syncTimetableToFirebase(timetable) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        console.log('🔥 시간표 동기화 시도:', { teacherUid, classId, firebaseEnabled: this.firebaseEnabled });

        if (!teacherUid || !classId || !this.firebaseEnabled) {
            console.warn('❌ 시간표 동기화 조건 미충족:', {
                hasTeacherUid: !!teacherUid,
                hasClassId: !!classId,
                firebaseEnabled: this.firebaseEnabled
            });
            return;
        }
        console.log('✅ 시간표 동기화 조건 충족, Firebase에 저장 시작...');

        if (this.isOnline) {
            try {
                await firebase.saveTimetable(teacherUid, classId, timetable);
                console.log('✅ 시간표 Firebase 저장 성공!', { teacherUid, classId });
            } catch (error) {
                console.error('❌ 시간표 Firebase 저장 실패:', error);
                this.addToOfflineQueue({ type: 'saveTimetable', teacherUid, classId, data: timetable });
            }
        } else {
            console.log('📴 오프라인 상태 - 시간표를 오프라인 큐에 추가');
            this.addToOfflineQueue({ type: 'saveTimetable', teacherUid, classId, data: timetable });
        }
    },

    async syncWeeklyOverridesToFirebase(overrides) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        console.log('🔥 주간 오버라이드 동기화 시도:', { teacherUid, classId, firebaseEnabled: this.firebaseEnabled });

        if (!teacherUid || !classId || !this.firebaseEnabled) {
            console.warn('❌ 주간 오버라이드 동기화 조건 미충족:', {
                hasTeacherUid: !!teacherUid,
                hasClassId: !!classId,
                firebaseEnabled: this.firebaseEnabled
            });
            return;
        }
        console.log('✅ 주간 오버라이드 동기화 조건 충족, Firebase에 저장 시작...');

        if (this.isOnline) {
            try {
                await firebase.saveTimetableOverrides(teacherUid, classId, overrides);
                console.log('✅ 주간 오버라이드 Firebase 저장 성공!', { teacherUid, classId });
            } catch (error) {
                console.error('❌ 주간 오버라이드 Firebase 동기화 실패:', error);
                this.addToOfflineQueue({ type: 'saveTimetableOverrides', teacherUid, classId, data: overrides });
            }
        } else {
            console.log('📴 오프라인 상태 - 주간 오버라이드를 오프라인 큐에 추가');
            this.addToOfflineQueue({ type: 'saveTimetableOverrides', teacherUid, classId, data: overrides });
        }
    },

    async loadTimetableFromFirebase() {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            const timetable = await firebase.getTimetable(teacherUid, classId);
            if (timetable) {
                localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
                return timetable;
            }
            return null;
        } catch (error) {
            console.error('Firebase 시간표 로드 실패:', error);
            return null;
        }
    },

    async loadWeeklyOverridesFromFirebase() {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            const overrides = await firebase.getTimetableOverrides(teacherUid, classId);
            if (overrides) {
                localStorage.setItem(STORAGE_KEYS.TIMETABLE_OVERRIDES, JSON.stringify(overrides));
                return overrides;
            }
            return null;
        } catch (error) {
            console.error('Firebase 주간 오버라이드 로드 실패:', error);
            return null;
        }
    }
};
