/**
 * 통계 컴포넌트
 * 학급 전체 통계 및 데이터 관리
 */

import { store, PET_TYPES, PRAISE_CATEGORIES } from '../store.js';
import { getPetEmoji, calculateRank, getRankTier, getGrowthStage } from '../utils/petLogic.js';
import { showToast, setModalContent, openModal, closeModal, showLoading, hideLoading } from '../utils/animations.js';

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
            <div class="py-2">
                <h2 class="text-lg font-bold">📊 통계</h2>
            </div>

            <!-- 전체 통계 -->
            <div class="grid grid-cols-4 gap-2">
                <div class="flex flex-col items-center py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <span class="text-lg">👥</span>
                    <span class="text-xl font-bold text-indigo-600">${stats.totalStudents}</span>
                    <span class="text-xs text-gray-500">학생</span>
                </div>
                <div class="flex flex-col items-center py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span class="text-lg">⭐</span>
                    <span class="text-xl font-bold text-amber-600">${stats.totalPraises}</span>
                    <span class="text-xs text-gray-500">누적</span>
                </div>
                <div class="flex flex-col items-center py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span class="text-lg">📈</span>
                    <span class="text-xl font-bold text-emerald-600">${isNaN(stats.averageLevel) ? 0 : stats.averageLevel}</span>
                    <span class="text-xs text-gray-500">평균Lv</span>
                </div>
                <div class="flex flex-col items-center py-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <span class="text-lg">📅</span>
                    <span class="text-xl font-bold text-rose-600">${stats.todayPraises}</span>
                    <span class="text-xs text-gray-500">오늘</span>
                </div>
            </div>

            <!-- 상위 랭킹 -->
            <div class="card">
                <h3 class="section-title">🏆 레벨 랭킹</h3>
                ${rankedStudents.length > 0 ? `
                <div class="space-y-2 max-h-[280px] overflow-y-auto">
                    ${rankedStudents.map((student, index) => {
                        const rankTier = getRankTier(index + 1, students.length);
                        const medals = ['🥇', '🥈', '🥉'];
                        return `
                        <div class="list-item" onclick="window.classpet.router.navigate('student', { id: ${student.id} })">
                            <div class="w-8 text-center text-lg">
                                ${index < 3 ? medals[index] : `${index + 1}`}
                            </div>
                            <span class="text-2xl">${getPetEmoji(student.petType, student.level)}</span>
                            <div class="flex-1 min-w-0 ml-2">
                                <div class="font-medium">${student.name}</div>
                                <div class="text-xs text-gray-400">Lv.${student.level || 1} · EXP ${student.exp || 0}</div>
                            </div>
                            <span class="text-xs px-2 py-0.5 rounded-full" style="background-color: ${rankTier.color}20; color: ${rankTier.color}">
                                ${rankTier.tier}
                            </span>
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
                <div class="grid grid-cols-3 gap-2">
                    <span class="flex items-center justify-between bg-cream rounded-lg px-2 py-1">
                        <span class="flex items-center gap-1">
                            <span class="text-sm">🎯</span><span class="text-xs font-bold text-gray-800">자기관리</span>
                        </span>
                        <span class="font-bold text-sm text-gray-800">${stats.categoryStats.selfManagement || 0}</span>
                    </span>
                    <span class="flex items-center justify-between bg-cream rounded-lg px-2 py-1">
                        <span class="flex items-center gap-1">
                            <span class="text-sm">📚</span><span class="text-xs font-bold text-gray-800">지식정보</span>
                        </span>
                        <span class="font-bold text-sm text-gray-800">${stats.categoryStats.knowledge || 0}</span>
                    </span>
                    <span class="flex items-center justify-between bg-cream rounded-lg px-2 py-1">
                        <span class="flex items-center gap-1">
                            <span class="text-sm">💡</span><span class="text-xs font-bold text-gray-800">창의적사고</span>
                        </span>
                        <span class="font-bold text-sm text-gray-800">${stats.categoryStats.creative || 0}</span>
                    </span>
                    <span class="flex items-center justify-between bg-cream rounded-lg px-2 py-1">
                        <span class="flex items-center gap-1">
                            <span class="text-sm">🎨</span><span class="text-xs font-bold text-gray-800">심미적감성</span>
                        </span>
                        <span class="font-bold text-sm text-gray-800">${stats.categoryStats.aesthetic || 0}</span>
                    </span>
                    <span class="flex items-center justify-between bg-cream rounded-lg px-2 py-1">
                        <span class="flex items-center gap-1">
                            <span class="text-sm">🤝</span><span class="text-xs font-bold text-gray-800">협력적소통</span>
                        </span>
                        <span class="font-bold text-sm text-gray-800">${stats.categoryStats.cooperation || 0}</span>
                    </span>
                    <span class="flex items-center justify-between bg-cream rounded-lg px-2 py-1">
                        <span class="flex items-center gap-1">
                            <span class="text-sm">🏠</span><span class="text-xs font-bold text-gray-800">공동체</span>
                        </span>
                        <span class="font-bold text-sm text-gray-800">${stats.categoryStats.community || 0}</span>
                    </span>
                </div>
            </div>

        </div>
    `;
}

export function afterRender() {
    // 특별한 이벤트 바인딩 없음
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
