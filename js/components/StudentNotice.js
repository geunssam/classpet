/**
 * 학생용 알림장 보기 컴포넌트
 * 교사가 공유한 알림장을 읽기 전용으로 표시
 */

import { store } from '../store.js';
import { router } from '../router.js';
import { sanitizeHTML } from '../utils/htmlSanitizer.js';

let noticeUnsubscribe = null;

export function render() {
    if (!store.isStudentLoggedIn()) {
        setTimeout(() => router.navigate('student-login'), 0);
        return '<div class="text-center p-8">로그인이 필요합니다...</div>';
    }

    const student = store.getCurrentStudent();
    if (!student) {
        setTimeout(() => router.navigate('student-login'), 0);
        return '<div class="text-center p-8">학생 정보를 찾을 수 없습니다...</div>';
    }

    const notices = store.getSharedNoticesForStudent(student.id);

    return `
        <div class="student-notice-page px-4 pt-4 pb-8 max-w-2xl mx-auto">
            <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                📋 알림장
                ${notices.length > 0 ? `<span class="text-xs font-medium text-gray-400">${notices.length}개</span>` : ''}
            </h2>
            <div id="studentNoticeList">
                ${renderStudentNoticeList(notices)}
            </div>
        </div>
    `;
}

function renderStudentNoticeList(notices) {
    if (!notices || notices.length === 0) {
        return `
            <div class="text-center py-16">
                <div class="text-5xl mb-4">📭</div>
                <p class="text-gray-500 font-medium">아직 알림장이 없어요</p>
                <p class="text-gray-400 text-sm mt-1">선생님이 알림장을 보내면 여기에 나타나요</p>
            </div>
        `;
    }

    return notices.map(n => `
        <div class="student-notice-card" data-notice-id="${n.id}">
            <div class="student-notice-header">
                <h3 class="student-notice-title">${escapeText(n.title)}</h3>
                <span class="student-notice-date">${formatDate(n.date)}</span>
            </div>
            <div class="student-notice-body">${sanitizeHTML(n.content)}</div>
        </div>
    `).join('');
}

export function afterRender() {
    // 실시간 구독으로 교사가 새 알림장을 공유하면 자동 갱신
    noticeUnsubscribe = store.subscribeToNoticesRealtime(() => {
        refreshStudentNoticeList();
    });
}

export function unmount() {
    if (noticeUnsubscribe) {
        noticeUnsubscribe();
        noticeUnsubscribe = null;
    }
}

function refreshStudentNoticeList() {
    const listEl = document.getElementById('studentNoticeList');
    const student = store.getCurrentStudent();
    if (listEl && student) {
        const notices = store.getSharedNoticesForStudent(student.id);
        listEl.innerHTML = renderStudentNoticeList(notices);
    }
}

// ==================== 유틸리티 ====================

function escapeText(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return `${Number(m)}월 ${Number(d)}일 (${days[date.getDay()]})`;
}
