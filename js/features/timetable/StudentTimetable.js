/**
 * 학생용 시간표 컴포넌트
 * 교사가 설정한 주간 시간표를 읽기 전용으로 표시
 * 교사용 Timetable.js와 동일한 UI, Firebase에서 실시간 로드
 */

import { store } from '../../store.js';
import { router } from '../../router.js';

const DAYS = ['월', '화', '수', '목', '금'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const PERIODS = [1, 2, 3, 4, 5, 6];

let weekOffset = 0; // 0: 이번 주, -1: 지난 주, 1: 다음 주
let isLoading = false;

/**
 * 과목 색상 가져오기
 */
function getSubjectColors() {
    return store.getSubjectColors();
}

/**
 * HEX 색상을 RGBA로 변환 (투명도 적용)
 */
function hexToRgba(hex, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 특정 주의 월요일~금요일 날짜 계산
 */
function getWeekRange(offset = 0) {
    const today = new Date();
    const dayOfWeek = today.getDay();

    const monday = new Date(today);
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + diff + (offset * 7));

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const formatDate = (date, dayName) => `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayName})`;

    return {
        monday,
        friday,
        rangeText: `${formatDate(monday, '월')} ~ ${formatDate(friday, '금')}`,
        isCurrentWeek: offset === 0
    };
}

/**
 * 렌더링
 */
export function render() {
    // 로그인 확인
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

    // 로딩 중이면 로딩 표시
    if (isLoading) {
        return `
            <div class="flex items-center justify-center h-64">
                <div class="text-center">
                    <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p class="text-gray-500">시간표 불러오는 중...</p>
                </div>
            </div>
        `;
    }

    // 현재 선택된 주 날짜 범위
    const weekRange = getWeekRange(weekOffset);

    // 주차 키 계산 후 해당 주 시간표 가져오기
    const weekKey = store.getWeekKey(weekRange.monday);
    const { timetable, overriddenCells } = store.getTimetableForWeek(weekKey);

    // 오늘 요일
    const today = new Date();
    const todayIndex = today.getDay() - 1; // 0: 월요일

    const subjectColors = getSubjectColors();

    return `
        <div class="space-y-4 pb-8">
            <!-- 헤더 -->
            <div class="flex items-center justify-center pb-2">
                <h2 class="text-xl font-bold flex items-center gap-1.5"><svg class="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> 주간시간표</h2>
            </div>

            <!-- 시간표 그리드 -->
            <div class="card p-2">
                <!-- 주간 네비게이터 -->
                <div class="week-navigator-dock mb-3">
                    <button id="prevWeekBtn" class="week-nav-btn">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div class="text-base font-bold text-gray-800 min-w-[160px] text-center">
                        ${weekRange.rangeText}
                    </div>
                    <button id="nextWeekBtn" class="week-nav-btn">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>

                <!-- 시간표 테이블 -->
                <div class="timetable-grid-dock">
                    <table class="w-full border-separate" style="border-spacing: 4px;">
                        <thead>
                            <tr>
                                <th class="p-1 text-sm font-bold text-gray-500">교시</th>
                                ${DAYS.map((day, i) => `
                                    <th class="p-1 text-base font-bold ${todayIndex === i && weekRange.isCurrentWeek ? 'text-primary' : 'text-gray-700'}">
                                        ${day}
                                        ${todayIndex === i && weekRange.isCurrentWeek ? '<div class="w-1.5 h-1.5 bg-primary rounded-full mx-auto mt-0.5"></div>' : ''}
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${PERIODS.map(period => `
                                <tr>
                                    <td class="p-1 text-center text-lg font-bold text-gray-600">${period}</td>
                                    ${DAY_KEYS.map((dayKey, dayIndex) => {
        const cellKey = `${dayKey}-${period}`;
        const cell = timetable[cellKey];
        const isToday = todayIndex === dayIndex && weekRange.isCurrentWeek;
        const isOverridden = overriddenCells.includes(cellKey);
        const colors = cell?.subject ? subjectColors[cell.subject] || { bg: '#F3F4F6', text: '#4B5563' } : null;

        const bgStyle = colors ? `background: ${hexToRgba(colors.bg, 0.35)} !important; color: ${colors.text};` : '';

        return `
                                            <td class="p-1">
                                                <div class="timetable-cell-new ${isToday && !cell?.subject ? 'today-empty' : ''} ${isOverridden ? 'overridden' : ''}"
                                                     style="${bgStyle}">
                                                    ${isOverridden ? '<span class="override-badge">✦</span>' : ''}
                                                    ${cell?.subject ? `
                                                        <div class="font-bold text-sm">${cell.subject}</div>
                                                    ` : `
                                                        <div class="text-gray-200 text-sm">-</div>
                                                    `}
                                                </div>
                                            </td>
                                        `;
    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 오늘의 수업 요약 -->
            ${weekRange.isCurrentWeek ? renderTodaySummary(timetable, todayIndex, subjectColors) : ''}
        </div>
    `;
}

/**
 * 오늘의 수업 요약 렌더링
 */
function renderTodaySummary(timetable, todayIndex, subjectColors) {
    // 주말 체크
    if (todayIndex < 0 || todayIndex > 4) {
        return `
            <div class="mt-4 px-2">
                <div class="bg-blue-50 rounded-2xl p-4 text-center">
                    <div class="mb-2 flex justify-center"><svg class="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div>
                    <p class="text-blue-600 font-medium">오늘은 주말이에요!</p>
                    <p class="text-sm text-blue-500 mt-1">푹 쉬고 월요일에 만나요~</p>
                </div>
            </div>
        `;
    }

    const todayClasses = PERIODS
        .map(period => {
            const cell = timetable[`${DAY_KEYS[todayIndex]}-${period}`];
            return cell?.subject ? { period, ...cell } : null;
        })
        .filter(Boolean);

    if (todayClasses.length === 0) {
        return `
            <div class="mt-4 px-2">
                <div class="bg-amber-50 rounded-2xl p-4 text-center">
                    <div class="mb-2 flex justify-center"><svg class="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
                    <p class="text-amber-600 font-medium">오늘 등록된 수업이 없어요</p>
                    <p class="text-sm text-amber-500 mt-1">선생님이 시간표를 등록해주실 거예요!</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="mt-4 px-2">
            <div class="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-4">
                <h3 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    <span>오늘의 수업</span>
                    <span class="text-xs font-normal text-gray-500">(${todayClasses.length}교시)</span>
                </h3>
                <div class="flex flex-wrap gap-2">
                    ${todayClasses.map(cls => {
        const colors = subjectColors[cls.subject] || { bg: '#F3F4F6', text: '#4B5563' };
        return `
                            <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm shadow-sm"
                                  style="background: ${colors.bg}; color: ${colors.text};">
                                <span class="text-xs opacity-70">${cls.period}교시</span>
                                <span class="font-medium">${cls.subject}</span>
                            </span>
                        `;
    }).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * 뷰 새로고침
 */
function refreshView() {
    const container = document.getElementById('studentTimetableContainer') || document.getElementById('content');
    if (container) {
        container.innerHTML = render();
        afterRender();
    }
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // Firebase에서 시간표 로드 (처음 한 번만)
    loadTimetableFromFirebase();

    // 주간 네비게이터
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');

    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            weekOffset--;
            refreshView();
        });
    }

    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            weekOffset++;
            refreshView();
        });
    }
}

/**
 * Firebase에서 시간표 로드
 */
async function loadTimetableFromFirebase() {
    // 이미 데이터가 있으면 스킵
    const existingTimetable = store.getTimetable();
    if (existingTimetable && Object.keys(existingTimetable).length > 0) {
        return;
    }

    isLoading = true;
    refreshView();

    try {
        await store.loadTimetableFromFirebase();
        await store.loadSubjectColorsFromFirebase();
    } catch (error) {
        console.error('시간표 로드 실패:', error);
    } finally {
        isLoading = false;
        refreshView();
    }
}
