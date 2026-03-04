/**
 * 앱 초기화
 * Firebase 인증 대기, 초기 라우트 결정, 앱 시작
 */

import { store } from '../store.js';
import { router } from '../router.js';
import { initRouter } from './routes.js';
import { bindNavigation, updateClassInfo } from './navigation.js';
import { bindHeaderButtons, updateCurrentDate } from './header.js';
import { registerGlobalFunctions, refreshCurrentView } from './globalFunctions.js';
import { startEmotionSubscription, stopEmotionSubscription } from '../features/emotion/EmotionService.js';
import { startPetSubscription, stopPetSubscription } from '../features/pet/PetService.js';
import { initSessionTimeout } from '../features/emotion/sessionTimeout.js';
import { hasAgreedToTerms } from '../firebase-config.js';
import { showToast } from '../shared/utils/animations.js';

/**
 * Firebase 서비스 구독 시작 + store에 정리 함수 등록
 * unsubscribeAllFirebase() 호출 시 서비스 구독도 함께 해제됨
 */
function startFirebaseServices() {
    startEmotionSubscription();
    startPetSubscription();
    store.firebaseListeners.push(stopEmotionSubscription, stopPetSubscription);
}

/**
 * 앱 초기화
 */
async function initApp() {
    // 초기 상태: 헤더와 툴바 강제 숨김 (로그인 전까지)
    const header = document.querySelector('.top-navbar');
    const rightToolbar = document.getElementById('rightToolbar');
    const mobileDrawer = document.getElementById('mobileDrawer');
    if (header) header.style.display = 'none';
    if (rightToolbar) rightToolbar.style.display = 'none';
    if (mobileDrawer) mobileDrawer.style.display = 'none';

    // /student 또는 /s 경로 → 학생 개인코드 로그인
    const pathname = window.location.pathname;
    if (pathname === '/student' || pathname === '/s') {
        const urlParams = new URLSearchParams(window.location.search);
        const codeParam = urlParams.get('code');
        window.history.replaceState({}, '', '/');
        hideAuthLoadingScreen();
        setTimeout(() => {
            initRouter();
            bindNavigation();
            bindHeaderButtons();
            registerGlobalFunctions();
            // 개인코드가 있으면 student-login에 code 파라미터 전달 (자동 로그인)
            if (codeParam) {
                router.navigate('student-login', { code: codeParam });
            } else {
                router.navigate('student-login');
            }
        }, 0);
        return;
    }

    // URL 파라미터로 개인코드 전달 (QR 스캔 시)
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam) {
        window.history.replaceState({}, '', window.location.pathname);
        hideAuthLoadingScreen();
        setTimeout(() => {
            initRouter();
            bindNavigation();
            bindHeaderButtons();
            registerGlobalFunctions();
            router.navigate('student-login', { code: codeParam });
        }, 0);
        return;
    }

    // 1. Firebase 인증 상태 확정까지 대기
    const authUser = await waitForAuthReady();

    // 2. 인증 상태에 따라 적절한 초기 라우트 결정 (렌더링 전에!)
    const currentHash = window.location.hash.slice(1).split('?')[0];

    if (authUser && store.isTeacherLoggedIn()) {
        // 약관 동의 여부 확인 (미동의 시 로그아웃 후 로그인 화면으로)
        const agreed = await hasAgreedToTerms(authUser.uid);
        if (!agreed) {
            console.log('⚠️ 약관 미동의 사용자 → 로그아웃 처리');
            await store.signOut();
            window.location.hash = 'login';
            hideAuthLoadingScreen();
            initRouter();
            bindNavigation();
            bindHeaderButtons();
            registerGlobalFunctions();
            return;
        }

        // Firebase에서 학급 데이터 로드 (칭찬/감정 포함)
        const currentClassId = store.getCurrentClassId();
        if (currentClassId) {
            await store.loadClassDataFromFirebase();
            console.log('📦 Firebase 학급 데이터 로드 완료');
        }

        // Firebase 서비스 구독 시작 + 정리 함수 등록
        startFirebaseServices();

        // 로그인된 상태
        if (!currentHash || currentHash === 'login' || currentHash === 'teacher-login') {
            if (currentClassId) {
                console.log('🔄 초기 라우트: 대시보드');
                window.location.hash = 'dashboard';
            } else {
                console.log('🔄 초기 라우트: 학급선택');
                window.location.hash = 'class-select';
            }
        }
    } else {
        // 로그인되지 않은 상태에서 보호된 라우트 접근 시
        // student-login 등 학생 모드 라우트는 제외
        const studentModeRoutes = ['student-login', 'student-main', 'student-chat', 'pet-selection', 'pet-collection', 'student-timetable', 'student-praise'];
        const protectedRoutes = ['dashboard', 'timetable', 'petfarm', 'student/', 'emotion', 'stats', 'settings', 'picker', 'timer'];
        if (!studentModeRoutes.includes(currentHash) && protectedRoutes.some(r => currentHash.startsWith(r))) {
            console.log('🔄 초기 라우트: 로그인');
            window.location.hash = 'login';
        }
    }

    // 3. 로딩 화면 숨기기 (페이드 아웃)
    hideAuthLoadingScreen();

    // 오늘 날짜 표시
    updateCurrentDate();

    // 학급 정보 표시
    updateClassInfo();

    // 4. 라우터 초기화 (적절한 해시가 이미 설정된 후)
    initRouter();

    // 네비게이션 이벤트 바인딩
    bindNavigation();

    // 헤더 버튼 바인딩
    bindHeaderButtons();

    // 전역 객체에 함수 등록
    registerGlobalFunctions();

    // 스토어 변경 리스너
    store.subscribe((type, data) => {
        if (type === 'settings') {
            updateClassInfo();
        }
        // Firebase 데이터 로드 완료 시 현재 화면 갱신
        if (type === 'dataLoaded') {
            // 학급 전환 → Firebase 서비스 재구독
            startFirebaseServices();

            // 마이그레이션 완료 알림
            if (data?.migrationCount > 0) {
                showToast(`학생 개인코드 ${data.migrationCount}명 발급 완료! 설정에서 확인하세요.`, 'success');
            }

            const currentRoute = window.location.hash.slice(1).split('/')[0].split('?')[0];
            const skipRoutes = ['login', 'teacher-login', 'class-select', 'student-login', 'pet-selection'];
            if (!skipRoutes.includes(currentRoute)) {
                console.log('📦 데이터 로드 완료 → 화면 갱신:', currentRoute);
                refreshCurrentView();
            } else {
                console.log('📦 데이터 로드 완료 (화면 갱신 스킵:', currentRoute + ')');
            }
        }
        // 펫 변경 시 화면 갱신
        if (type === 'petUpdate') {
            refreshCurrentView();
        }
    });

    // Firebase 인증 상태 리스너 설정 (지속적 감시용)
    setupAuthStateListener();

    // 세션 타임아웃 설정 (교사 2시간/학생 30분 자동 로그아웃)
    initSessionTimeout(store);

    console.log('🐾 클래스펫이 시작되었습니다!');
}

/**
 * Firebase 인증 상태 확정 대기
 * 초기화 시 한 번만 호출되어 인증 상태가 확정될 때까지 대기
 */
async function waitForAuthReady() {
    // 1. 먼저 리다이렉트 로그인 결과 확인 (리다이렉트 방식으로 로그인한 경우)
    const redirectResult = await store.checkRedirectResult();
    if (redirectResult?.success) {
        console.log('🔐 리다이렉트 로그인 결과 처리 완료');
        store.setAuthLoading(false);
        return redirectResult.user;
    }

    // 2. onAuthStateChanged로 기존 세션 복원 대기
    return new Promise((resolve) => {
        let timeoutId = null;

        const unsubscribe = store.onAuthChange((user) => {
            console.log('🔐 Firebase 인증 상태 확정:', user?.email || 'null');
            store.setAuthLoading(false);

            // 타임아웃 취소
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            if (user && !user.isAnonymous) {
                // Google 로그인 사용자 - 세션 복원
                store.setCurrentTeacherUid(user.uid);
                sessionStorage.setItem('classpet_teacher_session', JSON.stringify({
                    isLoggedIn: true,
                    isGoogleAuth: true,
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    loginTime: Date.now()
                }));
                console.log('🔐 Google 로그인 세션 복원 완료:', user.email);
            }

            unsubscribe();  // 초기화용 리스너 해제
            resolve(user);
        });

        // 타임아웃 (5초) - Firebase 응답이 없으면 진행
        timeoutId = setTimeout(() => {
            console.log('⏰ Firebase 인증 타임아웃 - 진행');
            store.setAuthLoading(false);
            unsubscribe();
            resolve(null);
        }, 5000);
    });
}

/**
 * 인증 로딩 화면 숨기기 (페이드 아웃)
 */
function hideAuthLoadingScreen() {
    const screen = document.getElementById('authLoadingScreen');
    if (screen) {
        screen.style.opacity = '0';
        screen.style.transition = 'opacity 0.3s ease';
        setTimeout(() => screen.remove(), 300);
    }
}

/**
 * Firebase 인증 상태 리스너
 * 로그인/로그아웃 후 지속적인 인증 상태 변경 감시용
 * (초기 세션 복원은 waitForAuthReady에서 처리됨)
 */
function setupAuthStateListener() {
    // store에서 인증 상태 변경 구독 (로그인/로그아웃 후 UI 업데이트용)
    store.subscribe((type, data) => {
        if (type === 'auth') {
            handleAuthStateChange(data);
        }
    });

    // Firebase onAuthStateChanged 지속 감시 (로그아웃 등 후속 변경 감지)
    store.onAuthChange(async (user) => {
        // 이미 로딩이 완료된 상태에서의 인증 변경만 처리
        if (!store.isAuthLoading()) {
            console.log('🔐 Firebase 인증 상태 변경:', user?.email || 'null');

            if (user && !user.isAnonymous) {
                // Google 로그인 - 세션 업데이트
                store.setCurrentTeacherUid(user.uid);

                // Firebase가 비활성화 상태였다면 활성화 (타임아웃 후 뒤늦은 인증 성공 케이스)
                if (!store.isFirebaseEnabled()) {
                    store.enableFirebase();
                    // Firebase에서 학급 데이터 다시 로드
                    await store.loadClassDataFromFirebase();
                    console.log('🔥 Firebase 뒤늦은 인증 처리 완료 - 학급 데이터 로드됨');
                    // 현재 화면 갱신
                    refreshCurrentView();
                }

                updateClassInfo();
            }
        }
    });
}

/**
 * 인증 상태 변경 처리
 */
function handleAuthStateChange(authData) {
    if (authData?.isLoggedIn) {
        // 로그인됨
        console.log('🔐 인증 상태: 로그인됨', authData.user?.email);
        updateClassInfo();
    } else {
        // 로그아웃됨
        console.log('🔓 인증 상태: 로그아웃됨');
    }
}

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', initApp);
