/**
 * 시간표 컴포넌트
 * 주간 시간표 관리
 */

import { store, COLOR_PRESETS, DEFAULT_SUBJECT_COLORS } from '../../store.js';
import { showToast, setModalContent, openModal, closeModal } from '../../shared/utils/animations.js';

const DAYS = ['월', '화', '수', '목', '금'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const PERIODS = [1, 2, 3, 4, 5, 6];

/**
 * 과목 색상 가져오기 (store에서 동적으로 로드)
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

let editMode = false;
let selectedCell = null;
let weekOffset = 0; // 0: 이번 주, -1: 지난 주, 1: 다음 주

// 드래그 앤 드롭 상태 관리
let dragState = {
    isDragging: false,
    sourceCell: null,      // 드래그 시작 셀 (cellKey)
    sourceCellEl: null,    // DOM 요소
    startX: 0,
    startY: 0,
    dragTimeout: null,     // 150ms 타이머
    hasMoved: false        // 이동 여부 (클릭 vs 드래그 구분)
};

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

    const formatDate = (date, dayName) => `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayName})`;

    return {
        monday,
        friday,
        rangeText: `${formatDate(monday, '월')} ~ ${formatDate(friday, '금')}`,
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
            <div class="flex items-center justify-between pb-2">
                <h2 class="text-xl font-bold whitespace-nowrap">📅 주간시간표</h2>

                <!-- 편집 버튼 -->
                <button id="editModeBtn" class="timetable-header-btn ${editMode ? 'active' : ''}">
                    <span>${editMode ? '완료' : '편집'}</span>
                    ${editMode ? `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    ` : `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                    </svg>
                    `}
                </button>
            </div>

            <!-- 시간표 그리드 -->
            <div class="card p-2">
                <!-- 주간 네비게이터 (리퀴드 글라스 dock) -->
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
                <!-- 시간표 테이블 (리퀴드 글라스 dock) -->
                <div class="timetable-grid-dock">
                    <table class="w-full border-separate" style="border-spacing: 4px;">
                        <thead>
                            <tr>
                                <th class="p-1 text-sm font-bold text-gray-500">교시</th>
                                ${DAYS.map((day, i) => `
                                    <th class="p-1 text-base font-bold ${todayIndex === i ? 'text-primary' : 'text-gray-700'}">
                                        ${day}
                                        ${todayIndex === i ? '<div class="w-1.5 h-1.5 bg-primary rounded-full mx-auto mt-0.5"></div>' : ''}
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
        const isToday = todayIndex === dayIndex;
        const isOverridden = overriddenCells.includes(cellKey);
        const subjectColors = getSubjectColors();
        const colors = cell?.subject ? subjectColors[cell.subject] || { bg: '#F3F4F6', text: '#4B5563' } : null;

        // 파스텔톤 200 수준의 밝은 배경색 적용 (35% 투명도)
        const bgStyle = colors ? `background: ${hexToRgba(colors.bg, 0.35)} !important; color: ${colors.text};` : '';

        return `
                                            <td class="p-1">
                                                <div class="timetable-cell-new ${isToday && !cell?.subject ? 'today-empty' : ''} ${isOverridden ? 'overridden' : ''}"
                                                     data-cell="${cellKey}"
                                                     data-overridden="${isOverridden}"
                                                     style="${bgStyle}">
                                                    ${isOverridden ? '<span class="override-badge">✦</span>' : ''}
                                                    ${cell?.subject ? `
                                                        <div class="font-bold text-sm">${cell.subject}</div>
                                                    ` : `
                                                        ${editMode ? `
                                                            <div class="text-primary text-xl font-bold">+</div>
                                                        ` : `
                                                            <div class="text-gray-200 text-sm">-</div>
                                                        `}
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

            // 편집 모드 진입 시 토스트 알림
            if (editMode) {
                showToast('💡 셀 클릭: 과목 입력\n📌 길게 누르고 드래그: 교환\n\n👆 아무 곳이나 클릭하면 편집 시작', 'info', { clickToClose: true });
            }
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

    // 셀 이벤트 (편집 모드에서만 작동)
    const cells = document.querySelectorAll('.timetable-cell-new');
    cells.forEach(cell => {
        if (editMode) {
            // 드래그 앤 드롭 이벤트 초기화
            initDragAndDrop(cell);
        } else {
            // 편집 모드가 아닐 때는 클릭만 가능
            cell.addEventListener('click', () => {
                // 비편집 모드에서는 아무것도 하지 않음
            });
        }
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

    const subjects = store.getSubjectList();
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
                <div class="grid grid-cols-4 gap-2" id="subjectGrid">
                    ${subjects.map(subject => {
        const colors = subjectColors[subject] || { bg: '#F3F4F6', text: '#4B5563' };
        const isSelected = currentCell.subject === subject;
        return `
                        <button type="button" class="subject-option py-3 px-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}"
                                data-subject="${subject}"
                                style="background-color: ${colors.bg}; color: ${colors.text}; min-height: 44px;">
                            ${subject}
                        </button>
                        `;
    }).join('')}
                    <button type="button" id="quickAddSubjectBtn" class="py-3 px-2 rounded-xl text-sm font-semibold transition-all bg-gray-100 text-gray-500 hover:bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center gap-1" style="min-height: 44px;">
                        <span>+</span><span>추가</span>
                    </button>
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
                    <button type="button" id="resetColorBtn" class="text-xs text-gray-500 hover:text-gray-700 underline">
                        기본값
                    </button>
                </div>

                <!-- 프리셋 색상 + 직접 선택 -->
                <div class="flex gap-1.5 flex-wrap items-center">
                    ${COLOR_PRESETS.map((preset, index) => `
                        <button type="button" class="color-preset w-6 h-6 rounded-full border border-white shadow-sm hover:scale-110 transition-transform"
                                data-index="${index}"
                                data-bg="${preset.bg}"
                                data-text="${preset.text}"
                                title="${preset.name}"
                                style="background-color: ${preset.bg};">
                        </button>
                    `).join('')}
                    <!-- 직접 선택 (팔레트) 버튼 - 색상 입력을 버튼 위에 오버레이 -->
                    <div class="relative w-6 h-6">
                        <div class="w-6 h-6 rounded-full shadow-sm hover:scale-110 transition-transform flex items-center justify-center"
                             style="background: conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000);">
                            <span class="absolute inset-0.5 bg-white rounded-full flex items-center justify-center pointer-events-none">
                                <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                </svg>
                            </span>
                        </div>
                        <input type="color" id="bgColorPicker" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" value="#DBEAFE" title="직접 선택">
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
                <button type="button" id="deleteSubjectBtn" class="btn btn-secondary flex-1">
                    삭제
                </button>
                ` : ''}
                ${isCurrentlyOverridden ? `
                <button type="button" id="restoreBaseBtn" class="btn btn-warning flex-1">
                    기본으로
                </button>
                ` : ''}
                <button type="button" id="saveSubjectBtn" class="btn btn-primary flex-1">
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

    // 빠른 과목 추가 버튼
    const quickAddBtn = document.getElementById('quickAddSubjectBtn');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            showQuickAddSubjectModal(cellKey);
        });
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

    // 직접 색상 선택 (컬러피커) - 색상 입력이 버튼 위에 오버레이 되어있어 직접 클릭됨
    const bgColorPicker = document.getElementById('bgColorPicker');

    if (bgColorPicker) {
        bgColorPicker.addEventListener('input', (e) => {
            if (!selectedSubject) return;

            const bgColor = e.target.value;
            // 배경색에 맞는 텍스트색 자동 계산 (밝기 기반)
            const textColor = getContrastTextColor(bgColor);

            pendingColor = { bg: bgColor, text: textColor };

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
    }

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

/**
 * 드래그 앤 드롭 초기화
 */
function initDragAndDrop(cell) {
    // Pointer Events 사용 (마우스 + 터치 통합)
    cell.addEventListener('pointerdown', handlePointerDown);
    cell.addEventListener('pointermove', handlePointerMove);
    cell.addEventListener('pointerup', handlePointerUp);
    cell.addEventListener('pointercancel', handlePointerUp);
    cell.addEventListener('pointerleave', handlePointerLeave);

    // 클릭 이벤트 백업 (포인터 이벤트 실패 시 대비)
    cell.addEventListener('click', (e) => {
        // 드래그 중이 아니고 편집 모드일 때만 모달 열기
        if (editMode && !dragState.isDragging && !dragState.hasMoved) {
            const cellKey = cell.dataset.cell;
            if (cellKey) {
                showEditModal(cellKey);
            }
        }
    });

    // 터치 시 기본 동작 방지
    cell.style.touchAction = 'none';
}

/**
 * 포인터 다운 핸들러 (드래그 시작 감지)
 */
function handlePointerDown(e) {
    if (!editMode) return;

    const cell = e.currentTarget;
    const cellKey = cell.dataset.cell;

    // 포인터 캡처
    cell.setPointerCapture(e.pointerId);

    // 드래그 상태 초기화
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    dragState.sourceCell = cellKey;
    dragState.sourceCellEl = cell;
    dragState.hasMoved = false;
    dragState.isDragging = false;

    // 길게 누르기 타이머 (150ms)
    dragState.dragTimeout = setTimeout(() => {
        startDrag(cell);
    }, 150);

    // 드래그 준비 상태 표시
    cell.classList.add('drag-ready');
}

/**
 * 포인터 이동 핸들러 (드래그 중)
 */
function handlePointerMove(e) {
    if (!editMode || !dragState.sourceCell) return;

    const dx = Math.abs(e.clientX - dragState.startX);
    const dy = Math.abs(e.clientY - dragState.startY);

    // 5px 이상 이동하면 드래그로 인식
    if (dx > 5 || dy > 5) {
        dragState.hasMoved = true;

        // 타이머 대기 중이면 즉시 드래그 시작
        if (dragState.dragTimeout && !dragState.isDragging) {
            clearTimeout(dragState.dragTimeout);
            dragState.dragTimeout = null;
            startDrag(dragState.sourceCellEl);
        }
    }

    if (!dragState.isDragging) return;

    e.preventDefault();

    // 현재 포인터 위치의 셀 찾기
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    const targetCell = elementBelow?.closest('.timetable-cell-new');

    // 모든 셀의 drag-over 클래스 제거
    document.querySelectorAll('.timetable-cell-new.drag-over').forEach(c => {
        c.classList.remove('drag-over');
    });

    // 타겟 셀에 drag-over 클래스 추가 (자기 자신 제외)
    if (targetCell && targetCell !== dragState.sourceCellEl) {
        targetCell.classList.add('drag-over');
    }
}

/**
 * 포인터 업 핸들러 (드래그 종료/클릭)
 */
function handlePointerUp(e) {
    if (!editMode || !dragState.sourceCell) {
        resetDragState();
        return;
    }

    const cell = e.currentTarget;
    cell.releasePointerCapture(e.pointerId);

    // 타이머 정리
    if (dragState.dragTimeout) {
        clearTimeout(dragState.dragTimeout);
        dragState.dragTimeout = null;
    }

    // 드래그 준비 상태 제거
    cell.classList.remove('drag-ready');

    // 드래그 중이었다면 드롭 처리
    if (dragState.isDragging) {
        handleDrop(e);
    } else if (!dragState.hasMoved) {
        // 드래그하지 않고 클릭만 했다면 모달 열기
        const cellKey = dragState.sourceCell;
        resetDragState();
        showEditModal(cellKey);
        return;
    }

    resetDragState();
}

/**
 * 포인터 리브 핸들러
 */
function handlePointerLeave(e) {
    const cell = e.currentTarget;
    cell.classList.remove('drag-ready');
}

/**
 * 드래그 시작
 */
function startDrag(cell) {
    dragState.isDragging = true;
    cell.classList.remove('drag-ready');
    cell.classList.add('dragging');

    // 진동 피드백 (지원하는 기기에서)
    if (navigator.vibrate) {
        navigator.vibrate(30);
    }
}

/**
 * 드롭 처리
 */
function handleDrop(e) {
    // 드래그 중인 셀의 스타일 제거
    if (dragState.sourceCellEl) {
        dragState.sourceCellEl.classList.remove('dragging');
    }

    // drag-over 클래스 제거
    document.querySelectorAll('.timetable-cell-new.drag-over').forEach(c => {
        c.classList.remove('drag-over');
    });

    // 드롭 위치의 셀 찾기
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    const targetCell = elementBelow?.closest('.timetable-cell-new');

    if (!targetCell) return;

    const targetKey = targetCell.dataset.cell;
    const sourceKey = dragState.sourceCell;

    // 같은 셀이면 무시
    if (targetKey === sourceKey) return;

    // 교환 모달 표시
    showSwapModal(sourceKey, targetKey);
}

/**
 * 드래그 상태 초기화
 */
function resetDragState() {
    if (dragState.dragTimeout) {
        clearTimeout(dragState.dragTimeout);
    }

    if (dragState.sourceCellEl) {
        dragState.sourceCellEl.classList.remove('dragging', 'drag-ready');
    }

    document.querySelectorAll('.timetable-cell-new.drag-over').forEach(c => {
        c.classList.remove('drag-over');
    });

    dragState = {
        isDragging: false,
        sourceCell: null,
        sourceCellEl: null,
        startX: 0,
        startY: 0,
        dragTimeout: null,
        hasMoved: false
    };
}

/**
 * 과목 교환 확인 모달
 */
function showSwapModal(sourceKey, targetKey) {
    const weekRange = getWeekRange(weekOffset);
    const weekKey = store.getWeekKey(weekRange.monday);
    const { timetable } = store.getTimetableForWeek(weekKey);
    const subjectColors = getSubjectColors();

    const sourceSubject = timetable[sourceKey]?.subject || null;
    const targetSubject = timetable[targetKey]?.subject || null;

    // 둘 다 빈 셀이면 무시
    if (!sourceSubject && !targetSubject) {
        showToast('교환할 과목이 없습니다', 'info');
        return;
    }

    const sourceDisplay = sourceSubject || '빈 칸';
    const targetDisplay = targetSubject || '빈 칸';

    const sourceColors = sourceSubject ? subjectColors[sourceSubject] || { bg: '#F3F4F6', text: '#4B5563' } : { bg: '#F3F4F6', text: '#9CA3AF' };
    const targetColors = targetSubject ? subjectColors[targetSubject] || { bg: '#F3F4F6', text: '#4B5563' } : { bg: '#F3F4F6', text: '#9CA3AF' };

    // 모달 HTML 생성
    const modalHtml = `
        <div id="swapModalOverlay" class="swap-modal-overlay">
            <div class="swap-modal-content">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold">과목 교환</h3>
                    <button id="swapModalClose" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                </div>

                <div class="swap-preview">
                    <div class="swap-preview-cell" style="background-color: ${sourceColors.bg}; color: ${sourceColors.text};">
                        ${sourceDisplay}
                    </div>
                    <span class="swap-arrow">⇄</span>
                    <div class="swap-preview-cell" style="background-color: ${targetColors.bg}; color: ${targetColors.text};">
                        ${targetDisplay}
                    </div>
                </div>

                <div class="space-y-3 mb-4">
                    <label class="block text-sm font-medium text-gray-700">적용 범위</label>
                    <div class="space-y-2">
                        <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer border-2 border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input type="radio" name="swapSaveType" value="week" checked class="accent-primary w-4 h-4">
                            <div>
                                <div class="text-sm font-medium">이번 주만</div>
                                <div class="text-xs text-gray-500">${weekRange.rangeText}</div>
                            </div>
                        </label>
                        <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer border-2 border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input type="radio" name="swapSaveType" value="base" class="accent-primary w-4 h-4">
                            <div>
                                <div class="text-sm font-medium">기본 시간표</div>
                                <div class="text-xs text-gray-500">매주 반복</div>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="flex gap-2">
                    <button type="button" id="swapCancelBtn" class="btn btn-secondary flex-1">취소</button>
                    <button type="button" id="swapConfirmBtn" class="btn btn-primary flex-1">교환</button>
                </div>
            </div>
        </div>
    `;

    // 모달을 body에 추가
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 약간의 딜레이 후 show 클래스 추가 (애니메이션)
    requestAnimationFrame(() => {
        document.getElementById('swapModalOverlay').classList.add('show');
    });

    // 이벤트 바인딩
    const overlay = document.getElementById('swapModalOverlay');
    const closeBtn = document.getElementById('swapModalClose');
    const cancelBtn = document.getElementById('swapCancelBtn');
    const confirmBtn = document.getElementById('swapConfirmBtn');

    const closeSwapModal = () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 200);
    };

    closeBtn.addEventListener('click', closeSwapModal);
    cancelBtn.addEventListener('click', closeSwapModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSwapModal();
    });

    confirmBtn.addEventListener('click', () => {
        const saveType = document.querySelector('input[name="swapSaveType"]:checked').value;
        swapCells(sourceKey, targetKey, saveType);
        closeSwapModal();
    });
}

/**
 * 셀 교환 실행
 */
function swapCells(sourceKey, targetKey, saveType) {
    const weekRange = getWeekRange(weekOffset);
    const weekKey = store.getWeekKey(weekRange.monday);
    const { timetable } = store.getTimetableForWeek(weekKey);

    const sourceData = timetable[sourceKey] || null;
    const targetData = timetable[targetKey] || null;

    if (saveType === 'week') {
        // 이번 주만 적용 (오버라이드)
        store.setWeekOverride(weekKey, sourceKey, targetData);
        store.setWeekOverride(weekKey, targetKey, sourceData);
        showToast('이번 주 과목이 교환되었습니다', 'success');
    } else {
        // 기본 시간표 변경
        const baseTimetable = store.getTimetable() || {};

        if (targetData) {
            baseTimetable[sourceKey] = targetData;
        } else {
            delete baseTimetable[sourceKey];
        }

        if (sourceData) {
            baseTimetable[targetKey] = sourceData;
        } else {
            delete baseTimetable[targetKey];
        }

        store.saveTimetable(baseTimetable);

        // 해당 셀들의 오버라이드 삭제 (기본 시간표가 변경되었으므로)
        store.setWeekOverride(weekKey, sourceKey, null);
        store.setWeekOverride(weekKey, targetKey, null);

        showToast('기본 시간표 과목이 교환되었습니다', 'success');
    }

    refreshView();
}

/**
 * 빠른 과목 추가 모달
 */
function showQuickAddSubjectModal(returnCellKey = null) {
    // 기존 오버레이가 있으면 먼저 제거
    const existingOverlay = document.getElementById('quickAddSubjectOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const modalHtml = `
        <div id="quickAddSubjectOverlay" class="swap-modal-overlay">
            <div class="swap-modal-content" onclick="event.stopPropagation()">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold">➕ 새 과목 추가</h3>
                    <button id="quickAddCloseBtn" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">과목명</label>
                        <input type="text" id="newSubjectInput"
                               class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                               placeholder="예: 안전교육, 보건, 방과후..."
                               maxlength="10">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">색상 선택</label>
                        <div class="flex gap-2 flex-wrap" id="newSubjectColors">
                            ${COLOR_PRESETS.map((preset, index) => `
                                <button type="button" class="new-subject-color w-10 h-10 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform ${index === 0 ? 'ring-2 ring-primary ring-offset-1' : ''}"
                                        data-index="${index}"
                                        data-bg="${preset.bg}"
                                        data-text="${preset.text}"
                                        title="${preset.name}"
                                        style="background-color: ${preset.bg};">
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="flex gap-2 mt-6">
                    <button type="button" id="quickAddCancelBtn" class="btn btn-secondary flex-1">취소</button>
                    <button type="button" id="quickAddConfirmBtn" class="btn btn-primary flex-1">추가</button>
                </div>
            </div>
        </div>
    `;

    // 기존 모달 닫기
    closeModal();

    // 새 모달 추가
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 요소 참조 가져오기 (DOM에 추가 직후)
    const overlay = document.getElementById('quickAddSubjectOverlay');
    const closeBtn = document.getElementById('quickAddCloseBtn');
    const cancelBtn = document.getElementById('quickAddCancelBtn');
    const confirmBtn = document.getElementById('quickAddConfirmBtn');
    const input = document.getElementById('newSubjectInput');

    // 요소 존재 확인
    if (!overlay || !closeBtn || !cancelBtn || !confirmBtn || !input) {
        console.error('Quick add modal elements not found');
        return;
    }

    // 선택된 색상 상태
    let selectedColorIndex = 0;

    // 모달 닫기 함수
    const closeQuickAddModal = (openEditModal = false) => {
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
            // 편집 모달로 돌아가기
            if (openEditModal && returnCellKey) {
                showEditModal(returnCellKey);
            }
        }, 200);
    };

    // 이벤트 바인딩
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeQuickAddModal(true);
    });

    cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeQuickAddModal(true);
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeQuickAddModal(true);
        }
    });

    // 색상 선택
    document.querySelectorAll('.new-subject-color').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.new-subject-color').forEach(b => {
                b.classList.remove('ring-2', 'ring-primary', 'ring-offset-1');
            });
            btn.classList.add('ring-2', 'ring-primary', 'ring-offset-1');
            selectedColorIndex = parseInt(btn.dataset.index);
        });
    });

    // 엔터키로 추가
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmBtn.click();
        }
    });

    // 추가 버튼
    confirmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const subjectName = input.value.trim();

        if (!subjectName) {
            showToast('과목명을 입력해주세요', 'warning');
            input.focus();
            return;
        }

        if (subjectName.length > 10) {
            showToast('과목명은 10자 이하로 입력해주세요', 'warning');
            return;
        }

        // 과목 추가
        const selectedColor = COLOR_PRESETS[selectedColorIndex];
        const success = store.addSubject(subjectName, selectedColor);

        if (success) {
            showToast(`"${subjectName}" 과목이 추가되었습니다`, 'success');
            closeQuickAddModal(true);
        } else {
            showToast('이미 존재하는 과목입니다', 'warning');
            input.focus();
        }
    });

    // 애니메이션 (DOM 업데이트 후)
    requestAnimationFrame(() => {
        overlay.classList.add('show');
    });

    // 입력창 포커스 (애니메이션 시작 후)
    setTimeout(() => {
        input.focus();
    }, 150);
}

/**
 * 과목 설정 모달 (시간표 탭에서 과목 관리)
 */
function showSubjectSettingsModal() {
    const subjects = store.getSubjectList();
    const subjectColors = store.getSubjectColors();

    const renderSubjectItems = () => {
        if (subjects.length === 0) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-4xl mb-3">📚</div>
                    <p>등록된 과목이 없어요</p>
                    <p class="text-sm mt-2">과목을 추가해주세요!</p>
                </div>
            `;
        }

        return `<div class="grid grid-cols-2 gap-2">${subjects.map(subject => {
            const colors = subjectColors[subject] || { bg: '#F3F4F6', text: '#4B5563' };
            const usageCount = store.countSubjectUsage(subject);
            return `
                <div class="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                        <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                             style="background-color: ${colors.bg}; color: ${colors.text};">
                            ${subject.charAt(0)}
                        </div>
                        <div class="min-w-0">
                            <div class="font-medium text-gray-800 text-sm truncate">${subject}</div>
                            ${usageCount > 0 ? `<div class="text-xs text-gray-400">${usageCount}회</div>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        <button class="modal-subject-color-btn w-7 h-7 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center text-xs"
                                data-subject="${subject}">
                            🎨
                        </button>
                        <button class="modal-subject-delete-btn w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center text-xs"
                                data-subject="${subject}"
                                data-usage="${usageCount}">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('')}</div>`;
    };

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">📖 과목 설정</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div class="max-h-[50vh] overflow-y-auto" id="subjectListInModal">
                ${renderSubjectItems()}
            </div>

            <button id="addSubjectInModalBtn" class="w-full p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
                <span>➕</span>
                <span>새 과목 추가</span>
            </button>

            <button onclick="window.classpet.closeModal()" class="btn btn-secondary w-full">
                닫기
            </button>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 이벤트 바인딩
    bindSubjectSettingsEvents();
}

/**
 * 과목 설정 모달 내 이벤트 바인딩
 */
function bindSubjectSettingsEvents() {
    // 과목 추가 버튼
    const addBtn = document.getElementById('addSubjectInModalBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            showAddSubjectInSettingsModal();
        });
    }

    // 과목 색상 변경 버튼들
    document.querySelectorAll('.modal-subject-color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const subject = btn.dataset.subject;
            showSubjectColorChangeModal(subject);
        });
    });

    // 과목 삭제 버튼들
    document.querySelectorAll('.modal-subject-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const subject = btn.dataset.subject;
            const usageCount = parseInt(btn.dataset.usage) || 0;
            showSubjectDeleteConfirmModal(subject, usageCount);
        });
    });
}

/**
 * 과목 추가 모달 (과목 설정에서 호출)
 */
function showAddSubjectInSettingsModal() {
    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">➕ 새 과목 추가</h3>
                <button id="backToSubjectSettingsBtn" class="text-gray-400 hover:text-gray-600">← 돌아가기</button>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">과목명</label>
                <input type="text" id="newSubjectNameInModal"
                       class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                       placeholder="예: 안전교육, 보건, 방과후..."
                       maxlength="10">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">색상 선택</label>
                <div class="flex gap-2 flex-wrap">
                    ${COLOR_PRESETS.map((preset, index) => `
                        <button class="add-subject-color-modal w-10 h-10 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform ${index === 0 ? 'ring-2 ring-primary ring-offset-1' : ''}"
                                data-index="${index}"
                                data-bg="${preset.bg}"
                                data-text="${preset.text}"
                                title="${preset.name}"
                                style="background-color: ${preset.bg};">
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="flex gap-2">
                <button id="cancelAddSubjectInModal" class="btn btn-secondary flex-1">취소</button>
                <button id="confirmAddSubjectInModal" class="btn btn-primary flex-1">추가</button>
            </div>
        </div>
    `;

    setModalContent(modalContent);

    // 입력창 포커스
    setTimeout(() => {
        const input = document.getElementById('newSubjectNameInModal');
        if (input) input.focus();
    }, 100);

    let selectedColorIndex = 0;

    // 돌아가기/취소 버튼
    document.getElementById('backToSubjectSettingsBtn')?.addEventListener('click', () => {
        showSubjectSettingsModal();
    });
    document.getElementById('cancelAddSubjectInModal')?.addEventListener('click', () => {
        showSubjectSettingsModal();
    });

    // 색상 선택 이벤트
    document.querySelectorAll('.add-subject-color-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.add-subject-color-modal').forEach(b => {
                b.classList.remove('ring-2', 'ring-primary', 'ring-offset-1');
            });
            btn.classList.add('ring-2', 'ring-primary', 'ring-offset-1');
            selectedColorIndex = parseInt(btn.dataset.index);
        });
    });

    // 엔터키 지원
    document.getElementById('newSubjectNameInModal')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('confirmAddSubjectInModal')?.click();
        }
    });

    // 추가 버튼
    document.getElementById('confirmAddSubjectInModal')?.addEventListener('click', () => {
        const input = document.getElementById('newSubjectNameInModal');
        const subjectName = input?.value.trim();

        if (!subjectName) {
            showToast('과목명을 입력해주세요', 'warning');
            input?.focus();
            return;
        }

        if (subjectName.length > 10) {
            showToast('과목명은 10자 이하로 입력해주세요', 'warning');
            return;
        }

        const selectedColor = COLOR_PRESETS[selectedColorIndex];
        const success = store.addSubject(subjectName, selectedColor);

        if (success) {
            showToast(`"${subjectName}" 과목이 추가되었습니다`, 'success');
            showSubjectSettingsModal(); // 목록으로 돌아가기
        } else {
            showToast('이미 존재하는 과목입니다', 'warning');
            input?.focus();
        }
    });
}

/**
 * 과목 색상 변경 모달
 */
function showSubjectColorChangeModal(subject) {
    const currentColor = store.getSubjectColor(subject);

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">🎨 ${subject} 색상 변경</h3>
                <button id="backToSubjectSettingsBtn2" class="text-gray-400 hover:text-gray-600">← 돌아가기</button>
            </div>

            <div class="text-center py-4">
                <div id="colorPreviewBoxModal" class="inline-block px-6 py-3 rounded-xl text-lg font-bold"
                     style="background-color: ${currentColor.bg}; color: ${currentColor.text};">
                    ${subject}
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">색상 선택</label>
                <div class="flex gap-2 flex-wrap justify-center">
                    ${COLOR_PRESETS.map((preset, index) => `
                        <button class="color-change-modal-btn w-10 h-10 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform ${preset.bg === currentColor.bg ? 'ring-2 ring-primary ring-offset-1' : ''}"
                                data-index="${index}"
                                data-bg="${preset.bg}"
                                data-text="${preset.text}"
                                title="${preset.name}"
                                style="background-color: ${preset.bg};">
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="flex gap-2">
                <button id="cancelColorChangeModal" class="btn btn-secondary flex-1">취소</button>
                <button id="confirmColorChangeModal" class="btn btn-primary flex-1">저장</button>
            </div>
        </div>
    `;

    setModalContent(modalContent);

    let selectedColor = currentColor;

    // 돌아가기/취소 버튼
    document.getElementById('backToSubjectSettingsBtn2')?.addEventListener('click', () => {
        showSubjectSettingsModal();
    });
    document.getElementById('cancelColorChangeModal')?.addEventListener('click', () => {
        showSubjectSettingsModal();
    });

    // 색상 선택 이벤트
    document.querySelectorAll('.color-change-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-change-modal-btn').forEach(b => {
                b.classList.remove('ring-2', 'ring-primary', 'ring-offset-1');
            });
            btn.classList.add('ring-2', 'ring-primary', 'ring-offset-1');

            selectedColor = { bg: btn.dataset.bg, text: btn.dataset.text };

            // 미리보기 업데이트
            const previewBox = document.getElementById('colorPreviewBoxModal');
            if (previewBox) {
                previewBox.style.backgroundColor = selectedColor.bg;
                previewBox.style.color = selectedColor.text;
            }
        });
    });

    // 저장 버튼
    document.getElementById('confirmColorChangeModal')?.addEventListener('click', () => {
        store.setSubjectColor(subject, selectedColor);
        showToast(`${subject} 색상이 변경되었습니다`, 'success');
        showSubjectSettingsModal(); // 목록으로 돌아가기
        refreshView(); // 시간표 새로고침
    });
}

/**
 * 과목 삭제 확인 모달
 */
function showSubjectDeleteConfirmModal(subject, usageCount) {
    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-red-600">⚠️ 과목 삭제</h3>
                <button id="backToSubjectSettingsBtn3" class="text-gray-400 hover:text-gray-600">← 돌아가기</button>
            </div>

            <div class="text-center py-4">
                <div class="text-5xl mb-4">🗑️</div>
                <p class="text-gray-700 mb-2">
                    <strong>"${subject}"</strong> 과목을 삭제할까요?
                </p>
                ${usageCount > 0 ? `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <p class="text-sm text-yellow-700">
                        ⚠️ 시간표에서 <strong>${usageCount}회</strong> 사용 중입니다.<br>
                        삭제 시 해당 시간이 비워집니다.
                    </p>
                </div>
                ` : ''}
            </div>

            <div class="flex gap-2">
                <button id="cancelDeleteSubjectModal" class="btn btn-secondary flex-1">취소</button>
                <button id="confirmDeleteSubjectModal" class="btn btn-danger flex-1">삭제</button>
            </div>
        </div>
    `;

    setModalContent(modalContent);

    // 돌아가기/취소 버튼
    document.getElementById('backToSubjectSettingsBtn3')?.addEventListener('click', () => {
        showSubjectSettingsModal();
    });
    document.getElementById('cancelDeleteSubjectModal')?.addEventListener('click', () => {
        showSubjectSettingsModal();
    });

    // 삭제 버튼
    document.getElementById('confirmDeleteSubjectModal')?.addEventListener('click', () => {
        const result = store.removeSubject(subject);

        if (result.success) {
            if (result.usageCount > 0) {
                showToast(`"${subject}" 과목이 삭제되었습니다 (시간표 ${result.usageCount}개 비움)`, 'info');
            } else {
                showToast(`"${subject}" 과목이 삭제되었습니다`, 'success');
            }
            showSubjectSettingsModal(); // 목록으로 돌아가기
            refreshView(); // 시간표 새로고침
        } else {
            showToast('과목 삭제에 실패했습니다', 'error');
        }
    });
}

