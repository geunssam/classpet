/**
 * 인증 관련 Mixin
 * Google 로그인/로그아웃, 인증 상태 관리
 */

import { firebase, SESSION_KEYS, STORAGE_KEYS } from '../../shared/store/Store.js';

export const authMixin = {
    /**
     * Google 로그인
     */
    async signInWithGoogle() {
        try {
            const result = await firebase.signInWithGoogle();

            // user 객체가 있으면 성공으로 처리 (success 플래그와 무관하게)
            const user = result?.user;
            if (user) {
                this.firebaseEnabled = true;

                // 교사 UID 저장 (계층 구조용)
                this.setCurrentTeacherUid(user.uid);

                // 교사 세션 저장 (Google 로그인 정보 포함)
                const teacherSession = {
                    isLoggedIn: true,
                    isGoogleAuth: true,
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    loginTime: Date.now()
                };
                sessionStorage.setItem(SESSION_KEYS.TEACHER_SESSION, JSON.stringify(teacherSession));

                // 인증 상태 변경 알림
                this.notify('auth', { isLoggedIn: true, user: user });
                this.notify('teacherLogin', teacherSession);

                return { success: true, user: user, needsTermsAgreement: result.needsTermsAgreement ?? false };
            }

            // 리다이렉트 중인 경우 (pending 상태)
            if (result?.pending) {
                return { success: false, pending: true };
            }

            return { success: false, error: result?.error || '로그인에 실패했어요' };
        } catch (error) {
            console.error('Google 로그인 실패:', error);
            throw error;
        }
    },

    /**
     * 리다이렉트 로그인 결과 확인 (페이지 로드 시)
     */
    async checkRedirectResult() {
        try {
            const result = await firebase.checkRedirectResult();
            if (result?.success && result?.user) {
                const user = result.user;
                this.firebaseEnabled = true;
                this.setCurrentTeacherUid(user.uid);

                const teacherSession = {
                    isLoggedIn: true,
                    isGoogleAuth: true,
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    loginTime: Date.now()
                };
                sessionStorage.setItem(SESSION_KEYS.TEACHER_SESSION, JSON.stringify(teacherSession));
                this.notify('auth', { isLoggedIn: true, user: user });
                this.notify('teacherLogin', teacherSession);

                console.log('✅ 리다이렉트 로그인 완료:', user.email);
                return { success: true, user: user, needsTermsAgreement: result.needsTermsAgreement ?? false };
            }
            return null;
        } catch (error) {
            console.error('리다이렉트 결과 확인 실패:', error);
            return null;
        }
    },

    /**
     * 로그아웃
     */
    async signOut() {
        try {
            // 모든 Firebase 실시간 구독 해제
            this.unsubscribeAllFirebase();
            await firebase.firebaseSignOut();
            this.currentClassId = null;
            this.currentTeacherUid = null;
            this.currentClassData = null;
            this.teacherLogout();
            this.studentLogout();
            localStorage.removeItem(STORAGE_KEYS.CURRENT_CLASS_ID);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_TEACHER_UID);

            // 인증 상태 변경 알림
            this.notify('auth', { isLoggedIn: false, user: null });
        } catch (error) {
            console.error('로그아웃 실패:', error);
            throw error;
        }
    },

    /**
     * 현재 Firebase 사용자
     */
    getCurrentUser() {
        return firebase.getCurrentUser();
    },

    /**
     * 교사인지 확인 (Google 로그인)
     */
    isGoogleTeacher() {
        // Firebase 인증 상태 먼저 확인
        if (firebase.isTeacherUser()) {
            return true;
        }

        // 세션 스토리지에서 Google 로그인 정보 확인 (페이지 새로고침 시)
        const session = this.getTeacherSession();
        return session?.isGoogleAuth === true;
    },

    /**
     * 인증 상태 리스너
     */
    onAuthChange(callback) {
        return firebase.onAuthChange(callback);
    },

    /**
     * 인증 로딩 상태 설정
     */
    setAuthLoading(loading) {
        this.authLoading = loading;
        this.notify('authLoading', loading);
    },

    /**
     * 인증 로딩 상태 확인
     */
    isAuthLoading() {
        return this.authLoading;
    }
};
