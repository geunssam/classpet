/**
 * 대시보드 컴포넌트
 * 메인 홈 화면
 */

import { store, PET_TYPES, EMOTION_TYPES } from '../../store.js';
import { PRAISE_CATEGORIES } from '../../shared/constants/index.js';
import { router } from '../../router.js';
import { getPetEmoji, getPetImageHTML, getExpProgress, getGrowthStage } from '../../shared/utils/petLogic.js';
import { fadeInCards, showToast } from '../../shared/utils/animations.js';
import { showQuickPraise } from '../praise/QuickPraise.js';
const DEFAULT_CAT_ORDER = Object.keys(PRAISE_CATEGORIES);

// HEX → RGBA 변환 (투명도 적용)
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
            <!-- 현재 학급 정보 -->
            <div class="card border border-gray-100" style="background: #ffffff !important; padding-top: 4px; padding-bottom: 4px;">
                <div class="flex items-center">
                    <!-- 서브타이틀 (좌측 고정, section-title 크기) -->
                    <h3 class="section-title m-0 flex-shrink-0 px-2 flex items-center gap-1.5" style="white-space:nowrap; position:relative; top:3px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/><line x1="10" y1="11" x2="14" y2="11"/></svg>학급 정보</h3>
                    <!-- 나머지 3항목: 3등분 그리드 -->
                    <div class="flex-1 grid grid-cols-3 items-center text-center ml-4">
                        <!-- 학급명 -->
                        <div>
                            <p class="text-sm font-semibold text-gray-600 mb-0.5">학급명</p>
                            <div class="flex items-center justify-center gap-1">
                                <p class="font-bold text-gray-800 truncate">${settings?.className || '미설정'}</p>
                                ${isGoogleTeacher ? `<button id="switchClassBtn" class="liquid-btn-small" style="font-size:11px; padding:1px 6px;">전환</button>` : ''}
                                <button id="goStudentPageBtn" class="liquid-btn-small" style="font-size:11px; padding:1px 6px;" title="학생 페이지 미리보기">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-1px; margin-right:2px;">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                        <polyline points="15 3 21 3 21 9"/>
                                        <line x1="10" y1="14" x2="21" y2="3"/>
                                    </svg>학생
                                </button>
                            </div>
                        </div>
                        <!-- 학급코드 -->
                        <div>
                            <p class="text-sm font-semibold text-gray-600 mb-0.5">학급코드</p>
                            <div class="flex items-center justify-center gap-1">
                                <span class="font-mono font-bold text-primary">${settings?.classCode || '------'}</span>
                                ${settings?.classCode ? `<button id="dashboardCodeCopyBtn" class="mobile-code-copy-btn" title="학급코드 복사" style="display:inline-flex; color:#9ca3af;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                    </svg>
                                </button>` : ''}
                            </div>
                        </div>
                        <!-- QR 코드 -->
                        <div>
                            <p class="text-sm font-semibold text-gray-600 mb-0.5">QR코드</p>
                            <div id="qrCodeContainer" class="w-10 h-10 mx-auto bg-white rounded-lg p-0.5 shadow-sm flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow" title="클릭하면 크게 보기"></div>
                        </div>
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

            <!-- 오늘의 한마디 -->
            <div class="card border border-gray-100" style="background: #ffffff !important; padding-top: 4px; padding-bottom: 8px;">
                <h3 class="section-title m-0 mb-2 flex items-center gap-1.5 px-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>오늘의 한마디</h3>
                <div class="flex items-center gap-2 px-2">
                    <input type="text" id="dailyMessageInput" class="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50" placeholder="학생에게 보여줄 한마디를 입력하세요" value="${store.getDailyMessage() || ''}" maxlength="60" />
                    <button id="dailyMessageSaveBtn" class="liquid-btn-small">저장</button>
                    <button id="dailyMessageClearBtn" class="liquid-btn-small" style="background: #f3f4f6; color: #6b7280;">지우기</button>
                </div>
                <p class="text-xs text-gray-400 mt-1 px-2">비어있으면 랜덤 명언이 학생에게 표시됩니다</p>
            </div>

            <!-- 오늘의 요약 카드 -->
            <div class="card border border-gray-100" style="background: #ffffff !important; padding-top: 4px; padding-bottom: 4px;">
                <div class="flex items-center">
                    <h3 class="section-title m-0 flex-shrink-0 px-2 flex items-center gap-1.5" style="white-space:nowrap;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>오늘의 학급</h3>
                    <div class="flex-1 grid grid-cols-4 items-center text-center ml-4">
                        <div>
                            <p class="text-sm font-semibold text-gray-800 mb-0.5">${today.getMonth() + 1}월 ${today.getDate()}일</p>
                            <p class="font-bold text-gray-800">${todayDayKr}요일</p>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-600 mb-0.5">인원</p>
                            <p class="font-bold text-primary">${stats.totalStudents}<span class="text-xs font-semibold text-gray-400 ml-0.5">명</span></p>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-600 mb-0.5">칭찬</p>
                            <p class="font-bold text-secondary">${stats.todayPraises}<span class="text-xs font-semibold text-gray-400 ml-0.5">건</span></p>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-600 mb-0.5">감정</p>
                            <p class="font-bold text-success">${stats.todayEmotionChecked}<span class="text-xs font-semibold text-gray-400 ml-0.5">명</span></p>
                        </div>
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
                        ${getPetImageHTML(mvpStudent.petType, mvpStudent.level, 'lg')}
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
            <div class="card py-2">
                <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                        <span class="section-title m-0 flex items-center gap-1.5"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>오늘의 수업</span>
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
                                 style="background-color: ${hexToRgba(colors.bg, 0.45)};">
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
            <div class="card border border-gray-100 py-2" style="background: #ffffff !important;">
                <div class="flex items-center justify-between mb-1">
                    <h3 class="section-title m-0 flex items-center gap-1.5"><svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af" stroke="none" style="display:block;flex-shrink:0"><ellipse cx="8.5" cy="6.5" rx="2.2" ry="3"/><ellipse cx="15.5" cy="6.5" rx="2.2" ry="3"/><ellipse cx="4.5" cy="13" rx="2" ry="2.5"/><ellipse cx="19.5" cy="13" rx="2" ry="2.5"/><path d="M12 20c-3 0-5.5-2.5-5.5-5 0-1.5 1-3 2.5-3.5 1-.5 2-.5 3-.5s2 0 3 .5c1.5.5 2.5 2 2.5 3.5 0 2.5-2.5 5-5.5 5z"/></svg>우리 반 펫들</h3>
                    <button onclick="window.classpet.router.navigate('petfarm')" class="liquid-btn-small">
                        전체보기
                    </button>
                </div>

                <div class="dash-pill-grid" style="max-height: 100px; overflow-y: auto; overflow-x: hidden;">
                    ${students.map(student => `
                    <div class="dash-pill-item cursor-pointer"
                         onclick="window.classpet.router.navigate('student', { id: '${student.id}' })">
                        <span class="dash-pill-icon">${getPetImageHTML(student.petType, student.level || 1, 'xs')}</span>
                        <span class="dash-pill-label">${student.name}</span>
                        <span class="dash-pill-level">Lv.${student.level || 1}</span>
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
                        ${getPetImageHTML(student.petType, student.level, 'xs')}
                        <span class="text-sm font-medium">${student.name}</span>
                        <span class="text-xs text-gray-400">${getExpProgress(student.exp, student.level)}%</span>
                    </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- 카테고리별 칭찬 통계 -->
            <div class="card border border-gray-100 py-2" style="background: #ffffff !important;">
                <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                        <span class="section-title m-0 flex items-center gap-1.5"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>칭찬 통계</span>
                    </div>
                    <button id="dashboardPraiseBtn" class="liquid-btn-small">
                        칭찬하기
                    </button>
                </div>
                <div class="dash-pill-grid">
                    ${Object.entries(store.getPraiseCategories()).sort(([a], [b]) => {
                        const ai = DEFAULT_CAT_ORDER.indexOf(a);
                        const bi = DEFAULT_CAT_ORDER.indexOf(b);
                        if (ai !== -1 && bi !== -1) return ai - bi;
                        if (ai !== -1) return -1;
                        if (bi !== -1) return 1;
                        return 0;
                    }).map(([key, cat]) => `
                    <div class="dash-pill-item">
                        <span class="dash-pill-icon">${cat.icon}</span>
                        <span class="dash-pill-label">${cat.name}</span>
                        <span class="dash-pill-count">${stats.categoryStats[key] || 0}</span>
                    </div>
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

    // 학생 페이지 바로가기 버튼
    const goStudentPageBtn = document.getElementById('goStudentPageBtn');
    if (goStudentPageBtn) {
        goStudentPageBtn.addEventListener('click', () => {
            const classCode = store.getClassCode();
            if (classCode) {
                window.open(`${location.origin}${location.pathname}?code=${classCode}#student-login`, '_blank');
            } else {
                window.open(`${location.origin}${location.pathname}#student-login`, '_blank');
            }
        });
    }

    // 오늘의 한마디 저장/지우기
    const dailyMsgInput = document.getElementById('dailyMessageInput');
    const dailyMsgSaveBtn = document.getElementById('dailyMessageSaveBtn');
    const dailyMsgClearBtn = document.getElementById('dailyMessageClearBtn');

    if (dailyMsgSaveBtn && dailyMsgInput) {
        dailyMsgSaveBtn.addEventListener('click', async () => {
            const text = dailyMsgInput.value.trim();
            if (!text) {
                showToast('한마디를 입력해주세요', 'warning');
                return;
            }
            const ok = await store.setDailyMessage(text);
            if (ok) showToast('한마디가 저장되었어요', 'success');
            else showToast('저장에 실패했어요', 'error');
        });
    }

    if (dailyMsgClearBtn && dailyMsgInput) {
        dailyMsgClearBtn.addEventListener('click', async () => {
            const ok = await store.setDailyMessage('');
            if (ok) {
                dailyMsgInput.value = '';
                showToast('한마디가 삭제되었어요', 'info');
            } else {
                showToast('삭제에 실패했어요', 'error');
            }
        });
    }

    // 학급코드 복사 버튼
    const codeCopyBtn = document.getElementById('dashboardCodeCopyBtn');
    if (codeCopyBtn) {
        const classCode = store.getSettings()?.classCode;
        codeCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(classCode).then(() => {
                showToast('학급코드가 복사되었어요', 'success');
            }).catch(() => {});
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
