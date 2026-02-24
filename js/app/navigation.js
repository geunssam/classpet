/**
 * 네비게이션 및 UI 가시성 관리
 * 탭 전환, 모바일 드로어, 헤더 모드 전환, 알림 배지
 */

import { store } from '../store.js';
import { router } from '../router.js';
import { showToast } from '../shared/utils/animations.js';
import { showStudentNotifications, showStudentPinChangeModal, handleStudentLogout } from './header.js';

/**
 * 네비게이션 이벤트 바인딩 (상단 탭바 + 모바일 드로어)
 */
export function bindNavigation() {
    // 로고/타이틀 클릭 → 홈 이동
    const navHomeBtn = document.getElementById('navHomeBtn');
    if (navHomeBtn) {
        navHomeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isStudent = store.isStudentLoggedIn?.();
            router.navigate(isStudent ? 'student-main' : 'dashboard');
        });
    }

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
 * 우측 툴바 토글 바인딩 (3단 구조)
 * - minimized: 화살표만 (모바일 기본)
 * - collapsed: 아이콘만
 * - expanded: 아이콘 + 텍스트 (데스크탑 기본)
 */
export function bindToolbarToggle() {
    const toolbar = document.getElementById('rightToolbar');
    const toggleBtn = document.getElementById('toolbarToggle');

    if (!toggleBtn || !toolbar) return;

    const iconSpan = toggleBtn.querySelector('.toggle-icon');
    const textSpan = toggleBtn.querySelector('.toggle-text');

    // 핑퐁 방향 추적: 'up' = 펼치는 중, 'down' = 접는 중
    let toolbarDirection = 'up';

    /**
     * 툴바 상태 설정
     * @param {'minimized' | 'collapsed' | 'expanded'} state
     */
    const setToolbarState = (state) => {
        toolbar.classList.remove('minimized', 'collapsed');

        if (state === 'minimized') {
            toolbar.classList.add('minimized');
            toolbarDirection = 'up'; // 바닥 → 다음은 올라감
        } else if (state === 'collapsed') {
            toolbar.classList.add('collapsed');
        } else {
            // expanded 도달 → 다음은 내려감
            toolbarDirection = 'down';
        }

        // 화살표 방향: 다음에 접을 건지 펼칠 건지
        const willCollapse =
            state === 'expanded' || (state === 'collapsed' && toolbarDirection === 'down');

        if (iconSpan) {
            iconSpan.style.transform = willCollapse ? 'rotate(180deg)' : 'rotate(0deg)';
        }
        if (textSpan) {
            textSpan.textContent = willCollapse ? '접기' : '펼치기';
        }
    };

    /**
     * 현재 상태 반환
     */
    const getState = () => {
        if (toolbar.classList.contains('minimized')) return 'minimized';
        if (toolbar.classList.contains('collapsed')) return 'collapsed';
        return 'expanded';
    };

    const isMobile = () => window.innerWidth <= 768;

    // 초기 상태 설정
    const initToolbarState = () => {
        if (isMobile()) {
            setToolbarState('minimized');
        } else if (window.innerWidth <= 1024) {
            setToolbarState('collapsed');
        } else {
            setToolbarState('expanded');
        }
    };

    initToolbarState();

    // 토글 이벤트: 핑퐁 순환 (minimized → collapsed → expanded → collapsed → minimized)
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const current = getState();

        if (current === 'minimized') {
            setToolbarState('collapsed');
        } else if (current === 'collapsed') {
            // 방향에 따라 올라감/내려감
            setToolbarState(toolbarDirection === 'up' ? 'expanded' : 'minimized');
        } else {
            // expanded → 한 단계씩 내려감
            toolbarDirection = 'down';
            setToolbarState('collapsed');
        }
    });

    // 화면 크기 변경 시 상태 재설정
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const current = getState();
            if (isMobile()) {
                // 모바일로 전환: expanded → minimized
                if (current === 'expanded') {
                    setToolbarState('minimized');
                }
            } else if (window.innerWidth <= 1024) {
                // 태블릿: minimized → collapsed
                if (current === 'minimized') {
                    setToolbarState('collapsed');
                }
            }
        }, 150);
    });
}

/**
 * 모바일 드로어 바인딩
 */
export function bindMobileDrawer(showNotificationsFn, showQuickPraiseFn) {
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

    // 모바일 드로어 버튼들 (학생/교사 모드 분기)
    const isStudentMode = () => router.isStudentMode?.() || false;

    const mobileQuickPraiseBtn = document.getElementById('mobileQuickPraiseBtn');
    if (mobileQuickPraiseBtn) {
        mobileQuickPraiseBtn.addEventListener('click', () => {
            closeMobileDrawer();
            if (showQuickPraiseFn) showQuickPraiseFn();
        });
    }

    const mobileNotificationBtn = document.getElementById('mobileNotificationBtn');
    if (mobileNotificationBtn) {
        mobileNotificationBtn.addEventListener('click', () => {
            closeMobileDrawer();
            if (isStudentMode()) {
                showStudentNotifications();
            } else {
                if (showNotificationsFn) showNotificationsFn();
            }
        });
    }

    const mobileSettingsBtn = document.getElementById('mobileSettingsBtn');
    if (mobileSettingsBtn) {
        mobileSettingsBtn.addEventListener('click', () => {
            closeMobileDrawer();
            if (isStudentMode()) {
                showStudentPinChangeModal();
            } else {
                router.navigate('settings');
            }
        });
    }

    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', () => {
            closeMobileDrawer();
            if (isStudentMode()) {
                handleStudentLogout();
            } else {
                if (confirm('로그아웃 하시겠습니까?')) {
                    store.teacherLogout();
                    router.navigate('login');
                }
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
    const studentClassInfo = document.getElementById('studentClassInfo');
    const teacherClassInfo = document.getElementById('classInfo');

    // 학생 로그인 상태가 아니면 버튼 숨김
    if (!store.isStudentLoggedIn()) {
        if (btn) btn.classList.add('hidden');
        if (settingsBtn) settingsBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (studentClassInfo) studentClassInfo.classList.add('hidden');
        if (teacherClassInfo) teacherClassInfo.classList.remove('hidden');
        return;
    }

    const student = store.getCurrentStudent();
    if (!student) {
        if (btn) btn.classList.add('hidden');
        if (settingsBtn) settingsBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (studentClassInfo) studentClassInfo.classList.add('hidden');
        return;
    }

    // 학생 로그인 상태면 버튼 표시
    if (btn) btn.classList.remove('hidden');
    if (settingsBtn) settingsBtn.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');

    // 학급정보 표시 (학생용)
    if (studentClassInfo) {
        const settings = store.getSettings();
        studentClassInfo.textContent = settings?.className || '우리반';
        studentClassInfo.classList.remove('hidden');
    }
    if (teacherClassInfo) teacherClassInfo.classList.add('hidden');

    // 1. 미읽은 답장 수
    const unreadReplies = store.getUnreadReplyCount(student.id);

    // 2. 새 칭찬 수 (마지막 확인 이후)
    const praises = store.getPraisesByStudent(student.id) || [];
    const lastSeen = parseInt(sessionStorage.getItem('lastSeenPraiseCount') || '0');
    const newPraises = Math.max(0, praises.length - lastSeen);

    // 3. 새 알림장 수
    const unreadNotices = store.getUnreadStudentNoticeCount?.(student.id) || 0;

    const total = unreadReplies + newPraises + unreadNotices;

    if (badge) {
        if (total > 0) {
            badge.textContent = total > 99 ? '99+' : total;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // 모바일 드로어 알림 뱃지도 동기화
    const mobileBadge = document.getElementById('mobileStudentNotiBadge');
    if (mobileBadge) {
        if (total > 0) {
            mobileBadge.textContent = total > 99 ? '99+' : total;
            mobileBadge.classList.remove('hidden');
        } else {
            mobileBadge.classList.add('hidden');
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
    const isStudentRoute = ['student-main', 'student-chat', 'pet-selection', 'pet-collection', 'student-timetable', 'student-praise', 'student-notice'].includes(route);

    if (isLoginRoute) {
        // 모드 해제
        document.body.classList.remove('student-mode');
        document.body.classList.remove('teacher-mode');
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
        // 모드 전환
        document.body.classList.remove('teacher-mode');
        document.body.classList.add('student-mode');
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
        const mobileStudentActions = document.getElementById('mobileStudentActions');
        if (mobileTeacherNav) mobileTeacherNav.classList.add('hidden');
        if (mobileStudentNav) mobileStudentNav.classList.remove('hidden');
        if (mobileStudentActions) mobileStudentActions.classList.remove('hidden');

        // 교사 프로필 숨김
        const mobileDrawerProfile = document.getElementById('mobileDrawerProfile');
        if (mobileDrawerProfile) mobileDrawerProfile.classList.add('hidden');

        // 학생 알림/로그아웃 버튼 표시
        updateStudentNotificationBadge();
    } else {
        // 모드 전환
        document.body.classList.remove('student-mode');
        document.body.classList.add('teacher-mode');
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
        const mobileStudentActions = document.getElementById('mobileStudentActions');
        if (mobileTeacherNav) mobileTeacherNav.classList.remove('hidden');
        if (mobileStudentNav) mobileStudentNav.classList.add('hidden');
        if (mobileStudentActions) mobileStudentActions.classList.add('hidden');
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
    const profilePic = document.getElementById('teacherProfilePic');
    if (!classInfoEl) return;

    // 모바일 드로어 프로필 요소
    const mobileProfile = document.getElementById('mobileDrawerProfile');
    const mobileProfilePic = document.getElementById('mobileProfilePic');
    const mobileProfileName = document.getElementById('mobileProfileName');
    const mobileProfileClass = document.getElementById('mobileProfileClass');

    // 로그인 상태 확인 - 로그인하지 않았으면 표시하지 않음
    const isLoggedIn = store.isGoogleTeacher() || store.getClassCode();
    if (!isLoggedIn) {
        classInfoEl.textContent = '';
        if (profilePic) profilePic.classList.add('hidden');
        if (mobileProfile) mobileProfile.classList.add('hidden');
        return;
    }

    const settings = store.getSettings();
    if (settings) {
        classInfoEl.textContent = `${settings.className} · ${settings.teacherName}`;
    }

    // Google 프로필 사진 표시
    const session = store.getTeacherSession();
    if (profilePic) {
        if (session?.photoURL) {
            profilePic.src = session.photoURL;
            profilePic.classList.remove('hidden');
            // 이미지 로드 실패 시 숨김
            profilePic.onerror = () => {
                profilePic.classList.add('hidden');
                profilePic.onerror = null;
            };
        } else {
            profilePic.classList.add('hidden');
        }
    }

    // 모바일 드로어 프로필 업데이트 (앱 설정 기준)
    if (mobileProfile) {
        mobileProfile.classList.remove('hidden');
        if (mobileProfilePic) {
            if (session?.photoURL) {
                mobileProfilePic.src = session.photoURL;
                mobileProfilePic.style.display = '';
                mobileProfilePic.onerror = () => {
                    mobileProfilePic.style.display = 'none';
                    mobileProfilePic.onerror = null;
                };
            } else {
                mobileProfilePic.style.display = 'none';
            }
        }
        if (mobileProfileName) mobileProfileName.textContent = settings?.teacherName || '선생님';
        if (mobileProfileClass) {
            const classCode = store.getClassCode();
            mobileProfileClass.textContent = classCode
                ? `${settings?.className || ''} · ${classCode}`
                : settings?.className || '';
            // 복사 버튼 표시/숨기기
            const copyBtn = document.getElementById('mobileCodeCopyBtn');
            if (copyBtn) {
                if (classCode) {
                    copyBtn.classList.remove('hidden');
                    copyBtn.onclick = () => {
                        navigator.clipboard.writeText(classCode).then(() => {
                            showToast('학급코드가 복사되었어요', 'success');
                        }).catch(() => {});
                    };
                } else {
                    copyBtn.classList.add('hidden');
                }
            }
        }
    }
}
