/**
 * Firebase 설정 및 초기화
 * Firestore 실시간 동기화를 위한 모듈
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
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

// Firebase 초기화
let app = null;
let db = null;
let auth = null;
let isInitialized = false;

// 현재 학급 코드
let currentClassCode = null;

// 실시간 리스너 해제 함수들
const unsubscribeFunctions = [];

/**
 * Firebase 초기화
 */
export function initializeFirebase(config = null) {
    if (isInitialized) return { app, db, auth };

    try {
        const configToUse = config || firebaseConfig;

        // 설정이 유효한지 확인
        if (configToUse.apiKey === "YOUR_API_KEY") {
            console.warn('Firebase 설정이 필요합니다. firebase-config.js의 firebaseConfig를 업데이트해주세요.');
            return null;
        }

        app = initializeApp(configToUse);
        db = getFirestore(app);
        auth = getAuth(app);
        isInitialized = true;

        console.log('Firebase 초기화 완료');
        return { app, db, auth };
    } catch (error) {
        console.error('Firebase 초기화 실패:', error);
        return null;
    }
}

/**
 * Firebase가 초기화되었는지 확인
 */
export function isFirebaseInitialized() {
    return isInitialized && firebaseConfig.apiKey !== "YOUR_API_KEY";
}

/**
 * 익명 인증 로그인
 */
export async function signInAnonymouslyIfNeeded() {
    if (!auth) return null;

    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                resolve(user);
            } else {
                try {
                    const result = await signInAnonymously(auth);
                    resolve(result.user);
                } catch (error) {
                    console.error('익명 인증 실패:', error);
                    reject(error);
                }
            }
        });
    });
}

/**
 * 현재 인증된 사용자 가져오기
 */
export function getCurrentUser() {
    return auth?.currentUser || null;
}

// ==================== 학급 코드 관리 ====================

/**
 * 새 학급 코드 생성 (6자리 영숫자)
 */
export function generateClassCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 쉬운 문자 제외 (0, O, 1, I)
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * 학급 코드 설정
 */
export function setClassCode(code) {
    currentClassCode = code?.toUpperCase() || null;
    if (code) {
        localStorage.setItem('classpet_class_code', code.toUpperCase());
    } else {
        localStorage.removeItem('classpet_class_code');
    }
}

/**
 * 저장된 학급 코드 가져오기
 */
export function getClassCode() {
    if (currentClassCode) return currentClassCode;
    currentClassCode = localStorage.getItem('classpet_class_code');
    return currentClassCode;
}

/**
 * 학급 코드 유효성 검사 (Firestore에서 확인)
 */
export async function validateClassCode(code) {
    if (!db || !code) return false;

    try {
        const classRef = doc(db, `classpet_${code.toUpperCase()}`, 'settings');
        const classDoc = await getDoc(classRef);
        return classDoc.exists();
    } catch (error) {
        console.error('학급 코드 검증 실패:', error);
        return false;
    }
}

/**
 * 컬렉션 경로 가져오기
 */
function getCollectionPath(collectionName) {
    const code = getClassCode();
    if (!code) {
        console.warn('학급 코드가 설정되지 않았습니다.');
        return null;
    }
    return `classpet_${code}/${collectionName}`;
}

// ==================== 학급 설정 ====================

/**
 * 학급 설정 저장 (새 학급 생성 시)
 */
export async function saveClassSettings(settings) {
    if (!db) return null;

    const code = getClassCode();
    if (!code) return null;

    try {
        const settingsRef = doc(db, `classpet_${code}`, 'settings');
        await setDoc(settingsRef, {
            ...settings,
            classCode: code,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });

        return { ...settings, classCode: code };
    } catch (error) {
        console.error('학급 설정 저장 실패:', error);
        return null;
    }
}

/**
 * 학급 설정 가져오기
 */
export async function getClassSettings() {
    if (!db) return null;

    const code = getClassCode();
    if (!code) return null;

    try {
        const settingsRef = doc(db, `classpet_${code}`, 'settings');
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
            return settingsDoc.data();
        }
        return null;
    } catch (error) {
        console.error('학급 설정 가져오기 실패:', error);
        return null;
    }
}

// ==================== 학생 데이터 ====================

/**
 * 학생 데이터 저장
 */
export async function saveStudent(student) {
    if (!db) return null;

    const code = getClassCode();
    if (!code) return null;

    try {
        const studentRef = doc(db, `classpet_${code}`, 'students', String(student.id));
        await setDoc(studentRef, {
            ...student,
            updatedAt: serverTimestamp()
        }, { merge: true });

        return student;
    } catch (error) {
        console.error('학생 저장 실패:', error);
        return null;
    }
}

/**
 * 모든 학생 데이터 저장 (배치)
 */
export async function saveAllStudents(students) {
    if (!db || !students?.length) return null;

    const code = getClassCode();
    if (!code) return null;

    try {
        const promises = students.map(student =>
            saveStudent(student)
        );
        await Promise.all(promises);
        return students;
    } catch (error) {
        console.error('학생 일괄 저장 실패:', error);
        return null;
    }
}

/**
 * 모든 학생 가져오기
 */
export async function getAllStudents() {
    if (!db) return null;

    const code = getClassCode();
    if (!code) return null;

    try {
        const studentsRef = collection(db, `classpet_${code}`, 'students');
        const snapshot = await getDocs(studentsRef);

        const students = [];
        snapshot.forEach(doc => {
            students.push({ id: parseInt(doc.id), ...doc.data() });
        });

        // 번호순 정렬
        students.sort((a, b) => a.number - b.number);
        return students;
    } catch (error) {
        console.error('학생 목록 가져오기 실패:', error);
        return null;
    }
}

/**
 * 학생 데이터 실시간 구독
 */
export function subscribeToStudents(callback) {
    if (!db) return null;

    const code = getClassCode();
    if (!code) return null;

    try {
        const studentsRef = collection(db, `classpet_${code}`, 'students');
        const unsubscribe = onSnapshot(studentsRef, (snapshot) => {
            const students = [];
            snapshot.forEach(doc => {
                students.push({ id: parseInt(doc.id), ...doc.data() });
            });
            students.sort((a, b) => a.number - b.number);
            callback(students);
        }, (error) => {
            console.error('학생 구독 오류:', error);
        });

        unsubscribeFunctions.push(unsubscribe);
        return unsubscribe;
    } catch (error) {
        console.error('학생 구독 실패:', error);
        return null;
    }
}

// ==================== 감정 기록 ====================

/**
 * 감정 기록 저장
 */
export async function saveEmotion(emotion) {
    if (!db) return null;

    const code = getClassCode();
    if (!code) return null;

    try {
        const emotionsRef = collection(db, `classpet_${code}`, 'emotions');

        const emotionData = {
            ...emotion,
            date: emotion.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0],
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(emotionsRef, emotionData);
        return { id: docRef.id, ...emotionData };
    } catch (error) {
        console.error('감정 저장 실패:', error);
        return null;
    }
}

/**
 * 오늘의 감정 기록 가져오기
 */
export async function getTodayEmotions() {
    if (!db) return [];

    const code = getClassCode();
    if (!code) return [];

    try {
        const today = new Date().toISOString().split('T')[0];
        const emotionsRef = collection(db, `classpet_${code}`, 'emotions');
        const q = query(
            emotionsRef,
            where('date', '==', today),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const emotions = [];
        snapshot.forEach(doc => {
            emotions.push({ id: doc.id, ...doc.data() });
        });

        return emotions;
    } catch (error) {
        console.error('오늘 감정 가져오기 실패:', error);
        return [];
    }
}

/**
 * 특정 학생의 감정 기록 가져오기
 */
export async function getStudentEmotions(studentId, limitCount = 30) {
    if (!db) return [];

    const code = getClassCode();
    if (!code) return [];

    try {
        const emotionsRef = collection(db, `classpet_${code}`, 'emotions');
        const q = query(
            emotionsRef,
            where('studentId', '==', studentId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const emotions = [];
        snapshot.forEach(doc => {
            emotions.push({ id: doc.id, ...doc.data() });
        });

        return emotions;
    } catch (error) {
        console.error('학생 감정 가져오기 실패:', error);
        return [];
    }
}

/**
 * 감정 기록 실시간 구독 (오늘 기록)
 */
export function subscribeToTodayEmotions(callback) {
    if (!db) return null;

    const code = getClassCode();
    if (!code) return null;

    try {
        const today = new Date().toISOString().split('T')[0];
        const emotionsRef = collection(db, `classpet_${code}`, 'emotions');
        const q = query(
            emotionsRef,
            where('date', '==', today),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const emotions = [];
            snapshot.forEach(doc => {
                emotions.push({ id: doc.id, ...doc.data() });
            });
            callback(emotions);
        }, (error) => {
            console.error('감정 구독 오류:', error);
        });

        unsubscribeFunctions.push(unsubscribe);
        return unsubscribe;
    } catch (error) {
        console.error('감정 구독 실패:', error);
        return null;
    }
}

/**
 * 날짜별 감정 기록 가져오기
 */
export async function getEmotionsByDate(date) {
    if (!db) return [];

    const code = getClassCode();
    if (!code) return [];

    try {
        const emotionsRef = collection(db, `classpet_${code}`, 'emotions');
        const q = query(
            emotionsRef,
            where('date', '==', date),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const emotions = [];
        snapshot.forEach(doc => {
            emotions.push({ id: doc.id, ...doc.data() });
        });

        return emotions;
    } catch (error) {
        console.error('날짜별 감정 가져오기 실패:', error);
        return [];
    }
}

// ==================== 칭찬 기록 ====================

/**
 * 칭찬 기록 저장
 */
export async function savePraise(praise) {
    if (!db) return null;

    const code = getClassCode();
    if (!code) return null;

    try {
        const praisesRef = collection(db, `classpet_${code}`, 'praises');

        const praiseData = {
            ...praise,
            date: praise.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0],
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(praisesRef, praiseData);
        return { id: docRef.id, ...praiseData };
    } catch (error) {
        console.error('칭찬 저장 실패:', error);
        return null;
    }
}

/**
 * 오늘의 칭찬 기록 가져오기
 */
export async function getTodayPraises() {
    if (!db) return [];

    const code = getClassCode();
    if (!code) return [];

    try {
        const today = new Date().toISOString().split('T')[0];
        const praisesRef = collection(db, `classpet_${code}`, 'praises');
        const q = query(
            praisesRef,
            where('date', '==', today),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const praises = [];
        snapshot.forEach(doc => {
            praises.push({ id: doc.id, ...doc.data() });
        });

        return praises;
    } catch (error) {
        console.error('오늘 칭찬 가져오기 실패:', error);
        return [];
    }
}

// ==================== 유틸리티 ====================

/**
 * 모든 실시간 리스너 해제
 */
export function unsubscribeAll() {
    unsubscribeFunctions.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
    unsubscribeFunctions.length = 0;
}

/**
 * Firestore Timestamp를 ISO 문자열로 변환
 */
export function timestampToISO(timestamp) {
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toISOString();
    }
    return timestamp;
}

/**
 * Firebase 인스턴스 내보내기
 */
export { db, auth, app };

// 자동 초기화 시도
initializeFirebase();
