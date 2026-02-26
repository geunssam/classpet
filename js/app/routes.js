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
import * as StudentMode from '../features/dashboard/StudentMode.js';
import * as PetChat from '../features/pet/PetChat.js';
import * as PetSelection from '../features/pet/PetSelection.js';
import * as PetCollection from '../features/pet/PetCollection.js';
import * as StudentTimetable from '../features/timetable/StudentTimetable.js';
import * as StudentPraise from '../features/praise/StudentPraise.js';
import * as StudentNotice from '../features/notice/StudentNotice.js';

import { updateHeaderForStudentMode, syncActiveTab, updateNotificationBadge, updateUIVisibility } from './navigation.js';

/**
 * 라우터 초기화
 */
export function initRouter() {
    // 라우트 등록
    router.registerAll({
        // 로그인 관련 라우트
        'login': {
            render: () => {
                const html = LoginSelect.render();
                setTimeout(() => LoginSelect.afterRender?.(), 0);
                return html;
            },
            unmount: () => LoginSelect.unmount?.()
        },
        'teacher-login': {
            render: () => {
                const html = TeacherLogin.render();
                setTimeout(() => TeacherLogin.afterRender?.(), 0);
                return html;
            },
            unmount: () => TeacherLogin.unmount?.()
        },
        'class-select': {
            render: async () => {
                const html = await ClassSelect.render();
                setTimeout(() => ClassSelect.afterRender?.(), 0);
                return html;
            },
            unmount: () => ClassSelect.unmount?.()
        },
        // 교사 모드 라우트
        'dashboard': {
            render: () => {
                if (!store.isTeacherLoggedIn()) {
                    setTimeout(() => router.navigate('login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                const html = Dashboard.render();
                setTimeout(() => Dashboard.afterRender?.(), 0);
                return html;
            },
            unmount: () => Dashboard.unmount?.()
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
            },
            unmount: () => Timetable.unmount?.()
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
            },
            unmount: () => PetFarm.unmount?.()
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
            },
            unmount: () => StudentDetail.unmount?.()
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
            },
            unmount: () => Emotion.unmount?.()
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
            },
            unmount: () => PraiseManagement.unmount?.()
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
            },
            unmount: () => Stats.unmount?.()
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
            },
            unmount: () => Settings.unmount?.()
        },
        'picker': {
            render: () => {
                if (!store.isTeacherLoggedIn()) {
                    setTimeout(() => router.navigate('login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                const html = Picker.render();
                setTimeout(() => Picker.afterRender?.(), 0);
                return html;
            },
            unmount: () => Picker.unmount?.()
        },
        'timer': {
            render: () => {
                if (!store.isTeacherLoggedIn()) {
                    setTimeout(() => router.navigate('login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                const html = TimerView.render();
                setTimeout(() => TimerView.afterRender?.(), 0);
                return html;
            },
            unmount: () => TimerView.unmount?.()
        },
        'notice': {
            render: () => {
                if (!store.isTeacherLoggedIn()) {
                    setTimeout(() => router.navigate('login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                const html = Notice.render();
                setTimeout(() => Notice.afterRender?.(), 0);
                return html;
            },
            unmount: () => Notice.unmount?.()
        },
        // 학생 모드 라우트
        'student-login': {
            render: (params) => {
                updateHeaderForStudentMode(true, false);
                const html = StudentLogin.render(params);
                setTimeout(() => StudentLogin.afterRender?.(), 0);
                return html;
            },
            unmount: () => StudentLogin.unmount?.()
        },
        'student-main': {
            render: () => {
                updateHeaderForStudentMode(true, true);
                const html = StudentMode.render();
                setTimeout(() => StudentMode.afterRender?.(), 0);
                return html;
            },
            unmount: () => StudentMode.unmount?.()
        },
        'student-chat': {
            render: () => {
                updateHeaderForStudentMode(true, true);
                const html = PetChat.render();
                setTimeout(() => PetChat.afterRender?.(), 0);
                return html;
            },
            unmount: () => PetChat.unmount?.()
        },
        'pet-selection': {
            render: () => {
                if (!store.isStudentLoggedIn()) {
                    setTimeout(() => router.navigate('student-login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                updateHeaderForStudentMode(true, true);
                const html = PetSelection.render();
                setTimeout(() => PetSelection.afterRender?.(), 0);
                return html;
            },
            unmount: () => PetSelection.unmount?.()
        },
        'pet-collection': {
            render: () => {
                if (!store.isStudentLoggedIn()) {
                    setTimeout(() => router.navigate('student-login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                updateHeaderForStudentMode(true, true);
                const html = PetCollection.render();
                setTimeout(() => PetCollection.afterRender?.(), 0);
                return html;
            },
            unmount: () => PetCollection.unmount?.()
        },
        'student-timetable': {
            render: () => {
                if (!store.isStudentLoggedIn()) {
                    setTimeout(() => router.navigate('student-login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                updateHeaderForStudentMode(true, true);
                const html = StudentTimetable.render();
                setTimeout(() => StudentTimetable.afterRender?.(), 0);
                return html;
            },
            unmount: () => StudentTimetable.unmount?.()
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
            },
            unmount: () => StudentPraise.unmount?.()
        },
        'student-notice': {
            render: () => {
                if (!store.isStudentLoggedIn()) {
                    setTimeout(() => router.navigate('student-login'), 0);
                    return '<div class="text-center p-8">로그인이 필요합니다...</div>';
                }
                updateHeaderForStudentMode(true, true);
                const html = StudentNotice.render();
                setTimeout(() => StudentNotice.afterRender?.(), 0);
                return html;
            },
            unmount: () => StudentNotice.unmount?.()
        }
    });

    // 라우터 초기화
    router.init('content');

    // 라우트 변경 시 헤더 업데이트
    router.onRouteChange = (route, params) => {
        const isStudentRoute = ['student-login', 'student-main', 'student-chat', 'pet-selection', 'pet-collection', 'student-timetable', 'student-praise', 'student-notice'].includes(route);
        const isLoginRoute = ['login', 'teacher-login', 'class-select'].includes(route);

        if (isStudentRoute) {
            // 학생 라우트: 학생 모드 헤더 적용 (로그인 여부에 따라)
            const isStudentLoggedIn = store.isStudentLoggedIn();
            updateHeaderForStudentMode(true, isStudentLoggedIn);
        } else if (!isLoginRoute) {
            // 교사 라우트: 교사 모드 헤더 복원
            updateHeaderForStudentMode(false, false);
        }

        syncActiveTab(route);
        updateNotificationBadge();
        updateUIVisibility(route);
    };

    // 초기 라우트에 대해서도 UI 가시성 적용
    const initialRoute = window.location.hash.slice(1).split('?')[0] || 'login';
    updateUIVisibility(initialRoute);
}
