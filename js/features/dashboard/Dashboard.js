/**
 * 대시보드 컴포넌트
 * 메인 홈 화면
 */

import { store, PET_TYPES, EMOTION_TYPES } from '../../store.js';
import { PRAISE_CATEGORIES } from '../../shared/constants/index.js';
import { EMOTION_CATEGORIES } from '../emotion/emotions.constants.js';
import { router } from '../../router.js';
import { getPetEmoji, getPetImageHTML, getExpProgress, getGrowthStage } from '../../shared/utils/petLogic.js';
import { getEmotionInfo, mapLegacyEmotion } from '../../shared/utils/emotionHelpers.js';
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

    // 감정 세부(12종) 분포 계산
    const emotionDist = {};
    const studentEmotionMap = {};
    todayEmotions.forEach(e => {
        const key = mapLegacyEmotion(e.emotion);
        emotionDist[key] = (emotionDist[key] || 0) + 1;
        studentEmotionMap[e.studentId] = key;
    });
    const unsent = Math.max(0, students.length - todayEmotions.length);
    // 0이 아닌 감정만 추출 + 미전송
    const emotionEntries = Object.entries(emotionDist)
        .map(([key, count]) => ({ key, count, info: getEmotionInfo(key) }))
        .filter(e => e.info)
        .sort((a, b) => b.count - a.count);
    const emotionTotal = emotionEntries.reduce((s, e) => s + e.count, 0) + unsent;
    // 파이차트 conic-gradient (세부 감정별 색상)
    let emoDegAcc = 0;
    const emoGradParts = [];
    emotionEntries.forEach(e => {
        const start = emoDegAcc;
        emoDegAcc += emotionTotal > 0 ? (e.count / emotionTotal) * 360 : 0;
        emoGradParts.push(`${e.info.color} ${start}deg ${emoDegAcc}deg`);
    });
    if (unsent > 0) {
        emoGradParts.push(`#e5e7eb ${emoDegAcc}deg 360deg`);
    }
    const pieGradient = emotionTotal > 0
        ? `conic-gradient(${emoGradParts.join(', ')})`
        : `conic-gradient(#e5e7eb 0deg 360deg)`;

    // 칭찬 카테고리별 분포 계산 (파이차트용)
    const praiseCategories = store.getPraiseCategories();
    const praiseCatEntries = Object.entries(praiseCategories).sort(([a], [b]) => {
        const ai = DEFAULT_CAT_ORDER.indexOf(a);
        const bi = DEFAULT_CAT_ORDER.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return 0;
    });
    const FALLBACK_COLORS = ['#fbbf24', '#60a5fa', '#a78bfa', '#34d399', '#f87171', '#fb923c', '#e879f9', '#38bdf8'];
    const getCatColor = (cat, i) => cat.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
    const praiseTotal = praiseCatEntries.reduce((sum, [key]) => sum + (stats.categoryStats[key] || 0), 0);
    const praisePieDeg = (v) => praiseTotal > 0 ? (v / praiseTotal) * 360 : 0;
    let praiseDegAcc = 0;
    const praiseGradientParts = [];
    praiseCatEntries.forEach(([key, cat], i) => {
        const count = stats.categoryStats[key] || 0;
        const color = getCatColor(cat, i);
        const start = praiseDegAcc;
        praiseDegAcc += praisePieDeg(count);
        praiseGradientParts.push(`${color} ${start}deg ${praiseDegAcc}deg`);
    });
    const praiseGradient = praiseTotal > 0
        ? `conic-gradient(${praiseGradientParts.join(', ')})`
        : `conic-gradient(#e5e7eb 0deg 360deg)`;

    // SVG 도넛 공통 설정 (viewBox 100x100, center 50, radius 34, stroke 16 → 바깥끝 50)
    const svgR = 34, svgC = 50, svgStroke = 16;
    const svgCircum = 2 * Math.PI * svgR;

    // 칭찬 SVG 도넛
    let svgOffset = 0;
    const praiseSvgSegments = praiseCatEntries.map(([key, cat], i) => {
        const count = stats.categoryStats[key] || 0;
        const pct = praiseTotal > 0 ? count / praiseTotal : 0;
        const dashLen = pct * svgCircum;
        const dashGap = svgCircum - dashLen;
        const color = getCatColor(cat, i);
        const seg = `<circle cx="${svgC}" cy="${svgC}" r="${svgR}" fill="none" stroke="${color}" stroke-width="${svgStroke}" stroke-dasharray="${dashLen} ${dashGap}" stroke-dashoffset="-${svgOffset}" data-tooltip="${cat.name}: ${count}회" style="cursor:pointer;pointer-events:stroke;"></circle>`;
        svgOffset += dashLen;
        return seg;
    }).join('');
    const praiseSvg = praiseTotal > 0
        ? `<svg viewBox="0 0 100 100" style="width:100%;height:100%;transform:rotate(-90deg);"><circle cx="${svgC}" cy="${svgC}" r="${svgR}" fill="none" stroke="#f3f4f6" stroke-width="${svgStroke}"/>${praiseSvgSegments}</svg>`
        : `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><circle cx="${svgC}" cy="${svgC}" r="${svgR}" fill="none" stroke="#e5e7eb" stroke-width="${svgStroke}"/></svg>`;

    // 감정 SVG 도넛
    let emoSvgOffset = 0;
    let emoSvgSegs = emotionEntries.map(e => {
        const pct = emotionTotal > 0 ? e.count / emotionTotal : 0;
        const dashLen = pct * svgCircum;
        const dashGap = svgCircum - dashLen;
        const seg = `<circle cx="${svgC}" cy="${svgC}" r="${svgR}" fill="none" stroke="${e.info.color}" stroke-width="${svgStroke}" stroke-dasharray="${dashLen} ${dashGap}" stroke-dashoffset="-${emoSvgOffset}" data-tooltip="${e.info.name}: ${e.count}명" style="cursor:pointer;pointer-events:stroke;"></circle>`;
        emoSvgOffset += dashLen;
        return seg;
    }).join('');
    if (unsent > 0) {
        const unsentPct = unsent / emotionTotal;
        const dashLen = unsentPct * svgCircum;
        const dashGap = svgCircum - dashLen;
        emoSvgSegs += `<circle cx="${svgC}" cy="${svgC}" r="${svgR}" fill="none" stroke="#d1d5db" stroke-width="${svgStroke}" stroke-dasharray="${dashLen} ${dashGap}" stroke-dashoffset="-${emoSvgOffset}" data-tooltip="미전송: ${unsent}명" style="cursor:pointer;pointer-events:stroke;"></circle>`;
    }
    const emotionSvg = emotionTotal > 0
        ? `<svg viewBox="0 0 100 100" style="width:100%;height:100%;transform:rotate(-90deg);"><circle cx="${svgC}" cy="${svgC}" r="${svgR}" fill="none" stroke="#f3f4f6" stroke-width="${svgStroke}"/>${emoSvgSegs}</svg>`
        : `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><circle cx="${svgC}" cy="${svgC}" r="${svgR}" fill="none" stroke="#e5e7eb" stroke-width="${svgStroke}"/></svg>`;

    return `
        <div class="space-y-4">
            <!-- 오늘의 한마디 카드 -->
            <div class="card border border-gray-100" style="background: #ffffff !important; padding-top: 4px; padding-bottom: 8px;">
                <!-- 타이틀 + 액션 버튼 -->
                <div class="flex items-center justify-between px-2">
                    <h3 class="section-title m-0 flex-shrink-0 flex items-center gap-1.5" style="white-space:nowrap; position:relative; top:3px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>오늘의 한마디</h3>
                    <div class="flex items-center gap-1">
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
                <!-- 한마디 입력 -->
                <div class="flex items-center gap-2 px-2 mt-2">
                    <input type="text" id="dailyMessageInput" class="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50" placeholder="한마디를 입력하세요..." value="${store.getDailyMessage() || ''}" maxlength="60" />
                    <button id="dailyMessageSaveBtn" class="liquid-btn-small">저장</button>
                    <button id="dailyMessageClearBtn" class="liquid-btn-small" style="background: #f3f4f6; color: #6b7280;">지우기</button>
                </div>
                <p class="text-xs text-gray-400 mt-1 px-2" style="padding-left: 8px;">비어있으면 랜덤 명언이 학생에게 표시됩니다</p>
                <!-- 학생 개인코드 안내 -->
                <div class="border-t border-gray-100 mt-2 pt-2 px-2">
                    <div class="flex items-center justify-between">
                        <p class="text-xs text-gray-400">학생들은 <strong class="text-gray-600">개인코드 4자리</strong>로 로그인합니다</p>
                        <button id="goToCodesBtn" class="liquid-btn-small" style="font-size:10px; padding:1px 6px;">코드 관리</button>
                    </div>
                </div>
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

            <!-- 시간표 + 감정 현황 2열 -->
            <div class="grid grid-cols-2 gap-3">
                <!-- 오늘의 시간표 -->
                <div class="card py-2" style="margin:0;">
                    <div class="flex items-center justify-between mb-1">
                        <span class="section-title m-0 flex items-center gap-1.5" style="font-size:13px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>오늘의 시간표</span>
                        <button onclick="window.classpet.router.navigate('timetable')" class="liquid-btn-small" style="font-size:10px; padding:1px 6px;">전체</button>
                    </div>
                    ${todaySchedule.length > 0 ? `
                    <div class="flex flex-col gap-1">
                        ${(() => {
                            const subjectColors = store.getSubjectColors();
                            return todaySchedule.map(item => {
                                const colors = subjectColors[item.subject] || { bg: '#F3F4F6', text: '#4B5563' };
                                return `
                                <div class="flex items-center gap-2">
                                    <span class="flex items-center justify-center text-white font-bold rounded-full" style="width:22px;height:22px;font-size:10px;background:${colors.bg};color:${colors.text};flex-shrink:0;">${item.period}</span>
                                    <span class="text-sm font-medium text-gray-600">${item.subject}</span>
                                </div>`;
                            }).join('');
                        })()}
                    </div>
                    ` : `
                    <div class="text-center text-gray-400 py-4 text-sm">
                        ${todayDay === 'sun' || todayDay === 'sat' ? '주말이에요!' : '시간표를 입력해주세요'}
                    </div>`}
                </div>

                <!-- 감정 현황 (세부 12종) -->
                <div class="card py-2" style="margin:0;">
                    <div class="flex items-center justify-between mb-1">
                        <span class="section-title m-0 flex items-center gap-1.5" style="font-size:13px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10h-10z"/></svg>감정 현황</span>
                        <button onclick="window.classpet.router.navigate('emotion')" class="liquid-btn-small" style="font-size:10px; padding:1px 6px;">전체</button>
                    </div>
                    <div class="flex flex-col items-center">
                        <div style="position:relative;width:100%;max-width:100px;aspect-ratio:1;margin:4px auto;">
                            ${emotionSvg}
                            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
                                <span style="font-size:14px;font-weight:700;color:#374151;">${emotionTotal - unsent}</span>
                            </div>
                        </div>
                        <div class="flex flex-wrap justify-center gap-x-2 gap-y-1 mt-2">
                            ${emotionEntries.map(e => `
                            <span class="flex items-center gap-1" style="font-size:10px;color:#6b7280;"><span style="width:6px;height:6px;border-radius:50%;background:${e.info.color};display:inline-block;"></span>${e.info.name} ${e.count}</span>
                            `).join('')}
                            ${unsent > 0 ? `<span class="flex items-center gap-1" style="font-size:10px;color:#9ca3af;"><span style="width:6px;height:6px;border-radius:50%;background:#e5e7eb;display:inline-block;"></span>미전송 ${unsent}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 우리 반 친구들 -->
            <div class="card border border-gray-100 py-2" style="background: #ffffff !important;">
                <div class="flex items-center justify-between mb-1">
                    <h3 class="section-title m-0 flex items-center gap-1.5"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>우리 반 친구들</h3>
                    <button onclick="window.classpet.router.navigate('petfarm')" class="liquid-btn-small">
                        전체보기
                    </button>
                </div>
                <div class="flex flex-col gap-1" style="max-height:180px; overflow-y:auto;">
                    ${students.map(student => {
                        const emotionKey = studentEmotionMap[student.id];
                        const eInfo = emotionKey ? getEmotionInfo(emotionKey) : null;
                        return `
                        <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                             onclick="window.classpet.router.navigate('student', { id: '${student.id}' })">
                            <span class="flex-shrink-0">${getPetImageHTML(student.petType, student.level || 1, 'xs')}</span>
                            <span class="flex-1 text-sm font-semibold text-gray-800 truncate">${student.name}</span>
                            ${eInfo
                                ? `<span class="text-xs font-semibold px-2 py-0.5 rounded-full" style="background:${hexToRgba(eInfo.color, 0.15)};color:${eInfo.color};">${eInfo.name}</span>`
                                : `<span class="text-xs text-gray-300">-</span>`
                            }
                        </div>`;
                    }).join('')}
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

            <!-- 칭찬 통계 2열 -->
            <div class="grid grid-cols-2 gap-3">
                <!-- 카테고리별 칭찬 목록 -->
                <div class="card py-2" style="margin:0;">
                    <div class="flex items-center justify-between mb-1">
                        <span class="section-title m-0 flex items-center gap-1.5" style="font-size:13px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>칭찬 통계</span>
                        <button id="dashboardPraiseBtn" class="liquid-btn-small" style="font-size:10px; padding:1px 6px;">칭찬</button>
                    </div>
                    <div class="flex flex-col gap-1">
                        ${praiseCatEntries.map(([key, cat], i) => {
                            const count = stats.categoryStats[key] || 0;
                            const color = getCatColor(cat, i);
                            return `
                            <div class="flex items-center gap-2">
                                <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
                                <span class="text-sm font-medium text-gray-600 flex-1">${cat.name}</span>
                                <span class="text-sm font-bold" style="color:${color};">${count}</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>

                <!-- 칭찬 파이차트 -->
                <div class="card py-2" style="margin:0;">
                    <div class="flex items-center justify-between mb-1">
                        <span class="section-title m-0 flex items-center gap-1.5" style="font-size:13px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10h-10z"/></svg>칭찬 분포</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <div style="position:relative;width:100%;max-width:100px;aspect-ratio:1;margin:4px auto;">
                            ${praiseSvg}
                            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
                                <span style="font-size:14px;font-weight:700;color:#374151;">${praiseTotal}</span>
                            </div>
                        </div>
                        <span style="font-size:10px;color:#9ca3af;margin-top:4px;">총 칭찬 횟수</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function afterRender() {
    // 카드 페이드인 애니메이션
    const content = document.getElementById('content');
    fadeInCards(content, '.card');

    // SVG 도넛 차트 커스텀 툴팁
    setupSvgTooltips(content);

    // 빠른 칭찬 버튼 (onclick 할당으로 중복 바인딩 방지)
    const dashboardPraiseBtn = document.getElementById('dashboardPraiseBtn');
    if (dashboardPraiseBtn) {
        dashboardPraiseBtn.onclick = showQuickPraise;
    }

    // 학급 전환 버튼 (Google 로그인 시)
    const switchClassBtn = document.getElementById('switchClassBtn');
    if (switchClassBtn) {
        switchClassBtn.onclick = () => {
            router.navigate('class-select');
        };
    }

    // 학생 페이지 바로가기 버튼
    const goStudentPageBtn = document.getElementById('goStudentPageBtn');
    if (goStudentPageBtn) {
        goStudentPageBtn.onclick = () => {
            window.open(`${location.origin}${location.pathname}#student-login`, '_blank');
        };
    }

    // 학생 코드 관리 바로가기
    const goToCodesBtn = document.getElementById('goToCodesBtn');
    if (goToCodesBtn) {
        goToCodesBtn.onclick = () => {
            router.navigate('settings');
        };
    }

    // 오늘의 한마디 저장/지우기
    const dailyMsgInput = document.getElementById('dailyMessageInput');
    const dailyMsgSaveBtn = document.getElementById('dailyMessageSaveBtn');
    const dailyMsgClearBtn = document.getElementById('dailyMessageClearBtn');

    if (dailyMsgSaveBtn && dailyMsgInput) {
        dailyMsgSaveBtn.onclick = async () => {
            const text = dailyMsgInput.value.trim();
            if (!text) {
                showToast('한마디를 입력해주세요', 'warning');
                return;
            }
            const ok = await store.setDailyMessage(text);
            if (ok) showToast('한마디가 저장되었어요', 'success');
            else showToast('저장에 실패했어요', 'error');
        };
    }

    if (dailyMsgClearBtn && dailyMsgInput) {
        dailyMsgClearBtn.onclick = async () => {
            const ok = await store.setDailyMessage('');
            if (ok) {
                dailyMsgInput.value = '';
                showToast('한마디가 삭제되었어요', 'info');
            } else {
                showToast('삭제에 실패했어요', 'error');
            }
        };
    }

}

/** SVG 도넛 차트 data-tooltip → 커스텀 툴팁 표시 */
function setupSvgTooltips(root) {
    if (!root) return;
    const circles = root.querySelectorAll('circle[data-tooltip]');
    if (!circles.length) return;

    // 툴팁 엘리먼트 (한 개 공유)
    let tip = document.getElementById('svgChartTip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'svgChartTip';
        Object.assign(tip.style, {
            position: 'fixed', padding: '4px 10px', borderRadius: '8px',
            background: 'rgba(55,65,81,.9)', color: '#fff', fontSize: '12px',
            fontWeight: '600', pointerEvents: 'none', opacity: '0',
            transition: 'opacity .15s', zIndex: '9999', whiteSpace: 'nowrap'
        });
        document.body.appendChild(tip);
    }

    circles.forEach(c => {
        const color = c.getAttribute('stroke') || '#374151';
        const show = (e) => {
            tip.textContent = c.getAttribute('data-tooltip');
            tip.style.background = color;
            tip.style.opacity = '1';
            const cx = (e.touches ? e.touches[0].clientX : e.clientX);
            const cy = (e.touches ? e.touches[0].clientY : e.clientY);
            tip.style.left = cx + 8 + 'px';
            tip.style.top = cy - 32 + 'px';
        };
        const hide = () => { tip.style.opacity = '0'; };

        c.addEventListener('mouseenter', show);
        c.addEventListener('mousemove', show);
        c.addEventListener('mouseleave', hide);
        c.addEventListener('touchstart', (e) => { show(e); setTimeout(hide, 1500); }, { passive: true });
    });
}
