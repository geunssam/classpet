/**
 * 대시보드 컴포넌트
 * 메인 홈 화면
 */

import { store, PET_TYPES, EMOTION_TYPES } from '../store.js';
import { PRAISE_CATEGORIES } from '../constants/index.js';
import { router } from '../router.js';
import { getPetEmoji, getExpProgress, getGrowthStage } from '../utils/petLogic.js';
import { fadeInCards } from '../utils/animations.js';
import { showQuickPraise } from './QuickPraise.js';

const DEFAULT_CAT_ORDER = Object.keys(PRAISE_CATEGORIES);

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
            <!-- 현재 학급 정보 + QR 코드 -->
            <div class="card border border-gray-100 py-3" style="background: #ffffff !important;">
                <div class="flex items-center justify-between gap-4">
                    <!-- 좌측: 학급 정보 (2행 구조) -->
                    <div class="flex flex-col gap-1 min-w-0">
                        <!-- 1열: 학급명 + 전환버튼 -->
                        <div class="flex items-center gap-2">
                            <span class="text-lg">🏫</span>
                            <p class="font-bold text-gray-800 text-lg truncate">${settings?.className || '학급 이름 없음'}</p>
                            ${isGoogleTeacher ? `
                            <span class="text-gray-300 text-lg">|</span>
                            <button id="switchClassBtn" class="liquid-btn-small">
                                전환
                            </button>
                            ` : ''}
                        </div>
                        <!-- 2열: 학급코드 -->
                        <p class="text-lg text-sky-500">
                            학급코드: <span class="font-mono font-bold text-primary">${settings?.classCode || '------'}</span>
                        </p>
                    </div>
                    <!-- 우측: QR 코드 (클릭하면 전체화면) -->
                    <div id="qrCodeContainer" class="w-14 h-14 bg-white rounded-lg p-0.5 shadow-sm flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow flex-shrink-0" title="클릭하면 크게 보기">
                        <!-- QR 코드가 여기에 생성됨 -->
                    </div>
                </div>
            </div>

            <!-- QR 코드 전체화면 모달 (칠판용) -->
            <div id="qrFullscreenModal" class="hidden fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center cursor-pointer">
                <div class="text-center">
                    <p class="text-2xl font-bold text-gray-800 mb-2">${settings?.className || '학급'}</p>
                    <p class="text-gray-500 mb-6">아래 QR 코드를 스캔하여 참가하세요</p>
                    <div id="qrCodeLarge" class="inline-block bg-white p-4 rounded-2xl shadow-lg mb-6">
                        <!-- 큰 QR 코드 -->
                    </div>
                    <p class="text-4xl font-mono font-bold text-primary mb-4">${settings?.classCode || '------'}</p>
                    <p class="text-gray-400 text-sm">화면을 클릭하면 닫힙니다</p>
                </div>
            </div>

            <!-- 오늘의 요약 카드 -->
            <div class="card bg-gradient-to-br from-primary/10 to-success/10 py-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">📊</span>
                        <span class="font-semibold text-base">오늘의 학급</span>
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
                        <span class="text-lg">📅</span>
                        <span class="font-semibold text-base">오늘의 수업</span>
                    </div>
                    <button onclick="window.classpet.router.navigate('timetable')" class="liquid-btn-small">
                        전체보기
                    </button>
                </div>

                ${todaySchedule.length > 0 ? `
                <div class="grid grid-cols-3 gap-2">
                    ${(() => {
                        const subjectColors = store.getSubjectColors();
                        return todaySchedule.map(item => {
                            const colors = subjectColors[item.subject] || { bg: '#F3F4F6', text: '#4B5563' };
                            return `
                            <div class="flex items-center rounded-xl px-3 py-2"
                                 style="background-color: ${colors.bg};">
                                <span class="text-lg font-bold w-6 text-left" style="color: ${colors.text};">${item.period}</span>
                                <span class="flex-1 text-sm font-semibold text-center" style="color: ${colors.text};">${item.subject}</span>
                            </div>
                            `;
                        }).join('');
                    })()}
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
                    <button onclick="window.classpet.router.navigate('petfarm')" class="liquid-btn-small">
                        전체보기
                    </button>
                </div>

                <div class="grid grid-cols-4 gap-1" style="max-height: 95px; overflow-y: auto; overflow-x: hidden;">
                    ${students.map(student => `
                    <div class="flex items-center bg-cream rounded-lg px-1 py-1.5 cursor-pointer hover:bg-cream-dark transition-colors"
                         onclick="window.classpet.router.navigate('student', { id: '${student.id}' })">
                        <span class="flex-1 text-center text-2xl">${getPetEmoji(student.petType, student.level || 1)}</span>
                        <span class="flex-1 text-center text-sm font-semibold truncate">${student.name}</span>
                        <span class="flex-1 text-center text-sm text-gray-400">Lv.${student.level || 1}</span>
                    </div>
                    `).join('')}
                </div>
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
                         onclick="window.classpet.router.navigate('student', { id: '${student.id}' })">
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
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">📈</span>
                        <span class="font-semibold text-base">칭찬 통계</span>
                    </div>
                    <button id="dashboardPraiseBtn" class="liquid-btn-small">
                        칭찬하기
                    </button>
                </div>
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
    // 카드 페이드인 애니메이션
    const content = document.getElementById('content');
    fadeInCards(content, '.card');

    // 빠른 칭찬 버튼
    const dashboardPraiseBtn = document.getElementById('dashboardPraiseBtn');
    if (dashboardPraiseBtn) {
        dashboardPraiseBtn.addEventListener('click', showQuickPraise);
    }

    // 학급 전환 버튼 (Google 로그인 시)
    const switchClassBtn = document.getElementById('switchClassBtn');
    if (switchClassBtn) {
        switchClassBtn.addEventListener('click', () => {
            router.navigate('class-select');
        });
    }

    // QR 코드 생성 및 전체화면 모달
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const qrCodeLarge = document.getElementById('qrCodeLarge');
    const qrFullscreenModal = document.getElementById('qrFullscreenModal');

    if (qrCodeContainer) {
        const settings = store.getSettings();
        const classCode = settings?.classCode;

        if (classCode) {
            // QR 코드에 담을 URL (학급 참가 링크)
            const joinUrl = `https://classpet.netlify.app/#student-login?code=${classCode}`;

            // QR 라이브러리 로드 후 QR 코드 생성
            const generateQRCodes = async () => {
                // loadQRLibrary가 있으면 호출하여 라이브러리 로드
                if (typeof window.loadQRLibrary === 'function') {
                    await window.loadQRLibrary();
                }

                // QRCode 라이브러리 사용 (qrcodejs)
                if (typeof QRCode !== 'undefined') {
                    try {
                        // 기존 QR 코드 제거 (중복 방지)
                        qrCodeContainer.innerHTML = '';

                        // 작은 QR 코드 (카드용)
                        new QRCode(qrCodeContainer, {
                            text: joinUrl,
                            width: 52,
                            height: 52,
                            colorDark: '#6366f1',
                            colorLight: '#ffffff',
                            correctLevel: QRCode.CorrectLevel.M
                        });

                        // 큰 QR 코드 (전체화면용)
                        if (qrCodeLarge) {
                            qrCodeLarge.innerHTML = '';
                            new QRCode(qrCodeLarge, {
                                text: joinUrl,
                                width: 280,
                                height: 280,
                                colorDark: '#6366f1',
                                colorLight: '#ffffff',
                                correctLevel: QRCode.CorrectLevel.M
                            });
                        }
                    } catch (error) {
                        console.error('QR 코드 생성 실패:', error);
                        qrCodeContainer.innerHTML = '<span class="text-xl">📱</span>';
                    }
                } else {
                    qrCodeContainer.innerHTML = '<span class="text-xl">📱</span>';
                }
            };

            // QR 코드 생성 실행
            generateQRCodes();

            // QR 코드 클릭 → 전체화면 모달 열기
            qrCodeContainer.addEventListener('click', () => {
                if (qrFullscreenModal) {
                    qrFullscreenModal.classList.remove('hidden');
                }
            });

            // 전체화면 모달 클릭 → 닫기
            if (qrFullscreenModal) {
                qrFullscreenModal.addEventListener('click', () => {
                    qrFullscreenModal.classList.add('hidden');
                });
            }
        }
    }
}
