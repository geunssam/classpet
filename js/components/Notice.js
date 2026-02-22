/**
 * 교사용 알림장 컴포넌트
 * 알림장 목록, 작성, 보기
 */

import { store } from '../store.js';
import { router } from '../router.js';
import { toDateString } from '../utils/dateUtils.js';
import { showToast, openModal, closeModal, setModalContent } from '../utils/animations.js';
import { sanitizeHTML, stripHTML } from '../utils/htmlSanitizer.js';

let noticeUnsubscribe = null;

export function render() {
    if (!store.isTeacherLoggedIn()) {
        setTimeout(() => router.navigate('login'), 0);
        return '<div class="text-center p-8">로그인이 필요합니다...</div>';
    }

    const notices = store.getNotices();

    return `
        <div class="notice-page p-4 max-w-2xl mx-auto">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-gray-800">알림장</h2>
                <button id="newNoticeBtn" class="btn btn-primary text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    새 알림장
                </button>
            </div>
            <div id="noticeList">
                ${renderNoticeList(notices)}
            </div>
        </div>
    `;
}

function renderNoticeList(notices) {
    if (!notices || notices.length === 0) {
        return `
            <div class="empty-state text-center py-12">
                <div class="text-4xl mb-3">📋</div>
                <p class="text-gray-500">아직 작성된 알림장이 없어요</p>
                <p class="text-gray-400 text-sm mt-1">새 알림장을 작성해보세요</p>
            </div>
        `;
    }

    // 날짜별 그룹핑
    const grouped = {};
    notices.forEach(n => {
        const dateKey = n.date || n.createdAt?.split('T')[0] || '';
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(n);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return sortedDates.map(date => `
        <div class="mb-4">
            <div class="text-xs font-semibold text-gray-400 mb-2 px-1">${formatDate(date)}</div>
            ${grouped[date].map(n => `
                <div class="notice-card bg-white rounded-2xl p-4 mb-2 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                     data-notice-id="${n.id}" data-action="view">
                    <div class="flex items-start justify-between">
                        <div class="flex-1 min-w-0">
                            <h3 class="font-semibold text-gray-800 text-sm truncate">${escapeText(n.title)}</h3>
                            <p class="text-gray-500 text-xs mt-1 line-clamp-2">${escapeText(n.plainText || stripHTML(n.content))}</p>
                            <span class="text-gray-400 text-xs mt-1.5 block">${formatTime(n.createdAt)}</span>
                        </div>
                        <button class="notice-delete-btn text-gray-300 hover:text-red-400 p-1 ml-2 flex-shrink-0 transition-colors"
                                data-notice-id="${n.id}" data-action="delete" title="삭제">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

export function afterRender() {
    // 새 알림장 버튼
    document.getElementById('newNoticeBtn')?.addEventListener('click', openWriteModal);

    // 카드 클릭 이벤트 위임
    document.getElementById('noticeList')?.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (deleteBtn) {
            e.stopPropagation();
            const noticeId = deleteBtn.dataset.noticeId;
            if (confirm('이 알림장을 삭제할까요?')) {
                store.deleteNoticeById(noticeId);
                refreshList();
            }
            return;
        }

        const card = e.target.closest('[data-action="view"]');
        if (card) {
            const noticeId = card.dataset.noticeId;
            const notice = store.getNotices().find(n => n.id === noticeId);
            if (notice) openViewModal(notice);
        }
    });

    // 실시간 구독
    noticeUnsubscribe = store.subscribeToNoticesRealtime(() => {
        refreshList();
    });
}

export function unmount() {
    if (noticeUnsubscribe) {
        noticeUnsubscribe();
        noticeUnsubscribe = null;
    }
}

function refreshList() {
    const listEl = document.getElementById('noticeList');
    if (listEl) {
        listEl.innerHTML = renderNoticeList(store.getNotices());
    }
}

// ==================== 작성 모달 ====================

function openWriteModal() {
    const today = toDateString();
    const defaultTitle = `${today.replace(/-/g, '.')} 알림장`;

    setModalContent(`
        <div class="modal-inner bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div class="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 class="font-bold text-gray-800">새 알림장 작성</h3>
                <button id="closeWriteModal" class="text-gray-400 hover:text-gray-600 p-1">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="p-4 flex-1 overflow-y-auto">
                <input id="noticeTitle" type="text" value="${escapeText(defaultTitle)}"
                       class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 mb-3"
                       placeholder="제목" />
                <div class="flex gap-1 mb-2">
                    <button data-cmd="bold" class="editor-btn px-2 py-1 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100" title="굵게">B</button>
                    <button data-cmd="italic" class="editor-btn px-2 py-1 rounded-lg text-sm italic text-gray-600 hover:bg-gray-100" title="기울임">I</button>
                    <button data-cmd="underline" class="editor-btn px-2 py-1 rounded-lg text-sm underline text-gray-600 hover:bg-gray-100" title="밑줄">U</button>
                    <button data-cmd="insertUnorderedList" class="editor-btn px-2 py-1 rounded-lg text-sm text-gray-600 hover:bg-gray-100" title="목록">• 목록</button>
                </div>
                <div id="noticeEditor" contenteditable="true"
                     class="w-full min-h-[200px] max-h-[300px] overflow-y-auto px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 leading-relaxed"
                     placeholder="알림 내용을 입력하세요..."></div>
            </div>
            <div class="p-4 border-t border-gray-100">
                <button id="saveNoticeBtn" class="btn btn-primary w-full py-2.5 rounded-xl font-semibold text-sm">저장</button>
            </div>
        </div>
    `);

    openModal();

    // 에디터 서식 버튼
    const modal = document.getElementById('modalContainer');
    modal?.querySelectorAll('.editor-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand(btn.dataset.cmd, false, null);
            document.getElementById('noticeEditor')?.focus();
        });
    });

    // placeholder 처리
    const editor = document.getElementById('noticeEditor');
    if (editor) {
        editor.addEventListener('focus', function() {
            if (this.textContent.trim() === '') this.innerHTML = '';
        });
    }

    // 저장
    document.getElementById('saveNoticeBtn')?.addEventListener('click', () => {
        const title = document.getElementById('noticeTitle')?.value?.trim();
        const content = document.getElementById('noticeEditor')?.innerHTML?.trim();

        if (!content || stripHTML(content).trim() === '') {
            showToast('내용을 입력해주세요', 'warning');
            return;
        }

        store.addNotice({ title: title || `${today} 알림장`, content });
        showToast('알림장이 저장되었어요');
        closeModal();
        refreshList();
    });

    // 닫기 (백드롭은 openModal이 처리)
    document.getElementById('closeWriteModal')?.addEventListener('click', () => closeModal());
}

// ==================== 보기 모달 ====================

function openViewModal(notice) {
    setModalContent(`
        <div class="modal-inner bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div class="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                    <h3 class="font-bold text-gray-800">${escapeText(notice.title)}</h3>
                    <p class="text-xs text-gray-400 mt-0.5">${formatDate(notice.date)} ${formatTime(notice.createdAt)}</p>
                </div>
                <button id="closeViewModal" class="text-gray-400 hover:text-gray-600 p-1">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="p-4 flex-1 overflow-y-auto">
                <div class="notice-content prose prose-sm text-gray-700 leading-relaxed">${sanitizeHTML(notice.content)}</div>
            </div>
        </div>
    `);

    openModal();

    // 닫기 (백드롭은 openModal이 처리)
    document.getElementById('closeViewModal')?.addEventListener('click', () => closeModal());
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
