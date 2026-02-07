/**
 * 칭찬 관리 Mixin
 * 칭찬 로그 CRUD, 칭찬 카테고리 관리, Firebase 동기화/조회
 */

import { firebase, STORAGE_KEYS } from './Store.js';
import { PRAISE_CATEGORIES } from '../constants/index.js';

export const praiseMixin = {
    // ==================== 칭찬 로그 관련 ====================

    getPraiseLog() {
        const data = localStorage.getItem(STORAGE_KEYS.PRAISE_LOG);
        return data ? JSON.parse(data) : null;
    },

    savePraiseLog(log) {
        localStorage.setItem(STORAGE_KEYS.PRAISE_LOG, JSON.stringify(log));
        this.notify('praiseLog', log);
    },

    addPraise(praise) {
        const log = this.getPraiseLog() || [];
        const newPraise = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...praise
        };
        log.unshift(newPraise);

        if (log.length > 500) log.pop();
        this.savePraiseLog(log);

        // Firebase 동기화
        this.syncPraiseToFirebase(newPraise);

        // 펫 경험치 추가 (칭찬 카테고리에 따른 경험치)
        const expAmount = this.getPraiseCategories()[praise.category]?.exp || 10;
        if (praise.studentId) {
            this.addPetExp(praise.studentId, expAmount);
        }

        return newPraise;
    },

    async syncPraiseToFirebase(praise) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        console.log('🔍 칭찬 Firebase 동기화 시도:', { teacherUid, classId, firebaseEnabled: this.firebaseEnabled, isOnline: this.isOnline });
        if (!teacherUid || !classId || !this.firebaseEnabled) {
            console.warn('⚠️ 칭찬 Firebase 동기화 스킵:', { teacherUid: !!teacherUid, classId: !!classId, firebaseEnabled: this.firebaseEnabled });
            return;
        }

        if (this.isOnline) {
            try {
                const result = await firebase.savePraise(teacherUid, classId, praise);
                console.log('✅ Firebase 칭찬 저장 완료:', result);
            } catch (error) {
                console.error('❌ Firebase 칭찬 저장 실패:', error);
                this.addToOfflineQueue({ type: 'savePraise', teacherUid, classId, data: praise });
            }
        } else {
            this.addToOfflineQueue({ type: 'savePraise', teacherUid, classId, data: praise });
        }
    },

    getPraisesByStudent(studentId) {
        const log = this.getPraiseLog() || [];
        return log.filter(p => String(p.studentId) === String(studentId));
    },

    getPraisesByCategory(category) {
        const log = this.getPraiseLog() || [];
        return log.filter(p => p.category === category);
    },

    getTodayPraises() {
        const log = this.getPraiseLog() || [];
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        return log.filter(p => p.timestamp.startsWith(today));
    },

    // ==================== 칭찬 카테고리 관리 ====================

    getPraiseCategories() {
        const data = localStorage.getItem(STORAGE_KEYS.PRAISE_CATEGORIES_CUSTOM);
        if (data) {
            return JSON.parse(data);
        }
        return { ...PRAISE_CATEGORIES };
    },

    savePraiseCategories(categories) {
        localStorage.setItem(STORAGE_KEYS.PRAISE_CATEGORIES_CUSTOM, JSON.stringify(categories));
        this.notify('praiseCategories', categories);
    },

    addPraiseCategory({ icon, name, exp }) {
        const categories = this.getPraiseCategories();
        const key = `custom_${Date.now()}`;
        categories[key] = { icon, name, exp: Number(exp) };
        this.savePraiseCategories(categories);
        return key;
    },

    updatePraiseCategory(key, { icon, name, exp }) {
        const categories = this.getPraiseCategories();
        if (categories[key]) {
            categories[key] = { icon, name, exp: Number(exp) };
            this.savePraiseCategories(categories);
        }
    },

    deletePraiseCategory(key) {
        const categories = this.getPraiseCategories();
        if (categories[key]) {
            delete categories[key];
            this.savePraiseCategories(categories);
        }
    },

    resetPraiseCategories() {
        localStorage.removeItem(STORAGE_KEYS.PRAISE_CATEGORIES_CUSTOM);
        this.notify('praiseCategories', PRAISE_CATEGORIES);
    },

    // ==================== Firebase 추가 조회 메서드 ====================

    /**
     * Firebase에서 카테고리별 칭찬 조회
     */
    async getPraisesByCategoryFromFirebase(category, limitCount = 100) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return [];

        try {
            return await firebase.getPraisesByCategory(teacherUid, classId, category, limitCount);
        } catch (error) {
            console.error('카테고리별 칭찬 조회 실패:', error);
            return [];
        }
    },

    /**
     * Firebase에서 날짜별 칭찬 조회
     */
    async getPraisesByDateFromFirebase(date) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return [];

        try {
            return await firebase.getPraisesByDate(teacherUid, classId, date);
        } catch (error) {
            console.error('날짜별 칭찬 조회 실패:', error);
            return [];
        }
    },

    /**
     * Firebase에서 학생별 칭찬 조회
     */
    async getStudentPraisesFromFirebase(studentId, limitCount = 100) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return [];

        try {
            return await firebase.getStudentPraises(teacherUid, classId, studentId, limitCount);
        } catch (error) {
            console.error('학생별 칭찬 조회 실패:', error);
            return [];
        }
    },

    /**
     * Firebase에서 학생+카테고리별 칭찬 조회
     */
    /**
     * 학생 모드: 특정 학생의 칭찬 실시간 구독
     * 교사가 칭찬을 보내면 자동으로 로컬에 반영
     */
    subscribeToStudentPraises(studentId, callback) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        return firebase.subscribeToStudentPraises(teacherUid, classId, studentId, (firebasePraises) => {
            const localLog = this.getPraiseLog() || [];
            const existingFirebaseIds = new Set(localLog.map(p => p.firebaseId).filter(Boolean));

            firebasePraises.forEach(fp => {
                if (!existingFirebaseIds.has(fp.id)) {
                    // 새 데이터만 추가
                    const newPraise = {
                        id: Date.now() + Math.random(),
                        firebaseId: fp.id,
                        timestamp: fp.timestamp || fp.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                        studentId: fp.studentId,
                        studentName: fp.studentName,
                        studentNumber: fp.studentNumber,
                        category: fp.category,
                        expGain: fp.expGain,
                        source: fp.source || 'teacher'
                    };
                    localLog.unshift(newPraise);
                }
            });

            this.savePraiseLog(localLog);
            if (callback) callback(localLog.filter(p => String(p.studentId) === String(studentId)));
        });
    },

    async getStudentPraisesByCategoryFromFirebase(studentId, category) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return [];

        try {
            return await firebase.getStudentPraisesByCategory(teacherUid, classId, studentId, category);
        } catch (error) {
            console.error('학생+카테고리별 칭찬 조회 실패:', error);
            return [];
        }
    }
};
