/**
 * 학생용 시간표 컴포넌트
 * 교사가 설정한 주간 시간표를 읽기 전용으로 표시
 */

import { store } from '../store.js';
import { router } from '../router.js';

// 요일 배열
const WEEKDAYS = ['월', '화', '수', '목', '금'];
// 요일 키 (교사용 Timetable.js와 동일하게)
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

// 교시 시간 (기본값)
const DEFAULT_PERIODS = [
    { period: 1, start: '09:00', end: '09:40' },
    { period: 2, start: '09:50', end: '10:30' },
    { period: 3, start: '10:40', end: '11:20' },
    { period: 4, start: '11:30', end: '12:10' },
    { period: 5, start: '13:10', end: '13:50' },
    { period: 6, start: '14:00', end: '14:40' }
];

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

    const settings = store.getSettings();
    const timetable = store.getTimetable() || {};
    const periods = settings?.periods || DEFAULT_PERIODS;

    // 현재 요일 (0: 일요일 ~ 6: 토요일)
    const today = new Date().getDay();
    const todayIndex = today >= 1 && today <= 5 ? today - 1 : -1; // 월~금 = 0~4

    return `
        <div class="student-timetable-container pb-8">
            <!-- 헤더 -->
            <div class="text-center mb-6 px-4">
                <h2 class="text-xl font-bold text-gray-800 mb-1">📅 주간 시간표</h2>
                <p class="text-sm text-gray-500">${settings?.className || '우리반'}</p>
            </div>

            <!-- 시간표 그리드 -->
            <div class="px-4">
                <div class="bg-white rounded-2xl shadow-soft overflow-hidden">
                    <!-- 요일 헤더 -->
                    <div class="grid grid-cols-6 bg-primary/10">
                        <div class="p-2 text-center text-xs font-medium text-gray-500 border-r border-gray-100">교시</div>
                        ${WEEKDAYS.map((day, idx) => `
                            <div class="p-2 text-center text-sm font-bold ${idx === todayIndex ? 'bg-primary/20 text-primary' : 'text-gray-700'}">
                                ${day}
                                ${idx === todayIndex ? '<span class="block text-xs font-normal">오늘</span>' : ''}
                            </div>
                        `).join('')}
                    </div>

                    <!-- 시간표 본문 -->
                    ${periods.map(({ period, start, end }) => `
                        <div class="grid grid-cols-6 border-t border-gray-100">
                            <!-- 교시 정보 -->
                            <div class="p-2 text-center border-r border-gray-100 bg-gray-50">
                                <div class="text-sm font-bold text-gray-700">${period}</div>
                                <div class="text-xs text-gray-400">${start}</div>
                            </div>
                            <!-- 각 요일 수업 -->
                            ${WEEKDAYS.map((day, dayIdx) => {
                                const cell = timetable[`${DAY_KEYS[dayIdx]}-${period}`];
                                const isToday = dayIdx === todayIndex;
                                const bgClass = isToday ? 'bg-primary/5' : '';

                                if (cell && cell.subject) {
                                    return `
                                        <div class="p-2 text-center ${bgClass} min-h-[60px] flex flex-col justify-center">
                                            <div class="text-sm font-medium text-gray-800">${cell.subject}</div>
                                            ${cell.location ? `<div class="text-xs text-gray-400">${cell.location}</div>` : ''}
                                        </div>
                                    `;
                                } else {
                                    return `
                                        <div class="p-2 text-center ${bgClass} min-h-[60px] flex items-center justify-center">
                                            <span class="text-xs text-gray-300">-</span>
                                        </div>
                                    `;
                                }
                            }).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 오늘의 수업 요약 -->
            ${todayIndex >= 0 ? renderTodaySummary(timetable, periods, todayIndex) : `
                <div class="mt-6 px-4">
                    <div class="bg-blue-50 rounded-2xl p-4 text-center">
                        <div class="text-2xl mb-2">🎉</div>
                        <p class="text-blue-600 font-medium">오늘은 주말이에요!</p>
                        <p class="text-sm text-blue-500 mt-1">푹 쉬고 월요일에 만나요~</p>
                    </div>
                </div>
            `}
        </div>
    `;
}

/**
 * 오늘의 수업 요약 렌더링
 */
function renderTodaySummary(timetable, periods, todayIndex) {
    const todayClasses = periods
        .map(({ period }) => {
            const cell = timetable[`${DAY_KEYS[todayIndex]}-${period}`];
            return cell && cell.subject ? { period, ...cell } : null;
        })
        .filter(Boolean);

    if (todayClasses.length === 0) {
        return `
            <div class="mt-6 px-4">
                <div class="bg-amber-50 rounded-2xl p-4 text-center">
                    <div class="text-2xl mb-2">📝</div>
                    <p class="text-amber-600 font-medium">오늘 등록된 수업이 없어요</p>
                    <p class="text-sm text-amber-500 mt-1">선생님이 시간표를 등록해주실 거예요!</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="mt-6 px-4">
            <div class="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-4">
                <h3 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span>📚</span>
                    <span>오늘의 수업</span>
                    <span class="text-xs font-normal text-gray-500">(${todayClasses.length}교시)</span>
                </h3>
                <div class="flex flex-wrap gap-2">
                    ${todayClasses.map(cls => `
                        <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm shadow-sm">
                            <span class="text-xs text-gray-400">${cls.period}교시</span>
                            <span class="font-medium text-gray-700">${cls.subject}</span>
                        </span>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // 학생 시간표는 읽기 전용이므로 특별한 이벤트 없음
}
