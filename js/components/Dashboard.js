/**
 * 대시보드 컴포넌트
 * 메인 홈 화면
 */

import { store, PET_TYPES, EMOTION_TYPES } from '../store.js';
import { router } from '../router.js';
import { getPetEmoji, getExpProgress, getGrowthStage } from '../utils/petLogic.js';
import { fadeInCards } from '../utils/animations.js';

export function render() {
    const students = store.getStudents() || [];
    const timetable = store.getTimetable() || {};
    const stats = store.getStats();
    const todayEmotions = store.getTodayEmotions();
    const needAttention = store.getStudentsNeedingAttention();
    const isTeacher = store.isTeacherLoggedIn(); // 교사 세션 확인
    const isGoogleTeacher = store.isGoogleTeacher(); // Google 로그인 여부
    const currentClassId = store.getCurrentClassId();
    const settings = store.getSettings();

    // 오늘 요일 계산
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = new Date();
    const todayDay = dayKeys[today.getDay()];
    const todayDayKr = days[today.getDay()];

    // 오늘의 시간표 가져오기
    const todaySchedule = [];
    for (let i = 1; i <= 6; i++) {
        const cell = timetable[`${todayDay}-${i}`];
        if (cell) {
            todaySchedule.push({ period: i, ...cell });
        }
    }

    // MVP 학생
    const mvpStudent = stats.mvp;

    // 레벨업 임박 학생 (경험치 90% 이상)
    const almostLevelUp = students.filter(s => getExpProgress(s.exp, s.level) >= 90);

    return `
        <div class="space-y-4">
            ${isGoogleTeacher ? `
            <!-- 현재 학급 정보 (Google 로그인 시) -->
            <div class="card bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 py-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-lg">
                            🏫
                        </div>
                        <div>
                            <p class="font-bold text-gray-800">${settings?.className || '학급 이름 없음'}</p>
                            <p class="text-xs text-gray-500">
                                학급코드: <span class="font-mono font-bold text-primary">${settings?.classCode || '------'}</span>
                                <button id="showQrCodeBtn" class="ml-2 text-primary hover:text-primary-dark" title="QR 코드 보기">
                                    📱
                                </button>
                            </p>
                        </div>
                    </div>
                    <button id="switchClassBtn" class="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-primary hover:text-primary transition-colors">
                        학급 전환
                    </button>
                </div>
            </div>

            <!-- QR 코드 모달 -->
            <div id="qrCodeModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">📱 학급 QR 코드</h3>
                    <p class="text-sm text-gray-500 mb-4">${settings?.className || '학급'}</p>
                    <div id="qrCodeContainer" class="flex justify-center mb-4">
                        <!-- QR 코드가 여기에 생성됨 -->
                    </div>
                    <p class="text-lg font-mono font-bold text-primary mb-4">${settings?.classCode || '------'}</p>
                    <p class="text-xs text-gray-400 mb-4">학생들이 이 QR 코드를 스캔하면<br>학급에 참가할 수 있어요!</p>
                    <button id="closeQrModalBtn" class="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors">
                        닫기
                    </button>
                </div>
            </div>
            ` : ''}

            <!-- 오늘의 요약 카드 -->
            <div class="card bg-gradient-to-br from-primary/10 to-success/10 py-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-base">📊</span>
                        <span class="font-semibold text-sm">오늘의 학급</span>
                        <span class="text-xs text-gray-500">${todayDayKr}요일</span>
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                        <span class="flex items-center gap-1"><span class="font-bold text-primary">${stats.totalStudents}</span><span class="text-xs text-gray-500">명</span></span>
                        <span class="flex items-center gap-1"><span class="font-bold text-secondary">${stats.todayPraises}</span><span class="text-xs text-gray-500">칭찬</span></span>
                        <span class="flex items-center gap-1"><span class="font-bold text-success">${stats.todayEmotionChecked}</span><span class="text-xs text-gray-500">감정</span></span>
                    </div>
                </div>
            </div>

            ${mvpStudent ? `
            <!-- 오늘의 MVP -->
            <div class="card bg-gradient-to-r from-warning/20 to-secondary/20">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xl">🏆</span>
                    <h3 class="font-semibold text-secondary-dark">오늘의 MVP</h3>
                </div>
                <div class="flex items-center gap-4 cursor-pointer"
                     onclick="window.classpet.router.navigate('student', { id: ${mvpStudent.id} })">
                    <div class="relative">
                        <span class="text-5xl pet-emoji ${getGrowthStage(mvpStudent.level)}">${getPetEmoji(mvpStudent.petType, mvpStudent.level)}</span>
                        <span class="mvp-badge">👑</span>
                    </div>
                    <div class="flex-1">
                        <div class="font-bold text-lg">${mvpStudent.name}</div>
                        <div class="text-sm text-gray-500">오늘 ${stats.mvpPraiseCount}번 칭찬받았어요!</div>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="level-badge">Lv.${mvpStudent.level}</span>
                            <div class="flex-1 exp-bar">
                                <div class="exp-bar-fill" style="width: ${getExpProgress(mvpStudent.exp, mvpStudent.level)}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- 오늘의 시간표 -->
            <div class="card py-3">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-base">📅</span>
                        <span class="font-semibold text-sm">오늘의 수업</span>
                    </div>
                    <button onclick="window.classpet.router.navigate('timetable')" class="text-xs text-primary font-medium">
                        전체보기 →
                    </button>
                </div>

                ${todaySchedule.length > 0 ? `
                <div class="grid grid-cols-3 gap-2">
                    ${todaySchedule.map(item => `
                    <div class="flex items-center gap-1 bg-cream rounded-lg px-2 py-1">
                        <span class="text-xs text-gray-400">${item.period}</span>
                        <span class="text-sm font-medium">${item.subject}</span>
                    </div>
                    `).join('')}
                </div>
                ` : `
                <div class="text-center text-gray-400 py-2 text-sm">
                    ${todayDay === 'sun' || todayDay === 'sat' ? '🎉 주말이에요!' : '시간표를 입력해주세요'}
                </div>
                `}
            </div>

            <!-- 펫 농장 미리보기 -->
            <div class="card">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="section-title m-0">🐾 우리 반 펫들</h3>
                    <button onclick="window.classpet.router.navigate('petfarm')" class="text-sm text-primary font-medium">
                        전체보기 →
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    ${students.slice(0, 6).map(student => `
                    <div class="flex items-center gap-2 bg-cream rounded-xl px-3 py-2 cursor-pointer hover:bg-cream-dark transition-colors"
                         onclick="window.classpet.router.navigate('student', { id: ${student.id} })">
                        <span class="text-xl">${getPetEmoji(student.petType, student.level)}</span>
                        <span class="text-sm font-medium flex-1 truncate">${student.name}</span>
                        <span class="text-xs text-gray-400">Lv.${student.level}</span>
                    </div>
                    `).join('')}
                </div>

                ${students.length > 6 ? `
                <div class="text-center mt-3 text-sm text-gray-400">
                    +${students.length - 6}명 더 있어요
                </div>
                ` : ''}
            </div>

            ${almostLevelUp.length > 0 ? `
            <!-- 레벨업 임박 -->
            <div class="card bg-gradient-to-r from-success/10 to-primary/10">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xl">⬆️</span>
                    <h3 class="font-semibold text-success">레벨업 임박!</h3>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${almostLevelUp.map(student => `
                    <div class="flex items-center gap-2 bg-white rounded-full px-3 py-1 cursor-pointer hover:bg-gray-50"
                         onclick="window.classpet.router.navigate('student', { id: ${student.id} })">
                        <span class="text-lg">${getPetEmoji(student.petType, student.level)}</span>
                        <span class="text-sm font-medium">${student.name}</span>
                        <span class="text-xs text-gray-400">${getExpProgress(student.exp, student.level)}%</span>
                    </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- 카테고리별 칭찬 통계 -->
            <div class="card py-3">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-base">📈</span>
                    <span class="font-semibold text-sm">칭찬 통계</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                    <span class="flex items-center gap-1 bg-cream rounded-lg px-2 py-1">
                        <span class="text-sm">🎯</span><span class="text-xs text-gray-500">자기관리</span><span class="font-bold text-sm text-primary">${stats.categoryStats.selfManagement || 0}</span>
                    </span>
                    <span class="flex items-center gap-1 bg-cream rounded-lg px-2 py-1">
                        <span class="text-sm">📚</span><span class="text-xs text-gray-500">지식</span><span class="font-bold text-sm text-primary">${stats.categoryStats.knowledge || 0}</span>
                    </span>
                    <span class="flex items-center gap-1 bg-cream rounded-lg px-2 py-1">
                        <span class="text-sm">💡</span><span class="text-xs text-gray-500">창의</span><span class="font-bold text-sm text-primary">${stats.categoryStats.creative || 0}</span>
                    </span>
                    <span class="flex items-center gap-1 bg-cream rounded-lg px-2 py-1">
                        <span class="text-sm">🎨</span><span class="text-xs text-gray-500">심미</span><span class="font-bold text-sm text-primary">${stats.categoryStats.aesthetic || 0}</span>
                    </span>
                    <span class="flex items-center gap-1 bg-cream rounded-lg px-2 py-1">
                        <span class="text-sm">🤝</span><span class="text-xs text-gray-500">협력</span><span class="font-bold text-sm text-primary">${stats.categoryStats.cooperation || 0}</span>
                    </span>
                    <span class="flex items-center gap-1 bg-cream rounded-lg px-2 py-1">
                        <span class="text-sm">🏠</span><span class="text-xs text-gray-500">공동체</span><span class="font-bold text-sm text-primary">${stats.categoryStats.community || 0}</span>
                    </span>
                </div>
            </div>
        </div>
    `;
}

export function afterRender() {
    // 카드 페이드인 애니메이션
    const content = document.getElementById('content');
    fadeInCards(content, '.card');

    // 학급 전환 버튼 (Google 로그인 시)
    const switchClassBtn = document.getElementById('switchClassBtn');
    if (switchClassBtn) {
        switchClassBtn.addEventListener('click', () => {
            router.navigate('class-select');
        });
    }

    // QR 코드 모달
    const showQrCodeBtn = document.getElementById('showQrCodeBtn');
    const qrCodeModal = document.getElementById('qrCodeModal');
    const closeQrModalBtn = document.getElementById('closeQrModalBtn');
    const qrCodeContainer = document.getElementById('qrCodeContainer');

    if (showQrCodeBtn && qrCodeModal) {
        showQrCodeBtn.addEventListener('click', () => {
            qrCodeModal.classList.remove('hidden');

            // QR 코드 생성
            const settings = store.getSettings();
            const classCode = settings?.classCode;
            if (classCode && qrCodeContainer) {
                qrCodeContainer.innerHTML = ''; // 기존 QR 코드 제거

                // QR 코드에 담을 URL (학급 참가 링크)
                const joinUrl = `${window.location.origin}${window.location.pathname}#student-login?code=${classCode}`;

                // QRCode 라이브러리 사용
                if (typeof QRCode !== 'undefined') {
                    QRCode.toCanvas(joinUrl, {
                        width: 200,
                        margin: 2,
                        color: {
                            dark: '#6366f1',  // primary 색상
                            light: '#ffffff'
                        }
                    }, (error, canvas) => {
                        if (error) {
                            console.error('QR 코드 생성 실패:', error);
                            qrCodeContainer.innerHTML = '<p class="text-red-500 text-sm">QR 코드 생성 실패</p>';
                        } else {
                            canvas.style.borderRadius = '12px';
                            qrCodeContainer.appendChild(canvas);
                        }
                    });
                } else {
                    qrCodeContainer.innerHTML = '<p class="text-gray-500 text-sm">QR 코드 라이브러리를 불러올 수 없습니다</p>';
                }
            }
        });

        // 모달 닫기
        if (closeQrModalBtn) {
            closeQrModalBtn.addEventListener('click', () => {
                qrCodeModal.classList.add('hidden');
            });
        }

        // 배경 클릭으로 닫기
        qrCodeModal.addEventListener('click', (e) => {
            if (e.target === qrCodeModal) {
                qrCodeModal.classList.add('hidden');
            }
        });
    }
}
