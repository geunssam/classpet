/**
 * 교사용 알림장 컴포넌트
 * 칠판 스타일 모달, 학생 공유 기능 포함
 */

import { store } from '../store.js';
import { router } from '../router.js';
import { toDateString } from '../utils/dateUtils.js';
import { showToast, openModal, closeModal, setModalContent } from '../utils/animations.js';
import { sanitizeHTML, stripHTML } from '../utils/htmlSanitizer.js';

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
            ${grouped[date].map(n => {
                const sharedBadge = n.sharedTo
                    ? `<span class="inline-flex items-center gap-1 text-xs text-green-500 font-medium">
                        <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>공유됨</span>`
                    : `<span class="text-xs text-orange-400">미공유</span>`;
                return `
                <div class="notice-card bg-white rounded-2xl p-4 mb-2 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                     data-notice-id="${n.id}" data-action="view">
                    <div class="flex items-start justify-between">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <h3 class="font-semibold text-gray-800 text-sm truncate">${escapeText(n.title)}</h3>
                                ${sharedBadge}
                            </div>
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
            `}).join('')}
        </div>
    `).join('');
}

export function afterRender() {
    document.getElementById('newNoticeBtn')?.addEventListener('click', openWriteModal);

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

// ==================== 칠판 스타일 작성 모달 ====================

function openWriteModal() {
    const today = toDateString();
    const defaultTitle = `${today.replace(/-/g, '.')} 알림장`;

    setModalMode('chalkboard-mode');

    setModalContent(`
        <div class="chalkboard">
            <div class="chalkboard-header">
                <h3 class="chalkboard-title">✏️ 새 알림장 작성</h3>
                <button id="closeWriteModal" class="chalkboard-close-btn">✕</button>
            </div>
            <div class="chalkboard-body">
                <div id="noticeTitle" contenteditable="true"
                     class="chalkboard-input"
                     data-placeholder="제목을 입력하세요">${escapeText(defaultTitle)}</div>
                <div class="chalkboard-divider"></div>
                <div class="chalkboard-toolbar">
                    <button data-cmd="bold" class="chalk-tool-btn" title="굵게"><strong>B</strong></button>
                    <button data-cmd="italic" class="chalk-tool-btn" title="기울임"><em>I</em></button>
                    <button data-cmd="underline" class="chalk-tool-btn" title="밑줄"><u>U</u></button>
                    <button data-cmd="insertUnorderedList" class="chalk-tool-btn" title="목록">• 목록</button>
                </div>
                <div id="noticeEditor" contenteditable="true"
                     class="chalkboard-editor"
                     data-placeholder="알림 내용을 입력하세요..."></div>
            </div>
            <div class="chalkboard-footer">
                <button id="saveNoticeBtn" class="chalkboard-save-btn">
                    ✅ 저장하고 공유하기
                </button>
            </div>
        </div>
    `);

    openModal();

    // 백드롭 클릭 시 모드 해제 후 닫기
    const container = document.getElementById('modalContainer');
    const backdrop = container?.querySelector('.modal-backdrop');
    if (backdrop) backdrop.onclick = () => closeNoticeModal();

    // 에디터 서식 버튼
    container?.querySelectorAll('.chalk-tool-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand(btn.dataset.cmd, false, null);
            document.getElementById('noticeEditor')?.focus();
        });
    });

    // placeholder 처리
    const editor = document.getElementById('noticeEditor');
    if (editor) {
        editor.addEventListener('focus', function () {
            if (this.textContent.trim() === '') this.innerHTML = '';
        });
    }

    // 저장 → 공유 모달로 전환
    document.getElementById('saveNoticeBtn')?.addEventListener('click', () => {
        const title = document.getElementById('noticeTitle')?.textContent?.trim();
        const content = document.getElementById('noticeEditor')?.innerHTML?.trim();

        if (!content || stripHTML(content).trim() === '') {
            showToast('내용을 입력해주세요', 'warning');
            return;
        }

        const newNotice = store.addNotice({ title: title || `${today} 알림장`, content });
        showToast('알림장이 저장되었어요 ✅');

        // 학생 공유 모달로 전환
        openShareModal(newNotice);
    });

    document.getElementById('closeWriteModal')?.addEventListener('click', () => closeNoticeModal());
}

// ==================== 학생 공유 모달 ====================

function openShareModal(notice) {
    const students = store.getStudents() || [];

    if (students.length === 0) {
        closeNoticeModal();
        showToast('학생이 없어요. 먼저 학생을 추가해주세요.', 'warning');
        refreshList();
        return;
    }

    setModalMode('share-mode');

    const studentCards = students.map(s => `
        <div class="share-student-card selected" data-student-id="${s.id}">
            <div class="share-check">
                <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
            </div>
            <span class="share-student-number">${s.number}번</span>
            <span class="share-student-name">${escapeText(s.name)}</span>
        </div>
    `).join('');

    setModalContent(`
        <div class="share-modal">
            <div class="share-header">
                <div>
                    <h3 class="share-title">📮 알림장 공유</h3>
                    <p class="share-subtitle">알림장을 받을 학생을 선택하세요</p>
                </div>
                <button id="closeShareModal" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="share-controls">
                <label class="share-select-all" id="selectAllLabel">
                    <div class="share-checkbox checked" id="selectAllCheckbox">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <span>전체 선택</span>
                </label>
                <span class="share-count" id="shareCount">${students.length}명 선택</span>
            </div>
            <div class="share-student-grid" id="studentShareGrid">
                ${studentCards}
            </div>
            <div class="share-footer">
                <button id="skipShareBtn" class="share-skip-btn">건너뛰기</button>
                <button id="confirmShareBtn" class="share-confirm-btn">
                    📤 공유하기 (${students.length}명)
                </button>
            </div>
        </div>
    `);

    // 백드롭 클릭
    const container = document.getElementById('modalContainer');
    const backdrop = container?.querySelector('.modal-backdrop');
    if (backdrop) backdrop.onclick = () => { closeNoticeModal(); refreshList(); };

    const grid = document.getElementById('studentShareGrid');

    // 학생 카드 토글
    grid?.addEventListener('click', (e) => {
        const card = e.target.closest('.share-student-card');
        if (card) {
            card.classList.toggle('selected');
            updateShareCount();
        }
    });

    // 전체 선택 토글
    document.getElementById('selectAllLabel')?.addEventListener('click', () => {
        const allCards = grid?.querySelectorAll('.share-student-card') || [];
        const allSelected = [...allCards].every(c => c.classList.contains('selected'));
        allCards.forEach(c => {
            if (allSelected) c.classList.remove('selected');
            else c.classList.add('selected');
        });
        updateShareCount();
    });

    function updateShareCount() {
        const allCards = grid?.querySelectorAll('.share-student-card') || [];
        const selectedCards = grid?.querySelectorAll('.share-student-card.selected') || [];
        const count = selectedCards.length;

        const countEl = document.getElementById('shareCount');
        if (countEl) countEl.textContent = `${count}명 선택`;

        const confirmBtn = document.getElementById('confirmShareBtn');
        if (confirmBtn) {
            confirmBtn.textContent = `📤 공유하기 (${count}명)`;
            confirmBtn.disabled = count === 0;
        }

        const checkbox = document.getElementById('selectAllCheckbox');
        if (checkbox) {
            if (count === allCards.length && count > 0) checkbox.classList.add('checked');
            else checkbox.classList.remove('checked');
        }
    }

    // 공유 확인
    document.getElementById('confirmShareBtn')?.addEventListener('click', async () => {
        const selectedCards = grid?.querySelectorAll('.share-student-card.selected') || [];
        const studentIds = [...selectedCards].map(c => c.dataset.studentId);

        if (studentIds.length === 0) {
            showToast('공유할 학생을 선택해주세요', 'warning');
            return;
        }

        await store.shareNotice(notice.id, studentIds);
        closeNoticeModal();
        showToast(`${studentIds.length}명에게 알림장을 공유했어요 📮`);
        refreshList();
    });

    // 건너뛰기
    document.getElementById('skipShareBtn')?.addEventListener('click', () => {
        closeNoticeModal();
        refreshList();
    });

    // 닫기
    document.getElementById('closeShareModal')?.addEventListener('click', () => {
        closeNoticeModal();
        refreshList();
    });
}

// ==================== 칠판 스타일 보기 모달 ====================

function openViewModal(notice) {
    setModalMode('chalkboard-mode');

    const sharedInfo = notice.sharedTo
        ? `<div class="chalkboard-shared-info">✅ ${notice.sharedTo.length}명에게 공유됨</div>`
        : '';

    const shareBtn = !notice.sharedTo
        ? `<button id="shareFromViewBtn" class="chalkboard-save-btn">📮 학생에게 공유하기</button>`
        : `<button id="reshareBtn" class="chalkboard-reshare-btn">다시 공유하기</button>`;

    setModalContent(`
        <div class="chalkboard chalkboard-view">
            <div class="chalkboard-header">
                <div>
                    <h3 class="chalkboard-title">${escapeText(notice.title)}</h3>
                    <p class="chalkboard-date">${formatDate(notice.date)} ${formatTime(notice.createdAt)}</p>
                </div>
                <button id="closeViewModal" class="chalkboard-close-btn">✕</button>
            </div>
            <div class="chalkboard-body chalkboard-view-body">
                <div class="chalkboard-content">${sanitizeHTML(notice.content)}</div>
            </div>
            <div class="chalkboard-footer">
                ${sharedInfo}
                ${shareBtn}
            </div>
        </div>
    `);

    openModal();

    const container = document.getElementById('modalContainer');
    const backdrop = container?.querySelector('.modal-backdrop');
    if (backdrop) backdrop.onclick = () => closeNoticeModal();

    document.getElementById('closeViewModal')?.addEventListener('click', () => closeNoticeModal());

    // 공유 / 다시 공유
    document.getElementById('shareFromViewBtn')?.addEventListener('click', () => openShareModal(notice));
    document.getElementById('reshareBtn')?.addEventListener('click', () => openShareModal(notice));
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
