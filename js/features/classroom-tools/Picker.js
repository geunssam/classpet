/**
 * 뽑기 컴포넌트
 * 술래뽑기 (Tag Picker) + 모둠뽑기 (Group Maker)
 * PEPicker 3단계 구조 이식: 설정 → 결과 → 타이머
 */

import { store } from '../../store.js';
import { Sound } from './sound.js';
import { Timer, formatTime } from './timer.js';
import { Whistle } from './whistle.js';
import { showToast } from '../../shared/utils/animations.js';
import { getPetEmoji, getPetImageHTML } from '../../shared/utils/petLogic.js';

// ========== 상태 ==========
let currentPhase = 'mode-select';
// 'mode-select' | 'tag-settings' | 'tag-result' | 'tag-timer'
// | 'group-settings' | 'group-result' | 'group-timer'
let currentMode = null; // 'tag' | 'group'

// 술래뽑기 상태
let tagSettings = { itCount: 1, angelCount: 0, excludePrevious: false };
let participants = [];
let excludedIds = new Set();
let selectedIts = [];
let selectedAngels = [];
let availableForIt = [];
let availableForAngel = [];
let tagRound = 0;

// 모둠뽑기 상태
let groupSettings = { groupCount: 4, namingType: 'number', customNames: [] };
let groupExcludedIds = new Set();
let groupResults = [];

// 타이머 상태
let tagTimerMinutes = 0;
let tagTimerSeconds = 30;
let groupTimerMinutes = 3;
let groupTimerSeconds = 0;
let pickerTimer = null;
let pickerFullscreen = false;
let pickerWhistleMode = 'long';
let pickerWhistlePressing = false;
let pickerCleanupFns = [];

// 폴딩 상태
let foldingState = { nextIts: false, nextAngels: false, historyIts: false, historyAngels: false };
let allItsHistory = [];
let allAngelsHistory = [];

// 모둠 이름 프리셋
const GROUP_NAMES = {
    number: (i) => `${i + 1}모둠`,
    color: (i) => ['빨강', '주황', '노랑', '초록', '파랑', '남색', '보라', '분홍'][i] || `${i + 1}모둠`,
    animal: (i) => ['사자', '호랑이', '독수리', '돌고래', '판다', '여우', '토끼', '늑대'][i] || `${i + 1}모둠`,
    custom: (i) => groupSettings.customNames?.[i] || `${i + 1}모둠`,
};

// SVG 아이콘 헬퍼 (stroke 스타일 통일)
const ICON = {
    target: (s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="${c}"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/></svg>`,
    group: (s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="7" r="3"/><path d="M8 21v-1.5a4 4 0 0 1 8 0V21"/><circle cx="5" cy="9" r="2.5"/><path d="M2 21v-1a3 3 0 0 1 4-2.8"/><circle cx="19" cy="9" r="2.5"/><path d="M22 21v-1a3 3 0 0 0-4-2.8"/></svg>`,
    play: (s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
    shuffle: (s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>`,
    gear: (s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    undo: (s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
    timer: (s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><line x1="9" y1="2" x2="15" y2="2"/><line x1="12" y1="2" x2="12" y2="4"/></svg>`,
    flame: (s = 16, c = '#DC2626') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-4-4-6-4-10z"/><path d="M12 18a2 2 0 0 1-2-2c0-2 2-3 2-3s2 1 2 3a2 2 0 0 1-2 2z"/></svg>`,
    halo: (s = 16, c = '#2563EB') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="5" rx="5" ry="2"/><circle cx="12" cy="14" r="5"/><path d="M9 19l-2 3"/><path d="M15 19l2 3"/></svg>`,
};

// label → 학생 데이터 조회 맵
function getStudentMap() {
    const students = getStudentList();
    const map = {};
    students.forEach(s => { map[s.label] = s; });
    return map;
}

// 결과 학생 칩 렌더 (설정 화면 칩과 동일 포맷)
function renderResultChip(label, type) {
    const studentMap = getStudentMap();
    const s = studentMap[label];
    const petImg = s ? getPetImageHTML(s.petType, s.level, 'xs') : '🥚';
    const chipType = type === 'it' ? 'chip-result-it' : 'chip-result-angel';
    return `
        <div class="picker-student-chip picker-result-chip ${chipType}">
            <span class="chip-pet">${petImg}</span>
            <span class="chip-number">${s?.number || ''}</span>
            <span class="chip-name">${s?.name || label}</span>
            <span class="chip-level">Lv.${s?.level || 1}</span>
        </div>
    `;
}

// ========== Fisher-Yates Shuffle ==========
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ========== 뽑기 알고리즘 ==========
function pickGroup(count, availablePool, fullList) {
    let picked = [];
    const shuffled = shuffle(availablePool);
    const newPicks = shuffled.slice(0, count);
    picked.push(...newPicks);

    const needed = count - picked.length;
    if (needed > 0) {
        const pool = fullList.filter(p => !picked.includes(p));
        const extra = shuffle(pool);
        picked.push(...extra.slice(0, needed));
    }
    return { finalGroup: picked, newPicks };
}

function assignRandomGroups(students, groupCount, namingType) {
    const shuffled = shuffle(students);
    const teamSize = Math.floor(shuffled.length / groupCount);
    const groups = [];

    for (let i = 0; i < groupCount; i++) {
        const start = i * teamSize;
        groups.push({
            id: i + 1,
            name: GROUP_NAMES[namingType](i),
            members: shuffled.slice(start, start + teamSize),
        });
    }

    const remaining = shuffled.slice(groupCount * teamSize);
    if (remaining.length > 0) {
        const indices = shuffle([...Array(groupCount).keys()]);
        remaining.forEach((name, i) => {
            groups[indices[i % groupCount]].members.push(name);
        });
    }
    return groups;
}

// ========== 유틸: 이벤트 리스너 등록 + cleanup ==========
function listen(el, event, handler, options) {
    if (!el) return;
    el.addEventListener(event, handler, options);
    pickerCleanupFns.push(() => el.removeEventListener(event, handler, options));
}

// ========== 타이머 총 초 계산 ==========
function getTagTimerTotal() {
    return tagTimerMinutes * 60 + tagTimerSeconds;
}

function getGroupTimerTotal() {
    return groupTimerMinutes * 60 + groupTimerSeconds;
}

// ========== Render ==========
export function render() {
    if (currentPhase === 'mode-select') return renderModeSelect();
    if (currentPhase === 'tag-settings') return renderTagSettings();
    if (currentPhase === 'tag-result') return renderTagResult();
    if (currentPhase === 'tag-timer') return renderPickerTimer('tag');
    if (currentPhase === 'group-settings') return renderGroupSettings();
    if (currentPhase === 'group-result') return renderGroupResult();
    if (currentPhase === 'group-timer') return renderPickerTimer('group');
    return renderModeSelect();
}

function renderModeSelect() {
    return `
        <div class="space-y-4">
            <div class="pb-2">
                <h2 class="text-xl font-bold">🎲 뽑기</h2>
            </div>
            <div class="picker-mode-grid">
                <div class="picker-mode-card mode-tag" id="pickerModeTag">
                    <svg class="mode-icon-svg" viewBox="0 0 48 48" fill="none" stroke="#F57C7C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="24" cy="24" r="18"/>
                        <circle cx="24" cy="24" r="11"/>
                        <circle cx="24" cy="24" r="4"/>
                        <line x1="24" y1="2" x2="24" y2="8"/>
                        <line x1="24" y1="40" x2="24" y2="46"/>
                        <line x1="2" y1="24" x2="8" y2="24"/>
                        <line x1="40" y1="24" x2="46" y2="24"/>
                    </svg>
                    <span class="mode-title">술래뽑기</span>
                    <span class="mode-desc">술래와 천사를<br>랜덤으로 뽑아요</span>
                </div>
                <div class="picker-mode-card mode-group" id="pickerModeGroup">
                    <svg class="mode-icon-svg" viewBox="0 0 48 48" fill="none" stroke="#7C9EF5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="24" cy="14" r="6"/>
                        <path d="M16 38v-3a8 8 0 0 1 16 0v3"/>
                        <circle cx="10" cy="18" r="5"/>
                        <path d="M4 38v-2a6 6 0 0 1 8-5.5"/>
                        <circle cx="38" cy="18" r="5"/>
                        <path d="M44 38v-2a6 6 0 0 0-8-5.5"/>
                    </svg>
                    <span class="mode-title">모둠뽑기</span>
                    <span class="mode-desc">모둠을 랜덤으로<br>구성해요</span>
                </div>
            </div>
        </div>
    `;
}

function getStudentList() {
    const students = store.getStudents() || [];
    return students.map(s => ({
        id: s.id,
        label: `${s.number} ${s.name}`,
        number: s.number,
        name: s.name,
        petType: s.petType || null,
        level: s.level || 1,
    }));
}

function renderStudentChips(excluded) {
    const students = getStudentList();
    if (students.length === 0) {
        return `
            <div class="picker-empty">
                <div class="empty-icon">📋</div>
                <div class="empty-text">등록된 학생이 없습니다.<br>학생을 먼저 등록해주세요.</div>
            </div>
        `;
    }

    const activeCount = students.filter(s => !excluded.has(s.id)).length;

    return `
        <div class="picker-participant-count">참가: ${activeCount}명 / 전체: ${students.length}명</div>
        <div class="picker-students-grid">
            ${students.map(s => {
                const petImg = getPetImageHTML(s.petType, s.level, 'xs');
                return `
                <div class="picker-student-chip ${excluded.has(s.id) ? 'excluded' : ''}" data-student-id="${s.id}">
                    <span class="chip-pet">${petImg}</span>
                    <span class="chip-number">${s.number}</span>
                    <span class="chip-name">${s.name}</span>
                    <span class="chip-level">Lv.${s.level}</span>
                </div>
            `}).join('')}
        </div>
    `;
}

// ========== 술래뽑기 설정 ==========
function renderTagSettings() {
    return `
        <div class="space-y-4">
            <div class="picker-header">
                <button class="picker-back-btn" id="pickerBackBtn">←</button>
                <span class="picker-title">${ICON.target(18, '#F57C7C')} 술래뽑기</span>
            </div>

            <div class="card">
                <h3 class="text-sm font-bold text-gray-500 mb-2">참가 학생</h3>
                ${renderStudentChips(excludedIds)}
            </div>

            <div class="card picker-settings">
                <div class="picker-settings-4col">
                    <div class="picker-setting-item">
                        <span class="setting-label">술래 수</span>
                        <div class="setting-control">
                            <button class="picker-count-btn" data-target="itCount" data-dir="-1">−</button>
                            <span class="picker-count-value" id="itCountDisplay">${tagSettings.itCount}</span>
                            <button class="picker-count-btn" data-target="itCount" data-dir="1">+</button>
                        </div>
                    </div>
                    <div class="picker-setting-item">
                        <span class="setting-label">천사 수</span>
                        <div class="setting-control">
                            <button class="picker-count-btn" data-target="angelCount" data-dir="-1">−</button>
                            <span class="picker-count-value" id="angelCountDisplay">${tagSettings.angelCount}</span>
                            <button class="picker-count-btn" data-target="angelCount" data-dir="1">+</button>
                        </div>
                    </div>
                    <div class="picker-setting-item">
                        <span class="setting-label">분</span>
                        <div class="setting-control">
                            <button class="picker-count-btn" data-target="tagMin" data-dir="-1">−</button>
                            <span class="picker-count-value" id="tagMinDisplay">${tagTimerMinutes}</span>
                            <button class="picker-count-btn" data-target="tagMin" data-dir="1">+</button>
                        </div>
                    </div>
                    <div class="picker-setting-item">
                        <span class="setting-label">초</span>
                        <div class="setting-control">
                            <button class="picker-count-btn" data-target="tagSec" data-dir="-1">−</button>
                            <span class="picker-count-value" id="tagSecDisplay">${tagTimerSeconds}</span>
                            <button class="picker-count-btn" data-target="tagSec" data-dir="1">+</button>
                        </div>
                    </div>
                </div>
                <div class="picker-setting-row">
                    <label>중복 제외</label>
                    <button class="picker-toggle ${tagSettings.excludePrevious ? 'active' : ''}" id="excludeToggle"></button>
                </div>
            </div>

            <button class="picker-start-btn tag-start" id="tagStartBtn">
                ${ICON.target(20, 'white')} 술래 뽑기 시작!
            </button>
        </div>
    `;
}

// ========== 폴딩 섹션 렌더러 ==========
function renderFoldingChip(label, type) {
    const studentMap = getStudentMap();
    const s = studentMap[label];
    const petImg = s ? getPetImageHTML(s.petType, s.level, 'xs') : '🥚';
    const colorClass = type === 'it' ? 'chip-folding-it' : type === 'angel' ? 'chip-folding-angel' : 'chip-folding-history';
    return `
        <div class="picker-student-chip picker-folding-chip ${colorClass}">
            <span class="chip-pet">${petImg}</span>
            <span class="chip-number">${s?.number || ''}</span>
            <span class="chip-name">${s?.name || label}</span>
            <span class="chip-level">Lv.${s?.level || 1}</span>
        </div>
    `;
}

function renderFoldingSection(key, title, items, type) {
    const isOpen = foldingState[key];
    const isEmpty = items.length === 0;

    return `
        <div class="picker-collapsible">
            <button class="picker-collapse-toggle" data-folding-key="${key}">
                <span>${title} (${items.length}명)</span>
                <span class="picker-collapse-arrow ${isOpen ? 'open' : ''}">▼</span>
            </button>
            <div class="picker-collapse-content ${isOpen ? 'open' : ''}">
                ${isEmpty
                    ? '<div style="font-size:12px; color:#D1D5DB;">없음</div>'
                    : `<div class="picker-candidate-chips">
                        ${items.map(name => renderFoldingChip(name, type)).join('')}
                    </div>`
                }
            </div>
        </div>
    `;
}

// ========== 술래뽑기 결과 ==========
function renderTagResult() {
    const totalSec = getTagTimerTotal();
    const showAngel = tagSettings.angelCount > 0;

    return `
        <div class="space-y-4">
            <div class="picker-header">
                <button class="picker-back-btn" id="pickerBackBtn">←</button>
                <span class="picker-title">${ICON.target(18, '#F57C7C')} 술래뽑기 결과</span>
                <span style="margin-left:auto; font-size:13px; color:#9CA3AF; font-weight:600;">ROUND ${tagRound}</span>
            </div>

            <div class="card picker-results">
                <div class="picker-result-section">
                    <div class="picker-result-label label-it">${ICON.flame(16, '#DC2626')} 술래</div>
                    <div class="picker-result-cards">
                        ${selectedIts.map(name => renderResultChip(name, 'it')).join('')}
                    </div>
                </div>

                ${selectedAngels.length > 0 ? `
                <div class="picker-result-section">
                    <div class="picker-result-label label-angel">${ICON.halo(16, '#2563EB')} 천사</div>
                    <div class="picker-result-cards">
                        ${selectedAngels.map(name => renderResultChip(name, 'angel')).join('')}
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="picker-folding-group">
                ${renderFoldingSection('nextIts', ICON.target(14, '#F57C7C') + ' 다음 술래 후보', availableForIt, 'it')}
                ${showAngel ? renderFoldingSection('nextAngels', ICON.halo(14, '#2563EB') + ' 다음 천사 후보', availableForAngel, 'angel') : ''}
                ${renderFoldingSection('historyIts', ICON.target(14, '#9CA3AF') + ' 지난 술래', allItsHistory, 'history')}
                ${showAngel ? renderFoldingSection('historyAngels', ICON.halo(14, '#9CA3AF') + ' 지난 천사', allAngelsHistory, 'history') : ''}
            </div>

            <div class="picker-phase2-grid">
                <button class="picker-action-btn picker-action-game" id="tagGameBtn" ${totalSec <= 0 ? 'disabled' : ''}>
                    <span class="picker-action-icon">${ICON.play(20, 'white')}</span>
                    <span>게임 시작</span>
                </button>
                <button class="picker-action-btn picker-action-retry" id="tagRetryBtn">
                    <span class="picker-action-icon">${ICON.shuffle(20, 'white')}</span>
                    <span>다시뽑기</span>
                </button>
                <button class="picker-action-btn picker-action-settings" id="tagSettingsBtn">
                    <span class="picker-action-icon">${ICON.gear(20, '#374151')}</span>
                    <span>설정</span>
                </button>
                <button class="picker-action-btn picker-action-reset" id="tagResetBtn">
                    <span class="picker-action-icon">${ICON.undo(20, '#6B7280')}</span>
                    <span>초기화</span>
                </button>
            </div>
        </div>
    `;
}

// ========== 모둠뽑기 설정 ==========
function renderGroupSettings() {
    const customInputs = Array.from({ length: groupSettings.groupCount }, (_, i) =>
        `<input class="picker-custom-name-input" data-group-idx="${i}" placeholder="${i + 1}모둠" value="${groupSettings.customNames?.[i] || ''}" />`
    ).join('');

    return `
        <div class="space-y-4">
            <div class="picker-header">
                <button class="picker-back-btn" id="pickerBackBtn">←</button>
                <span class="picker-title">${ICON.group(18, '#7C9EF5')} 모둠뽑기</span>
            </div>

            <div class="card">
                <h3 class="text-sm font-bold text-gray-500 mb-2">참가 학생</h3>
                ${renderStudentChips(groupExcludedIds)}
            </div>

            <div class="card picker-settings">
                <div class="picker-settings-4col">
                    <div class="picker-setting-item">
                        <span class="setting-label">모둠 수</span>
                        <div class="setting-control">
                            <button class="picker-count-btn" data-target="groupCount" data-dir="-1">−</button>
                            <span class="picker-count-value" id="groupCountDisplay">${groupSettings.groupCount}</span>
                            <button class="picker-count-btn" data-target="groupCount" data-dir="1">+</button>
                        </div>
                    </div>
                    <div class="picker-setting-item picker-setting-item--empty"></div>
                    <div class="picker-setting-item">
                        <span class="setting-label">분</span>
                        <div class="setting-control">
                            <button class="picker-count-btn" data-target="groupMin" data-dir="-1">−</button>
                            <span class="picker-count-value" id="groupMinDisplay">${groupTimerMinutes}</span>
                            <button class="picker-count-btn" data-target="groupMin" data-dir="1">+</button>
                        </div>
                    </div>
                    <div class="picker-setting-item">
                        <span class="setting-label">초</span>
                        <div class="setting-control">
                            <button class="picker-count-btn" data-target="groupSec" data-dir="-1">−</button>
                            <span class="picker-count-value" id="groupSecDisplay">${groupTimerSeconds}</span>
                            <button class="picker-count-btn" data-target="groupSec" data-dir="1">+</button>
                        </div>
                    </div>
                </div>
                <div class="picker-setting-row" style="flex-direction:column; align-items:stretch; gap:8px;">
                    <label>모둠 이름</label>
                    <div class="picker-naming-options">
                        <button class="picker-naming-btn ${groupSettings.namingType === 'number' ? 'active' : ''}" data-naming="number">1, 2, 3...</button>
                        <button class="picker-naming-btn ${groupSettings.namingType === 'color' ? 'active' : ''}" data-naming="color">빨, 주, 노...</button>
                        <button class="picker-naming-btn ${groupSettings.namingType === 'animal' ? 'active' : ''}" data-naming="animal">사자, 호랑이...</button>
                        <button class="picker-naming-btn ${groupSettings.namingType === 'custom' ? 'active' : ''}" data-naming="custom">직접 입력</button>
                    </div>
                    <div class="picker-custom-names ${groupSettings.namingType === 'custom' ? 'open' : ''}" id="customNamesSection">
                        ${customInputs}
                    </div>
                </div>
            </div>

            <button class="picker-start-btn group-start" id="groupStartBtn">
                ${ICON.group(20, 'white')} 모둠 나누기 시작!
            </button>
        </div>
    `;
}

// ========== 모둠뽑기 결과 ==========
function renderGroupMemberChip(label) {
    const studentMap = getStudentMap();
    const s = studentMap[label];
    const petImg = s ? getPetImageHTML(s.petType, s.level, 'xs') : '🥚';
    return `
        <div class="picker-student-chip picker-group-member-chip">
            <span class="chip-pet">${petImg}</span>
            <span class="chip-number">${s?.number || ''}</span>
            <span class="chip-name">${s?.name || label}</span>
            <span class="chip-level">Lv.${s?.level || 1}</span>
        </div>
    `;
}

function renderGroupResult() {
    const totalSec = getGroupTimerTotal();
    return `
        <div class="space-y-4">
            <div class="picker-header">
                <button class="picker-back-btn" id="pickerBackBtn">←</button>
                <span class="picker-title">${ICON.group(18, '#7C9EF5')} 모둠 결과</span>
            </div>

            <div class="picker-group-cards">
                ${groupResults.map(group => `
                    <div class="picker-group-card">
                        <div class="group-name">${group.name}<span class="group-count">${group.members.length}명</span></div>
                        <div class="group-members-chips">
                            ${group.members.map(m => renderGroupMemberChip(m)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="picker-phase2-grid">
                <button class="picker-action-btn picker-action-timer" id="groupTimerBtn" ${totalSec <= 0 ? 'disabled' : ''}>
                    <span class="picker-action-icon">${ICON.timer(20, 'white')}</span>
                    <span>타이머</span>
                </button>
                <button class="picker-action-btn picker-action-retry" id="groupRetryBtn">
                    <span class="picker-action-icon">${ICON.shuffle(20, 'white')}</span>
                    <span>다시나누기</span>
                </button>
                <button class="picker-action-btn picker-action-settings" id="groupSettingsBtn">
                    <span class="picker-action-icon">${ICON.gear(20, '#374151')}</span>
                    <span>설정</span>
                </button>
                <button class="picker-action-btn picker-action-reset" id="groupResetBtn">
                    <span class="picker-action-icon">${ICON.undo(20, '#6B7280')}</span>
                    <span>초기화</span>
                </button>
            </div>
        </div>
    `;
}

// ========== 공통 타이머 Phase (인라인 ↔ 전체화면 토글) ==========
function renderPickerTimer(mode) {
    const totalSec = mode === 'tag' ? getTagTimerTotal() : getGroupTimerTotal();
    const timeStr = formatTime(totalSec);

    return `
        <div class="picker-timer-phase ${pickerFullscreen ? 'picker-timer-fullscreen' : ''}" id="pickerTimerPhase">
            <div class="picker-timer-label">남은 시간</div>
            <div class="picker-timer-display picker-timer-state-normal" id="pickerTimerDisplay">${timeStr}</div>

            <div class="picker-timer-whistle-wrap">
                <div class="picker-timer-whistle-modes">
                    <button class="picker-tw-mode-btn ${pickerWhistleMode === 'hold' ? 'active' : ''}" data-wmode="hold">꾹</button>
                    <button class="picker-tw-mode-btn ${pickerWhistleMode === 'long' ? 'active' : ''}" data-wmode="long">길게</button>
                    <button class="picker-tw-mode-btn ${pickerWhistleMode === 'triple' ? 'active' : ''}" data-wmode="triple">삐삐삐</button>
                </div>
                <div class="picker-timer-whistle-btn-area">
                    <div class="picker-tw-ring" id="pickerTwRing1"></div>
                    <div class="picker-tw-ring" id="pickerTwRing2"></div>
                    <button class="picker-timer-whistle-btn" id="pickerWhistleBtn">
                        <span style="font-size:28px">📣</span>
                    </button>
                </div>
            </div>

            <div class="picker-timer-sub-controls">
                <button class="picker-timer-ctrl-btn" id="pickerFullscreenToggle">
                    <span id="pickerFsLabel">${pickerFullscreen ? '축소' : '전체화면'}</span>
                </button>
                <button class="picker-timer-ctrl-btn" id="pickerTimerToggleBtn">
                    <svg id="pickerPauseIcon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    <svg id="pickerPlayIcon" class="hidden" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span id="pickerToggleLabel">일시정지</span>
                </button>
                <button class="picker-timer-ctrl-btn picker-timer-ctrl-stop" id="pickerTimerStopBtn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                    <span>타이머 종료</span>
                </button>
            </div>
        </div>
    `;
}

// ========== afterRender ==========
export function afterRender() {
    // cleanup 이전 리스너
    pickerCleanupFns.forEach(fn => fn());
    pickerCleanupFns = [];

    if (currentPhase === 'mode-select') bindModeSelect();
    if (currentPhase === 'tag-settings') bindTagSettings();
    if (currentPhase === 'tag-result') bindTagResult();
    if (currentPhase === 'tag-timer') bindPickerTimer('tag');
    if (currentPhase === 'group-settings') bindGroupSettings();
    if (currentPhase === 'group-result') bindGroupResult();
    if (currentPhase === 'group-timer') bindPickerTimer('group');
}

function refreshView() {
    const container = document.getElementById('content');
    if (!container) return;
    container.innerHTML = render();
    afterRender();
}

// --- Mode Select ---
function bindModeSelect() {
    document.getElementById('pickerModeTag')?.addEventListener('click', () => {
        currentMode = 'tag';
        excludedIds = new Set();
        currentPhase = 'tag-settings';
        Sound.playClick();
        refreshView();
    });

    document.getElementById('pickerModeGroup')?.addEventListener('click', () => {
        currentMode = 'group';
        groupExcludedIds = new Set();
        currentPhase = 'group-settings';
        Sound.playClick();
        refreshView();
    });
}

// --- Tag Settings ---
function bindTagSettings() {
    document.getElementById('pickerBackBtn')?.addEventListener('click', () => {
        currentPhase = 'mode-select';
        Sound.playClick();
        refreshView();
    });

    // Student chips toggle exclude
    document.querySelectorAll('.picker-student-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const id = chip.dataset.studentId;
            if (excludedIds.has(id)) {
                excludedIds.delete(id);
                chip.classList.remove('excluded');
            } else {
                excludedIds.add(id);
                chip.classList.add('excluded');
            }
            const students = getStudentList();
            const activeCount = students.filter(s => !excludedIds.has(s.id)).length;
            const countEl = document.querySelector('.picker-participant-count');
            if (countEl) countEl.textContent = `참가: ${activeCount}명 / 전체: ${students.length}명`;
            Sound.playClick();
        });
    });

    // Count buttons (itCount, angelCount, tagMin, tagSec)
    document.querySelectorAll('.picker-count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            const dir = parseInt(btn.dataset.dir);
            if (target === 'itCount') {
                tagSettings.itCount = Math.max(1, Math.min(5, tagSettings.itCount + dir));
                document.getElementById('itCountDisplay').textContent = tagSettings.itCount;
            } else if (target === 'angelCount') {
                tagSettings.angelCount = Math.max(0, Math.min(3, tagSettings.angelCount + dir));
                document.getElementById('angelCountDisplay').textContent = tagSettings.angelCount;
            } else if (target === 'tagMin') {
                tagTimerMinutes = Math.max(0, Math.min(99, tagTimerMinutes + dir));
                document.getElementById('tagMinDisplay').textContent = tagTimerMinutes;
            } else if (target === 'tagSec') {
                tagTimerSeconds = Math.max(0, Math.min(59, tagTimerSeconds + dir * 10));
                document.getElementById('tagSecDisplay').textContent = tagTimerSeconds;
            }
            Sound.playClick();
        });
    });

    // Exclude toggle
    document.getElementById('excludeToggle')?.addEventListener('click', (e) => {
        tagSettings.excludePrevious = !tagSettings.excludePrevious;
        e.currentTarget.classList.toggle('active', tagSettings.excludePrevious);
        Sound.playClick();
    });

    // Start
    document.getElementById('tagStartBtn')?.addEventListener('click', startTagPick);
}

function startTagPick() {
    const students = getStudentList();
    participants = students
        .filter(s => !excludedIds.has(s.id))
        .map(s => s.label);

    if (participants.length === 0) {
        showToast('참가 학생이 없습니다!');
        Sound.playError();
        return;
    }

    if (tagSettings.itCount + tagSettings.angelCount > participants.length) {
        showToast('참가자보다 술래+천사가 많습니다!');
        Sound.playError();
        return;
    }

    // Initialize pools
    availableForIt = [...participants];
    availableForAngel = [...participants];
    tagRound = 0;

    doTagPick();
}

function doTagPick() {
    tagRound++;

    // Reset pools if excludePrevious is off
    if (!tagSettings.excludePrevious && tagRound > 1) {
        availableForIt = [...participants];
        availableForAngel = [...participants];
    }

    // Pick its
    const itResult = pickGroup(tagSettings.itCount, availableForIt, participants);
    selectedIts = itResult.finalGroup;

    if (tagSettings.excludePrevious) {
        availableForIt = availableForIt.filter(p => !itResult.newPicks.includes(p));
    }

    // Pick angels
    if (tagSettings.angelCount > 0) {
        const angelPool = availableForAngel.filter(p => !selectedIts.includes(p));
        const fullAngelList = participants.filter(p => !selectedIts.includes(p));

        if (fullAngelList.length < tagSettings.angelCount) {
            showToast('천사를 뽑기에 인원이 부족합니다!');
            tagRound--;
            Sound.playError();
            return;
        }

        const angelResult = pickGroup(tagSettings.angelCount, angelPool, fullAngelList);
        selectedAngels = angelResult.finalGroup;

        if (tagSettings.excludePrevious) {
            availableForAngel = availableForAngel.filter(p => !angelResult.newPicks.includes(p));
        }
    } else {
        selectedAngels = [];
    }

    // 이력 누적
    allItsHistory = [...new Set([...allItsHistory, ...selectedIts])];
    if (selectedAngels.length > 0) {
        allAngelsHistory = [...new Set([...allAngelsHistory, ...selectedAngels])];
    }

    // Show animation then result
    showPickAnimation(() => {
        currentPhase = 'tag-result';
        Sound.playPickSound();
        refreshView();
    });
}

// --- Pick Animation ---
function showPickAnimation(callback) {
    const overlay = document.createElement('div');
    overlay.className = 'picker-animation-overlay';
    overlay.innerHTML = `<div class="picker-shuffle-text"></div>`;
    document.body.appendChild(overlay);

    const textEl = overlay.querySelector('.picker-shuffle-text');
    let count = 0;
    const maxCount = 12;
    const allNames = participants.length > 0 ? participants :
        getStudentList().filter(s => !groupExcludedIds.has(s.id)).map(s => s.label);

    const interval = setInterval(() => {
        const randomName = allNames[Math.floor(Math.random() * allNames.length)];
        if (textEl) textEl.textContent = randomName;
        count++;
        if (count >= maxCount) {
            clearInterval(interval);
            setTimeout(() => {
                overlay.remove();
                callback();
            }, 200);
        }
    }, 80);
}

// --- Tag Result ---
function bindTagResult() {
    document.getElementById('pickerBackBtn')?.addEventListener('click', () => {
        currentPhase = 'mode-select';
        resetTagState();
        Sound.playClick();
        refreshView();
    });

    // 폴딩 토글
    document.querySelectorAll('.picker-collapse-toggle[data-folding-key]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.foldingKey;
            foldingState[key] = !foldingState[key];
            const content = btn.nextElementSibling;
            const arrow = btn.querySelector('.picker-collapse-arrow');
            if (content) content.classList.toggle('open', foldingState[key]);
            if (arrow) arrow.classList.toggle('open', foldingState[key]);
        });
    });

    // 게임 시작 → 타이머
    document.getElementById('tagGameBtn')?.addEventListener('click', () => {
        if (getTagTimerTotal() <= 0) return;
        currentPhase = 'tag-timer';
        Sound.playClick();
        refreshView();
    });

    document.getElementById('tagRetryBtn')?.addEventListener('click', () => {
        doTagPick();
    });

    document.getElementById('tagSettingsBtn')?.addEventListener('click', () => {
        currentPhase = 'tag-settings';
        Sound.playClick();
        refreshView();
    });

    document.getElementById('tagResetBtn')?.addEventListener('click', () => {
        currentPhase = 'mode-select';
        resetTagState();
        Sound.playClick();
        refreshView();
    });
}

function resetTagState() {
    tagRound = 0;
    selectedIts = [];
    selectedAngels = [];
    availableForIt = [];
    availableForAngel = [];
    participants = [];
    allItsHistory = [];
    allAngelsHistory = [];
    foldingState = { nextIts: false, nextAngels: false, historyIts: false, historyAngels: false };
}

// --- Group Settings ---
function bindGroupSettings() {
    document.getElementById('pickerBackBtn')?.addEventListener('click', () => {
        currentPhase = 'mode-select';
        Sound.playClick();
        refreshView();
    });

    // Student chips toggle exclude
    document.querySelectorAll('.picker-student-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const id = chip.dataset.studentId;
            if (groupExcludedIds.has(id)) {
                groupExcludedIds.delete(id);
                chip.classList.remove('excluded');
            } else {
                groupExcludedIds.add(id);
                chip.classList.add('excluded');
            }
            const students = getStudentList();
            const activeCount = students.filter(s => !groupExcludedIds.has(s.id)).length;
            const countEl = document.querySelector('.picker-participant-count');
            if (countEl) countEl.textContent = `참가: ${activeCount}명 / 전체: ${students.length}명`;
            Sound.playClick();
        });
    });

    // Count buttons (groupCount, groupMin, groupSec)
    document.querySelectorAll('.picker-count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            const dir = parseInt(btn.dataset.dir);
            if (target === 'groupCount') {
                groupSettings.groupCount = Math.max(2, Math.min(8, groupSettings.groupCount + dir));
                document.getElementById('groupCountDisplay').textContent = groupSettings.groupCount;
                if (groupSettings.namingType === 'custom') refreshView();
            } else if (target === 'groupMin') {
                groupTimerMinutes = Math.max(0, Math.min(99, groupTimerMinutes + dir));
                document.getElementById('groupMinDisplay').textContent = groupTimerMinutes;
            } else if (target === 'groupSec') {
                groupTimerSeconds = Math.max(0, Math.min(59, groupTimerSeconds + dir * 10));
                document.getElementById('groupSecDisplay').textContent = groupTimerSeconds;
            }
            Sound.playClick();
        });
    });

    // Naming type
    document.querySelectorAll('.picker-naming-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            groupSettings.namingType = btn.dataset.naming;
            document.querySelectorAll('.picker-naming-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const customSection = document.getElementById('customNamesSection');
            if (customSection) customSection.classList.toggle('open', btn.dataset.naming === 'custom');
            Sound.playClick();
        });
    });

    // Custom name inputs
    document.querySelectorAll('.picker-custom-name-input').forEach(input => {
        input.addEventListener('input', () => {
            const idx = parseInt(input.dataset.groupIdx);
            if (!groupSettings.customNames) groupSettings.customNames = [];
            groupSettings.customNames[idx] = input.value.trim();
        });
    });

    // Start
    document.getElementById('groupStartBtn')?.addEventListener('click', startGroupPick);
}

function startGroupPick() {
    const students = getStudentList();
    const activeStudents = students
        .filter(s => !groupExcludedIds.has(s.id))
        .map(s => s.label);

    if (activeStudents.length === 0) {
        showToast('참가 학생이 없습니다!');
        Sound.playError();
        return;
    }

    if (groupSettings.groupCount > activeStudents.length) {
        showToast('학생 수보다 모둠 수가 많습니다!');
        Sound.playError();
        return;
    }

    doGroupPick(activeStudents);
}

function doGroupPick(studentList) {
    const list = studentList || getStudentList()
        .filter(s => !groupExcludedIds.has(s.id))
        .map(s => s.label);

    groupResults = assignRandomGroups(list, groupSettings.groupCount, groupSettings.namingType);

    showPickAnimation(() => {
        currentPhase = 'group-result';
        Sound.playPickSound();
        refreshView();
    });
}

// --- Group Result ---
function bindGroupResult() {
    document.getElementById('pickerBackBtn')?.addEventListener('click', () => {
        currentPhase = 'mode-select';
        Sound.playClick();
        refreshView();
    });

    // 타이머
    document.getElementById('groupTimerBtn')?.addEventListener('click', () => {
        if (getGroupTimerTotal() <= 0) return;
        currentPhase = 'group-timer';
        Sound.playClick();
        refreshView();
    });

    document.getElementById('groupRetryBtn')?.addEventListener('click', () => {
        const students = getStudentList();
        const activeStudents = students
            .filter(s => !groupExcludedIds.has(s.id))
            .map(s => s.label);
        doGroupPick(activeStudents);
    });

    document.getElementById('groupSettingsBtn')?.addEventListener('click', () => {
        currentPhase = 'group-settings';
        Sound.playClick();
        refreshView();
    });

    document.getElementById('groupResetBtn')?.addEventListener('click', () => {
        currentPhase = 'mode-select';
        groupResults = [];
        Sound.playClick();
        refreshView();
    });
}

// ========== 공통 타이머 Phase 바인딩 ==========
function bindPickerTimer(mode) {
    const totalSec = mode === 'tag' ? getTagTimerTotal() : getGroupTimerTotal();
    const resultPhase = mode === 'tag' ? 'tag-result' : 'group-result';

    const display = document.getElementById('pickerTimerDisplay');
    const pauseIcon = document.getElementById('pickerPauseIcon');
    const playIcon = document.getElementById('pickerPlayIcon');
    const toggleLabel = document.getElementById('pickerToggleLabel');

    function updateToggleIcon(isRunning) {
        if (pauseIcon) pauseIcon.classList.toggle('hidden', !isRunning);
        if (playIcon) playIcon.classList.toggle('hidden', isRunning);
        if (toggleLabel) toggleLabel.textContent = isRunning ? '일시정지' : '재개';
    }

    // 타이머 생성
    pickerTimer = new Timer({
        seconds: totalSec,
        warningAt: 10,
        onTick: (remaining) => {
            if (display) {
                display.textContent = formatTime(remaining);
                display.classList.remove('picker-timer-state-normal', 'picker-timer-state-warning', 'picker-timer-state-danger');
                if (remaining > 30) {
                    display.classList.add('picker-timer-state-normal');
                } else if (remaining > 10) {
                    display.classList.add('picker-timer-state-warning');
                } else {
                    display.classList.add('picker-timer-state-danger');
                }

                if (remaining <= 10 && remaining > 0) {
                    Sound.playBeep();
                }
            }
        },
        onWarning: () => {
            Sound.playWarning();
        },
        onComplete: () => {
            Sound.playEndAlarm();
            // 타이머 종료 → 결과 화면으로 복귀
            destroyPickerTimer();
            currentPhase = resultPhase;
            refreshView();
        },
    });

    // 시작
    pickerTimer.start();
    updateToggleIcon(true);
    Sound.activate();
    Whistle.init();

    // 전체화면 토글
    listen(document.getElementById('pickerFullscreenToggle'), 'click', () => {
        pickerFullscreen = !pickerFullscreen;
        const phase = document.getElementById('pickerTimerPhase');
        phase?.classList.toggle('picker-timer-fullscreen', pickerFullscreen);
        document.body.style.overflow = pickerFullscreen ? 'hidden' : '';
        const label = document.getElementById('pickerFsLabel');
        if (label) label.textContent = pickerFullscreen ? '축소' : '전체화면';
    });

    // 일시정지/재개
    listen(document.getElementById('pickerTimerToggleBtn'), 'click', () => {
        if (!pickerTimer) return;
        pickerTimer.toggle();
        updateToggleIcon(pickerTimer.isRunning);
    });

    // 타이머 종료
    listen(document.getElementById('pickerTimerStopBtn'), 'click', () => {
        destroyPickerTimer();
        currentPhase = resultPhase;
        Sound.playClick();
        refreshView();
    });

    // --- 휘슬 모드 ---
    document.querySelectorAll('.picker-tw-mode-btn').forEach(btn => {
        listen(btn, 'click', () => {
            pickerWhistleMode = btn.dataset.wmode;
            Whistle.setMode(pickerWhistleMode);
            document.querySelectorAll('.picker-tw-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
        });
    });

    // --- 휘슬 버튼 (터치 + 마우스) ---
    const whistleBtn = document.getElementById('pickerWhistleBtn');
    const ring1 = document.getElementById('pickerTwRing1');
    const ring2 = document.getElementById('pickerTwRing2');

    function startRipple() {
        ring1?.classList.add('picker-tw-ring--continuous');
        if (ring2) setTimeout(() => ring2.classList.add('picker-tw-ring--continuous'), 400);
    }

    function stopRipple() {
        ring1?.classList.remove('picker-tw-ring--continuous');
        ring2?.classList.remove('picker-tw-ring--continuous');
    }

    function pulseRipple() {
        [ring1, ring2].forEach((r, i) => {
            if (!r) return;
            r.classList.remove('picker-tw-ring--animate');
            void r.offsetWidth;
            setTimeout(() => r.classList.add('picker-tw-ring--animate'), i * 120);
        });
    }

    async function whistleDown(e) {
        e.preventDefault();
        if (pickerWhistlePressing) return;
        pickerWhistlePressing = true;
        whistleBtn?.classList.add('picker-timer-whistle-btn--pressed');

        if (pickerWhistleMode === 'hold') {
            await Whistle.play('hold');
            startRipple();
        } else {
            await Whistle.play(pickerWhistleMode);
            pulseRipple();
            setTimeout(() => {
                pickerWhistlePressing = false;
                whistleBtn?.classList.remove('picker-timer-whistle-btn--pressed');
            }, 300);
        }
    }

    function whistleUp(e) {
        if (e) e.preventDefault();
        if (!pickerWhistlePressing) return;
        if (pickerWhistleMode === 'hold') {
            pickerWhistlePressing = false;
            whistleBtn?.classList.remove('picker-timer-whistle-btn--pressed');
            Whistle.stop();
            stopRipple();
        }
    }

    if (whistleBtn) {
        listen(whistleBtn, 'touchstart', whistleDown, { passive: false });
        listen(whistleBtn, 'touchend', whistleUp, { passive: false });
        listen(whistleBtn, 'touchcancel', whistleUp, { passive: false });

        listen(whistleBtn, 'mousedown', (e) => {
            if ('ontouchstart' in window) return;
            whistleDown(e);
        });

        const mouseUpHandler = (e) => {
            if ('ontouchstart' in window) return;
            whistleUp(e);
        };
        document.addEventListener('mouseup', mouseUpHandler);
        pickerCleanupFns.push(() => document.removeEventListener('mouseup', mouseUpHandler));
    }

    // visibility / blur 시 휘슬 정지
    const visHandler = () => { if (document.hidden) whistleUp(); };
    const blurHandler = () => whistleUp();
    document.addEventListener('visibilitychange', visHandler);
    window.addEventListener('blur', blurHandler);
    pickerCleanupFns.push(() => {
        document.removeEventListener('visibilitychange', visHandler);
        window.removeEventListener('blur', blurHandler);
    });
}

function destroyPickerTimer() {
    if (pickerTimer) {
        pickerTimer.destroy();
        pickerTimer = null;
    }
    Whistle.stop();
    Sound.stopEndAlarm();
    pickerWhistlePressing = false;
    pickerFullscreen = false;
    document.body.style.overflow = '';
}

// ========== Unmount ==========
export function unmount() {
    destroyPickerTimer();
    pickerCleanupFns.forEach(fn => fn());
    pickerCleanupFns = [];
    currentPhase = 'mode-select';
    currentMode = null;
}
