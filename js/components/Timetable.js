/**
 * 시간표 컴포넌트
 * 주간 시간표 관리
 */

import { store } from '../store.js';
import { showToast, setModalContent, openModal, closeModal } from '../utils/animations.js';

const DAYS = ['월', '화', '수', '목', '금'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const PERIODS = [1, 2, 3, 4, 5, 6];

// 과목 색상 매핑
const SUBJECT_COLORS = {
    '국어': '#7C9EF5',
    '수학': '#F57C7C',
    '사회': '#F5A67C',
    '과학': '#7CE0A3',
    '영어': '#A67CF5',
    '체육': '#F5E07C',
    '음악': '#E07CF5',
    '미술': '#7CF5E0',
    '도덕': '#9CA3AF',
    '실과': '#6B7280',
    '창체': '#4B5563'
};

let editMode = false;
let selectedCell = null;

export function render() {
    const timetable = store.getTimetable() || {};

    // 오늘 요일
    const today = new Date();
    const todayIndex = today.getDay() - 1; // 0: 월요일

    return `
        <div class="space-y-4">
            <!-- 헤더 -->
            <div class="flex items-center justify-between">
                <h2 class="text-lg font-bold">📅 주간 시간표</h2>
                <button id="editModeBtn" class="btn ${editMode ? 'btn-primary' : 'btn-secondary'} text-sm py-2 px-4">
                    ${editMode ? '✓ 완료' : '✏️ 편집'}
                </button>
            </div>

            <!-- 시간표 그리드 -->
            <div class="card p-2">
                <table class="w-full">
                    <thead>
                        <tr>
                            <th class="p-2 text-xs text-gray-400">교시</th>
                            ${DAYS.map((day, i) => `
                                <th class="p-2 text-sm ${todayIndex === i ? 'text-primary font-bold' : 'text-gray-600'}">
                                    ${day}
                                    ${todayIndex === i ? '<div class="w-1.5 h-1.5 bg-primary rounded-full mx-auto mt-1"></div>' : ''}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${PERIODS.map(period => `
                            <tr>
                                <td class="p-1 text-center text-xs text-gray-400">${period}</td>
                                ${DAY_KEYS.map((dayKey, dayIndex) => {
                                    const cellKey = `${dayKey}-${period}`;
                                    const cell = timetable[cellKey];
                                    const isToday = todayIndex === dayIndex;
                                    const subjectColor = cell?.subject ? SUBJECT_COLORS[cell.subject] || '#9CA3AF' : 'transparent';

                                    return `
                                        <td class="p-1">
                                            <div class="timetable-cell ${isToday ? 'today' : ''}"
                                                 data-cell="${cellKey}"
                                                 style="border-left: 3px solid ${subjectColor}">
                                                ${cell?.subject ? `
                                                    <div class="font-medium text-xs">${cell.subject}</div>
                                                ` : `
                                                    <div class="text-gray-300 text-xs">${editMode ? '+' : '-'}</div>
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

            <!-- 빠른 입력 도움말 -->
            ${editMode ? `
            <div class="card bg-primary/10">
                <div class="flex items-center gap-2 text-sm text-primary">
                    <span>💡</span>
                    <span>셀을 클릭하면 과목을 입력할 수 있어요</span>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

export function afterRender() {
    // 편집 모드 토글
    const editBtn = document.getElementById('editModeBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            editMode = !editMode;
            const content = document.getElementById('content');
            content.innerHTML = render();
            afterRender();
        });
    }

    // 셀 클릭 이벤트 (편집 모드에서만 작동)
    const cells = document.querySelectorAll('.timetable-cell');
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const cellKey = cell.dataset.cell;
            if (editMode) {
                showEditModal(cellKey);
            }
        });
    });
}

/**
 * 과목 편집 모달
 */
function showEditModal(cellKey) {
    const timetable = store.getTimetable() || {};
    const cell = timetable[cellKey] || {};
    const [day, period] = cellKey.split('-');
    const dayName = DAYS[DAY_KEYS.indexOf(day)];

    const subjects = ['국어', '수학', '사회', '과학', '영어', '체육', '음악', '미술', '도덕', '실과', '창체'];

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">${dayName}요일 ${period}교시</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">과목 선택</label>
                <div class="grid grid-cols-4 gap-2">
                    ${subjects.map(subject => `
                        <button class="subject-option p-2 rounded-lg text-sm font-medium transition-all
                                       ${cell.subject === subject ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}"
                                data-subject="${subject}"
                                style="border-left: 3px solid ${SUBJECT_COLORS[subject] || '#9CA3AF'}">
                            ${subject}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="flex gap-2">
                <button id="deleteSubjectBtn" class="btn btn-secondary flex-1 ${!cell.subject ? 'hidden' : ''}">
                    삭제
                </button>
                <button id="saveSubjectBtn" class="btn btn-primary flex-1">
                    저장
                </button>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 이벤트 바인딩
    let selectedSubject = cell.subject || null;

    document.querySelectorAll('.subject-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.subject-option').forEach(b => {
                b.classList.remove('bg-primary', 'text-white');
                b.classList.add('bg-gray-100');
            });
            btn.classList.remove('bg-gray-100');
            btn.classList.add('bg-primary', 'text-white');
            selectedSubject = btn.dataset.subject;
        });
    });

    document.getElementById('saveSubjectBtn').addEventListener('click', () => {
        if (selectedSubject) {
            store.updateTimetableCell(cellKey, {
                subject: selectedSubject
            });
            showToast(`${dayName}요일 ${period}교시: ${selectedSubject}`, 'success');
        }
        closeModal();
        const content = document.getElementById('content');
        content.innerHTML = render();
        afterRender();
    });

    const deleteBtn = document.getElementById('deleteSubjectBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const tt = store.getTimetable() || {};
            delete tt[cellKey];
            store.saveTimetable(tt);
            showToast('삭제되었습니다', 'info');
            closeModal();
            const content = document.getElementById('content');
            content.innerHTML = render();
            afterRender();
        });
    }
}

