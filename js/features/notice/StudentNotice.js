/**
 * 학생용 알림장 보기 컴포넌트
 * 교사가 공유한 알림장을 읽기 전용으로 표시
 */

import { store } from '../store.js';
import { router } from '../router.js';
import { sanitizeHTML } from '../utils/htmlSanitizer.js';
import { openModal, closeModal, setModalContent } from '../utils/animations.js';
import { updateStudentNotificationBadge } from '../app/navigation.js';

let noticeUnsubscribe = null;

// ==================== 모달 모드 관리 ====================

function setModalMode(mode) {
    const container = document.getElementById('modalContainer');
    if (!container) return;
    container.classList.remove('chalkboard-mode', 'share-mode');
    if (mode) container.classList.add(mode);
}

function closeNoticeModal() {
    setModalMode(null);
    closeModal();
}

// ==================== 메인 렌더링 ====================

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
            <div class="student-notice-preview">${escapeText(stripHTMLSimple(n.content))}</div>
        </div>
    `).join('');
}

export function afterRender() {
    const student = store.getCurrentStudent();

    // 읽음 처리: 현재 알림장 중 가장 최신 ID 기록
    if (student) {
        const notices = store.getSharedNoticesForStudent(student.id);
        if (notices.length > 0) {
            store.setLastSeenStudentNoticeId(notices[0].id);
            updateStudentNotificationBadge();
        }
    }

    // 카드 클릭 → 칠판 스타일 상세 모달
    document.getElementById('studentNoticeList')?.addEventListener('click', (e) => {
        const card = e.target.closest('.student-notice-card');
        if (!card) return;

        const noticeId = card.dataset.noticeId;
        const student = store.getCurrentStudent();
        if (!student) return;

        const notices = store.getSharedNoticesForStudent(student.id);
        const notice = notices.find(n => n.id === noticeId);
        if (notice) openNoticeDetail(notice);
    });

    // 실시간 구독으로 교사가 새 알림장을 공유하면 자동 갱신
    noticeUnsubscribe = store.subscribeToNoticesRealtime(() => {
        refreshStudentNoticeList();
        updateStudentNotificationBadge();
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

// ==================== 칠판 스타일 상세 모달 ====================

function openNoticeDetail(notice) {
    setModalMode('chalkboard-mode');

    setModalContent(`
        <div class="chalkboard chalkboard-view">
            <div class="chalkboard-header">
                <div>
                    <h3 class="chalkboard-title">${escapeText(notice.title)}</h3>
                    <p class="chalkboard-date">${formatDate(notice.date)} ${formatTime(notice.createdAt)}</p>
                </div>
                <button id="closeNoticeDetail" class="chalkboard-close-btn">✕</button>
            </div>
            <div class="chalkboard-body chalkboard-view-body">
                <div class="chalkboard-content">${sanitizeHTML(notice.content)}</div>
            </div>
        </div>
    `);

    openModal();

    const container = document.getElementById('modalContainer');
    const backdrop = container?.querySelector('.modal-backdrop');
    if (backdrop) backdrop.onclick = () => closeNoticeModal();

    document.getElementById('closeNoticeDetail')?.addEventListener('click', () => closeNoticeModal());
}

// ==================== 유틸리티 ====================

function escapeText(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function stripHTMLSimple(html) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return `${Number(m)}월 ${Number(d)}일 (${days[date.getDay()]})`;
}

function formatTime(isoStr) {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return '';
        const h = d.getHours();
        const m = String(d.getMinutes()).padStart(2, '0');
        const period = h < 12 ? '오전' : '오후';
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${period} ${hour12}:${m}`;
    } catch {
        return '';
    }
}
