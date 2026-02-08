/**
 * 칭찬 관리 컴포넌트
 * 교사용 - 칭찬 카테고리 관리 + 칭찬 보내기
 */

import { store } from '../store.js';
import { showQuickPraise } from './QuickPraise.js';
import { showToast, setModalContent, openModal, closeModal } from '../utils/animations.js';
import { PRAISE_CATEGORIES } from '../constants/index.js';

// 기본 카테고리 키 순서 (학생 페이지와 동일)
const DEFAULT_CAT_ORDER = Object.keys(PRAISE_CATEGORIES);

let currentTab = 'categories';
let sendSelectedCategory = 'all';
let sendCurrentDate = new Date();

/**
 * 렌더링
 */
export function render() {
    const categories = store.getPraiseCategories();

    return `
        <div class="p-4 max-w-2xl mx-auto">
            <h2 class="text-xl font-bold text-gray-800 mb-4">⭐ 칭찬 관리</h2>

            <!-- 탭 -->
            <div class="flex gap-2 mb-6">
                <button id="tabCategories" class="tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${currentTab === 'categories' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
                    카테고리 관리
                </button>
                <button id="tabSendPraise" class="tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${currentTab === 'send' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
                    칭찬 보내기
                </button>
            </div>

            <!-- 카테고리 관리 탭 -->
            <div id="categoriesContent" class="${currentTab !== 'categories' ? 'hidden' : ''}">
                <div class="space-y-3 mb-4">
                    ${Object.entries(categories).sort(([a], [b]) => {
                        const ai = DEFAULT_CAT_ORDER.indexOf(a);
                        const bi = DEFAULT_CAT_ORDER.indexOf(b);
                        if (ai !== -1 && bi !== -1) return ai - bi;
                        if (ai !== -1) return -1;
                        if (bi !== -1) return 1;
                        return a.localeCompare(b);
                    }).map(([key, cat]) => `
                        <div class="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">${cat.icon}</span>
                                <div>
                                    <span class="font-medium text-gray-800">${cat.name}</span>
                                    <span class="text-xs text-primary ml-2">+${cat.exp} EXP</span>
                                </div>
                            </div>
                            <div class="flex gap-1">
                                <button class="edit-category-btn p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10" data-key="${key}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                </button>
                                <button class="delete-category-btn p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" data-key="${key}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="flex gap-2">
                    <button id="addCategoryBtn" class="flex-1 btn btn-primary py-3">
                        + 카테고리 추가
                    </button>
                    <button id="resetCategoriesBtn" class="btn bg-gray-100 text-gray-600 hover:bg-gray-200 py-3 px-4">
                        기본값 복원
                    </button>
                </div>
            </div>

            <!-- 칭찬 보내기 탭 -->
            <div id="sendPraiseContent" class="${currentTab !== 'send' ? 'hidden' : ''}">
                <!-- 칭찬 보내기 버튼 -->
                <button id="openQuickPraiseBtn" class="btn btn-primary w-full py-3 text-lg mb-5">
                    ⭐ 칭찬 보내기
                </button>

                ${renderSendPraiseList(categories)}
            </div>
        </div>
    `;
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // 탭 전환
    document.getElementById('tabCategories')?.addEventListener('click', () => {
        currentTab = 'categories';
        refreshView();
    });

    document.getElementById('tabSendPraise')?.addEventListener('click', () => {
        currentTab = 'send';
        refreshView();
    });

    // 카테고리 추가
    document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
        showCategoryModal();
    });

    // 기본값 복원
    document.getElementById('resetCategoriesBtn')?.addEventListener('click', () => {
        if (confirm('칭찬 카테고리를 기본값으로 복원하시겠습니까?')) {
            store.resetPraiseCategories();
            showToast('기본값으로 복원되었습니다', 'success');
            refreshView();
        }
    });

    // 편집 버튼들
    document.querySelectorAll('.edit-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key;
            const categories = store.getPraiseCategories();
            const cat = categories[key];
            if (cat) {
                showCategoryModal(key, cat);
            }
        });
    });

    // 삭제 버튼들
    document.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key;
            const categories = store.getPraiseCategories();
            const cat = categories[key];
            if (cat && confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?`)) {
                store.deletePraiseCategory(key);
                showToast('삭제되었습니다', 'info');
                refreshView();
            }
        });
    });

    // 칭찬 보내기
    document.getElementById('openQuickPraiseBtn')?.addEventListener('click', () => {
        showQuickPraise();
    });

    // === 칭찬 보내기 탭: 날짜 네비게이션 ===
    document.getElementById('sendPrevDate')?.addEventListener('click', () => {
        sendCurrentDate.setDate(sendCurrentDate.getDate() - 1);
        refreshView();
    });

    document.getElementById('sendNextDate')?.addEventListener('click', () => {
        const now = new Date();
        const isToday = sendCurrentDate.getFullYear() === now.getFullYear()
            && sendCurrentDate.getMonth() === now.getMonth()
            && sendCurrentDate.getDate() === now.getDate();
        if (!isToday) {
            sendCurrentDate.setDate(sendCurrentDate.getDate() + 1);
            refreshView();
        }
    });

    // 캘린더 날짜 선택
    const datePickerBtn = document.getElementById('sendDatePicker');
    const dateInput = document.getElementById('sendDateInput');
    datePickerBtn?.addEventListener('click', () => {
        dateInput?.showPicker?.();
    });
    dateInput?.addEventListener('change', (e) => {
        if (e.target.value) {
            const [y, m, d] = e.target.value.split('-').map(Number);
            sendCurrentDate = new Date(y, m - 1, d);
            refreshView();
        }
    });

    // === 칭찬 보내기 탭: 카테고리 필터 ===
    document.querySelectorAll('.send-cat-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            sendSelectedCategory = btn.dataset.cat;
            refreshView();
        });
    });
}

/**
 * 이모지 피커 데이터 (교육/칭찬에 적합한 큐레이션)
 */
const EMOJI_GROUPS = {
    '학습': ['📚', '📖', '✏️', '📝', '🎓', '💡', '🔬', '📐', '🧮', '💻'],
    '활동': ['⚽', '🏃', '🎯', '🏆', '🥇', '💪', '🎾', '🏅', '👟', '⛹️'],
    '감성': ['❤️', '⭐', '🌟', '✨', '💖', '🎵', '🎨', '🌈', '🦋', '🌸'],
    '사회': ['🤝', '👏', '🙌', '💬', '👥', '🫂', '🤗', '👋', '🎉', '🎊'],
    '기타': ['🏠', '🌱', '🍀', '🔥', '💎', '👑', '🎁', '🧹', '📌', '🐾']
};

/**
 * 카테고리 추가/수정 모달
 */
function showCategoryModal(editKey = null, editCat = null) {
    const isEdit = !!editKey;
    const title = isEdit ? '카테고리 수정' : '카테고리 추가';
    const currentIcon = editCat?.icon || '';

    const emojiGroupNames = Object.keys(EMOJI_GROUPS);
    const firstGroup = emojiGroupNames[0];

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">${isEdit ? '✏️' : '➕'} ${title}</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">아이콘 (이모지)</label>
                <input type="hidden" id="categoryIcon" value="${currentIcon}">

                <!-- 이모지 팔레트 (항상 표시) -->
                <div id="emojiPalette" class="border rounded-xl bg-white overflow-hidden">
                    <!-- 카테고리 탭 -->
                    <div class="flex border-b overflow-x-auto scrollbar-hide">
                        ${emojiGroupNames.map((name, i) => `
                            <button class="emoji-tab flex-shrink-0 px-3 py-2 text-xs font-medium transition-colors ${i === 0 ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}" data-group="${name}">
                                ${name}
                            </button>
                        `).join('')}
                    </div>
                    <!-- 이모지 그리드 -->
                    <div id="emojiGrid" class="p-3 grid grid-cols-5 gap-1">
                        ${EMOJI_GROUPS[firstGroup].map(emoji => `
                            <button class="emoji-item p-2 text-2xl rounded-lg hover:bg-primary/10 transition-colors text-center ${currentIcon === emoji ? 'bg-primary/20 ring-2 ring-primary' : ''}" data-emoji="${emoji}">${emoji}</button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">이름</label>
                <input type="text" id="categoryName" value="${editCat?.name || ''}" class="w-full p-3 border rounded-xl" placeholder="카테고리 이름">
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">경험치 (EXP)</label>
                <input type="number" id="categoryExp" value="${editCat?.exp || 10}" class="w-full p-3 border rounded-xl" min="1" max="100">
            </div>

            <button id="saveCategoryBtn" class="btn btn-primary w-full py-3">
                ${isEdit ? '수정하기' : '추가하기'}
            </button>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    const grid = document.getElementById('emojiGrid');
    const hiddenInput = document.getElementById('categoryIcon');

    // 카테고리 탭 전환
    document.querySelectorAll('.emoji-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const groupName = tab.dataset.group;
            const emojis = EMOJI_GROUPS[groupName];
            const selectedEmoji = hiddenInput.value;

            // 탭 활성화 스타일
            document.querySelectorAll('.emoji-tab').forEach(t => {
                t.classList.remove('text-primary', 'border-b-2', 'border-primary', 'bg-primary/5');
                t.classList.add('text-gray-500');
            });
            tab.classList.add('text-primary', 'border-b-2', 'border-primary', 'bg-primary/5');
            tab.classList.remove('text-gray-500');

            // 그리드 갱신
            grid.innerHTML = emojis.map(emoji => `
                <button class="emoji-item p-2 text-2xl rounded-lg hover:bg-primary/10 transition-colors text-center ${selectedEmoji === emoji ? 'bg-primary/20 ring-2 ring-primary' : ''}" data-emoji="${emoji}">${emoji}</button>
            `).join('');

            // 새 그리드 아이템에 클릭 이벤트 바인딩
            bindEmojiGridEvents(grid, hiddenInput);
        });
    });

    // 이모지 아이템 클릭 바인딩
    bindEmojiGridEvents(grid, hiddenInput);

    // 저장 버튼
    document.getElementById('saveCategoryBtn')?.addEventListener('click', () => {
        const icon = hiddenInput.value.trim();
        const name = document.getElementById('categoryName').value.trim();
        const exp = parseInt(document.getElementById('categoryExp').value);

        if (!icon) {
            showToast('아이콘을 선택해주세요', 'warning');
            return;
        }
        if (!name) {
            showToast('이름을 입력해주세요', 'warning');
            return;
        }
        if (!exp || exp < 1) {
            showToast('경험치를 올바르게 입력해주세요', 'warning');
            return;
        }

        if (isEdit) {
            store.updatePraiseCategory(editKey, { icon, name, exp });
            showToast('수정되었습니다', 'success');
        } else {
            store.addPraiseCategory({ icon, name, exp });
            showToast('추가되었습니다', 'success');
        }

        closeModal();
        refreshView();
    });
}

/**
 * 이모지 그리드 아이템 클릭 이벤트 바인딩
 */
function bindEmojiGridEvents(grid, hiddenInput) {
    grid.querySelectorAll('.emoji-item').forEach(item => {
        item.addEventListener('click', () => {
            const emoji = item.dataset.emoji;
            hiddenInput.value = emoji;

            // 선택 상태 표시 갱신
            grid.querySelectorAll('.emoji-item').forEach(el => {
                el.classList.remove('bg-primary/20', 'ring-2', 'ring-primary');
            });
            item.classList.add('bg-primary/20', 'ring-2', 'ring-primary');
        });
    });
}

/**
 * 칭찬 보내기 탭 - 날짜/카테고리 필터 + 보낸 칭찬 목록
 */
function renderSendPraiseList(categories) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const y = sendCurrentDate.getFullYear();
    const m = sendCurrentDate.getMonth();
    const d = sendCurrentDate.getDate();
    const dayName = days[sendCurrentDate.getDay()];

    const isToday = (() => {
        const now = new Date();
        return y === now.getFullYear() && m === now.getMonth() && d === now.getDate();
    })();

    // 날짜 문자열 (YYYY-MM-DD)
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // 로컬 칭찬 로그에서 해당 날짜 필터
    const allLog = store.getPraiseLog() || [];
    let filtered = allLog.filter(p => p.timestamp && p.timestamp.startsWith(dateStr));

    // 카테고리 필터
    if (sendSelectedCategory !== 'all') {
        filtered = filtered.filter(p => p.category === sendSelectedCategory);
    }

    // 날짜 네비게이션
    const dateNav = `
        <div class="flex items-center justify-center gap-3 mb-4">
            <button id="sendPrevDate" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span class="text-base font-medium text-gray-800">${y}년 ${m + 1}월 ${d}일 (${dayName})</span>
            <button id="sendNextDate" class="p-2 rounded-full hover:bg-gray-100 transition-colors ${isToday ? 'opacity-30 cursor-not-allowed' : ''}">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
            <button id="sendDatePicker" class="p-2 rounded-full hover:bg-gray-100 transition-colors ml-1" title="날짜 선택">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </button>
            <input type="date" id="sendDateInput" class="absolute opacity-0 w-0 h-0 pointer-events-none" value="${dateStr}">
        </div>
    `;

    // 카테고리 필터 태그
    const catFilter = `
        <div class="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-hide">
            <button class="send-cat-filter flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${sendSelectedCategory === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}" data-cat="all">
                전체
            </button>
            ${Object.entries(categories).sort(([a], [b]) => {
                const ai = DEFAULT_CAT_ORDER.indexOf(a);
                const bi = DEFAULT_CAT_ORDER.indexOf(b);
                if (ai !== -1 && bi !== -1) return ai - bi;
                if (ai !== -1) return -1;
                if (bi !== -1) return 1;
                return a.localeCompare(b);
            }).map(([key, cat]) => `
                <button class="send-cat-filter flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${sendSelectedCategory === key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}" data-cat="${key}">
                    ${cat.icon} ${cat.name}
                </button>
            `).join('')}
        </div>
    `;

    // 칭찬 목록
    let listHtml;
    if (filtered.length === 0) {
        listHtml = `
            <div class="text-center py-10">
                <div class="text-4xl mb-3">📭</div>
                <p class="text-gray-400">이 날 보낸 칭찬이 없어요</p>
            </div>
        `;
    } else {
        const cards = filtered.map(p => {
            const cat = categories[p.category];
            const icon = cat?.icon || '⭐';
            const catName = cat?.name || p.category;
            const ts = new Date(p.timestamp);
            const timeStr = `${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}`;
            // studentId로 학생 목록에서 직접 조회 (가장 신뢰도 높음)
            let studentLabel = '';
            if (p.studentId) {
                const st = store.getStudent(p.studentId);
                if (st) studentLabel = st.name || (st.number + '번');
            }
            if (!studentLabel) {
                studentLabel = (p.studentName && p.studentName.length > 0) ? p.studentName : (p.studentNumber ? p.studentNumber + '번' : '학생');
            }
            return `
                <div class="grid items-center bg-white rounded-xl px-3 py-2.5 shadow-sm border border-gray-100" style="grid-template-columns: 6.5rem 1fr 3rem;">
                    <span class="flex items-center gap-1.5 truncate">
                        <span class="text-base flex-shrink-0">${icon}</span>
                        <span class="text-sm font-medium text-gray-800 truncate">${catName}</span>
                    </span>
                    <span class="text-sm font-semibold text-gray-900 text-center truncate">${studentLabel}</span>
                    <span class="text-sm text-gray-500 text-right">${timeStr}</span>
                </div>
            `;
        }).join('');

        const needsScroll = filtered.length > 30;
        listHtml = `
            <div class="${needsScroll ? 'max-h-[480px] overflow-y-auto' : ''} grid grid-cols-2 gap-2">
                ${cards}
            </div>
        `;
    }

    return `
        ${dateNav}
        ${catFilter}
        <div class="text-sm font-medium text-gray-500 mb-3">보낸 칭찬 (${filtered.length}건)</div>
        ${listHtml}
    `;
}

/**
 * 뷰 새로고침
 */
function refreshView() {
    const content = document.getElementById('content');
    if (content) {
        content.innerHTML = render();
        afterRender();
    }
}
