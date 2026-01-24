/**
 * 시간표 컴포넌트
 * 주간 시간표 관리
 */

import { store, COLOR_PRESETS, DEFAULT_SUBJECT_COLORS } from '../store.js';
import { showToast, setModalContent, openModal, closeModal } from '../utils/animations.js';

const DAYS = ['월', '화', '수', '목', '금'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const PERIODS = [1, 2, 3, 4, 5, 6];

/**
 * 과목 색상 가져오기 (store에서 동적으로 로드)
 */
function getSubjectColors() {
    return store.getSubjectColors();
}

let editMode = false;
let selectedCell = null;
let weekOffset = 0; // 0: 이번 주, -1: 지난 주, 1: 다음 주

/**
 * 특정 주의 월요일~금요일 날짜 계산
 */
function getWeekRange(offset = 0) {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ...

    // 이번 주 월요일 계산
    const monday = new Date(today);
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + diff + (offset * 7));

    // 금요일 계산
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const formatDate = (date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;

    return {
        monday,
        friday,
        rangeText: `${formatDate(monday)} ~ ${formatDate(friday)}`,
        isCurrentWeek: offset === 0
    };
}

export function render() {
    // 현재 선택된 주 날짜 범위
    const weekRange = getWeekRange(weekOffset);

    // 주차 키 계산 후 해당 주 시간표 가져오기 (기본 + 오버라이드 병합)
    const weekKey = store.getWeekKey(weekRange.monday);
    const { timetable, overriddenCells } = store.getTimetableForWeek(weekKey);

    // 오늘 요일
    const today = new Date();
    const todayIndex = today.getDay() - 1; // 0: 월요일

    return `
        <div class="space-y-4">
            <!-- 헤더 -->
            <div class="flex items-center justify-between sticky top-[88px] z-40 bg-white py-2 -mx-4 px-4">
                <h2 class="text-base font-bold whitespace-nowrap">📅 주간시간표</h2>

                <!-- 주간 네비게이터 -->
                <div class="flex items-center gap-2">
                    <button id="prevWeekBtn" class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div class="text-sm font-medium text-gray-700 min-w-[140px] text-center">
                        ${weekRange.rangeText}
                    </div>
                    <button id="nextWeekBtn" class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>

                <button id="editModeBtn" class="flex items-center justify-center gap-1 bg-sky-100 border border-sky-200 rounded-xl px-3 py-1.5 text-sky-700 hover:bg-sky-200 transition-colors text-sm font-medium">
                    ${editMode ? '✓ 완료' : '✏️ 편집'}
                </button>
            </div>

            <!-- 시간표 그리드 -->
            <div class="card p-4">
                <table class="w-full border-separate" style="border-spacing: 6px;">
                    <thead>
                        <tr>
                            <th class="p-2 text-base font-bold text-gray-500">교시</th>
                            ${DAYS.map((day, i) => `
                                <th class="p-2 text-lg font-bold ${todayIndex === i ? 'text-primary' : 'text-gray-700'}">
                                    ${day}
                                    ${todayIndex === i ? '<div class="w-2 h-2 bg-primary rounded-full mx-auto mt-1"></div>' : ''}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${PERIODS.map(period => `
                            <tr>
                                <td class="p-2 text-center text-2xl font-bold text-gray-600">${period}</td>
                                ${DAY_KEYS.map((dayKey, dayIndex) => {
                                    const cellKey = `${dayKey}-${period}`;
                                    const cell = timetable[cellKey];
                                    const isToday = todayIndex === dayIndex;
                                    const isOverridden = overriddenCells.includes(cellKey);
                                    const subjectColors = getSubjectColors();
                                    const colors = cell?.subject ? subjectColors[cell.subject] || { bg: '#F3F4F6', text: '#4B5563' } : null;

                                    return `
                                        <td class="p-1">
                                            <div class="timetable-cell-new ${isToday && !cell?.subject ? 'today-empty' : ''} ${isOverridden ? 'overridden' : ''}"
                                                 data-cell="${cellKey}"
                                                 data-overridden="${isOverridden}"
                                                 style="${colors ? `background-color: ${colors.bg}; color: ${colors.text};` : ''}">
                                                ${isOverridden ? '<span class="override-badge">✦</span>' : ''}
                                                ${cell?.subject ? `
                                                    <div class="font-bold text-sm">${cell.subject}</div>
                                                ` : `
                                                    <div class="text-gray-300 text-sm">${editMode ? '+' : '-'}</div>
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

    // 주간 네비게이터
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');

    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            weekOffset--;
            const content = document.getElementById('content');
            content.innerHTML = render();
            afterRender();
        });
    }

    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            weekOffset++;
            const content = document.getElementById('content');
            content.innerHTML = render();
            afterRender();
        });
    }

    // 셀 클릭 이벤트 (편집 모드에서만 작동)
    const cells = document.querySelectorAll('.timetable-cell-new');
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
    // 현재 주차 키 계산
    const weekRange = getWeekRange(weekOffset);
    const weekKey = store.getWeekKey(weekRange.monday);

    // 기본 시간표와 현재 주 병합 데이터
    const baseTimetable = store.getTimetable() || {};
    const { timetable: mergedTimetable, overriddenCells } = store.getTimetableForWeek(weekKey);

    const baseCell = baseTimetable[cellKey] || {};
    const currentCell = mergedTimetable[cellKey] || {};
    const isCurrentlyOverridden = overriddenCells.includes(cellKey);

    const [day, period] = cellKey.split('-');
    const dayName = DAYS[DAY_KEYS.indexOf(day)];

    const subjects = ['국어', '수학', '사회', '과학', '영어', '체육', '음악', '미술', '도덕', '실과', '창체'];
    const subjectColors = getSubjectColors();

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">${dayName}요일 ${period}교시</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            ${isCurrentlyOverridden ? `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-700 flex items-center gap-1">
                <span>✦</span>
                <span>이번 주만 변경된 과목입니다 (기본: ${baseCell.subject || '없음'})</span>
            </div>
            ` : ''}

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">과목 선택</label>
                <div class="grid grid-cols-4 gap-2">
                    ${subjects.map(subject => {
                        const colors = subjectColors[subject] || { bg: '#F3F4F6', text: '#4B5563' };
                        const isSelected = currentCell.subject === subject;
                        return `
                        <button class="subject-option p-3 rounded-xl text-sm font-semibold transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}"
                                data-subject="${subject}"
                                style="background-color: ${colors.bg}; color: ${colors.text};">
                            ${subject}
                        </button>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- 색상 선택 섹션 (과목 선택 시 표시) -->
            <div id="colorSection" class="hidden p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <span class="text-base">🎨</span>
                        <span class="text-sm font-medium text-gray-700">
                            <span id="selectedSubjectName">과목</span> 색상 변경
                        </span>
                    </div>
                    <button id="resetColorBtn" class="text-xs text-gray-500 hover:text-gray-700 underline">
                        기본값
                    </button>
                </div>

                <!-- 프리셋 색상 -->
                <div class="flex gap-2 flex-wrap mb-3">
                    ${COLOR_PRESETS.map((preset, index) => `
                        <button class="color-preset w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                                data-index="${index}"
                                data-bg="${preset.bg}"
                                data-text="${preset.text}"
                                title="${preset.name}"
                                style="background-color: ${preset.bg};">
                        </button>
                    `).join('')}
                </div>

                <!-- 직접 선택 버튼 -->
                <div class="flex items-center gap-2">
                    <button id="customColorBtn" class="text-sm text-primary hover:text-primary-dark flex items-center gap-1">
                        <span>🎨</span> 직접 선택
                    </button>
                    <input type="color" id="bgColorPicker" class="sr-only" value="#DBEAFE">
                    <div id="customColorPreview" class="hidden flex items-center gap-2 ml-2">
                        <div id="previewSwatch" class="w-6 h-6 rounded-full border border-gray-300"></div>
                        <span class="text-xs text-gray-500">미리보기</span>
                    </div>
                </div>
            </div>

            <!-- 저장 옵션 -->
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">적용 범위</label>
                <div class="flex gap-2">
                    <label class="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer border-2 border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input type="radio" name="saveType" value="week" checked class="accent-primary">
                        <div>
                            <div class="text-sm font-medium">이번 주만</div>
                            <div class="text-xs text-gray-500">${weekRange.rangeText}</div>
                        </div>
                    </label>
                    <label class="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer border-2 border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input type="radio" name="saveType" value="base" class="accent-primary">
                        <div>
                            <div class="text-sm font-medium">기본 시간표</div>
                            <div class="text-xs text-gray-500">매주 반복</div>
                        </div>
                    </label>
                </div>
            </div>

            <div class="flex gap-2">
                ${currentCell.subject ? `
                <button id="deleteSubjectBtn" class="btn btn-secondary flex-1">
                    삭제
                </button>
                ` : ''}
                ${isCurrentlyOverridden ? `
                <button id="restoreBaseBtn" class="btn btn-warning flex-1">
                    기본으로
                </button>
                ` : ''}
                <button id="saveSubjectBtn" class="btn btn-primary flex-1">
                    저장
                </button>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 이벤트 바인딩
    let selectedSubject = currentCell.subject || null;
    let pendingColor = null; // 저장 대기 중인 색상

    // 색상 섹션 표시/숨김 및 업데이트 함수
    const updateColorSection = (subject) => {
        const colorSection = document.getElementById('colorSection');
        const subjectNameEl = document.getElementById('selectedSubjectName');

        if (subject) {
            colorSection.classList.remove('hidden');
            subjectNameEl.textContent = subject;

            // 현재 선택된 색상에 체크 표시
            const currentColor = subjectColors[subject];
            document.querySelectorAll('.color-preset').forEach(btn => {
                btn.classList.remove('ring-2', 'ring-primary', 'ring-offset-1');
                if (currentColor && btn.dataset.bg === currentColor.bg) {
                    btn.classList.add('ring-2', 'ring-primary', 'ring-offset-1');
                }
            });
        } else {
            colorSection.classList.add('hidden');
        }
    };

    // 초기 상태 설정
    if (selectedSubject) {
        updateColorSection(selectedSubject);
    }

    // 과목 선택 이벤트
    document.querySelectorAll('.subject-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.subject-option').forEach(b => {
                b.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'scale-105');
            });
            btn.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'scale-105');
            selectedSubject = btn.dataset.subject;
            pendingColor = null; // 과목 변경 시 대기 색상 초기화
            updateColorSection(selectedSubject);
        });
    });

    // 프리셋 색상 선택 이벤트
    document.querySelectorAll('.color-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!selectedSubject) return;

            const newColor = { bg: btn.dataset.bg, text: btn.dataset.text };
            pendingColor = newColor;

            // UI 업데이트
            document.querySelectorAll('.color-preset').forEach(b => {
                b.classList.remove('ring-2', 'ring-primary', 'ring-offset-1');
            });
            btn.classList.add('ring-2', 'ring-primary', 'ring-offset-1');

            // 과목 버튼 미리보기 업데이트
            const subjectBtn = document.querySelector(`.subject-option[data-subject="${selectedSubject}"]`);
            if (subjectBtn) {
                subjectBtn.style.backgroundColor = newColor.bg;
                subjectBtn.style.color = newColor.text;
            }

            showToast(`${selectedSubject} 색상 미리보기 적용`, 'info');
        });
    });

    // 직접 색상 선택 (컬러피커)
    const customColorBtn = document.getElementById('customColorBtn');
    const bgColorPicker = document.getElementById('bgColorPicker');
    const customColorPreview = document.getElementById('customColorPreview');
    const previewSwatch = document.getElementById('previewSwatch');

    customColorBtn.addEventListener('click', () => {
        bgColorPicker.click();
    });

    bgColorPicker.addEventListener('input', (e) => {
        if (!selectedSubject) return;

        const bgColor = e.target.value;
        // 배경색에 맞는 텍스트색 자동 계산 (밝기 기반)
        const textColor = getContrastTextColor(bgColor);

        pendingColor = { bg: bgColor, text: textColor };

        // 미리보기 표시
        customColorPreview.classList.remove('hidden');
        previewSwatch.style.backgroundColor = bgColor;

        // 과목 버튼 미리보기 업데이트
        const subjectBtn = document.querySelector(`.subject-option[data-subject="${selectedSubject}"]`);
        if (subjectBtn) {
            subjectBtn.style.backgroundColor = bgColor;
            subjectBtn.style.color = textColor;
        }

        // 프리셋 선택 해제
        document.querySelectorAll('.color-preset').forEach(b => {
            b.classList.remove('ring-2', 'ring-primary', 'ring-offset-1');
        });
    });

    // 기본값 복원 버튼
    const resetColorBtn = document.getElementById('resetColorBtn');
    resetColorBtn.addEventListener('click', () => {
        if (!selectedSubject) return;

        const defaultColor = DEFAULT_SUBJECT_COLORS[selectedSubject] || { bg: '#F3F4F6', text: '#4B5563' };
        pendingColor = defaultColor;

        // 과목 버튼 업데이트
        const subjectBtn = document.querySelector(`.subject-option[data-subject="${selectedSubject}"]`);
        if (subjectBtn) {
            subjectBtn.style.backgroundColor = defaultColor.bg;
            subjectBtn.style.color = defaultColor.text;
        }

        // 프리셋에서 해당 색상 선택
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.classList.remove('ring-2', 'ring-primary', 'ring-offset-1');
            if (btn.dataset.bg === defaultColor.bg) {
                btn.classList.add('ring-2', 'ring-primary', 'ring-offset-1');
            }
        });

        // 커스텀 미리보기 숨김
        customColorPreview.classList.add('hidden');

        showToast(`${selectedSubject} 색상이 기본값으로 설정됩니다`, 'info');
    });

    // 저장 버튼
    document.getElementById('saveSubjectBtn').addEventListener('click', () => {
        if (!selectedSubject) {
            showToast('과목을 선택해주세요', 'warning');
            return;
        }

        const saveType = document.querySelector('input[name="saveType"]:checked').value;

        // 색상 변경이 있으면 먼저 저장
        if (pendingColor) {
            store.setSubjectColor(selectedSubject, pendingColor);
        }

        if (saveType === 'week') {
            // 이번 주만 적용 (오버라이드)
            store.setWeekOverride(weekKey, cellKey, { subject: selectedSubject });
            showToast(`이번 주 ${dayName}요일 ${period}교시: ${selectedSubject}`, 'success');
        } else {
            // 기본 시간표 수정
            store.updateTimetableCell(cellKey, { subject: selectedSubject });
            showToast(`기본 시간표 ${dayName}요일 ${period}교시: ${selectedSubject}`, 'success');
        }

        closeModal();
        refreshView();
    });

    // 삭제 버튼
    const deleteBtn = document.getElementById('deleteSubjectBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const saveType = document.querySelector('input[name="saveType"]:checked').value;

            if (saveType === 'week') {
                // 이번 주 오버라이드에서 빈 값으로 설정 (기본 시간표와 다르게)
                store.setWeekOverride(weekKey, cellKey, { subject: null });
                showToast('이번 주 해당 과목이 삭제되었습니다', 'info');
            } else {
                // 기본 시간표에서 삭제
                const tt = store.getTimetable() || {};
                delete tt[cellKey];
                store.saveTimetable(tt);
                showToast('기본 시간표에서 삭제되었습니다', 'info');
            }

            closeModal();
            refreshView();
        });
    }

    // 기본으로 복원 버튼 (오버라이드 삭제)
    const restoreBtn = document.getElementById('restoreBaseBtn');
    if (restoreBtn) {
        restoreBtn.addEventListener('click', () => {
            store.setWeekOverride(weekKey, cellKey, null); // null = 오버라이드 삭제
            showToast('기본 시간표로 복원되었습니다', 'info');
            closeModal();
            refreshView();
        });
    }
}

/**
 * 배경색에 맞는 대비 텍스트 색상 계산
 */
function getContrastTextColor(bgColor) {
    // HEX to RGB
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // 밝기 계산 (YIQ 공식)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // 밝은 배경이면 어두운 텍스트, 어두운 배경이면 밝은 텍스트
    if (brightness > 180) {
        // 배경색을 더 어둡게 만든 색상 반환
        const darkenFactor = 0.4;
        const darkR = Math.round(r * darkenFactor);
        const darkG = Math.round(g * darkenFactor);
        const darkB = Math.round(b * darkenFactor);
        return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
    } else {
        return '#FFFFFF';
    }
}

/**
 * 뷰 새로고침 헬퍼
 */
function refreshView() {
    const content = document.getElementById('content');
    content.innerHTML = render();
    afterRender();
}

