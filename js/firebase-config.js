/**
 * Firebase 설정 및 초기화
 * 계층 구조: /teachers/{uid}/classes/{classId}/students/{studentId}/emotions|praises|pets/...
 * 경로 자체가 소유권을 보장 (ownerId 필드 불필요)
 * Cross-student 쿼리는 collectionGroup + teacherUid/classId 필드 필터링
 * @updated 2025-01-24 - 학생 ID 처리 수정
 * @updated 2025-01-27 - pets 컬렉션 추가, emotions/praises 추가 조회 함수
 * @updated 2025-01-27 - 서브컬렉션 구조 변경 (emotions/praises/pets → students/{id}/하위)
 *
 * 필요한 Firebase collectionGroup 인덱스 (firestore.indexes.json):
 * ----------------------------------------
 * emotions collectionGroup:
 *   - (teacherUid ASC, classId ASC, date ASC, createdAt DESC)
 *   - (teacherUid ASC, classId ASC, emotion ASC, createdAt DESC)
 *   - (teacherUid ASC, classId ASC, date ASC, emotion ASC, createdAt DESC)
 *   - (teacherUid ASC, classId ASC, createdAt DESC)
 *
 * praises collectionGroup:
 *   - (teacherUid ASC, classId ASC, date ASC, createdAt DESC)
 *   - (teacherUid ASC, classId ASC, category ASC, createdAt DESC)
 *   - (teacherUid ASC, classId ASC, date ASC, category ASC, createdAt DESC)
 *   - (teacherUid ASC, classId ASC, createdAt DESC)
 *
 * Per-student 서브컬렉션 인덱스:
 *   emotions: (createdAt DESC)
 *   praises: (createdAt DESC), (category ASC, createdAt DESC)
 *   pets: (status ASC), (status ASC, completedAt DESC), (petType ASC, status ASC), (createdAt DESC)
 * ----------------------------------------
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
    Timestamp,
    collectionGroup
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getAuth,
    signInAnonymously,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
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

// Firebase 초기화
let app = null;
let db = null;
let auth = null;
let isInitialized = false;

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// 현재 학급 정보 (계층 구조용)
let currentClassId = null;
let currentTeacherUid = null;

// 실시간 리스너 해제 함수들
const unsubscribeFunctions = [];

// ==================== 서브컬렉션 헬퍼 ====================

/**
 * 학생 서브컬렉션 참조 헬퍼
 * 경로: /teachers/{uid}/classes/{classId}/students/{studentId}/{sub}
 */
function studentSubRef(uid, classId, studentId, sub) {
    return collection(db, 'teachers', uid, 'classes', classId, 'students', String(studentId), sub);
}

/**
 * 학생 서브컬렉션 문서 참조 헬퍼
 * 경로: /teachers/{uid}/classes/{classId}/students/{studentId}/{sub}/{docId}
 */
function studentSubDoc(uid, classId, studentId, sub, docId) {
    return doc(db, 'teachers', uid, 'classes', classId, 'students', String(studentId), sub, String(docId));
}

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

        // 인증 지속성 설정 (새로고침 후에도 로그인 유지)
        await setPersistence(auth, browserLocalPersistence);

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
 * Google 로그인 (팝업 우선, 실패 시 리다이렉트)
 * 시크릿 모드: 팝업 방식이 더 안정적
 * 일반 모드: COOP 문제 시 리다이렉트로 전환
 */
export async function signInWithGoogle() {
    if (!auth) return { success: false, error: 'Firebase가 초기화되지 않았습니다' };

    try {
        console.log('🔐 Google 팝업 로그인 시도...');
        const result = await signInWithPopup(auth, googleProvider);
        return await processGoogleSignInResult(result);
    } catch (error) {
        console.error('Google 팝업 로그인 오류:', error.code, error.message);

        // 팝업 차단/닫힘 시 리다이렉트로 전환
        if (error.code === 'auth/popup-blocked' ||
            error.code === 'auth/popup-closed-by-user' ||
            error.code === 'auth/cancelled-popup-request') {

            console.log('🔄 팝업 실패, 리다이렉트 방식으로 전환...');
            try {
                await signInWithRedirect(auth, googleProvider);
                return { success: false, pending: true, error: '리다이렉트 중...' };
            } catch (redirectError) {
                console.error('리다이렉트 로그인 오류:', redirectError);
                return { success: false, error: redirectError.message };
            }
        }

        // 그 외 오류는 그대로 반환
        return { success: false, error: error.message };
    }
}

/**
 * 리다이렉트 로그인 결과 처리 (페이지 로드 시 호출)
 */
export async function checkRedirectResult() {
    if (!auth) return null;

    try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
            console.log('🔐 리다이렉트 로그인 결과 처리...');
            return await processGoogleSignInResult(result);
        }
        return null;
    } catch (error) {
        console.error('리다이렉트 결과 처리 오류:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Google 로그인 결과 처리 (공통 로직)
 */
async function processGoogleSignInResult(result) {
    const user = result.user;

    // 교사 프로필 생성/업데이트
    await createOrUpdateTeacherProfile(user);

    // 교사 UID 설정 (계층 구조용)
    setCurrentTeacherUid(user.uid);

    console.log('✅ Google 로그인 성공:', user.email);

    // Firebase User 객체에서 필요한 속성만 추출
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous
    };

    return { success: true, user: userData };
}

/**
 * 로그아웃
 */
export async function firebaseSignOut() {
    if (!auth) return;

    try {
        await signOut(auth);
        currentClassId = null;
        currentTeacherUid = null;
        localStorage.removeItem('classpet_current_class_id');
        localStorage.removeItem('classpet_current_teacher_uid');
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
 * 현재 교사 UID 설정
 */
export function setCurrentTeacherUid(uid) {
    currentTeacherUid = uid;
    if (uid) {
        localStorage.setItem('classpet_current_teacher_uid', uid);
    } else {
        localStorage.removeItem('classpet_current_teacher_uid');
    }
}

/**
 * 현재 교사 UID 가져오기
 */
export function getCurrentTeacherUid() {
    if (currentTeacherUid) return currentTeacherUid;
    currentTeacherUid = localStorage.getItem('classpet_current_teacher_uid');
    return currentTeacherUid;
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
 * 현재 학급 전체 경로 (teacherUid + classId)
 */
export function getCurrentClassPath() {
    const teacherUid = getCurrentTeacherUid();
    const classId = getCurrentClassId();
    if (!teacherUid || !classId) return null;
    return { teacherUid, classId };
}

/**
 * 새 학급 생성 (계층 구조: /teachers/{uid}/classes/{classId})
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

        // 계층 구조: /teachers/{uid}/classes/{classId}
        const teacherUid = user.uid;
        const classRef = doc(collection(db, 'teachers', teacherUid, 'classes'));
        const classId = classRef.id;

        const newClass = {
            // ownerId 제거: 경로 자체가 소유권 보장
            classCode: classCode,
            className: classData.className || '우리 반',
            schoolYear: classData.schoolYear || new Date().getFullYear(),
            semester: classData.semester || 1,
            teacherName: classData.teacherName || user.displayName || '선생님',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(classRef, newClass);

        // 학급코드 → classId + teacherUid 매핑 저장 (학생 접속용)
        await setDoc(doc(db, 'classCodes', classCode), {
            teacherUid: teacherUid,
            classId: classId,
            createdAt: serverTimestamp()
        });

        // 학생 데이터가 있으면 학생들도 추가
        if (classData.students && Array.isArray(classData.students)) {
            const studentsRef = collection(db, 'teachers', teacherUid, 'classes', classId, 'students');

            for (const student of classData.students) {
                const studentDoc = doc(studentsRef);
                await setDoc(studentDoc, {
                    number: student.number,
                    name: student.name,
                    pin: student.pin || String(student.number).padStart(4, '0'),
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            console.log(`학생 ${classData.students.length}명 추가 완료`);
        }

        // 현재 교사 UID 저장
        setCurrentTeacherUid(teacherUid);

        console.log('학급 생성 완료:', teacherUid, classId, classCode);
        return { id: classId, teacherUid, studentCount: classData.students?.length || 0, ...newClass };
    } catch (error) {
        console.error('학급 생성 실패:', error);
        return null;
    }
}

/**
 * 교사의 모든 학급 가져오기 (계층 구조: /teachers/{uid}/classes)
 */
export async function getTeacherClasses(uid) {
    if (!db || !uid) return [];

    try {
        // 계층 구조: 경로 자체로 소유권 보장, where 쿼리 불필요
        const classesRef = collection(db, 'teachers', uid, 'classes');
        const snapshot = await getDocs(classesRef);

        const classes = [];
        snapshot.forEach(doc => {
            classes.push({ id: doc.id, teacherUid: uid, ...doc.data() });
        });

        // 각 학급의 학생 수 가져오기
        for (const cls of classes) {
            const studentsRef = collection(db, 'teachers', uid, 'classes', cls.id, 'students');
            const studentsSnapshot = await getDocs(studentsRef);
            cls.studentCount = studentsSnapshot.size;
        }

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
 * 학급 정보 가져오기 (계층 구조: /teachers/{uid}/classes/{classId})
 * @param {string} teacherUid - 교사 UID (null이면 현재 저장된 값 사용)
 * @param {string} classId - 학급 ID
 */
export async function getClass(teacherUid, classId) {
    if (!db) return null;

    // teacherUid가 없으면 현재 저장된 값 사용
    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const classRef = doc(db, 'teachers', uid, 'classes', cId);
        const classDoc = await getDoc(classRef);

        if (classDoc.exists()) {
            return { id: classDoc.id, teacherUid: uid, ...classDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('학급 조회 실패:', error);
        return null;
    }
}

/**
 * 학급코드로 학급 정보 조회 (계층 구조용: teacherUid + classId 반환)
 * @returns {{ teacherUid: string, classId: string } | null}
 */
export async function getClassIdByCode(code) {
    if (!db || !code) return null;

    try {
        const codeRef = doc(db, 'classCodes', code.toUpperCase());
        const codeDoc = await getDoc(codeRef);

        if (codeDoc.exists()) {
            const data = codeDoc.data();
            return {
                teacherUid: data.teacherUid,
                classId: data.classId
            };
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
    const result = await getClassIdByCode(code);
    return !!result && !!result.classId && !!result.teacherUid;
}

/**
 * 학급 정보 업데이트 (계층 구조)
 * @param {string} teacherUid - 교사 UID (null이면 현재 저장된 값 사용)
 * @param {string} classId - 학급 ID
 * @param {object} updates - 업데이트할 데이터
 */
export async function updateClass(teacherUid, classId, updates) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const classRef = doc(db, 'teachers', uid, 'classes', cId);
        await updateDoc(classRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        return { id: cId, teacherUid: uid, ...updates };
    } catch (error) {
        console.error('학급 업데이트 실패:', error);
        return null;
    }
}

/**
 * 학급 삭제 (계층 구조)
 * @param {string} teacherUid - 교사 UID (null이면 현재 저장된 값 사용)
 * @param {string} classId - 학급 ID
 */
export async function deleteClass(teacherUid, classId) {
    if (!db) return false;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return false;

    try {
        // 학급 정보 가져오기 (학급코드 확인용)
        const classData = await getClass(uid, cId);

        // 학급 삭제
        await deleteDoc(doc(db, 'teachers', uid, 'classes', cId));

        // 학급코드 매핑 삭제
        if (classData?.classCode) {
            await deleteDoc(doc(db, 'classCodes', classData.classCode));
        }

        console.log('학급 삭제 완료:', uid, cId);
        return true;
    } catch (error) {
        console.error('학급 삭제 실패:', error);
        return false;
    }
}

// ==================== 학생 데이터 (계층 구조) ====================

/**
 * 학생 저장 (계층 구조: /teachers/{uid}/classes/{classId}/students/{studentId})
 * @param {string} teacherUid - 교사 UID (null이면 현재 저장된 값 사용)
 * @param {string} classId - 학급 ID (null이면 현재 저장된 값 사용)
 * @param {object} student - 학생 데이터
 */
export async function saveStudent(teacherUid, classId, student) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const studentId = String(student.id);
        const studentRef = doc(db, 'teachers', uid, 'classes', cId, 'students', studentId);

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
 * 모든 학생 저장 (배치, 계층 구조)
 */
export async function saveAllStudents(teacherUid, classId, students) {
    if (!db || !students?.length) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const promises = students.map(student => saveStudent(uid, cId, student));
        await Promise.all(promises);
        return students;
    } catch (error) {
        console.error('학생 일괄 저장 실패:', error);
        return null;
    }
}

/**
 * 모든 학생 가져오기 (계층 구조)
 */
export async function getAllStudents(teacherUid, classId) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const studentsRef = collection(db, 'teachers', uid, 'classes', cId, 'students');
        const snapshot = await getDocs(studentsRef);

        const students = [];
        snapshot.forEach(doc => {
            const numericId = parseInt(doc.id);
            const id = isNaN(numericId) ? doc.id : numericId;
            students.push({ ...doc.data(), id });
        });

        students.sort((a, b) => a.number - b.number);
        return students;
    } catch (error) {
        console.error('학생 목록 가져오기 실패:', error);
        return [];
    }
}

/**
 * 학생 삭제 (계층 구조)
 */
export async function deleteStudent(teacherUid, classId, studentId) {
    if (!db) return false;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return false;

    try {
        await deleteDoc(doc(db, 'teachers', uid, 'classes', cId, 'students', String(studentId)));
        return true;
    } catch (error) {
        console.error('학생 삭제 실패:', error);
        return false;
    }
}

/**
 * 학생 데이터 실시간 구독 (계층 구조)
 */
export function subscribeToStudents(teacherUid, classId, callback) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const studentsRef = collection(db, 'teachers', uid, 'classes', cId, 'students');
        const unsubscribe = onSnapshot(studentsRef, (snapshot) => {
            const students = [];
            snapshot.forEach(doc => {
                const numericId = parseInt(doc.id);
                const id = isNaN(numericId) ? doc.id : numericId;
                students.push({ ...doc.data(), id });
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

// ==================== 감정 기록 (계층 구조) ====================
// conversations 배열 구조: 학생 메시지 + 교사 답장이 쌍으로 매칭

/**
 * 감정 기록 저장 (계층 구조: /teachers/{uid}/classes/{classId}/emotions/{emotionId})
 * conversations 배열 구조 사용
 */
export async function saveEmotion(teacherUid, classId, emotion) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const studentId = emotion.studentId;
        const emotionsRef = studentSubRef(uid, cId, studentId, 'emotions');
        const now = new Date().toISOString();

        const emotionData = {
            studentId: emotion.studentId,
            studentName: emotion.studentName,
            studentNumber: emotion.studentNumber,
            emotion: emotion.emotion,
            date: emotion.timestamp?.split('T')[0] || now.split('T')[0],
            // collectionGroup 쿼리용 필드
            teacherUid: uid,
            classId: cId,
            // conversations 배열: 메모-답장 쌍으로 저장
            conversations: [
                {
                    studentMessage: emotion.memo || null,
                    studentAt: now,
                    teacherReply: null,
                    replyAt: null,
                    read: false
                }
            ],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(emotionsRef, emotionData);
        return { id: docRef.id, ...emotionData };
    } catch (error) {
        console.error('감정 저장 실패:', error);
        return null;
    }
}

/**
 * 감정 기록에 교사 답장 추가 (conversations 배열의 특정 항목에)
 * @param {number} conversationIndex - conversations 배열 내 인덱스 (기본: 마지막 항목)
 */
export async function addReplyToEmotion(teacherUid, classId, studentId, emotionId, message, conversationIndex = -1) {
    if (!db || !emotionId || !studentId) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const emotionRef = studentSubDoc(uid, cId, studentId, 'emotions', emotionId);

        // 먼저 현재 문서 가져오기
        const emotionDoc = await getDoc(emotionRef);
        if (!emotionDoc.exists()) {
            console.error('감정 문서를 찾을 수 없음:', emotionId);
            return null;
        }

        const data = emotionDoc.data();
        const conversations = data.conversations || [];

        // 답장할 대화 인덱스 결정 (기본: 마지막 항목)
        const targetIndex = conversationIndex === -1 ? conversations.length - 1 : conversationIndex;

        if (targetIndex < 0 || targetIndex >= conversations.length) {
            console.error('유효하지 않은 대화 인덱스:', targetIndex);
            return null;
        }

        // 해당 대화에 답장 추가
        conversations[targetIndex].teacherReply = message;
        conversations[targetIndex].replyAt = new Date().toISOString();
        conversations[targetIndex].read = false;

        await updateDoc(emotionRef, {
            conversations: conversations,
            updatedAt: serverTimestamp()
        });

        return { emotionId, conversationIndex: targetIndex, reply: message };
    } catch (error) {
        console.error('답장 저장 실패:', error);
        return null;
    }
}

/**
 * 학생 추가 메시지 보내기 (conversations 배열에 새 항목 추가)
 */
export async function addStudentMessage(teacherUid, classId, studentId, emotionId, message) {
    if (!db || !emotionId || !message || !studentId) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const emotionRef = studentSubDoc(uid, cId, studentId, 'emotions', emotionId);

        // 현재 문서 가져오기
        const emotionDoc = await getDoc(emotionRef);
        if (!emotionDoc.exists()) {
            console.error('감정 문서를 찾을 수 없음:', emotionId);
            return null;
        }

        const data = emotionDoc.data();
        const conversations = data.conversations || [];

        // 새 대화 항목 추가
        const newConversation = {
            studentMessage: message,
            studentAt: new Date().toISOString(),
            teacherReply: null,
            replyAt: null,
            read: false
        };

        conversations.push(newConversation);

        await updateDoc(emotionRef, {
            conversations: conversations,
            updatedAt: serverTimestamp()
        });

        return { emotionId, conversationIndex: conversations.length - 1, message };
    } catch (error) {
        console.error('학생 메시지 추가 실패:', error);
        return null;
    }
}

/**
 * 오늘의 감정 기록 가져오기 (계층 구조)
 */
export async function getTodayEmotions(teacherUid, classId) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const today = new Date().toISOString().split('T')[0];
        const emotionsGroup = collectionGroup(db, 'emotions');
        const q = query(
            emotionsGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
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
 * 특정 학생의 감정 기록 가져오기 (계층 구조)
 */
export async function getStudentEmotions(teacherUid, classId, studentId, limitCount = 30) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const emotionsRef = studentSubRef(uid, cId, studentId, 'emotions');
        const q = query(
            emotionsRef,
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
 * 날짜별 감정 기록 가져오기 (계층 구조)
 */
export async function getEmotionsByDate(teacherUid, classId, date) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const emotionsGroup = collectionGroup(db, 'emotions');
        const q = query(
            emotionsGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
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
 * 감정 기록 실시간 구독 (오늘 기록, 계층 구조)
 */
export function subscribeToTodayEmotions(teacherUid, classId, callback) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const today = new Date().toISOString().split('T')[0];
        const emotionsGroup = collectionGroup(db, 'emotions');
        const q = query(
            emotionsGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
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
 * 감정 타입별 기록 가져오기 (계층 구조)
 * @param {string} emotionType - 감정 타입 (great|good|soso|bad|terrible)
 */
export async function getEmotionsByType(teacherUid, classId, emotionType, limitCount = 100) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !emotionType) return [];

    try {
        const emotionsGroup = collectionGroup(db, 'emotions');
        const q = query(
            emotionsGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('emotion', '==', emotionType),
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
        console.error('감정 타입별 조회 실패:', error);
        return [];
    }
}

/**
 * 날짜 + 감정 타입별 기록 가져오기 (계층 구조)
 */
export async function getEmotionsByDateAndType(teacherUid, classId, date, emotionType) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !date || !emotionType) return [];

    try {
        const emotionsGroup = collectionGroup(db, 'emotions');
        const q = query(
            emotionsGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('date', '==', date),
            where('emotion', '==', emotionType),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const emotions = [];
        snapshot.forEach(doc => {
            emotions.push({ id: doc.id, ...doc.data() });
        });

        return emotions;
    } catch (error) {
        console.error('날짜+감정 타입별 조회 실패:', error);
        return [];
    }
}

/**
 * 학생의 미읽은 답장 수 가져오기 (conversations 배열 구조)
 * conversations 배열 내 teacherReply가 있고 read가 false인 항목 수 카운트
 */
export async function getUnreadReplyCount(teacherUid, classId, studentId) {
    if (!db) return 0;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return 0;

    try {
        const emotionsRef = studentSubRef(uid, cId, studentId, 'emotions');
        const snapshot = await getDocs(emotionsRef);
        let unreadCount = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            const conversations = data.conversations || [];
            conversations.forEach(conv => {
                // teacherReply가 있고 아직 읽지 않은 경우
                if (conv.teacherReply && !conv.read) {
                    unreadCount++;
                }
            });
        });

        return unreadCount;
    } catch (error) {
        console.error('미읽은 답장 수 조회 실패:', error);
        return 0;
    }
}

/**
 * 감정 기록 답장 읽음 처리 (conversations 배열 구조)
 * @param {number} conversationIndex - 읽음 처리할 대화 인덱스 (-1이면 모든 대화)
 */
export async function markEmotionReplyAsRead(teacherUid, classId, studentId, emotionId, conversationIndex = -1) {
    if (!db || !emotionId || !studentId) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const emotionRef = studentSubDoc(uid, cId, studentId, 'emotions', emotionId);

        // 현재 문서 가져오기
        const emotionDoc = await getDoc(emotionRef);
        if (!emotionDoc.exists()) return null;

        const data = emotionDoc.data();
        const conversations = data.conversations || [];

        if (conversationIndex === -1) {
            // 모든 대화의 읽음 처리
            conversations.forEach(conv => {
                if (conv.teacherReply) {
                    conv.read = true;
                }
            });
        } else if (conversationIndex >= 0 && conversationIndex < conversations.length) {
            // 특정 대화만 읽음 처리
            conversations[conversationIndex].read = true;
        }

        await updateDoc(emotionRef, {
            conversations: conversations,
            updatedAt: serverTimestamp()
        });

        return { emotionId, read: true };
    } catch (error) {
        console.error('답장 읽음 처리 실패:', error);
        return null;
    }
}

// ==================== 칭찬 기록 (계층 구조) ====================

/**
 * 칭찬 기록 저장 (계층 구조: /teachers/{uid}/classes/{classId}/praises/{praiseId})
 */
export async function savePraise(teacherUid, classId, praise) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const studentId = praise.studentId;
        const praisesRef = studentSubRef(uid, cId, studentId, 'praises');

        const praiseData = {
            ...praise,
            date: praise.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0],
            // collectionGroup 쿼리용 필드
            teacherUid: uid,
            classId: cId,
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
 * 오늘의 칭찬 기록 가져오기 (계층 구조)
 */
export async function getTodayPraises(teacherUid, classId) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const today = new Date().toISOString().split('T')[0];
        const praisesGroup = collectionGroup(db, 'praises');
        const q = query(
            praisesGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
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
 * 모든 칭찬 기록 가져오기 (계층 구조)
 */
export async function getAllPraises(teacherUid, classId, limitCount = 500) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const praisesGroup = collectionGroup(db, 'praises');
        const q = query(
            praisesGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
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

/**
 * 카테고리별 칭찬 기록 가져오기 (계층 구조)
 * @param {string} category - 칭찬 카테고리 (selfManagement|knowledge|creative|aesthetic|cooperation|community)
 */
export async function getPraisesByCategory(teacherUid, classId, category, limitCount = 100) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !category) return [];

    try {
        const praisesGroup = collectionGroup(db, 'praises');
        const q = query(
            praisesGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('category', '==', category),
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
        console.error('카테고리별 칭찬 조회 실패:', error);
        return [];
    }
}

/**
 * 날짜별 칭찬 기록 가져오기 (계층 구조)
 */
export async function getPraisesByDate(teacherUid, classId, date) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !date) return [];

    try {
        const praisesGroup = collectionGroup(db, 'praises');
        const q = query(
            praisesGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('date', '==', date),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const praises = [];
        snapshot.forEach(doc => {
            praises.push({ id: doc.id, ...doc.data() });
        });

        return praises;
    } catch (error) {
        console.error('날짜별 칭찬 조회 실패:', error);
        return [];
    }
}

/**
 * 날짜 + 카테고리별 칭찬 기록 가져오기 (계층 구조)
 */
export async function getPraisesByDateAndCategory(teacherUid, classId, date, category) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !date || !category) return [];

    try {
        const praisesGroup = collectionGroup(db, 'praises');
        const q = query(
            praisesGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('date', '==', date),
            where('category', '==', category),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const praises = [];
        snapshot.forEach(doc => {
            praises.push({ id: doc.id, ...doc.data() });
        });

        return praises;
    } catch (error) {
        console.error('날짜+카테고리별 칭찬 조회 실패:', error);
        return [];
    }
}

/**
 * 특정 학생이 받은 칭찬 기록 가져오기 (계층 구조)
 */
export async function getStudentPraises(teacherUid, classId, studentId, limitCount = 100) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return [];

    try {
        const praisesRef = studentSubRef(uid, cId, studentId, 'praises');
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
        console.error('학생별 칭찬 조회 실패:', error);
        return [];
    }
}

/**
 * 특정 학생의 카테고리별 칭찬 기록 가져오기 (계층 구조)
 */
export async function getStudentPraisesByCategory(teacherUid, classId, studentId, category) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId || !category) return [];

    try {
        const praisesRef = studentSubRef(uid, cId, studentId, 'praises');
        const q = query(
            praisesRef,
            where('category', '==', category),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const praises = [];
        snapshot.forEach(doc => {
            praises.push({ id: doc.id, ...doc.data() });
        });

        return praises;
    } catch (error) {
        console.error('학생+카테고리별 칭찬 조회 실패:', error);
        return [];
    }
}

// ==================== 시간표 (계층 구조) ====================

/**
 * 시간표 저장 (계층 구조: /teachers/{uid}/classes/{classId}/timetable/schedule)
 */
export async function saveTimetable(teacherUid, classId, timetable) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const timetableRef = doc(db, 'teachers', uid, 'classes', cId, 'timetable', 'schedule');
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
 * 시간표 가져오기 (계층 구조)
 */
export async function getTimetable(teacherUid, classId) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const timetableRef = doc(db, 'teachers', uid, 'classes', cId, 'timetable', 'schedule');
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

/**
 * 시간표 오버라이드 저장 (계층 구조: /teachers/{uid}/classes/{classId}/timetable/overrides)
 * @param {object} overrides - { "2025-W04": { "mon-1": {subject: "체육"} }, ... }
 */
export async function saveTimetableOverrides(teacherUid, classId, overrides) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const overridesRef = doc(db, 'teachers', uid, 'classes', cId, 'timetable', 'overrides');
        await setDoc(overridesRef, {
            data: overrides,
            updatedAt: serverTimestamp()
        });

        console.log('시간표 오버라이드 저장 완료');
        return overrides;
    } catch (error) {
        console.error('시간표 오버라이드 저장 실패:', error);
        return null;
    }
}

/**
 * 시간표 오버라이드 가져오기 (계층 구조)
 * @returns {object} - { "2025-W04": { "mon-1": {subject: "체육"} }, ... }
 */
export async function getTimetableOverrides(teacherUid, classId) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const overridesRef = doc(db, 'teachers', uid, 'classes', cId, 'timetable', 'overrides');
        const overridesDoc = await getDoc(overridesRef);

        if (overridesDoc.exists()) {
            return overridesDoc.data().data || {};
        }
        return {};
    } catch (error) {
        console.error('시간표 오버라이드 가져오기 실패:', error);
        return {};
    }
}

// ==================== 과목 색상 (계층 구조) ====================

/**
 * 과목 색상 저장 (계층 구조: /teachers/{uid}/classes/{classId}/timetable/subjectColors)
 */
export async function saveSubjectColors(teacherUid, classId, colors) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const colorsRef = doc(db, 'teachers', uid, 'classes', cId, 'timetable', 'subjectColors');
        await setDoc(colorsRef, {
            data: colors,
            updatedAt: serverTimestamp()
        });
        return colors;
    } catch (error) {
        console.error('과목 색상 저장 실패:', error);
        return null;
    }
}

/**
 * 과목 색상 가져오기 (계층 구조: /teachers/{uid}/classes/{classId}/timetable/subjectColors)
 */
export async function getSubjectColors(teacherUid, classId) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const colorsRef = doc(db, 'teachers', uid, 'classes', cId, 'timetable', 'subjectColors');
        const colorsDoc = await getDoc(colorsRef);

        if (colorsDoc.exists()) {
            return colorsDoc.data().data || {};
        }
        return null;
    } catch (error) {
        console.error('과목 색상 가져오기 실패:', error);
        return null;
    }
}

// ==================== 메모/노트 (계층 구조) ====================

/**
 * 메모 저장 (계층 구조: /teachers/{uid}/classes/{classId}/notes/{noteId})
 */
export async function saveNote(teacherUid, classId, note) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const notesRef = collection(db, 'teachers', uid, 'classes', cId, 'notes');

        const noteData = {
            ...note,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        if (note.id) {
            // 기존 노트 업데이트
            const noteRef = doc(db, 'teachers', uid, 'classes', cId, 'notes', String(note.id));
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
 * 모든 메모 가져오기 (계층 구조)
 */
export async function getAllNotes(teacherUid, classId) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const notesRef = collection(db, 'teachers', uid, 'classes', cId, 'notes');
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
 * 메모 삭제 (계층 구조)
 */
export async function deleteNote(teacherUid, classId, noteId) {
    if (!db) return false;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return false;

    try {
        await deleteDoc(doc(db, 'teachers', uid, 'classes', cId, 'notes', String(noteId)));
        return true;
    } catch (error) {
        console.error('메모 삭제 실패:', error);
        return false;
    }
}

// ==================== 펫 관리 (계층 구조) ====================

/**
 * 펫 저장/생성 (계층 구조: /teachers/{uid}/classes/{classId}/pets/{petId})
 * @param {string} teacherUid - 교사 UID
 * @param {string} classId - 학급 ID
 * @param {object} pet - 펫 데이터
 */
export async function savePet(teacherUid, classId, pet) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const studentId = pet.studentId;
        const petsRef = studentSubRef(uid, cId, studentId, 'pets');

        const petData = {
            ...pet,
            // collectionGroup 쿼리용 필드
            teacherUid: uid,
            classId: cId,
            createdAt: pet.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        if (pet.id) {
            // 기존 펫 업데이트
            const petRef = studentSubDoc(uid, cId, studentId, 'pets', pet.id);
            await setDoc(petRef, petData, { merge: true });
            return { id: pet.id, ...petData };
        } else {
            // 새 펫 생성
            const docRef = await addDoc(petsRef, petData);
            return { id: docRef.id, ...petData };
        }
    } catch (error) {
        console.error('펫 저장 실패:', error);
        return null;
    }
}

/**
 * 학생의 현재 활성 펫 가져오기
 * @param {string} teacherUid - 교사 UID
 * @param {string} classId - 학급 ID
 * @param {string} studentId - 학생 ID
 */
export async function getActivePet(teacherUid, classId, studentId) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return null;

    try {
        const petsRef = studentSubRef(uid, cId, studentId, 'pets');
        const q = query(
            petsRef,
            where('status', '==', 'active'),
            limit(1)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('활성 펫 조회 실패:', error);
        return null;
    }
}

/**
 * 학생의 완성된 펫 도감 가져오기
 * @param {string} teacherUid - 교사 UID
 * @param {string} classId - 학급 ID
 * @param {string} studentId - 학생 ID
 */
export async function getCompletedPets(teacherUid, classId, studentId) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return [];

    try {
        const petsRef = studentSubRef(uid, cId, studentId, 'pets');
        const q = query(
            petsRef,
            where('status', '==', 'completed'),
            orderBy('completedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const pets = [];
        snapshot.forEach(doc => {
            pets.push({ id: doc.id, ...doc.data() });
        });
        return pets;
    } catch (error) {
        console.error('완성 펫 조회 실패:', error);
        return [];
    }
}

/**
 * 학생의 모든 펫 가져오기 (현재 + 완성)
 * @param {string} teacherUid - 교사 UID
 * @param {string} classId - 학급 ID
 * @param {string} studentId - 학생 ID
 */
export async function getStudentPets(teacherUid, classId, studentId) {
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return [];

    try {
        const petsRef = studentSubRef(uid, cId, studentId, 'pets');
        const q = query(
            petsRef,
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const pets = [];
        snapshot.forEach(doc => {
            pets.push({ id: doc.id, ...doc.data() });
        });
        return pets;
    } catch (error) {
        console.error('학생 펫 목록 조회 실패:', error);
        return [];
    }
}

/**
 * 특정 종류 펫 완성 여부 확인
 * @param {string} teacherUid - 교사 UID
 * @param {string} classId - 학급 ID
 * @param {string} studentId - 학생 ID
 * @param {string} petType - 펫 종류
 */
export async function hasCompletedPetType(teacherUid, classId, studentId, petType) {
    if (!db) return false;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId || !petType) return false;

    try {
        const petsRef = studentSubRef(uid, cId, studentId, 'pets');
        const q = query(
            petsRef,
            where('petType', '==', petType),
            where('status', '==', 'completed'),
            limit(1)
        );

        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('펫 완성 여부 확인 실패:', error);
        return false;
    }
}

/**
 * 펫 경험치/레벨 업데이트
 * @param {string} teacherUid - 교사 UID
 * @param {string} classId - 학급 ID
 * @param {string} petId - 펫 ID
 * @param {object} updates - { exp, level, status?, completedAt? }
 */
export async function updatePet(teacherUid, classId, studentId, petId, updates) {
    if (!db || !petId || !studentId) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const petRef = studentSubDoc(uid, cId, studentId, 'pets', petId);
        await updateDoc(petRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        return { id: petId, ...updates };
    } catch (error) {
        console.error('펫 업데이트 실패:', error);
        return null;
    }
}

/**
 * 펫 삭제
 * @param {string} teacherUid - 교사 UID
 * @param {string} classId - 학급 ID
 * @param {string} petId - 펫 ID
 */
export async function deletePet(teacherUid, classId, studentId, petId) {
    if (!db || !petId || !studentId) return false;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return false;

    try {
        await deleteDoc(studentSubDoc(uid, cId, studentId, 'pets', petId));
        return true;
    } catch (error) {
        console.error('펫 삭제 실패:', error);
        return false;
    }
}

/**
 * 펫 데이터 실시간 구독 (특정 학생)
 */
export function subscribeToStudentPets(teacherUid, classId, studentId, callback) {
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return null;

    try {
        const petsRef = studentSubRef(uid, cId, studentId, 'pets');
        const q = query(
            petsRef,
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pets = [];
            snapshot.forEach(doc => {
                pets.push({ id: doc.id, ...doc.data() });
            });
            callback(pets);
        }, (error) => {
            console.error('펫 구독 오류:', error);
        });

        unsubscribeFunctions.push(unsubscribe);
        return unsubscribe;
    } catch (error) {
        console.error('펫 구독 실패:', error);
        return null;
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
