/**
 * 칭찬 관리 컴포넌트
 * 교사용 - 칭찬 카테고리 관리 + 칭찬 보내기
 */

import { store } from '../store.js';
import { showQuickPraise } from './QuickPraise.js';
import { showToast, setModalContent, openModal, closeModal } from '../utils/animations.js';

let currentTab = 'categories';

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
                    ${Object.entries(categories).map(([key, cat]) => `
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
                <div class="text-center py-8">
                    <div class="text-5xl mb-4">⭐</div>
                    <p class="text-gray-600 mb-6">학생을 선택하고 칭찬 카테고리를 골라 칭찬해보세요!</p>
                    <button id="openQuickPraiseBtn" class="btn btn-primary py-3 px-8 text-lg">
                        칭찬 보내기
                    </button>
                </div>
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
}

/**
 * 카테고리 추가/수정 모달
 */
function showCategoryModal(editKey = null, editCat = null) {
    const isEdit = !!editKey;
    const title = isEdit ? '카테고리 수정' : '카테고리 추가';

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">${isEdit ? '✏️' : '➕'} ${title}</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">아이콘 (이모지)</label>
                <input type="text" id="categoryIcon" value="${editCat?.icon || ''}" class="w-full p-3 border rounded-xl text-center text-2xl" placeholder="🌟" maxlength="4">
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

    document.getElementById('saveCategoryBtn')?.addEventListener('click', () => {
        const icon = document.getElementById('categoryIcon').value.trim();
        const name = document.getElementById('categoryName').value.trim();
        const exp = parseInt(document.getElementById('categoryExp').value);

        if (!icon) {
            showToast('아이콘을 입력해주세요', 'warning');
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
 * 뷰 새로고침
 */
function refreshView() {
    const content = document.getElementById('content');
    if (content) {
        content.innerHTML = render();
        afterRender();
    }
}
