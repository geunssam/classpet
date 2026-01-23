/**
 * Firebase 설정 및 초기화
 * Firebase 우선 구조 - Google 인증 + 다중 학급 지원
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
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
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

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// 현재 학급 ID (새 구조)
let currentClassId = null;

// 실시간 리스너 해제 함수들
const unsubscribeFunctions = [];

/**
 * Firebase 초기화
 */
export function initializeFirebase(config = null) {
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

// ==================== Google 인증 ====================

/**
 * Google 로그인
 */
export async function signInWithGoogle() {
    if (!auth) return { success: false, error: 'Firebase가 초기화되지 않았습니다' };

    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // 교사 프로필 생성/업데이트
        await createOrUpdateTeacherProfile(user);

        console.log('Google 로그인 성공:', user.email);
        return { success: true, user };
    } catch (error) {
        console.error('Google 로그인 실패:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 로그아웃
 */
export async function firebaseSignOut() {
    if (!auth) return;

    try {
        await signOut(auth);
        currentClassId = null;
        console.log('로그아웃 완료');
    } catch (error) {
        console.error('로그아웃 실패:', error);
        throw error;
    }
}

/**
 * 익명 인증 로그인 (학생용)
 */
export async function signInAnonymouslyIfNeeded() {
    if (!auth) return null;

    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
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

/**
 * 인증 상태 변경 리스너
 */
export function onAuthChange(callback) {
    if (!auth) return null;
    return onAuthStateChanged(auth, callback);
}

/**
 * 현재 사용자가 교사인지 확인 (Google 로그인 여부)
 */
export function isTeacherUser() {
    const user = getCurrentUser();
    return user && !user.isAnonymous;
}

// ==================== 교사 프로필 관리 ====================

/**
 * 교사 프로필 생성/업데이트
 */
export async function createOrUpdateTeacherProfile(user) {
    if (!db || !user) return null;

    try {
        const teacherRef = doc(db, 'teachers', user.uid);
        const teacherDoc = await getDoc(teacherRef);

        const profileData = {
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            updatedAt: serverTimestamp()
        };

        if (!teacherDoc.exists()) {
            profileData.createdAt = serverTimestamp();
        }

        await setDoc(teacherRef, profileData, { merge: true });
        return { uid: user.uid, ...profileData };
    } catch (error) {
        console.error('교사 프로필 저장 실패:', error);
        return null;
    }
}

/**
 * 교사 프로필 가져오기
 */
export async function getTeacherProfile(uid) {
    if (!db || !uid) return null;

    try {
        const teacherRef = doc(db, 'teachers', uid);
        const teacherDoc = await getDoc(teacherRef);

        if (teacherDoc.exists()) {
            return { uid, ...teacherDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('교사 프로필 조회 실패:', error);
        return null;
    }
}

// ==================== 학급 관리 ====================

/**
 * 새 학급 코드 생성 (6자리 영숫자)
 */
export function generateClassCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * 현재 학급 ID 설정
 */
export function setCurrentClassId(classId) {
    currentClassId = classId;
    if (classId) {
        localStorage.setItem('classpet_current_class_id', classId);
    } else {
        localStorage.removeItem('classpet_current_class_id');
    }
}

/**
 * 현재 학급 ID 가져오기
 */
export function getCurrentClassId() {
    if (currentClassId) return currentClassId;
    currentClassId = localStorage.getItem('classpet_current_class_id');
    return currentClassId;
}

/**
 * 새 학급 생성
 */
export async function createClass(classData) {
    if (!db) return null;

    const user = getCurrentUser();
    if (!user || user.isAnonymous) {
        console.error('학급 생성: 교사 로그인 필요');
        return null;
    }

    try {
        // 고유한 학급 코드 생성
        let classCode = generateClassCode();
        let codeExists = true;
        let attempts = 0;

        while (codeExists && attempts < 10) {
            const codeRef = doc(db, 'classCodes', classCode);
            const codeDoc = await getDoc(codeRef);
            codeExists = codeDoc.exists();
            if (codeExists) {
                classCode = generateClassCode();
                attempts++;
            }
        }

        // 학급 문서 생성
        const classRef = doc(collection(db, 'classes'));
        const classId = classRef.id;

        const newClass = {
            ownerId: user.uid,
            classCode: classCode,
            className: classData.className || '우리 반',
            schoolYear: classData.schoolYear || new Date().getFullYear(),
            semester: classData.semester || 1,
            teacherName: classData.teacherName || user.displayName || '선생님',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(classRef, newClass);

        // 학급코드 → classId 매핑 저장
        await setDoc(doc(db, 'classCodes', classCode), {
            classId: classId,
            createdAt: serverTimestamp()
        });

        console.log('학급 생성 완료:', classId, classCode);
        return { id: classId, ...newClass };
    } catch (error) {
        console.error('학급 생성 실패:', error);
        return null;
    }
}

/**
 * 교사의 모든 학급 가져오기
 */
export async function getTeacherClasses(uid) {
    if (!db || !uid) return [];

    try {
        const classesRef = collection(db, 'classes');
        // orderBy 제거 (복합 인덱스 필요 없이 작동)
        const q = query(classesRef, where('ownerId', '==', uid));
        const snapshot = await getDocs(q);

        const classes = [];
        snapshot.forEach(doc => {
            classes.push({ id: doc.id, ...doc.data() });
        });

        // 클라이언트에서 정렬 (최신순)
        classes.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime - aTime;
        });

        return classes;
    } catch (error) {
        console.error('학급 목록 조회 실패:', error);
        return [];
    }
}

/**
 * 학급 정보 가져오기
 */
export async function getClass(classId) {
    if (!db || !classId) return null;

    try {
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);

        if (classDoc.exists()) {
            return { id: classDoc.id, ...classDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('학급 조회 실패:', error);
        return null;
    }
}

/**
 * 학급코드로 학급 ID 조회
 */
export async function getClassIdByCode(code) {
    if (!db || !code) return null;

    try {
        const codeRef = doc(db, 'classCodes', code.toUpperCase());
        const codeDoc = await getDoc(codeRef);

        if (codeDoc.exists()) {
            return codeDoc.data().classId;
        }
        return null;
    } catch (error) {
        console.error('학급코드 조회 실패:', error);
        return null;
    }
}

/**
 * 학급코드 유효성 검사
 */
export async function validateClassCode(code) {
    const classId = await getClassIdByCode(code);
    return !!classId;
}

/**
 * 학급 정보 업데이트
 */
export async function updateClass(classId, updates) {
    if (!db || !classId) return null;

    try {
        const classRef = doc(db, 'classes', classId);
        await updateDoc(classRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        return { id: classId, ...updates };
    } catch (error) {
        console.error('학급 업데이트 실패:', error);
        return null;
    }
}

/**
 * 학급 삭제
 */
export async function deleteClass(classId) {
    if (!db || !classId) return false;

    try {
        // 학급 정보 가져오기 (학급코드 확인용)
        const classData = await getClass(classId);

        // 학급 삭제
        await deleteDoc(doc(db, 'classes', classId));

        // 학급코드 매핑 삭제
        if (classData?.classCode) {
            await deleteDoc(doc(db, 'classCodes', classData.classCode));
        }

        console.log('학급 삭제 완료:', classId);
        return true;
    } catch (error) {
        console.error('학급 삭제 실패:', error);
        return false;
    }
}

// ==================== 학생 데이터 ====================

/**
 * 학생 저장
 */
export async function saveStudent(classId, student) {
    if (!db || !classId) return null;

    try {
        const studentId = String(student.id);
        const studentRef = doc(db, 'classes', classId, 'students', studentId);

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
 * 모든 학생 저장 (배치)
 */
export async function saveAllStudents(classId, students) {
    if (!db || !classId || !students?.length) return null;

    try {
        const promises = students.map(student => saveStudent(classId, student));
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
export async function getAllStudents(classId) {
    if (!db || !classId) return [];

    try {
        const studentsRef = collection(db, 'classes', classId, 'students');
        const snapshot = await getDocs(studentsRef);

        const students = [];
        snapshot.forEach(doc => {
            students.push({ id: parseInt(doc.id), ...doc.data() });
        });

        students.sort((a, b) => a.number - b.number);
        return students;
    } catch (error) {
        console.error('학생 목록 가져오기 실패:', error);
        return [];
    }
}

/**
 * 학생 삭제
 */
export async function deleteStudent(classId, studentId) {
    if (!db || !classId) return false;

    try {
        await deleteDoc(doc(db, 'classes', classId, 'students', String(studentId)));
        return true;
    } catch (error) {
        console.error('학생 삭제 실패:', error);
        return false;
    }
}

/**
 * 학생 데이터 실시간 구독
 */
export function subscribeToStudents(classId, callback) {
    if (!db || !classId) return null;

    try {
        const studentsRef = collection(db, 'classes', classId, 'students');
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
export async function saveEmotion(classId, emotion) {
    if (!db || !classId) return null;

    try {
        const emotionsRef = collection(db, 'classes', classId, 'emotions');

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
 * 감정 기록에 답장 추가
 */
export async function addReplyToEmotion(classId, emotionId, message) {
    if (!db || !classId || !emotionId) return null;

    try {
        const emotionRef = doc(db, 'classes', classId, 'emotions', emotionId);
        await updateDoc(emotionRef, {
            reply: {
                message: message,
                timestamp: new Date().toISOString(),
                read: false
            },
            updatedAt: serverTimestamp()
        });

        return { emotionId, reply: { message, read: false } };
    } catch (error) {
        console.error('답장 저장 실패:', error);
        return null;
    }
}

/**
 * 오늘의 감정 기록 가져오기
 */
export async function getTodayEmotions(classId) {
    if (!db || !classId) return [];

    try {
        const today = new Date().toISOString().split('T')[0];
        const emotionsRef = collection(db, 'classes', classId, 'emotions');
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
export async function getStudentEmotions(classId, studentId, limitCount = 30) {
    if (!db || !classId) return [];

    try {
        const emotionsRef = collection(db, 'classes', classId, 'emotions');
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
 * 날짜별 감정 기록 가져오기
 */
export async function getEmotionsByDate(classId, date) {
    if (!db || !classId) return [];

    try {
        const emotionsRef = collection(db, 'classes', classId, 'emotions');
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

/**
 * 감정 기록 실시간 구독 (오늘 기록)
 */
export function subscribeToTodayEmotions(classId, callback) {
    if (!db || !classId) return null;

    try {
        const today = new Date().toISOString().split('T')[0];
        const emotionsRef = collection(db, 'classes', classId, 'emotions');
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

// ==================== 칭찬 기록 ====================

/**
 * 칭찬 기록 저장
 */
export async function savePraise(classId, praise) {
    if (!db || !classId) return null;

    try {
        const praisesRef = collection(db, 'classes', classId, 'praises');

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
export async function getTodayPraises(classId) {
    if (!db || !classId) return [];

    try {
        const today = new Date().toISOString().split('T')[0];
        const praisesRef = collection(db, 'classes', classId, 'praises');
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

/**
 * 모든 칭찬 기록 가져오기
 */
export async function getAllPraises(classId, limitCount = 500) {
    if (!db || !classId) return [];

    try {
        const praisesRef = collection(db, 'classes', classId, 'praises');
        const q = query(
            praisesRef,
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const praises = [];
        snapshot.forEach(doc => {
            praises.push({ id: doc.id, ...doc.data() });
        });

        return praises;
    } catch (error) {
        console.error('칭찬 목록 가져오기 실패:', error);
        return [];
    }
}

// ==================== 시간표 ====================

/**
 * 시간표 저장
 */
export async function saveTimetable(classId, timetable) {
    if (!db || !classId) return null;

    try {
        const timetableRef = doc(db, 'classes', classId, 'timetable', 'schedule');
        await setDoc(timetableRef, {
            ...timetable,
            updatedAt: serverTimestamp()
        });

        return timetable;
    } catch (error) {
        console.error('시간표 저장 실패:', error);
        return null;
    }
}

/**
 * 시간표 가져오기
 */
export async function getTimetable(classId) {
    if (!db || !classId) return null;

    try {
        const timetableRef = doc(db, 'classes', classId, 'timetable', 'schedule');
        const timetableDoc = await getDoc(timetableRef);

        if (timetableDoc.exists()) {
            const data = timetableDoc.data();
            // updatedAt 필드 제외하고 반환
            const { updatedAt, ...timetable } = data;
            return timetable;
        }
        return null;
    } catch (error) {
        console.error('시간표 가져오기 실패:', error);
        return null;
    }
}

// ==================== 메모/노트 ====================

/**
 * 메모 저장
 */
export async function saveNote(classId, note) {
    if (!db || !classId) return null;

    try {
        const notesRef = collection(db, 'classes', classId, 'notes');

        const noteData = {
            ...note,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        if (note.id) {
            // 기존 노트 업데이트
            const noteRef = doc(db, 'classes', classId, 'notes', String(note.id));
            await setDoc(noteRef, noteData, { merge: true });
            return { id: note.id, ...noteData };
        } else {
            // 새 노트 생성
            const docRef = await addDoc(notesRef, noteData);
            return { id: docRef.id, ...noteData };
        }
    } catch (error) {
        console.error('메모 저장 실패:', error);
        return null;
    }
}

/**
 * 모든 메모 가져오기
 */
export async function getAllNotes(classId) {
    if (!db || !classId) return [];

    try {
        const notesRef = collection(db, 'classes', classId, 'notes');
        const q = query(notesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const notes = [];
        snapshot.forEach(doc => {
            notes.push({ id: doc.id, ...doc.data() });
        });

        return notes;
    } catch (error) {
        console.error('메모 목록 가져오기 실패:', error);
        return [];
    }
}

/**
 * 메모 삭제
 */
export async function deleteNote(classId, noteId) {
    if (!db || !classId) return false;

    try {
        await deleteDoc(doc(db, 'classes', classId, 'notes', String(noteId)));
        return true;
    } catch (error) {
        console.error('메모 삭제 실패:', error);
        return false;
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

// ==================== 레거시 호환 (기존 classCode 기반) ====================

// 기존 학급코드 (레거시 지원용)
let legacyClassCode = null;

/**
 * [레거시] 학급 코드 설정
 */
export function setClassCode(code) {
    legacyClassCode = code?.toUpperCase() || null;
    if (code) {
        localStorage.setItem('classpet_class_code', code.toUpperCase());
    } else {
        localStorage.removeItem('classpet_class_code');
    }
}

/**
 * [레거시] 저장된 학급 코드 가져오기
 */
export function getClassCode() {
    if (legacyClassCode) return legacyClassCode;
    legacyClassCode = localStorage.getItem('classpet_class_code');
    return legacyClassCode;
}

/**
 * Firebase 인스턴스 내보내기
 */
export { db, auth, app };

// 자동 초기화 시도
initializeFirebase();
