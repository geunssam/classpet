/**
 * 네비게이션 및 UI 가시성 관리
 * 탭 전환, 모바일 드로어, 헤더 모드 전환, 알림 배지
 */

import { store } from '../store.js';
import { router } from '../router.js';

/**
 * 네비게이션 이벤트 바인딩 (상단 탭바 + 모바일 드로어)
 */
export function bindNavigation() {
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
export function bindToolbarToggle() {
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
export function bindMobileDrawer(showNotificationsFn) {
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
            if (showNotificationsFn) showNotificationsFn();
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
export function closeMobileDrawer() {
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
export function syncActiveTab(route) {
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
 * 알림 배지 업데이트
 */
export function updateNotificationBadge() {
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
 * 학생 알림 뱃지 업데이트 (미읽은 답장 + 새 칭찬)
 */
export function updateStudentNotificationBadge() {
    const badge = document.getElementById('studentNotificationBadge');
    const btn = document.getElementById('studentNotificationBtn');
    const settingsBtn = document.getElementById('studentSettingsBtn');
    const logoutBtn = document.getElementById('studentLogoutBtn');

    // 학생 로그인 상태가 아니면 버튼 숨김
    if (!store.isStudentLoggedIn()) {
        if (btn) btn.classList.add('hidden');
        if (settingsBtn) settingsBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        return;
    }

    const student = store.getCurrentStudent();
    if (!student) {
        if (btn) btn.classList.add('hidden');
        if (settingsBtn) settingsBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        return;
    }

    // 학생 로그인 상태면 버튼 표시
    if (btn) btn.classList.remove('hidden');
    if (settingsBtn) settingsBtn.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');

    // 1. 미읽은 답장 수
    const unreadReplies = store.getUnreadReplyCount(student.id);

    // 2. 새 칭찬 수 (마지막 확인 이후)
    const praises = store.getPraisesByStudent(student.id) || [];
    const lastSeen = parseInt(sessionStorage.getItem('lastSeenPraiseCount') || '0');
    const newPraises = Math.max(0, praises.length - lastSeen);

    const total = unreadReplies + newPraises;

    if (badge) {
        if (total > 0) {
            badge.textContent = total > 99 ? '99+' : total;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

/**
 * 라우트에 따른 UI 가시성 업데이트
 */
export function updateUIVisibility(route) {
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

        // 학생 알림/로그아웃 버튼 표시
        updateStudentNotificationBadge();
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
export function updateHeaderForStudentMode(isStudentMode, isLoggedIn) {
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

/**
 * 학급 정보 업데이트
 */
export function updateClassInfo() {
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
