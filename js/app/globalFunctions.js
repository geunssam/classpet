/**
 * 전역 함수 등록
 * window.classpet 객체에 전역에서 접근 가능한 함수 등록
 */

import { store } from '../store.js';
import { router } from '../router.js';
import { openModal, closeModal } from '../utils/animations.js';
import { showQuickPraise } from '../components/QuickPraise.js';
import * as Emotion from '../components/Emotion.js';
import * as Stats from '../components/Stats.js';
import { showAddStudent, showEditStudent, deleteStudent, showAddNote, deleteNote } from './modals.js';

/**
 * 현재 뷰 새로고침
 */
export function refreshCurrentView() {
    router.handleRoute();
}

/**
 * 전역 함수 등록
 */
export function registerGlobalFunctions() {
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
        openChatRoom: Emotion.openChatRoom,

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
