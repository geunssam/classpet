/**
 * 통계 컴포넌트
 * 학급 전체 통계 및 데이터 관리
 */

import { store, PET_TYPES } from '../store.js';
import { PRAISE_CATEGORIES } from '../constants/index.js';
import { getPetEmoji, calculateRank, getRankTier, getGrowthStage } from '../utils/petLogic.js';
import { showToast, setModalContent, openModal, closeModal, showLoading, hideLoading } from '../utils/animations.js';
const DEFAULT_CAT_ORDER = Object.keys(PRAISE_CATEGORIES);

export function render() {
    const students = store.getStudents() || [];
    const stats = store.getStats();
    const settings = store.getSettings();

    // 레벨 분포
    const levelGroups = {
        '1-3': students.filter(s => s.level >= 1 && s.level <= 3).length,
        '4-6': students.filter(s => s.level >= 4 && s.level <= 6).length,
        '7-9': students.filter(s => s.level >= 7 && s.level <= 9).length,
        '10+': students.filter(s => s.level >= 10).length
    };

    // 전체 학생 레벨순 정렬
    const rankedStudents = [...students]
        .sort((a, b) => b.level - a.level || (b.exp || 0) - (a.exp || 0));

    return `
        <div class="space-y-4">
            <!-- 헤더 -->
            <div class="pb-2">
                <h2 class="text-xl font-bold">📊 통계</h2>
            </div>

            <!-- 전체 통계 -->
            <div class="grid grid-cols-3 gap-2">
                <div class="stat-summary-card stat-students">
                    <div class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                    <div class="stat-value">${stats.totalStudents}</div>
                    <div class="stat-label">학생</div>
                </div>
                <div class="stat-summary-card stat-praises">
                    <div class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
                    <div class="stat-value">${stats.totalPraises}</div>
                    <div class="stat-label">누적 칭찬</div>
                </div>
                <div class="stat-summary-card stat-level">
                    <div class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></div>
                    <div class="stat-value">${isNaN(stats.averageLevel) ? 0 : stats.averageLevel}</div>
                    <div class="stat-label">평균 레벨</div>
                </div>
            </div>

            <!-- 상위 랭킹 -->
            <div class="card">
                <h3 class="section-title">🏆 레벨 랭킹</h3>
                ${rankedStudents.length > 0 ? `
                <!-- 칼럼 헤더 -->
                <div class="ranking-header">
                    <span class="ranking-col-rank">순위</span>
                    <span class="ranking-col-emoji">펫</span>
                    <span class="ranking-col-number">번호</span>
                    <span class="ranking-col-name">이름</span>
                    <span class="ranking-col-praise">칭찬</span>
                    <span class="ranking-col-level">레벨</span>
                    <span class="ranking-col-exp">경험치</span>
                </div>
                <div class="space-y-2" style="max-height: 310px; overflow-y: auto; overflow-x: hidden;">
                    ${rankedStudents.map((student, index) => {
                        const medals = ['🥇', '🥈', '🥉'];
                        return `
                        <div class="ranking-card" onclick="window.classpet.router.navigate('student', { id: '${student.id}' })">
                            <span class="ranking-col-rank text-xl">${index < 3 ? medals[index] : (index + 1)}</span>
                            <span class="ranking-col-emoji text-xl">${getPetEmoji(student.petType, student.level)}</span>
                            <span class="ranking-col-number">${student.number}</span>
                            <span class="ranking-col-name">${student.name}</span>
                            <span class="ranking-col-praise">${store.getPraisesByStudent(student.id).length}</span>
                            <span class="ranking-col-level">Lv.${student.level || 1}</span>
                            <span class="ranking-col-exp">${student.exp || 0}</span>
                        </div>
                        `;
                    }).join('')}
                </div>
                ` : `
                <div class="text-center text-gray-400 py-4">학생이 없습니다</div>
                `}
            </div>

            <!-- 칭찬 통계 -->
            <div class="card">
                <h3 class="section-title">📈 칭찬 통계</h3>
                <div class="grid grid-cols-4 gap-1">
                    ${Object.entries(store.getPraiseCategories()).sort(([a], [b]) => {
                        const ai = DEFAULT_CAT_ORDER.indexOf(a);
                        const bi = DEFAULT_CAT_ORDER.indexOf(b);
                        if (ai !== -1 && bi !== -1) return ai - bi;
                        if (ai !== -1) return -1;
                        if (bi !== -1) return 1;
                        return 0;
                    }).map(([key, cat]) => `
                    <span class="flex items-center bg-cream rounded-lg px-1 py-1.5">
                        <span class="flex-1 text-center text-xl">${cat.icon}</span>
                        <span class="flex-1 text-center text-sm font-bold text-gray-800">${cat.name}</span>
                        <span class="flex-1 text-center font-extrabold text-sm text-gray-800">${stats.categoryStats[key] || 0}</span>
                    </span>
                    `).join('')}
                </div>
            </div>

        </div>
    `;
}

export function afterRender() {
    // Stats 페이지에서는 특별한 afterRender 불필요
}

/**
 * 설정 모달
 */
export function showSettings() {
    const settings = store.getSettings();

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">⚙️ 설정</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">학급명</label>
                <input type="text" id="className" value="${settings.className}" class="w-full" placeholder="예: 4학년 2반">
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">선생님 이름</label>
                <input type="text" id="teacherName" value="${settings.teacherName}" class="w-full" placeholder="예: 홍길동">
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-sm font-medium text-gray-700 mb-1 block">학년도</label>
                    <input type="number" id="schoolYear" value="${settings.schoolYear}" class="w-full" min="2020" max="2030">
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-700 mb-1 block">학기</label>
                    <select id="semester" class="w-full">
                        <option value="1" ${settings.semester === 1 ? 'selected' : ''}>1학기</option>
                        <option value="2" ${settings.semester === 2 ? 'selected' : ''}>2학기</option>
                    </select>
                </div>
            </div>

            <button id="saveSettingsBtn" class="btn btn-primary w-full">
                저장하기
            </button>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        const newSettings = {
            className: document.getElementById('className').value || '우리 반',
            teacherName: document.getElementById('teacherName').value || '담임선생님',
            schoolYear: parseInt(document.getElementById('schoolYear').value) || 2025,
            semester: parseInt(document.getElementById('semester').value) || 1,
            initialized: true
        };

        store.saveSettings(newSettings);
        showToast('설정이 저장되었습니다', 'success');
        closeModal();

        // 헤더 업데이트
        const classInfoEl = document.getElementById('classInfo');
        if (classInfoEl) {
            classInfoEl.textContent = `${newSettings.className} · ${newSettings.teacherName}`;
        }
    });
}

/**
 * 데이터 내보내기
 */
export function exportData() {
    const data = store.exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `classpet_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('데이터를 내보냈습니다', 'success');
}

/**
 * 데이터 가져오기
 */
export function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                store.importData(data);
                showToast('데이터를 가져왔습니다', 'success');
                window.classpet.refreshCurrentView();
            } catch (error) {
                showToast('파일을 읽을 수 없습니다', 'error');
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

/**
 * 초기화 확인
 */
export function showResetConfirm() {
    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-danger">⚠️ 데이터 초기화</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="text-center py-4">
                <div class="text-4xl mb-4">🗑️</div>
                <p class="text-gray-600">모든 데이터가 삭제됩니다.</p>
                <p class="text-gray-600">이 작업은 되돌릴 수 없습니다.</p>
            </div>

            <div class="flex gap-2">
                <button onclick="window.classpet.closeModal()" class="btn btn-secondary flex-1">
                    취소
                </button>
                <button id="confirmResetBtn" class="btn btn-danger flex-1">
                    초기화
                </button>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    document.getElementById('confirmResetBtn').addEventListener('click', () => {
        store.clearAllData();
        showToast('모든 데이터가 초기화되었습니다', 'info');
        closeModal();
        window.location.reload();
    });
}
