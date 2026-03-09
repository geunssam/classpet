/**
 * 라우트 정의 및 초기화
 * URL별로 어떤 화면을 보여줄지 결정
 */

import { store } from '../store.js';
import { router } from '../router.js';

// 컴포넌트 임포트
import * as Dashboard from '../features/dashboard/Dashboard.js';
import * as Timetable from '../features/timetable/Timetable.js';
import * as PetFarm from '../features/pet/PetFarm.js';
import * as StudentDetail from '../features/stats/StudentDetail.js';
import * as Emotion from '../features/emotion/Emotion.js';
import * as Stats from '../features/stats/Stats.js';
import * as Settings from '../features/class/Settings.js';
import * as PraiseManagement from '../features/praise/PraiseManagement.js';
import * as Picker from '../features/classroom-tools/Picker.js';
import * as TimerView from '../features/classroom-tools/TimerView.js';
import * as Notice from '../features/notice/Notice.js';

// 로그인 컴포넌트
import * as LoginSelect from '../features/auth/LoginSelect.js';
import * as TeacherLogin from '../features/auth/TeacherLogin.js';
import * as ClassSelect from '../features/class/ClassSelect.js';

// 학생 모드 컴포넌트
import * as StudentLogin from '../features/auth/StudentLogin.js';
import * as StudentHome from '../features/dashboard/StudentHome.js';
import * as StudentEmotion from '../features/emotion/StudentEmotion.js';
import * as PetChat from '../features/pet/PetChat.js';
import * as PetSelection from '../features/pet/PetSelection.js';
import * as PetCollection from '../features/pet/PetCollection.js';
import * as StudentTimetable from '../features/timetable/StudentTimetable.js';
import * as StudentPraise from '../features/praise/StudentPraise.js';
import * as StudentNotice from '../features/notice/StudentNotice.js';

import { updateHeaderForStudentMode, syncActiveTab, updateNotificationBadge, updateStudentNotificationBadge, updateUIVisibility } from './navigation.js';

// 학생 모드 글로벌 알림장 구독 (StudentNotice 페이지 밖에서도 배지 갱신)
let studentNoticeUnsubscribe = null;

/* ── 라우트 헬퍼 ── */
const AUTH_DENIED = '<div class="text-center p-8">로그인이 필요합니다...</div>';

/** 공개 라우트 (인증 불필요) */
function open(component) {
    return {
        render: (params) => {
            const html = component.render(params);
            setTimeout(() => component.afterRender?.(params), 0);
            return html;
        },
        unmount: () => component.unmount?.()
    };
}

/** 교사 전용 라우트 */
function teacher(component) {
    return {
        render: (params) => {
            if (!store.isTeacherLoggedIn()) {
                setTimeout(() => router.navigate('login'), 0);
                return AUTH_DENIED;
            }
            const html = component.render(params);
            setTimeout(() => component.afterRender?.(params), 0);
            return html;
        },
        unmount: () => component.unmount?.()
    };
}

/** 학생 전용 라우트 (인증 체크 + 헤더 업데이트) */
function student(component) {
    return {
        render: (params) => {
            if (!store.isStudentLoggedIn()) {
                setTimeout(() => router.navigate('student-login'), 0);
                return AUTH_DENIED;
            }
            updateHeaderForStudentMode(true, true);
            const html = component.render(params);
            setTimeout(() => component.afterRender?.(params), 0);
            return html;
        },
        unmount: () => component.unmount?.()
    };
}

/** 학생 라우트 (인증 체크 없이 헤더만 업데이트) */
function studentOpen(component) {
    return {
        render: (params) => {
            updateHeaderForStudentMode(true, true);
            const html = component.render(params);
            setTimeout(() => component.afterRender?.(params), 0);
            return html;
        },
        unmount: () => component.unmount?.()
    };
}

/**
 * 라우터 초기화
 */
export function initRouter() {
    // 라우트 등록
    router.registerAll({
        // 로그인 관련
        'login': open(LoginSelect),
        'teacher-login': open(TeacherLogin),
        'class-select': {
            render: async () => {
                const html = await ClassSelect.render();
                setTimeout(() => ClassSelect.afterRender?.(), 0);
                return html;
            },
            unmount: () => ClassSelect.unmount?.()
        },

        // 교사 모드
        'dashboard': teacher(Dashboard),
        'timetable': teacher(Timetable),
        'petfarm': teacher(PetFarm),
        'student': teacher(StudentDetail),
        'emotion': teacher(Emotion),
        'praise': teacher(PraiseManagement),
        'stats': teacher(Stats),
        'settings': teacher(Settings),
        'picker': teacher(Picker),
        'timer': teacher(TimerView),
        'notice': teacher(Notice),

        // 학생 모드
        'student-login': {
            render: (params) => {
                updateHeaderForStudentMode(true, false);
                const html = StudentLogin.render(params);
                setTimeout(() => StudentLogin.afterRender?.(), 0);
                return html;
            },
            unmount: () => StudentLogin.unmount?.()
        },
        'student-home': student(StudentHome),
        'student-main': studentOpen(StudentEmotion),
        'student-chat': studentOpen(PetChat),
        'pet-selection': {
            render: () => {
                if (!store.isStudentLoggedIn()) {
                    setTimeout(() => router.navigate('student-login'), 0);
                    return AUTH_DENIED;
                }
                // 이미 펫이 있으면 홈으로 리다이렉트 (뒤로가기 중복 선택 방지)
                const session = store.getStudentSession();
                if (session?.studentId && store.hasSelectedPet(session.studentId)) {
                    setTimeout(() => router.navigate('student-home'), 0);
                    return '<div class="text-center p-8">이동 중...</div>';
                }
                updateHeaderForStudentMode(true, true);
                const html = PetSelection.render();
                setTimeout(() => PetSelection.afterRender?.(), 0);
                return html;
            },
            unmount: () => PetSelection.unmount?.()
        },
        'pet-collection': student(PetCollection),
        'student-timetable': student(StudentTimetable),
        'student-praise': student(StudentPraise),
        'student-notice': student(StudentNotice),
    });

    // 라우터 초기화
    router.init('content');

    // 라우트 변경 시 헤더 업데이트
    router.onRouteChange = (route, params) => {
        const isStudentRoute = ['student-login', 'student-home', 'student-main', 'student-chat', 'pet-selection', 'pet-collection', 'student-timetable', 'student-praise', 'student-notice'].includes(route);
        const isLoginRoute = ['login', 'teacher-login', 'class-select'].includes(route);

        if (isStudentRoute) {
            // 학생 라우트: 학생 모드 헤더 적용 (로그인 여부에 따라)
            const isStudentLoggedIn = store.isStudentLoggedIn();
            updateHeaderForStudentMode(true, isStudentLoggedIn);

            // 학생 라우트 진입 시 글로벌 알림장 구독 (배지 실시간 갱신)
            if (isStudentLoggedIn && !studentNoticeUnsubscribe) {
                studentNoticeUnsubscribe = store.subscribeToNoticesRealtime(() => {
                    updateStudentNotificationBadge();
                });
            }
        } else {
            // 학생 라우트를 벗어나면 알림장 구독 해제
            if (studentNoticeUnsubscribe) {
                studentNoticeUnsubscribe();
                studentNoticeUnsubscribe = null;
            }

            if (!isLoginRoute) {
                // 교사 라우트: 교사 모드 헤더 복원
                updateHeaderForStudentMode(false, false);
            }
        }

        syncActiveTab(route);
        updateNotificationBadge();
        updateUIVisibility(route);
    };

    // 초기 라우트에 대해서도 UI 가시성 적용
    const initialRoute = window.location.hash.slice(1).split('?')[0] || 'login';
    updateUIVisibility(initialRoute);
}
