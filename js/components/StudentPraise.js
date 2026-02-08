/**
 * 학생 받은 칭찬 컴포넌트
 * 카테고리 필터 + 월별 조회
 */

import { store } from '../store.js';
import { router } from '../router.js';
import { PRAISE_CATEGORIES } from '../constants/index.js';

// 기본 카테고리 키 순서 (교사 페이지와 동일)
const DEFAULT_CAT_ORDER = Object.keys(PRAISE_CATEGORIES);

let selectedCategory = 'all';
let currentMonth = new Date();
let praiseUnsubscribe = null;
let categoryUnsubscribe = null;
let lastPraiseSnapshot = '';

/**
 * 렌더링
 */
export function render() {
    if (!store.isStudentLoggedIn()) {
        setTimeout(() => router.navigate('student-login'), 0);
        return '<div class="text-center p-8">로그인이 필요합니다...</div>';
    }

    const student = store.getCurrentStudent();
    if (!student) {
        store.studentLogout();
        setTimeout(() => router.navigate('student-login'), 0);
        return '<div class="text-center p-8">학생 정보를 찾을 수 없습니다...</div>';
    }

    const categories = store.getPraiseCategories();
    const allPraises = store.getPraisesByStudent(student.id);

    // 월 필터
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthPraises = allPraises.filter(p => {
        const d = new Date(p.timestamp);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    // 카테고리 필터
    const filteredPraises = selectedCategory === 'all'
        ? monthPraises
        : monthPraises.filter(p => p.category === selectedCategory);

    // 날짜별 그룹핑
    const grouped = {};
    filteredPraises.forEach(p => {
        const dateKey = p.timestamp.split('T')[0];
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(p);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();

    return `
        <div class="p-4 pb-8">
            <h2 class="text-xl font-bold text-gray-800 mb-4">⭐ 받은 칭찬</h2>

            <!-- 카테고리 필터 -->
            <div class="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-hide">
                <button class="category-filter-btn flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}" data-cat="all">
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
                    <button class="category-filter-btn flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}" data-cat="${key}">
                        ${cat.icon} ${cat.name}
                    </button>
                `).join('')}
            </div>

            <!-- 월 네비게이션 -->
            <div class="flex items-center justify-center gap-4 mb-4">
                <button id="praisePrevMonth" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <span class="text-base font-medium text-gray-800">${year}년 ${month + 1}월</span>
                <button id="praiseNextMonth" class="p-2 rounded-full hover:bg-gray-100 transition-colors ${isCurrentMonth ? 'opacity-30 cursor-not-allowed' : ''}">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
            </div>

            <!-- 칭찬 목록 -->
            <div class="space-y-4">
                ${sortedDates.length > 0 ? sortedDates.map(dateKey => {
                    const d = new Date(dateKey + 'T00:00:00');
                    const days = ['일', '월', '화', '수', '목', '금', '토'];
                    const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;

                    return `
                        <div>
                            <div class="text-xs text-gray-400 font-medium mb-2">${dateLabel}</div>
                            <div class="space-y-2">
                                ${grouped[dateKey].map(p => {
                                    const cat = categories[p.category];
                                    const icon = cat?.icon || '⭐';
                                    const name = cat?.name || p.category;
                                    const exp = p.expGain || cat?.exp || 10;
                                    return `
                                        <div class="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                                            <div class="flex items-center gap-3">
                                                <span class="text-2xl">${icon}</span>
                                                <span class="text-sm font-medium text-gray-700">${name}</span>
                                            </div>
                                            <span class="text-sm font-bold text-primary">+${exp} EXP</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div class="text-center py-12">
                        <div class="text-4xl mb-3">📭</div>
                        <p class="text-gray-400">이 달에는 받은 칭찬이 없어요</p>
                    </div>
                `}
            </div>

            <!-- 총 칭찬 수 -->
            ${filteredPraises.length > 0 ? `
                <div class="mt-6 text-center">
                    <span class="text-sm text-gray-400">이번 달 총 ${filteredPraises.length}개의 칭찬</span>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // 카테고리 필터
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedCategory = btn.dataset.cat;
            refreshView();
        });
    });

    // 월 네비게이션
    document.getElementById('praisePrevMonth')?.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        refreshView();
    });

    document.getElementById('praiseNextMonth')?.addEventListener('click', () => {
        const next = new Date(currentMonth);
        next.setMonth(next.getMonth() + 1);
        const now = new Date();
        if (next.getFullYear() < now.getFullYear() || (next.getFullYear() === now.getFullYear() && next.getMonth() <= now.getMonth())) {
            currentMonth = next;
            refreshView();
        }
    });

    // 학생 세션이면 칭찬 + 카테고리 실시간 구독 설정
    if (store.isStudentLoggedIn()) {
        setupPraiseSubscription();
        setupCategorySubscription();
    }
}

/**
 * 학생 칭찬 Firebase 실시간 구독 설정
 * 교사가 칭찬을 보내면 자동으로 로컬에 반영 + 화면 갱신
 */
function setupPraiseSubscription() {
    // 기존 구독 해제
    if (praiseUnsubscribe) {
        praiseUnsubscribe();
        praiseUnsubscribe = null;
    }

    const student = store.getCurrentStudent();
    if (!student || !store.isFirebaseEnabled() || !store.getClassCode()) return;

    praiseUnsubscribe = store.subscribeToStudentPraises(student.id, (praises) => {
        // 데이터 변경 여부 체크 (플리커링 방지)
        const snapshot = JSON.stringify(praises.map(p => ({
            id: p.firebaseId || p.id,
            category: p.category
        })));
        if (snapshot === lastPraiseSnapshot) return;
        lastPraiseSnapshot = snapshot;

        console.log('학생 칭찬 실시간 업데이트:', praises.length, '개');
        // 칭찬 탭일 때만 콘텐츠 갱신 (배지는 notify 체인으로 자동 갱신)
        if (router.getCurrentRoute() === 'student-praise') {
            refreshView();
        }
    });
}

/**
 * 카테고리 실시간 구독 설정
 * 교사가 카테고리를 추가/수정/삭제하면 자동으로 필터 태그 갱신
 */
function setupCategorySubscription() {
    // 기존 구독 해제
    if (categoryUnsubscribe) {
        categoryUnsubscribe();
        categoryUnsubscribe = null;
    }

    if (!store.isFirebaseEnabled() || !store.getClassCode()) return;

    categoryUnsubscribe = store.subscribeToPraiseCategories((categories) => {
        console.log('학생 칭찬 카테고리 실시간 업데이트:', Object.keys(categories).length, '개');
        if (router.getCurrentRoute() === 'student-praise') {
            refreshView();
        }
    });
}

/**
 * 컴포넌트 언마운트 시 구독 해제
 */
export function unmount() {
    if (praiseUnsubscribe) {
        praiseUnsubscribe();
        praiseUnsubscribe = null;
    }
    if (categoryUnsubscribe) {
        categoryUnsubscribe();
        categoryUnsubscribe = null;
    }
}

function refreshView() {
    const content = document.getElementById('content');
    if (content) {
        content.innerHTML = render();
        afterRender();
    }
}
