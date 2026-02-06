/**
 * Store 핵심 클래스
 * 생성자, 초기화, 네트워크/오프라인 관리, 구독/알림
 */

import * as firebase from '../firebase-config.js';

import {
    STORAGE_KEYS,
    SESSION_KEYS,
    DEFAULT_SETTINGS,
    SAMPLE_STUDENTS,
    SAMPLE_TIMETABLE
} from '../constants/index.js';

class Store {
    constructor() {
        this.listeners = new Set();
        this.firebaseEnabled = false;
        this.firebaseListeners = [];
        this.currentClassId = null;
        this.currentTeacherUid = null;  // 계층 구조용 교사 UID
        this.currentClassData = null;
        this.offlineQueue = [];
        this.isOnline = navigator.onLine;
        this.authLoading = true;  // Firebase 인증 초기화 중

        // 네트워크 상태 감지
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        this.init();
    }

    /**
     * 초기화
     */
    async init() {
        // Firebase 초기화
        await this.initFirebase();

        // 저장된 현재 학급 정보 복원 (계층 구조: teacherUid + classId)
        this.currentClassId = localStorage.getItem(STORAGE_KEYS.CURRENT_CLASS_ID);
        this.currentTeacherUid = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER_UID);

        // Firebase 모듈에도 동기화
        if (this.currentTeacherUid) {
            firebase.setCurrentTeacherUid(this.currentTeacherUid);
        }
        if (this.currentClassId) {
            firebase.setCurrentClassId(this.currentClassId);
        }

        // 오프라인 큐 복원
        this.loadOfflineQueue();

        // 로컬 데이터 초기화 (Firebase 연결 없을 때 폴백용)
        this.initLocalData();
    }

    /**
     * 로컬 데이터 초기화 (폴백용)
     */
    initLocalData() {
        if (!this.getSettings()) {
            this.saveSettings(DEFAULT_SETTINGS);
        }
        if (!this.getStudents() || this.getStudents().length === 0) {
            this.saveStudents(SAMPLE_STUDENTS);
        }
        if (!this.getTimetable() || Object.keys(this.getTimetable()).length === 0) {
            this.saveTimetable(SAMPLE_TIMETABLE);
        }
        if (!this.getPraiseLog()) this.savePraiseLog([]);
        if (!this.getEmotionLog()) this.saveEmotionLog([]);
        if (!this.getNotes()) this.saveNotes([]);
        if (!this.getNotifications()) this.saveNotifications([]);
    }

    /**
     * Firebase 초기화
     */
    async initFirebase() {
        try {
            const result = await firebase.initializeFirebase();
            if (result) {
                this.firebaseEnabled = firebase.isFirebaseInitialized();
                console.log('Firebase 연동:', this.firebaseEnabled ? '활성화' : '비활성화');
            }
        } catch (error) {
            console.warn('Firebase 초기화 실패:', error);
            this.firebaseEnabled = false;
        }
    }

    // ==================== 네트워크 상태 관리 ====================

    handleOnline() {
        this.isOnline = true;
        console.log('온라인 상태로 전환');
        this.processOfflineQueue();
    }

    handleOffline() {
        this.isOnline = false;
        console.log('오프라인 상태로 전환');
    }

    // ==================== 변경 리스너 ====================

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(type, data) {
        this.listeners.forEach(listener => listener(type, data));
    }
}

export { Store, firebase, STORAGE_KEYS, SESSION_KEYS };
