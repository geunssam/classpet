/**
 * Firebase 초기화 및 전역 상태 관리
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getFirestore,
    serverTimestamp,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getAuth,
    setPersistence,
    browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Firebase 설정 - classpet-iwg 프로젝트
const firebaseConfig = {
    apiKey: "AIzaSyCpw_9F8TGAg8IxzO5kVkxSKbE4xW3l_ZI",
    authDomain: "classpet-iwg.firebaseapp.com",
    projectId: "classpet-iwg",
    storageBucket: "classpet-iwg.firebasestorage.app",
    messagingSenderId: "1032094653691",
    appId: "1:1032094653691:web:72e43c81162c49bde5a45e"
};

// Firebase 인스턴스
let app = null;
let db = null;
let auth = null;
let isInitialized = false;

// 현재 학급 정보 (계층 구조용)
let currentClassId = null;
let currentTeacherUid = null;

// 실시간 리스너 해제 함수들
const unsubscribeFunctions = [];

// 레거시 학급코드
let legacyClassCode = null;

/**
 * Firebase 초기화
 */
export async function initializeFirebase(config = null) {
    if (isInitialized) return { app, db, auth };

    try {
        const configToUse = config || firebaseConfig;

        if (configToUse.apiKey === "YOUR_API_KEY") {
            console.warn('Firebase 설정이 필요합니다.');
            return null;
        }

        app = initializeApp(configToUse);
        db = getFirestore(app);
        auth = getAuth(app);

        await setPersistence(auth, browserLocalPersistence);

        isInitialized = true;

        console.log('Firebase 초기화 완료');
        return { app, db, auth };
    } catch (error) {
        console.error('Firebase 초기화 실패:', error);
        return null;
    }
}

export function isFirebaseInitialized() {
    return isInitialized && firebaseConfig.apiKey !== "YOUR_API_KEY";
}

// Getter/Setter for shared state
export function getDb() { return db; }
export function getAuthInstance() { return auth; }
export function getApp() { return app; }

export function getCurrentClassId() {
    if (currentClassId) return currentClassId;
    currentClassId = localStorage.getItem('classpet_current_class_id');
    return currentClassId;
}

export function setCurrentClassId(classId) {
    currentClassId = classId;
    if (classId) {
        localStorage.setItem('classpet_current_class_id', classId);
    } else {
        localStorage.removeItem('classpet_current_class_id');
    }
}

export function getCurrentTeacherUid() {
    if (currentTeacherUid) return currentTeacherUid;
    currentTeacherUid = localStorage.getItem('classpet_current_teacher_uid');
    return currentTeacherUid;
}

export function setCurrentTeacherUid(uid) {
    currentTeacherUid = uid;
    if (uid) {
        localStorage.setItem('classpet_current_teacher_uid', uid);
    } else {
        localStorage.removeItem('classpet_current_teacher_uid');
    }
}

export function getCurrentClassPath() {
    const teacherUid = getCurrentTeacherUid();
    const classId = getCurrentClassId();
    if (!teacherUid || !classId) return null;
    return { teacherUid, classId };
}

export function clearCurrentSession() {
    currentClassId = null;
    currentTeacherUid = null;
    localStorage.removeItem('classpet_current_class_id');
    localStorage.removeItem('classpet_current_teacher_uid');
}

export function getUnsubscribeFunctions() { return unsubscribeFunctions; }

export function unsubscribeAll() {
    unsubscribeFunctions.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
    unsubscribeFunctions.length = 0;
}

export function timestampToISO(timestamp) {
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toISOString();
    }
    return timestamp;
}

// 레거시 학급코드
export function setClassCode(code) {
    legacyClassCode = code?.toUpperCase() || null;
    if (code) {
        localStorage.setItem('classpet_class_code', code.toUpperCase());
    } else {
        localStorage.removeItem('classpet_class_code');
    }
}

export function getClassCode() {
    if (legacyClassCode) return legacyClassCode;
    legacyClassCode = localStorage.getItem('classpet_class_code');
    return legacyClassCode;
}

// Re-export Firebase instances (for bridge compatibility)
export { db, auth, app, serverTimestamp, Timestamp };
