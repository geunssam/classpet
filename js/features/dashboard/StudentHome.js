/**
 * 학생 홈 대시보드 컴포넌트
 * 선생님의 한마디 + 내 펫 + 받은 칭찬 + 학급 펫 랭킹
 */

import { store } from '../../store.js';
import { router } from '../../router.js';
import { getPetImageHTML, getGrowthStage, getExpProgress, getCurrentLevelExp, getExpForNextLevel, isMaxLevel } from '../../shared/utils/petLogic.js';
import { playPetClickAnimation } from '../../shared/utils/petAnimations.js';
import { getRandomQuote } from '../../shared/constants/quotes.js';
import { fadeInCards } from '../../shared/utils/animations.js';

let praiseUnsubscribe = null;
let petUnsubscribe = null;
let classDocUnsubscribe = null;

const stageNames = { baby: '아기', child: '어린이', teen: '청소년', adult: '성체' };

/**
 * 렌더링
 */
export function render() {
    if (!store.isStudentLoggedIn()) {
        setTimeout(() => router.navigate('student-login'), 0);
        return '<div class="text-center p-8">로그인이 필요합니다...</div>';
    }

    const student = store.getCurrentStudent();
    if (!student) {
        store.studentLogout();
        setTimeout(() => router.navigate('student-login'), 0);
        return '<div class="text-center p-8">학생 정보를 찾을 수 없습니다...</div>';
    }

    return `
        <div class="space-y-3 student-home-dashboard">
            ${renderHeroCard(student)}
            ${renderPetSection(student)}
            ${renderPraiseSection(student)}
            ${renderRankingSection(student)}
        </div>
    `;
}

/**
 * 선생님의 한마디 히어로 카드
 */
function renderHeroCard() {
    const message = store.getDailyMessage() || getRandomQuote();
    return `
        <div class="card" style="background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #C7D2FE 100%); border: none; padding: 16px 20px;">
            <div class="flex items-start gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0" style="margin-top:2px"><path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <div>
                    <p class="text-xs font-semibold text-indigo-500 mb-1">선생님의 한마디</p>
                    <p id="dailyMessageText" class="text-sm font-medium text-gray-800 leading-relaxed">${message}</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * 내 펫 영역
 */
function renderPetSection(student) {
    const level = student.level || 1;
    const exp = student.exp || 0;
    const petType = student.petType;
    const petName = student.petName || '내 펫';
    const stage = getGrowthStage(level);
    const stageName = stageNames[stage];
    const expPercent = getExpProgress(exp, level);
    const currentExp = getCurrentLevelExp(exp, level);
    const neededExp = getExpForNextLevel(level);
    const maxLevel = isMaxLevel(level);

    // 다음 레벨까지 필요한 칭찬 횟수
    const remainingExp = neededExp - currentExp;
    const praisesNeeded = Math.ceil(remainingExp / 10);

    return `
        <div class="card py-3 cursor-pointer" id="petSectionCard" style="background: #ffffff; border: 1px solid #f3f4f6;">
            <div class="flex items-center gap-4">
                <div class="relative flex-shrink-0" id="homePetContainer">
                    <div class="pet-emoji-large">
                        ${getPetImageHTML(petType, level, 'xl')}
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-gray-800 text-base truncate" id="homePetName">${petName}</span>
                        <span class="level-badge-lg" id="homeLevelBadge">Lv.${level}</span>
                        <span class="text-xs text-gray-400" id="homeStageText">${stageName}</span>
                    </div>
                    <div class="exp-bar-xl mb-1">
                        <div class="exp-bar-fill-xl" id="homeExpFill" style="width: ${Math.max(expPercent, maxLevel ? 100 : 8)}%"></div>
                    </div>
                    <p class="text-xs text-gray-400" id="homeExpInfo">
                        ${maxLevel ? '최고 레벨 달성! 👑' : `다음 레벨까지 칭찬 ${praisesNeeded}회`}
                    </p>
                </div>
            </div>
        </div>
    `;
}

/**
 * 받은 칭찬 카드
 */
function renderPraiseSection(student) {
    const praises = store.getPraisesByStudent(student.id) || [];
    const recent = praises.slice(0, 3);
    const categories = store.getPraiseCategories();

    return `
        <div class="card py-2" style="background: #ffffff; border: 1px solid #f3f4f6;">
            <div class="flex items-center justify-between mb-2">
                <h3 class="section-title m-0 flex items-center gap-1.5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    받은 칭찬
                </h3>
                <button id="viewAllPraisesBtn" class="liquid-btn-small">전체보기</button>
            </div>
            <div id="praiseListContainer">
                ${recent.length > 0 ? recent.map(p => {
                    const cat = categories[p.category];
                    const icon = cat?.icon || '⭐';
                    const name = cat?.name || '칭찬';
                    const expGain = p.expGain || cat?.exp || 10;
                    const timeStr = formatPraiseTime(p.timestamp || p.createdAt);
                    return `
                        <div class="flex items-center gap-3 py-1.5 ${p !== recent[recent.length - 1] ? 'border-b border-gray-50' : ''}">
                            <span class="text-lg flex-shrink-0">${icon}</span>
                            <span class="text-sm font-medium text-gray-700 flex-1">${name}</span>
                            <span class="text-xs font-semibold text-primary">+${expGain}</span>
                            <span class="text-xs text-gray-400">${timeStr}</span>
                        </div>
                    `;
                }).join('') : `
                    <div class="text-center py-4 text-gray-400 text-sm">
                        아직 받은 칭찬이 없어요
                    </div>
                `}
            </div>
        </div>
    `;
}

/**
 * 학급 펫 랭킹 섹션
 */
function renderRankingSection(currentStudent) {
    const students = store.getStudents() || [];

    // 레벨 내림차순 → 경험치 내림차순 → 학번 오름차순
    const sorted = [...students].sort((a, b) => {
        const levelDiff = (b.level || 1) - (a.level || 1);
        if (levelDiff !== 0) return levelDiff;
        const expDiff = (b.exp || 0) - (a.exp || 0);
        if (expDiff !== 0) return expDiff;
        return (a.number || 0) - (b.number || 0);
    });

    // 내 순위 찾기
    const myRank = sorted.findIndex(s => String(s.id) === String(currentStudent.id)) + 1;
    const medalIcons = ['🥇', '🥈', '🥉'];

    return `
        <div class="card py-2" style="background: #ffffff; border: 1px solid #f3f4f6;">
            <h3 class="section-title m-0 mb-2 flex items-center gap-1.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 22V8a4 4 0 0 1 4 0v14"/><path d="M8 9h8"/></svg>
                우리 반 펫 레벨
            </h3>

            ${myRank > 0 ? `
            <div class="rounded-xl p-2.5 mb-2" style="background: rgba(99, 102, 241, 0.08); border: 1.5px solid rgba(99, 102, 241, 0.2);">
                <div class="flex items-center gap-2.5">
                    <span class="text-sm font-bold text-primary w-6 text-center">${myRank <= 3 ? medalIcons[myRank - 1] : myRank + '위'}</span>
                    ${getPetImageHTML(currentStudent.petType, currentStudent.level || 1, 'sm')}
                    <div class="flex-1 min-w-0">
                        <span class="text-sm font-bold text-gray-800 truncate">${currentStudent.petName || '내 펫'}</span>
                        <span class="text-xs text-primary font-semibold ml-1">(나)</span>
                    </div>
                    <span class="text-xs font-bold text-primary">Lv.${currentStudent.level || 1}</span>
                </div>
            </div>
            ` : ''}

            <div class="space-y-0.5" id="rankingList" style="max-height: 240px; overflow-y: auto;">
                ${sorted.map((s, i) => {
                    const rank = i + 1;
                    const isMe = String(s.id) === String(currentStudent.id);
                    const rankDisplay = rank <= 3 ? medalIcons[rank - 1] : rank + '위';
                    return `
                        <div class="flex items-center gap-2.5 py-1.5 px-2 rounded-lg ${isMe ? 'bg-primary/5' : ''}">
                            <span class="text-xs font-bold w-6 text-center ${rank <= 3 ? '' : 'text-gray-400'}">${rankDisplay}</span>
                            ${getPetImageHTML(s.petType, s.level || 1, 'xs')}
                            <span class="text-sm text-gray-700 flex-1 truncate">${s.petName || s.name}${isMe ? ' <span class="text-xs text-primary font-semibold">(나)</span>' : ` <span class="text-xs text-gray-400">(${s.name})</span>`}</span>
                            <span class="text-xs font-semibold ${isMe ? 'text-primary' : 'text-gray-500'}">Lv.${s.level || 1}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

/**
 * 칭찬 시간 포맷
 */
function formatPraiseTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    if (diffHours < 48) {
        return '어제';
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * afterRender - 이벤트 바인딩 및 구독 설정
 */
export function afterRender() {
    const content = document.getElementById('content');
    fadeInCards(content, '.card');

    // 펫 카드 클릭 → 마음보내기 (onclick으로 중복 방지 + 최신 DOM 참조)
    const petCard = document.getElementById('petSectionCard');
    if (petCard) {
        petCard.onclick = () => {
            const petContainer = document.getElementById('homePetContainer');
            if (petContainer) {
                const student = store.getCurrentStudent();
                if (student?.petType) {
                    playPetClickAnimation(petContainer, student.petType, student.level || 1);
                }
            }
            setTimeout(() => router.navigate('student-main'), 300);
        };
    }

    // 전체보기 버튼 → 받은 칭찬 페이지
    const viewAllBtn = document.getElementById('viewAllPraisesBtn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            router.navigate('student-praise');
        });
    }

    // 실시간 구독 설정
    setupSubscriptions();
}

/**
 * 실시간 구독 설정
 */
function setupSubscriptions() {
    const student = store.getCurrentStudent();
    if (!student || !store.isFirebaseEnabled() || !store.getClassCode()) return;

    // 칭찬 구독
    praiseUnsubscribe = store.subscribeToStudentPraises(student.id, () => {
        if (router.getCurrentRoute() === 'student-home') {
            refreshPraiseSection(student);
        }
    });

    // 펫 구독
    petUnsubscribe = store.subscribeToStudentPets(student.id, (pets) => {
        const activePet = pets.find(p => p.status === 'active');
        if (!activePet) return;

        const current = store.getCurrentStudent();
        if (!current) return;

        if (current.exp !== activePet.exp || current.level !== activePet.level) {
            store.updateStudent(current.id, {
                exp: activePet.exp || 0,
                level: activePet.level || 1
            });
            if (router.getCurrentRoute() === 'student-home') {
                refreshPetSection();
                refreshRankingSection();
            }
        }
    });

    // 학급 문서 구독 (한마디 실시간 반영)
    classDocUnsubscribe = store.subscribeToClassDoc((classData) => {
        if (router.getCurrentRoute() === 'student-home') {
            const msgEl = document.getElementById('dailyMessageText');
            if (msgEl) {
                msgEl.textContent = classData?.dailyMessage?.text || getRandomQuote();
            }
        }
    });
}

/**
 * 받은 칭찬 섹션 부분 갱신
 */
function refreshPraiseSection(student) {
    const s = student || store.getCurrentStudent();
    if (!s) return;
    const container = document.getElementById('praiseListContainer');
    if (!container) return;

    const praises = store.getPraisesByStudent(s.id) || [];
    const recent = praises.slice(0, 3);
    const categories = store.getPraiseCategories();

    if (recent.length > 0) {
        container.innerHTML = recent.map(p => {
            const cat = categories[p.category];
            const icon = cat?.icon || '⭐';
            const name = cat?.name || '칭찬';
            const expGain = p.expGain || cat?.exp || 10;
            const timeStr = formatPraiseTime(p.timestamp || p.createdAt);
            return `
                <div class="flex items-center gap-3 py-1.5 ${p !== recent[recent.length - 1] ? 'border-b border-gray-50' : ''}">
                    <span class="text-lg flex-shrink-0">${icon}</span>
                    <span class="text-sm font-medium text-gray-700 flex-1">${name}</span>
                    <span class="text-xs font-semibold text-primary">+${expGain}</span>
                    <span class="text-xs text-gray-400">${timeStr}</span>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = `
            <div class="text-center py-4 text-gray-400 text-sm">
                아직 받은 칭찬이 없어요
            </div>
        `;
    }
}

/**
 * 펫 섹션 부분 갱신
 */
function refreshPetSection() {
    const student = store.getCurrentStudent();
    if (!student) return;

    const level = student.level || 1;
    const exp = student.exp || 0;
    const stage = getGrowthStage(level);
    const expPercent = getExpProgress(exp, level);
    const currentExp = getCurrentLevelExp(exp, level);
    const neededExp = getExpForNextLevel(level);
    const maxLevel = isMaxLevel(level);
    const praisesNeeded = Math.ceil((neededExp - currentExp) / 10);

    const levelBadge = document.getElementById('homeLevelBadge');
    if (levelBadge) levelBadge.textContent = `Lv.${level}`;

    const stageText = document.getElementById('homeStageText');
    if (stageText) stageText.textContent = stageNames[stage];

    const expFill = document.getElementById('homeExpFill');
    if (expFill) expFill.style.width = `${Math.max(expPercent, maxLevel ? 100 : 8)}%`;

    const expInfo = document.getElementById('homeExpInfo');
    if (expInfo) expInfo.textContent = maxLevel ? '최고 레벨 달성! 👑' : `다음 레벨까지 칭찬 ${praisesNeeded}회`;
}

/**
 * 랭킹 섹션 부분 갱신
 */
function refreshRankingSection() {
    const currentStudent = store.getCurrentStudent();
    if (!currentStudent) return;

    const rankingEl = document.getElementById('rankingList');
    if (!rankingEl) return;

    const students = store.getStudents() || [];
    const sorted = [...students].sort((a, b) => {
        const levelDiff = (b.level || 1) - (a.level || 1);
        if (levelDiff !== 0) return levelDiff;
        const expDiff = (b.exp || 0) - (a.exp || 0);
        if (expDiff !== 0) return expDiff;
        return (a.number || 0) - (b.number || 0);
    });

    const medalIcons = ['🥇', '🥈', '🥉'];
    rankingEl.innerHTML = sorted.map((s, i) => {
        const rank = i + 1;
        const isMe = String(s.id) === String(currentStudent.id);
        const rankDisplay = rank <= 3 ? medalIcons[rank - 1] : rank + '위';
        return `
            <div class="flex items-center gap-2.5 py-1.5 px-2 rounded-lg ${isMe ? 'bg-primary/5' : ''}">
                <span class="text-xs font-bold w-6 text-center ${rank <= 3 ? '' : 'text-gray-400'}">${rankDisplay}</span>
                ${getPetImageHTML(s.petType, s.level || 1, 'xs')}
                <span class="text-sm text-gray-700 flex-1 truncate">${s.petName || s.name}${isMe ? ' <span class="text-xs text-primary font-semibold">(나)</span>' : ` <span class="text-xs text-gray-400">(${s.name})</span>`}</span>
                <span class="text-xs font-semibold ${isMe ? 'text-primary' : 'text-gray-500'}">Lv.${s.level || 1}</span>
            </div>
        `;
    }).join('');
}

/**
 * 언마운트 - 구독 해제
 */
export function unmount() {
    if (praiseUnsubscribe) {
        praiseUnsubscribe();
        praiseUnsubscribe = null;
    }
    if (petUnsubscribe) {
        petUnsubscribe();
        petUnsubscribe = null;
    }
    if (classDocUnsubscribe) {
        classDocUnsubscribe();
        classDocUnsubscribe = null;
    }
}
