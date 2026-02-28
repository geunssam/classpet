/**
 * 칭찬 관리 Mixin
 * 칭찬 로그 CRUD, 칭찬 카테고리 관리, Firebase 동기화/조회
 */

import { firebase, STORAGE_KEYS } from '../../shared/store/Store.js';
import { PRAISE_CATEGORIES } from '../../shared/constants/index.js';
import { toDateString } from '../../shared/utils/dateUtils.js';
import { showToast } from '../../shared/utils/animations.js';

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

    async addPraise(praise) {
        const log = this.getPraiseLog() || [];
        const newPraise = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...praise
        };

        // Firebase 먼저 저장하여 firebaseId 확보 (구독 중복 방지)
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (teacherUid && classId && this.firebaseEnabled && this.isOnline) {
            try {
                const result = await firebase.savePraise(teacherUid, classId, newPraise);
                if (result && result.id) {
                    newPraise.firebaseId = result.id;
                }
            } catch (error) {
                console.error('Firebase 칭찬 저장 실패:', error);
                this.addToOfflineQueue({ type: 'savePraise', teacherUid, classId, data: newPraise });
            }
        } else if (teacherUid && classId && this.firebaseEnabled) {
            this.addToOfflineQueue({ type: 'savePraise', teacherUid, classId, data: newPraise });
        }

        // firebaseId 포함하여 로컬 저장
        log.unshift(newPraise);
        if (log.length > 500) log.pop();
        this.savePraiseLog(log);

        // 펫 경험치 추가 (칭찬 카테고리에 따른 경험치)
        const expAmount = this.getPraiseCategories()[praise.category]?.exp || 10;
        if (praise.studentId) {
            this.addPetExp(praise.studentId, expAmount);
        }

        return newPraise;
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
        const today = toDateString();
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
        this.syncPraiseCategoriesToFirebase(categories);
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
        this.syncPraiseCategoriesToFirebase({ ...PRAISE_CATEGORIES });
    },

    // ==================== 칭찬 카테고리 Firestore 동기화 ====================

    /**
     * 칭찬 카테고리를 Firestore에 동기화
     * teachers/{uid}/classes/{classId} 문서의 praiseCategories 필드에 저장
     */
    async syncPraiseCategoriesToFirebase(categories) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return;

        try {
            await firebase.updateClass(teacherUid, classId, { praiseCategories: categories });
            console.log('✅ 칭찬 카테고리 Firestore 동기화 완료');
        } catch (error) {
            console.error('❌ 칭찬 카테고리 Firestore 동기화 실패:', error);
        }
    },

    /**
     * 칭찬 카테고리를 localStorage에만 저장 (Firestore 역방향 동기화 방지)
     */
    savePraiseCategoriesLocal(categories) {
        localStorage.setItem(STORAGE_KEYS.PRAISE_CATEGORIES_CUSTOM, JSON.stringify(categories));
        this.notify('praiseCategories', categories);
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
     * 학생 모드: 칭찬 카테고리 실시간 구독
     * 교사가 카테고리를 추가/수정/삭제하면 자동으로 로컬에 반영
     * @returns {Function|null} 구독 해제 함수
     */
    subscribeToPraiseCategories(callback) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        return firebase.subscribeToClassDoc(teacherUid, classId, (classData) => {
            if (classData.praiseCategories) {
                // 현재 로컬과 비교하여 변경이 있을 때만 갱신
                const localCategories = JSON.stringify(this.getPraiseCategories());
                const remoteCategories = JSON.stringify(classData.praiseCategories);
                if (localCategories !== remoteCategories) {
                    this.savePraiseCategoriesLocal(classData.praiseCategories);
                    console.log('✅ 칭찬 카테고리 실시간 동기화 완료');
                    if (callback) callback(classData.praiseCategories);
                }
            }
        });
    },

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
            let hasNew = false;

            firebasePraises.forEach(fp => {
                if (existingFirebaseIds.has(fp.id)) return;

                // firebaseId 없는 로컬 레코드와 timestamp+studentId로 매칭 (같은 브라우저 중복 방지)
                const fpTime = fp.timestamp || fp.createdAt?.toDate?.()?.toISOString() || '';
                const duplicate = localLog.find(p =>
                    !p.firebaseId &&
                    String(p.studentId) === String(fp.studentId) &&
                    p.category === fp.category &&
                    p.timestamp && fpTime &&
                    Math.abs(new Date(p.timestamp) - new Date(fpTime)) < 5000
                );
                if (duplicate) {
                    // firebaseId 보충
                    duplicate.firebaseId = fp.id;
                    hasNew = true;
                    return;
                }

                // 진짜 새 데이터만 추가
                const newPraise = {
                    id: Date.now() + Math.random(),
                    firebaseId: fp.id,
                    timestamp: fpTime || new Date().toISOString(),
                    studentId: fp.studentId,
                    studentName: fp.studentName,
                    studentNumber: fp.studentNumber,
                    category: fp.category,
                    expGain: fp.expGain,
                    source: fp.source || 'teacher'
                };
                localLog.unshift(newPraise);
                hasNew = true;
            });

            if (hasNew) this.savePraiseLog(localLog);
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
