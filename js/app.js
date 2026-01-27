/**
 * 클래스펫 메인 앱
 * 앱 초기화 및 전역 함수 관리
 */

import { store, PET_TYPES, PRAISE_CATEGORIES, EMOTION_TYPES } from './store.js';
import { router } from './router.js';

// 컴포넌트 임포트
import * as Dashboard from './components/Dashboard.js';
import * as Timetable from './components/Timetable.js';
import * as PetFarm from './components/PetFarm.js';
import * as StudentDetail from './components/StudentDetail.js';
import * as Emotion from './components/Emotion.js';
import * as Stats from './components/Stats.js';
import * as Settings from './components/Settings.js';
import * as PraiseManagement from './components/PraiseManagement.js';
// showQuickPraise는 Dashboard에서 직접 import하여 사용
import { showQuickPraise } from './components/QuickPraise.js'; // 전역 함수 등록용

// 로그인 컴포넌트 임포트
import * as LoginSelect from './components/LoginSelect.js';
import * as TeacherLogin from './components/TeacherLogin.js';
import * as ClassSelect from './components/ClassSelect.js';

// 학생 모드 컴포넌트 임포트
import * as StudentLogin from './components/StudentLogin.js';
import * as StudentMode from './components/StudentMode.js';
import * as PetChat from './components/PetChat.js';
import * as PetSelection from './components/PetSelection.js';
import * as PetCollection from './components/PetCollection.js';
import * as StudentTimetable from './components/StudentTimetable.js';
import * as StudentPraise from './components/StudentPraise.js';

// 유틸리티 임포트
import { getPetEmoji, calculateLevel, getLevelUpMessage } from './utils/petLogic.js';
import {
    showToast,
    setModalContent,
    openModal,
    closeModal,
    bounceAnimation,
    levelUpAnimation
} from './utils/animations.js';

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

    // URL 파라미터로 학급 코드 자동 설정 (QR 스캔 시)
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam) {
        store.setClassCode(codeParam.toUpperCase());
        window.history.replaceState({}, '', window.location.pathname);
        // 로딩 화면 숨기기
        hideAuthLoadingScreen();
        // DOM 로드 후 라우터 초기화하고 학생 로그인으로 이동
        setTimeout(() => {
            initRouter();
            bindNavigation();
            bindHeaderButtons();
            registerGlobalFunctions();
            router.navigate('student-login');
        }, 0);
        return; // 초기화 중단하고 학생 로그인으로
    }

    // 1. Firebase 인증 상태 확정까지 대기
    const authUser = await waitForAuthReady();

    // 2. 인증 상태에 따라 적절한 초기 라우트 결정 (렌더링 전에!)
    const currentHash = window.location.hash.slice(1).split('?')[0];

    if (authUser && store.isTeacherLoggedIn()) {
        // Firebase에서 학급 데이터 로드 (칭찬/감정 포함)
        const currentClassId = store.getCurrentClassId();
        if (currentClassId) {
            await store.loadClassDataFromFirebase();
            console.log('📦 Firebase 학급 데이터 로드 완료');
        }

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
        const protectedRoutes = ['dashboard', 'timetable', 'petfarm', 'student/', 'emotion', 'stats', 'settings'];
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
            console.log('📦 데이터 로드 완료 → 화면 갱신');
            refreshCurrentView();
        }
    });

    // Firebase 인증 상태 리스너 설정 (지속적 감시용)
    setupAuthStateListener();

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
 * 초기 인증 상태 확인 (레거시 - setupAuthStateListener로 대체됨)
 */
async function checkInitialAuthState() {
    // onAuthStateChanged에서 처리하므로 빈 함수로 유지
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

/**
 * 라우터 초기화
 */
function initRouter() {
    // 라우트 등록
    router.registerAll({
        // 로그인 관련 라우트
        'login': {
            render: () => {
                const html = LoginSelect.render();
                setTimeout(() => LoginSelect.afterRender?.(), 0);
                return html;
            }
        },
        'teacher-login': {
            render: () => {
                const html = TeacherLogin.render();
                setTimeout(() => TeacherLogin.afterRender?.(), 0);
                return html;
            }
        },
        'class-select': {
            render: async () => {
                const html = await ClassSelect.render();
                setTimeout(() => ClassSelect.afterRender?.(), 0);
                return html;
            }
        },
        // 교사 모드 라우트
        'dashboard': {
            render: () => {
                // 교사 로그인 확인
                if (!store.isTeacherLoggedIn()) {
                    setTimeout(() => router.navigate('login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                const html = Dashboard.render();
                setTimeout(() => Dashboard.afterRender?.(), 0);
                return html;
            }
        },
        'timetable': {
            render: () => {
                if (!store.isTeacherLoggedIn()) {
                    setTimeout(() => router.navigate('login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                const html = Timetable.render();
                setTimeout(() => Timetable.afterRender?.(), 0);
                return html;
            }
        },
        'petfarm': {
            render: () => {
                if (!store.isTeacherLoggedIn()) {
                    setTimeout(() => router.navigate('login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                const html = PetFarm.render();
                setTimeout(() => PetFarm.afterRender?.(), 0);
                return html;
            }
        },
        'student': {
            render: (params) => {
                if (!store.isTeacherLoggedIn()) {
                    setTimeout(() => router.navigate('login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                const html = StudentDetail.render(params);
                setTimeout(() => StudentDetail.afterRender?.(params), 0);
                return html;
            }
        },
        'emotion': {
            render: () => {
                if (!store.isTeacherLoggedIn()) {
                    setTimeout(() => router.navigate('login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                const html = Emotion.render();
                setTimeout(() => Emotion.afterRender?.(), 0);
                return html;
            }
        },
        'praise': {
            render: () => {
                if (!store.isTeacherLoggedIn()) {
                    setTimeout(() => router.navigate('login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                const html = PraiseManagement.render();
                setTimeout(() => PraiseManagement.afterRender?.(), 0);
                return html;
            }
        },
        'stats': {
            render: () => {
                if (!store.isTeacherLoggedIn()) {
                    setTimeout(() => router.navigate('login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                const html = Stats.render();
                setTimeout(() => Stats.afterRender?.(), 0);
                return html;
            }
        },
        'settings': {
            render: () => {
                if (!store.isTeacherLoggedIn()) {
                    setTimeout(() => router.navigate('login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                const html = Settings.render();
                setTimeout(() => Settings.afterRender?.(), 0);
                return html;
            }
        },
        // 학생 모드 라우트
        'student-login': {
            render: (params) => {
                const html = StudentLogin.render(params);
                setTimeout(() => StudentLogin.afterRender?.(), 0);
                return html;
            }
        },
        'student-main': {
            render: () => {
                updateHeaderForStudentMode(true, true);
                const html = StudentMode.render();
                setTimeout(() => StudentMode.afterRender?.(), 0);
                return html;
            }
        },
        'student-chat': {
            render: () => {
                updateHeaderForStudentMode(true, true);
                const html = PetChat.render();
                setTimeout(() => PetChat.afterRender?.(), 0);
                return html;
            }
        },
        'pet-selection': {
            render: () => {
                // 학생 로그인 확인
                if (!store.isStudentLoggedIn()) {
                    setTimeout(() => router.navigate('student-login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                const html = PetSelection.render();
                setTimeout(() => PetSelection.afterRender?.(), 0);
                return html;
            }
        },
        'pet-collection': {
            render: () => {
                // 학생 로그인 확인
                if (!store.isStudentLoggedIn()) {
                    setTimeout(() => router.navigate('student-login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                updateHeaderForStudentMode(true, true);
                const html = PetCollection.render();
                setTimeout(() => PetCollection.afterRender?.(), 0);
                return html;
            }
        },
        'student-timetable': {
            render: () => {
                // 학생 로그인 확인
                if (!store.isStudentLoggedIn()) {
                    setTimeout(() => router.navigate('student-login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                updateHeaderForStudentMode(true, true);
                const html = StudentTimetable.render();
                setTimeout(() => StudentTimetable.afterRender?.(), 0);
                return html;
            }
        },
        'student-praise': {
            render: () => {
                if (!store.isStudentLoggedIn()) {
                    setTimeout(() => router.navigate('student-login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                updateHeaderForStudentMode(true, true);
                const html = StudentPraise.render();
                setTimeout(() => StudentPraise.afterRender?.(), 0);
                return html;
            }
        }
    });

    // 라우터 초기화
    router.init('content');

    // 라우트 변경 시 헤더 업데이트
    router.onRouteChange = (route, params) => {
        const isStudentRoute = ['student-login', 'student-main', 'student-chat', 'pet-selection', 'pet-collection', 'student-timetable', 'student-praise'].includes(route);
        const isLoginRoute = ['login', 'teacher-login', 'student-login', 'class-select'].includes(route);

        if (!isStudentRoute && !isLoginRoute) {
            // 교사 모드로 돌아오면 헤더 복원
            updateHeaderForStudentMode(false, false);
        }

        // 탭 활성화 동기화
        syncActiveTab(route);

        // 라우트 변경 시 알림 버튼 표시/숨김 업데이트
        updateNotificationBadge();

        // 학생/로그인 라우트에서 헤더/툴바 숨김 처리
        updateUIVisibility(route);
    };

    // 초기 라우트에 대해서도 UI 가시성 적용
    const initialRoute = window.location.hash.slice(1).split('?')[0] || 'login';
    updateUIVisibility(initialRoute);
}

/**
 * 오늘 날짜 업데이트
 */
function updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const today = new Date();
        const month = today.getMonth() + 1;
        const date = today.getDate();
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const day = days[today.getDay()];
        dateEl.textContent = `${month}/${date} (${day})`;
    }
}

/**
 * 학급 정보 업데이트
 */
function updateClassInfo() {
    const classInfoEl = document.getElementById('classInfo');
    if (!classInfoEl) return;

    // 로그인 상태 확인 - 로그인하지 않았으면 표시하지 않음
    const isLoggedIn = store.isGoogleTeacher() || store.getClassCode();
    if (!isLoggedIn) {
        classInfoEl.textContent = '';
        return;
    }

    const settings = store.getSettings();
    if (settings) {
        classInfoEl.textContent = `${settings.className} · ${settings.teacherName}`;
    }
}

/**
 * 네비게이션 이벤트 바인딩 (상단 탭바 + 모바일 드로어)
 */
function bindNavigation() {
    // 상단 탭바 네비게이션
    const navTabs = document.querySelectorAll('.navbar-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const route = tab.dataset.route;
            if (route) {
                // 활성 탭 업데이트
                navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                router.navigate(route);
            }
        });
    });

    // 모바일 드로어 네비게이션
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const route = item.dataset.route;
            if (route) {
                // 활성 아이템 업데이트
                mobileNavItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                // 상단 탭바도 동기화
                navTabs.forEach(t => {
                    t.classList.toggle('active', t.dataset.route === route);
                });
                // 드로어 닫기
                closeMobileDrawer();
                router.navigate(route);
            }
        });
    });

    // 기존 하단 네비 호환성 (있다면)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const route = item.dataset.route;
            if (route) {
                router.navigate(route);
            }
        });
    });
}

/**
 * 우측 툴바 토글 바인딩
 */
function bindToolbarToggle() {
    const toolbar = document.getElementById('rightToolbar');
    const toggleBtn = document.getElementById('toolbarToggle');

    if (toggleBtn && toolbar) {
        const iconSpan = toggleBtn.querySelector('.toggle-icon');
        const textSpan = toggleBtn.querySelector('.toggle-text');

        // 아이콘 회전 업데이트 (접힌 상태: <, 펼쳐진 상태: >)
        const updateToggleIcon = (isCollapsed) => {
            if (iconSpan) {
                // 접힌 상태: < (0deg), 펼쳐진 상태: > (180deg)
                iconSpan.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)';
            }
            if (textSpan) textSpan.textContent = isCollapsed ? '펼치기' : '접기';
        };

        // 화면 크기에 따른 초기 상태 설정
        const initToolbarState = () => {
            const isTablet = window.innerWidth <= 1024;
            if (isTablet && !toolbar.classList.contains('collapsed')) {
                toolbar.classList.add('collapsed');
                updateToggleIcon(true);
            }
        };

        // 초기화
        initToolbarState();

        // 토글 이벤트
        toggleBtn.addEventListener('click', () => {
            toolbar.classList.toggle('collapsed');
            const isCollapsed = toolbar.classList.contains('collapsed');
            updateToggleIcon(isCollapsed);
        });

        // 화면 크기 변경 시 상태 초기화 (옵션)
        window.addEventListener('resize', () => {
            // 모바일에서 태블릿/데스크탑으로 전환 시에만 초기화
            if (window.innerWidth > 768 && window.innerWidth <= 1024) {
                if (!toolbar.classList.contains('collapsed')) {
                    toolbar.classList.add('collapsed');
                    updateToggleIcon(true);
                }
            }
        });
    }
}

/**
 * 모바일 드로어 바인딩
 */
function bindMobileDrawer() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const mobileDrawerOverlay = document.getElementById('mobileDrawerOverlay');

    if (hamburgerBtn && mobileDrawer) {
        hamburgerBtn.addEventListener('click', () => {
            mobileDrawer.classList.add('open');
            if (mobileDrawerOverlay) {
                mobileDrawerOverlay.classList.add('open');
            }
        });
    }

    if (mobileDrawerOverlay) {
        mobileDrawerOverlay.addEventListener('click', closeMobileDrawer);
    }

    // 모바일 드로어 버튼들
    const mobileSettingsBtn = document.getElementById('mobileSettingsBtn');
    if (mobileSettingsBtn) {
        mobileSettingsBtn.addEventListener('click', () => {
            closeMobileDrawer();
            router.navigate('settings');
        });
    }

    const mobileNotificationBtn = document.getElementById('mobileNotificationBtn');
    if (mobileNotificationBtn) {
        mobileNotificationBtn.addEventListener('click', () => {
            closeMobileDrawer();
            showNotifications();
        });
    }

    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', () => {
            closeMobileDrawer();
            if (confirm('로그아웃 하시겠습니까?')) {
                store.teacherLogout();
                router.navigate('login');
            }
        });
    }
}

/**
 * 모바일 드로어 닫기
 */
function closeMobileDrawer() {
    const mobileDrawer = document.getElementById('mobileDrawer');
    const mobileDrawerOverlay = document.getElementById('mobileDrawerOverlay');

    if (mobileDrawer) {
        mobileDrawer.classList.remove('open');
    }
    if (mobileDrawerOverlay) {
        mobileDrawerOverlay.classList.remove('open');
    }
}

/**
 * 라우트 변경 시 탭 활성화 동기화
 */
function syncActiveTab(route) {
    // 상단 탭바
    const navTabs = document.querySelectorAll('.navbar-tab');
    navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.route === route);
    });

    // 모바일 드로어
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
        item.classList.toggle('active', item.dataset.route === route);
    });
}

/**
 * 헤더 버튼 바인딩
 */
function bindHeaderButtons() {
    // 설정 버튼
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            router.navigate('settings');
        });
    }

    // 알림 버튼
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', showNotifications);
    }

    // 로그아웃 버튼 (헤더 + 기존 숨김 버튼)
    const logoutHandler = () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            store.teacherLogout();
            router.navigate('login');
        }
    };

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutHandler);
    }

    const headerLogoutBtn = document.getElementById('headerLogoutBtn');
    if (headerLogoutBtn) {
        headerLogoutBtn.addEventListener('click', logoutHandler);
    }

    // 날짜 버튼 → 감정 히스토리로 이동
    bindDateHistoryButton();

    // 툴바 토글 바인딩
    bindToolbarToggle();

    // 모바일 드로어 바인딩
    bindMobileDrawer();

    // 알림 배지 업데이트
    updateNotificationBadge();

    // 스토어 변경 리스너에서 알림 업데이트
    store.subscribe((type, data) => {
        if (type === 'notifications' || type === 'studentSession') {
            updateNotificationBadge();
        }
    });
}

/**
 * 날짜 버튼 클릭 → 감정 히스토리로 이동
 */
function bindDateHistoryButton() {
    const dateHistoryBtn = document.getElementById('dateHistoryBtn');
    const historyDatePicker = document.getElementById('historyDatePicker');

    if (dateHistoryBtn && historyDatePicker) {
        // 오늘 날짜를 기본값으로 설정
        const today = new Date().toISOString().split('T')[0];
        historyDatePicker.value = today;
        historyDatePicker.max = today; // 미래 날짜 선택 불가

        // 날짜 버튼 클릭 시 date picker 열기
        dateHistoryBtn.addEventListener('click', () => {
            // showPicker()가 지원되지 않는 브라우저(일부 모바일)를 위한 fallback
            if (typeof historyDatePicker.showPicker === 'function') {
                try {
                    historyDatePicker.showPicker();
                } catch (e) {
                    // SecurityError 등 발생 시 click으로 fallback
                    historyDatePicker.click();
                }
            } else {
                historyDatePicker.click();
            }
        });

        // 날짜 선택 시 감정 히스토리로 이동
        historyDatePicker.addEventListener('change', (e) => {
            const selectedDate = e.target.value; // "2025-01-22" 형식
            if (selectedDate) {
                // sessionStorage에 선택한 날짜 저장
                sessionStorage.setItem('emotionHistoryDate', selectedDate);
                // 감정 페이지로 이동
                router.navigate('emotion');
            }
        });
    }
}

/**
 * 알림 배지 업데이트
 */
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const notificationBtn = document.getElementById('notificationBtn');

    // 학생 로그인 상태면 알림 버튼 전체 숨김
    if (store.isStudentLoggedIn()) {
        if (notificationBtn) notificationBtn.classList.add('hidden');
        return;
    }

    // 교사 상태면 알림 버튼 표시
    if (notificationBtn) notificationBtn.classList.remove('hidden');

    if (!badge) return;

    const unreadCount = store.getUnreadNotificationCount();

    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

/**
 * 알림 모달 표시
 */
function showNotifications() {
    const notifications = store.getNotifications() || [];
    const recentNotifications = notifications.slice(0, 20); // 최근 20개만

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">🔔 알림</h3>
                <div class="flex gap-2">
                    ${notifications.filter(n => !n.read).length > 0 ? `
                        <button id="markAllReadBtn" class="text-sm text-primary hover:text-primary-dark">
                            모두 읽음
                        </button>
                    ` : ''}
                    <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
                </div>
            </div>

            <div class="max-h-80 overflow-y-auto">
                ${recentNotifications.length > 0 ? `
                    <div class="space-y-3">
                        ${recentNotifications.map(notification => {
                            const timeAgo = getTimeAgo(notification.timestamp);
                            const isUnread = !notification.read;

                            return `
                                <div class="notification-item p-3 rounded-xl ${isUnread ? 'bg-primary/10' : 'bg-gray-50'} cursor-pointer hover:bg-gray-100 transition-colors"
                                     data-notification-id="${notification.id}">
                                    <div class="flex items-start gap-3">
                                        <span class="text-2xl">${notification.emotionIcon || '📢'}</span>
                                        <div class="flex-1">
                                            <p class="text-sm ${isUnread ? 'font-medium' : ''} text-gray-700">
                                                ${notification.message}
                                            </p>
                                            ${notification.memo ? `
                                                <p class="text-xs text-gray-500 mt-1 italic">"${notification.memo}"</p>
                                            ` : ''}
                                            <p class="text-xs text-gray-400 mt-1">${timeAgo}</p>
                                        </div>
                                        ${isUnread ? '<span class="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></span>' : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-center py-8 text-gray-500">
                        <div class="text-4xl mb-3">🔕</div>
                        <p>새로운 알림이 없어요</p>
                    </div>
                `}
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 이벤트 바인딩
    // 모두 읽음 버튼
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            store.markAllNotificationsRead();
            showToast('모든 알림을 읽음 처리했습니다', 'info');
            closeModal();
        });
    }

    // 알림 항목 클릭 시 읽음 처리
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const notificationId = parseInt(item.dataset.notificationId);
            store.markNotificationRead(notificationId);

            // 감정 관련 알림이면 해당 학생 상세로 이동
            const notification = notifications.find(n => n.id === notificationId);
            if (notification && notification.type === 'emotion' && notification.studentId) {
                closeModal();
                router.navigate('student', { id: notification.studentId });
            }
        });
    });
}

/**
 * 시간 경과 표시
 */
function getTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = Math.floor((now - date) / 1000); // 초 단위

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
}

/**
 * 전역 함수 등록
 */
function registerGlobalFunctions() {
    window.classpet = {
        // 라우터
        router,

        // 모달
        closeModal,
        openModal,

        // 빠른 칭찬
        showQuickPraise,

        // 감정 체크
        showEmotionCheck: Emotion.showEmotionCheck,
        showBulkEmotionCheck: Emotion.showBulkEmotionCheck,

        // 설정
        showSettings: Stats.showSettings,

        // 데이터 관리
        exportData: Stats.exportData,
        importData: Stats.importData,
        showResetConfirm: Stats.showResetConfirm,

        // 학생 관리
        showAddStudent,
        showEditStudent,
        deleteStudent,

        // 메모 관리
        showAddNote,
        deleteNote,

        // 화면 새로고침
        refreshCurrentView,

        // 학생 모드
        goToStudentMode: () => router.navigate('student-login'),
        studentLogout: () => {
            store.studentLogout();
            router.navigate('student-login');
        },

        // 교사 모드
        teacherLogout: () => {
            store.teacherLogout();
            router.navigate('login');
        },

        // 로그인 화면
        goToLogin: () => router.navigate('login')
    };
}

/**
 * 학생 추가 모달
 */
function showAddStudent() {
    const petTypes = Object.entries(PET_TYPES).map(([key, pet]) => ({
        key,
        name: pet.name,
        emoji: pet.stages.baby
    }));

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">🐣 새 학생 추가</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">이름</label>
                <input type="text" id="studentName" class="w-full" placeholder="학생 이름">
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">펫 선택</label>
                <div class="grid grid-cols-5 gap-2" id="petTypeGrid">
                    ${petTypes.map((pet, index) => `
                        <button class="pet-type-btn p-3 rounded-xl border-2 ${index === 0 ? 'border-primary bg-primary/10' : 'border-transparent'} hover:border-primary/50 transition-all"
                                data-pet="${pet.key}">
                            <span class="text-2xl">${pet.emoji}</span>
                            <div class="text-xs mt-1">${pet.name}</div>
                        </button>
                    `).join('')}
                </div>
            </div>

            <button id="addStudentBtn" class="btn btn-primary w-full">
                추가하기
            </button>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 이벤트 바인딩
    let selectedPetType = 'dog';

    document.querySelectorAll('.pet-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pet-type-btn').forEach(b => {
                b.classList.remove('border-primary', 'bg-primary/10');
                b.classList.add('border-transparent');
            });
            btn.classList.remove('border-transparent');
            btn.classList.add('border-primary', 'bg-primary/10');
            selectedPetType = btn.dataset.pet;
        });
    });

    document.getElementById('addStudentBtn').addEventListener('click', () => {
        const name = document.getElementById('studentName').value.trim();
        if (!name) {
            showToast('이름을 입력해주세요', 'warning');
            return;
        }

        const newStudent = store.addStudent({
            name,
            petType: selectedPetType
        });

        showToast(`${name}의 ${PET_TYPES[selectedPetType].name}가 태어났어요! 🥚`, 'success');
        closeModal();
        refreshCurrentView();
    });
}

/**
 * 학생 편집 모달
 */
function showEditStudent(studentId) {
    const student = store.getStudent(studentId);
    if (!student) return;

    const petTypes = Object.entries(PET_TYPES).map(([key, pet]) => ({
        key,
        name: pet.name,
        emoji: pet.stages.baby
    }));

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">✏️ 학생 정보 수정</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">이름</label>
                <input type="text" id="editStudentName" value="${student.name}" class="w-full">
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">번호</label>
                <input type="number" id="editStudentNumber" value="${student.number}" class="w-full" min="1">
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">펫 타입</label>
                <div class="grid grid-cols-5 gap-2" id="editPetTypeGrid">
                    ${petTypes.map(pet => `
                        <button class="edit-pet-type-btn p-3 rounded-xl border-2 ${student.petType === pet.key ? 'border-primary bg-primary/10' : 'border-transparent'} hover:border-primary/50 transition-all"
                                data-pet="${pet.key}">
                            <span class="text-2xl">${pet.emoji}</span>
                            <div class="text-xs mt-1">${pet.name}</div>
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="flex gap-2">
                <button id="deleteStudentBtn" class="btn btn-danger flex-1">
                    삭제
                </button>
                <button id="saveStudentBtn" class="btn btn-primary flex-1">
                    저장
                </button>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 이벤트 바인딩
    let selectedPetType = student.petType;

    document.querySelectorAll('.edit-pet-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.edit-pet-type-btn').forEach(b => {
                b.classList.remove('border-primary', 'bg-primary/10');
                b.classList.add('border-transparent');
            });
            btn.classList.remove('border-transparent');
            btn.classList.add('border-primary', 'bg-primary/10');
            selectedPetType = btn.dataset.pet;
        });
    });

    document.getElementById('saveStudentBtn').addEventListener('click', () => {
        const name = document.getElementById('editStudentName').value.trim();
        const number = parseInt(document.getElementById('editStudentNumber').value);

        if (!name) {
            showToast('이름을 입력해주세요', 'warning');
            return;
        }

        store.updateStudent(studentId, {
            name,
            number,
            petType: selectedPetType
        });

        showToast('수정되었습니다', 'success');
        closeModal();
        refreshCurrentView();
    });

    document.getElementById('deleteStudentBtn').addEventListener('click', () => {
        if (confirm(`정말 ${student.name}을(를) 삭제하시겠습니까?`)) {
            store.deleteStudent(studentId);
            showToast('삭제되었습니다', 'info');
            closeModal();
            router.navigate('petfarm');
        }
    });
}

/**
 * 학생 삭제
 */
function deleteStudent(studentId) {
    const student = store.getStudent(studentId);
    if (!student) return;

    if (confirm(`정말 ${student.name}을(를) 삭제하시겠습니까?`)) {
        store.deleteStudent(studentId);
        showToast('삭제되었습니다', 'info');
        refreshCurrentView();
    }
}

/**
 * 메모 추가 모달
 */
function showAddNote(studentId) {
    const student = store.getStudent(studentId);
    if (!student) return;

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">📝 메모 추가</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="text-center text-sm text-gray-500">
                ${student.name}에 대한 메모
            </div>

            <div>
                <textarea id="noteContent" class="w-full p-3 border rounded-xl resize-none" rows="4"
                          placeholder="메모 내용을 입력하세요..."></textarea>
            </div>

            <button id="saveNoteBtn" class="btn btn-primary w-full">
                저장하기
            </button>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    document.getElementById('saveNoteBtn').addEventListener('click', () => {
        const content = document.getElementById('noteContent').value.trim();
        if (!content) {
            showToast('내용을 입력해주세요', 'warning');
            return;
        }

        store.addNote({
            studentId,
            content
        });

        showToast('메모가 저장되었습니다', 'success');
        closeModal();
        refreshCurrentView();
    });
}

/**
 * 메모 삭제
 */
function deleteNote(noteId) {
    if (confirm('이 메모를 삭제하시겠습니까?')) {
        store.deleteNote(noteId);
        showToast('삭제되었습니다', 'info');
        refreshCurrentView();
    }
}

/**
 * 현재 뷰 새로고침
 */
function refreshCurrentView() {
    router.handleRoute();
}

/**
 * 라우트에 따른 UI 가시성 업데이트
 */
function updateUIVisibility(route) {
    const header = document.querySelector('.top-navbar');
    const rightToolbar = document.getElementById('rightToolbar');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const mobileDrawerOverlay = document.getElementById('mobileDrawerOverlay');
    const classInfoEl = document.getElementById('classInfo');
    const isLoginRoute = ['login', 'teacher-login', 'student-login', 'class-select'].includes(route);
    const isStudentRoute = ['student-main', 'student-chat', 'pet-selection', 'pet-collection', 'student-timetable', 'student-praise'].includes(route);

    if (isLoginRoute) {
        // 로그인 화면: 헤더, 툴바, 모바일 드로어 모두 숨김
        if (header) {
            header.style.display = 'none';
            header.classList.add('hidden');
        }
        if (rightToolbar) {
            rightToolbar.style.display = 'none';
            rightToolbar.classList.add('hidden');
        }
        if (mobileDrawer) {
            mobileDrawer.style.display = 'none';
            mobileDrawer.classList.add('hidden');
        }
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.add('hidden');
        if (classInfoEl) classInfoEl.textContent = '';
    } else if (isStudentRoute) {
        // 학생 모드: 헤더 표시하되 탭 숨김, 툴바 숨김
        if (header) {
            header.style.display = '';
            header.classList.remove('hidden');
        }
        if (rightToolbar) {
            rightToolbar.style.display = 'none';
            rightToolbar.classList.add('hidden');
        }
        if (mobileDrawer) {
            mobileDrawer.style.display = '';
            mobileDrawer.classList.remove('hidden');
        }
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.remove('hidden');
        // 상단바: 교사 메뉴 숨기고 학생 메뉴 표시
        const teacherNav = document.getElementById('teacherNav');
        const studentNav = document.getElementById('studentNav');
        if (teacherNav) teacherNav.classList.add('hidden');
        if (studentNav) studentNav.classList.remove('hidden');
        // 모바일 드로어: 교사 메뉴 숨기고 학생 메뉴 표시
        const mobileTeacherNav = mobileDrawer?.querySelector('.mobile-drawer-nav:not(#mobileStudentNav)');
        const mobileStudentNav = document.getElementById('mobileStudentNav');
        if (mobileTeacherNav) mobileTeacherNav.classList.add('hidden');
        if (mobileStudentNav) mobileStudentNav.classList.remove('hidden');
    } else {
        // 교사 모드: 모두 표시
        if (header) {
            header.style.display = '';
            header.classList.remove('hidden');
        }
        if (rightToolbar) {
            rightToolbar.style.display = '';
            rightToolbar.classList.remove('hidden');
        }
        if (mobileDrawer) {
            mobileDrawer.style.display = '';
            mobileDrawer.classList.remove('hidden');
        }
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.remove('hidden');
        // 상단바: 학생 메뉴 숨기고 교사 메뉴 표시
        const teacherNav = document.getElementById('teacherNav');
        const studentNav = document.getElementById('studentNav');
        if (teacherNav) teacherNav.classList.remove('hidden');
        if (studentNav) studentNav.classList.add('hidden');
        // 모바일 드로어: 학생 메뉴 숨기고 교사 메뉴 표시
        const mobileTeacherNav = mobileDrawer?.querySelector('.mobile-drawer-nav:not(#mobileStudentNav)');
        const mobileStudentNav = document.getElementById('mobileStudentNav');
        if (mobileTeacherNav) mobileTeacherNav.classList.remove('hidden');
        if (mobileStudentNav) mobileStudentNav.classList.add('hidden');
        updateClassInfo();
    }
}

/**
 * 학생 모드 헤더 업데이트
 */
function updateHeaderForStudentMode(isStudentMode, isLoggedIn) {
    const headerTitle = document.querySelector('.navbar-title');
    const classInfo = document.getElementById('classInfo');
    const settingsBtn = document.getElementById('settingsBtn');
    const navbarTabs = document.querySelector('.navbar-tabs');
    const rightToolbar = document.getElementById('rightToolbar');

    if (isStudentMode) {
        if (isLoggedIn) {
            // 로그인 후: 학생 이름 표시
            const student = store.getCurrentStudent();
            if (headerTitle && student) {
                headerTitle.textContent = `${student.name}의 페이지`;
            }
            if (classInfo) {
                const settings = store.getSettings();
                classInfo.textContent = settings?.className || '우리반';
            }
        } else {
            // 로그인 전
            if (headerTitle) {
                headerTitle.textContent = '클래스펫';
            }
            if (classInfo) {
                classInfo.textContent = '학생 모드';
            }
        }

        // 학생 모드에서 탭바와 툴바 숨기기
        if (navbarTabs) navbarTabs.classList.add('hidden');
        if (rightToolbar) rightToolbar.classList.add('hidden');
        if (settingsBtn) settingsBtn.classList.add('hidden');
    } else {
        // 교사 모드: 원래대로
        if (headerTitle) {
            headerTitle.textContent = '클래스펫';
        }
        if (navbarTabs) navbarTabs.classList.remove('hidden');
        if (rightToolbar) rightToolbar.classList.remove('hidden');
        if (settingsBtn) settingsBtn.classList.remove('hidden');
        updateClassInfo();
    }
}

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', initApp);
