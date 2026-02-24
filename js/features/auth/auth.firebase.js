/**
 * Firebase 인증 모듈
 */

import {
    signInAnonymously,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    doc,
    getDoc,
    setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getDb,
    getAuthInstance,
    setCurrentTeacherUid,
    clearCurrentSession,
    serverTimestamp
} from '../../shared/firebase/init.js';

const googleProvider = new GoogleAuthProvider();

/**
 * Google 로그인 결과 처리 (공통 로직)
 */
async function processGoogleSignInResult(result) {
    const user = result.user;

    await createOrUpdateTeacherProfile(user);
    setCurrentTeacherUid(user.uid);

    console.log('✅ Google 로그인 성공:', user.email);

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
 * Google 로그인 (팝업 우선, 실패 시 리다이렉트)
 */
export async function signInWithGoogle() {
    const auth = getAuthInstance();
    if (!auth) return { success: false, error: 'Firebase가 초기화되지 않았습니다' };

    try {
        console.log('🔐 Google 팝업 로그인 시도...');
        const result = await signInWithPopup(auth, googleProvider);
        return await processGoogleSignInResult(result);
    } catch (error) {
        console.error('Google 팝업 로그인 오류:', error.code, error.message);

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

        return { success: false, error: error.message };
    }
}

/**
 * 리다이렉트 로그인 결과 처리
 */
export async function checkRedirectResult() {
    const auth = getAuthInstance();
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
 * 로그아웃
 */
export async function firebaseSignOut() {
    const auth = getAuthInstance();
    if (!auth) return;

    try {
        await signOut(auth);
        clearCurrentSession();
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
    const auth = getAuthInstance();
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

export function getCurrentUser() {
    return getAuthInstance()?.currentUser || null;
}

export function onAuthChange(callback) {
    const auth = getAuthInstance();
    if (!auth) return null;
    return onAuthStateChanged(auth, callback);
}

export function isTeacherUser() {
    const user = getCurrentUser();
    return user && !user.isAnonymous;
}

/**
 * 교사 프로필 생성/업데이트
 */
export async function createOrUpdateTeacherProfile(user) {
    const db = getDb();
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
    const db = getDb();
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
