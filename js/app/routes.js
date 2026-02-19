/**
 * 라우트 정의 및 초기화
 * URL별로 어떤 화면을 보여줄지 결정
 */

import { store } from '../store.js';
import { router } from '../router.js';

// 컴포넌트 임포트
import * as Dashboard from '../components/Dashboard.js';
import * as Timetable from '../components/Timetable.js';
import * as PetFarm from '../components/PetFarm.js';
import * as StudentDetail from '../components/StudentDetail.js';
import * as Emotion from '../components/Emotion.js';
import * as Stats from '../components/Stats.js';
import * as Settings from '../components/Settings.js';
import * as PraiseManagement from '../components/PraiseManagement.js';
import * as Picker from '../components/Picker.js';
import * as TimerView from '../components/TimerView.js';

// 로그인 컴포넌트
import * as LoginSelect from '../components/LoginSelect.js';
import * as TeacherLogin from '../components/TeacherLogin.js';
import * as ClassSelect from '../components/ClassSelect.js';

// 학생 모드 컴포넌트
import * as StudentLogin from '../components/StudentLogin.js';
import * as StudentMode from '../components/StudentMode.js';
import * as PetChat from '../components/PetChat.js';
import * as PetSelection from '../components/PetSelection.js';
import * as PetCollection from '../components/PetCollection.js';
import * as StudentTimetable from '../components/StudentTimetable.js';
import * as StudentPraise from '../components/StudentPraise.js';

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
        // 학생 모드 라우트
        'student-login': {
            render: (params) => {
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
        }
    });

    // 라우터 초기화
    router.init('content');

    // 라우트 변경 시 헤더 업데이트
    router.onRouteChange = (route, params) => {
        const isStudentRoute = ['student-login', 'student-main', 'student-chat', 'pet-selection', 'pet-collection', 'student-timetable', 'student-praise'].includes(route);
        const isLoginRoute = ['login', 'teacher-login', 'student-login', 'class-select'].includes(route);

        if (!isStudentRoute && !isLoginRoute) {
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
