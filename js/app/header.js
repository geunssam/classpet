/**
 * 헤더 버튼 및 알림 관리
 * 설정/알림/로그아웃 버튼, 날짜 히스토리, 알림 모달
 */

import { store } from '../store.js';
import { router } from '../router.js';
import {
    showToast,
    setModalContent,
    openModal,
    closeModal
} from '../utils/animations.js';
import { toDateString } from '../utils/dateUtils.js';
import { bindToolbarToggle, bindMobileDrawer, updateNotificationBadge, updateStudentNotificationBadge } from './navigation.js';
import { setStudentTab, setHistoryDate } from '../components/StudentMode.js';
import { showQuickPraise } from '../components/QuickPraise.js';
import { getPetEmoji } from '../utils/petLogic.js';
import { DEFAULT_THERMOSTAT } from '../store/thermostatMixin.js';

/**
 * 헤더 버튼 바인딩
 */
export function bindHeaderButtons() {
    // 설정 버튼
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            router.navigate('settings');
        });
    }

    // 알림 버튼 (교사용)
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', showNotifications);
    }

    // 알림 버튼 (학생용)
    const studentNotificationBtn = document.getElementById('studentNotificationBtn');
    if (studentNotificationBtn) {
        studentNotificationBtn.addEventListener('click', showStudentNotifications);
    }

    // 설정 버튼 (학생용) - PIN 변경
    const studentSettingsBtn = document.getElementById('studentSettingsBtn');
    if (studentSettingsBtn) {
        studentSettingsBtn.addEventListener('click', showStudentPinChangeModal);
    }

    // 학생 로그아웃 버튼 (중복 등록 방지)
    const studentLogoutBtn = document.getElementById('studentLogoutBtn');
    if (studentLogoutBtn) {
        studentLogoutBtn.removeEventListener('click', handleStudentLogout);
        studentLogoutBtn.addEventListener('click', handleStudentLogout);
    }

    // 모바일 드로어 학생 버튼들
    const mobileStudentNotiBtn = document.getElementById('mobileStudentNotiBtn');
    if (mobileStudentNotiBtn) {
        mobileStudentNotiBtn.addEventListener('click', () => {
            document.getElementById('mobileDrawer')?.classList.remove('open');
            document.getElementById('mobileDrawerOverlay')?.classList.remove('open');
            showStudentNotifications();
        });
    }

    const mobileStudentSettingsBtn = document.getElementById('mobileStudentSettingsBtn');
    if (mobileStudentSettingsBtn) {
        mobileStudentSettingsBtn.addEventListener('click', () => {
            document.getElementById('mobileDrawer')?.classList.remove('open');
            document.getElementById('mobileDrawerOverlay')?.classList.remove('open');
            showStudentPinChangeModal();
        });
    }

    const mobileStudentLogoutBtn = document.getElementById('mobileStudentLogoutBtn');
    if (mobileStudentLogoutBtn) {
        mobileStudentLogoutBtn.removeEventListener('click', handleStudentLogout);
        mobileStudentLogoutBtn.addEventListener('click', () => {
            document.getElementById('mobileDrawer')?.classList.remove('open');
            document.getElementById('mobileDrawerOverlay')?.classList.remove('open');
            handleStudentLogout();
        });
    }

    // 로그아웃 버튼 (헤더 + 기존 숨김 버튼)
    const logoutHandler = () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            store.teacherLogout();
            router.navigate('login');
        }
    };

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutHandler);
    }

    const headerLogoutBtn = document.getElementById('headerLogoutBtn');
    if (headerLogoutBtn) {
        headerLogoutBtn.addEventListener('click', logoutHandler);
    }

    // 빠른 칭찬 버튼 (우측 툴바)
    const quickPraiseToolbarBtn = document.getElementById('quickPraiseToolbarBtn');
    if (quickPraiseToolbarBtn) {
        quickPraiseToolbarBtn.addEventListener('click', showQuickPraise);
    }

    // 뽑기 버튼 (우측 툴바 + 모바일)
    const pickerToolbarBtn = document.getElementById('pickerToolbarBtn');
    if (pickerToolbarBtn) {
        pickerToolbarBtn.addEventListener('click', () => router.navigate('picker'));
    }
    const mobilePickerBtn = document.getElementById('mobilePickerBtn');
    if (mobilePickerBtn) {
        mobilePickerBtn.addEventListener('click', () => {
            document.getElementById('mobileDrawer')?.classList.remove('open');
            document.getElementById('mobileDrawerOverlay')?.classList.remove('open');
            router.navigate('picker');
        });
    }

    // 타이머 버튼 (우측 툴바 + 모바일)
    const timerToolbarBtn = document.getElementById('timerToolbarBtn');
    if (timerToolbarBtn) {
        timerToolbarBtn.addEventListener('click', () => router.navigate('timer'));
    }
    const mobileTimerBtn = document.getElementById('mobileTimerBtn');
    if (mobileTimerBtn) {
        mobileTimerBtn.addEventListener('click', () => {
            document.getElementById('mobileDrawer')?.classList.remove('open');
            document.getElementById('mobileDrawerOverlay')?.classList.remove('open');
            router.navigate('timer');
        });
    }

    // 온도계 버튼 (우측 툴바 + 모바일)
    const thermoToolbarBtn = document.getElementById('thermoToolbarBtn');
    if (thermoToolbarBtn) {
        thermoToolbarBtn.addEventListener('click', showThermometerModal);
    }
    const mobileThermoBtn = document.getElementById('mobileThermoBtn');
    if (mobileThermoBtn) {
        mobileThermoBtn.addEventListener('click', () => {
            document.getElementById('mobileDrawer')?.classList.remove('open');
            document.getElementById('mobileDrawerOverlay')?.classList.remove('open');
            showThermometerModal();
        });
    }

    // 알림장 버튼 (우측 툴바)
    const noticeToolbarBtn = document.getElementById('noticeToolbarBtn');
    if (noticeToolbarBtn) {
        noticeToolbarBtn.addEventListener('click', () => router.navigate('notice'));
    }

    // 학급 전환 버튼 (우측 툴바)
    const switchClassToolbarBtn = document.getElementById('switchClassToolbarBtn');
    if (switchClassToolbarBtn) {
        // Google 로그인 시에만 표시
        if (store.isGoogleTeacher()) {
            switchClassToolbarBtn.classList.remove('hidden');
            switchClassToolbarBtn.addEventListener('click', () => {
                router.navigate('class-select');
            });
        }
    }

    // 날짜 버튼 → 감정 히스토리로 이동
    bindDateHistoryButton();

    // 툴바 토글 바인딩
    bindToolbarToggle();

    // 모바일 드로어 바인딩 (알림 표시 함수, 빠른 칭찬 함수 전달)
    bindMobileDrawer(showNotifications, showQuickPraise);

    // 알림 배지 업데이트
    updateNotificationBadge();

    // 스토어 변경 리스너에서 알림 업데이트
    store.subscribe((type, data) => {
        if (type === 'notifications' || type === 'studentSession') {
            updateNotificationBadge();
        }
        if (type === 'emotionLog' || type === 'praiseLog') {
            updateStudentNotificationBadge();
        }
    });
}

/**
 * 날짜 버튼 클릭 → 감정 히스토리로 이동
 */
function bindDateHistoryButton() {
    const dateHistoryBtn = document.getElementById('dateHistoryBtn');
    const historyDatePicker = document.getElementById('historyDatePicker');

    if (dateHistoryBtn && historyDatePicker) {
        // 오늘 날짜를 기본값으로 설정
        const today = toDateString();
        historyDatePicker.value = today;
        historyDatePicker.max = today; // 미래 날짜 선택 불가

        // 날짜 버튼 클릭 시 date picker 열기
        dateHistoryBtn.addEventListener('click', () => {
            // showPicker()가 지원되지 않는 브라우저(일부 모바일)를 위한 fallback
            if (typeof historyDatePicker.showPicker === 'function') {
                try {
                    historyDatePicker.showPicker();
                } catch (e) {
                    // SecurityError 등 발생 시 click으로 fallback
                    historyDatePicker.click();
                }
            } else {
                historyDatePicker.click();
            }
        });

        // 날짜 선택 시 학생 선택 모달 표시
        historyDatePicker.addEventListener('change', (e) => {
            const selectedDate = e.target.value; // "2025-01-22" 형식
            if (selectedDate) {
                showStudentPickerModal(selectedDate);
            }
        });
    }
}

/**
 * 날짜 선택 후 학생 선택 모달 표시
 */
function showStudentPickerModal(selectedDate) {
    const students = store.getStudents() || [];

    if (students.length === 0) {
        showToast('등록된 학생이 없어요', 'warning');
        return;
    }

    // 날짜 라벨 생성 (예: "2월 8일")
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dateLabel = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

    const modalContent = `
        <div class="space-y-4 max-h-[70vh] overflow-y-auto">
            <div class="flex items-center justify-between sticky top-0 bg-white pb-2">
                <h3 class="text-lg font-bold">📋 ${dateLabel} · 학생 선택</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <p class="text-sm text-gray-500">기록을 확인할 학생을 선택하세요</p>

            <div class="grid grid-cols-4 gap-2">
                ${students.map(student => `
                    <button class="student-picker-btn flex flex-col items-center p-2 rounded-xl border-2 border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all"
                            data-student-id="${student.id}">
                        <span class="text-2xl">${getPetEmoji(student.petType, student.level)}</span>
                        <span class="text-xs mt-1 truncate w-full text-center">${student.name}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 학생 클릭 이벤트 바인딩
    document.querySelectorAll('.student-picker-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const studentId = btn.dataset.studentId;
            sessionStorage.setItem('studentDetailDate', selectedDate);
            closeModal();
            router.navigate('student', { id: studentId });
        });
    });
}

/**
 * 알림 모달 표시
 */
export function showNotifications() {
    const notifications = store.getNotifications() || [];
    const recentNotifications = notifications.slice(0, 20); // 최근 20개만

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">🔔 알림</h3>
                <div class="flex gap-2">
                    ${notifications.filter(n => !n.read).length > 0 ? `
                        <button id="markAllReadBtn" class="text-sm text-primary hover:text-primary-dark">
                            모두 읽음
                        </button>
                    ` : ''}
                    <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
                </div>
            </div>

            <div class="max-h-80 overflow-y-auto">
                ${recentNotifications.length > 0 ? `
                    <div class="space-y-3">
                        ${recentNotifications.map(notification => {
        const timeAgo = getTimeAgo(notification.timestamp);
        const isUnread = !notification.read;

        return `
                                <div class="notification-item p-3 rounded-xl ${isUnread ? 'bg-primary/10' : 'bg-gray-50'} cursor-pointer hover:bg-gray-100 transition-colors"
                                     data-notification-id="${notification.id}">
                                    <div class="flex items-start gap-3">
                                        <span class="text-2xl">${notification.emotionIcon || '📢'}</span>
                                        <div class="flex-1">
                                            <p class="text-sm ${isUnread ? 'font-medium' : ''} text-gray-700">
                                                ${notification.message}
                                            </p>
                                            ${notification.memo ? `
                                                <p class="text-xs text-gray-500 mt-1 italic">"${notification.memo}"</p>
                                            ` : ''}
                                            <p class="text-xs text-gray-400 mt-1">${timeAgo}</p>
                                        </div>
                                        ${isUnread ? '<span class="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></span>' : ''}
                                    </div>
                                </div>
                            `;
    }).join('')}
                    </div>
                ` : `
                    <div class="text-center py-8 text-gray-500">
                        <div class="text-4xl mb-3">🔕</div>
                        <p>새로운 알림이 없어요</p>
                    </div>
                `}
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 이벤트 바인딩
    // 모두 읽음 버튼
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            store.markAllNotificationsRead();
            showToast('모든 알림을 읽음 처리했습니다', 'info');
            closeModal();
        });
    }

    // 알림 항목 클릭 시 읽음 처리
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const notificationId = parseInt(item.dataset.notificationId);
            store.markNotificationRead(notificationId);

            // 감정 관련 알림이면 마음 탭 기록보기 → 해당 학생 채팅방으로 이동
            const notification = notifications.find(n => n.id === notificationId);
            console.log('🔔 알림 클릭:', { notificationId, notification, type: notification?.type, studentId: notification?.studentId });

            if (notification && notification.type === 'emotion' && notification.studentId) {
                closeModal();
                sessionStorage.setItem('emotionHistoryStudentId', notification.studentId.toString());
                console.log('🔔 마음 탭으로 이동, studentId:', notification.studentId);
                router.navigate('emotion');
            }
        });
    });
}

/**
 * 학생 알림 모달 표시 (미읽은 답장 + 새 칭찬)
 */
export function showStudentNotifications() {
    // PIN 모달 닫기
    const pinModal = document.getElementById('studentPinChangeModal');
    if (pinModal) pinModal.classList.add('hidden');

    const student = store.getCurrentStudent();
    if (!student) return;

    // 1. 미읽은 답장 목록
    const todayEmotions = store.getStudentTodayEmotions?.(student.id) || [];
    const unreadReplies = todayEmotions.filter(emotion => {
        const convos = emotion.conversations || [];
        const hasUnreadConvo = convos.some(c => c.teacherReply && !c.read);
        const hasUnreadReply = emotion.reply && !emotion.reply.read;
        return hasUnreadConvo || hasUnreadReply;
    });

    // 2. 새 칭찬 목록
    const praises = store.getPraisesByStudent(student.id) || [];
    const lastSeen = parseInt(sessionStorage.getItem('lastSeenPraiseCount') || '0');
    const newCount = Math.max(0, praises.length - lastSeen);
    const newPraises = praises.slice(0, newCount);

    // 3. 새 알림장 목록
    const unreadNoticeCount = store.getUnreadStudentNoticeCount?.(student.id) || 0;
    const sharedNotices = store.getSharedNoticesForStudent?.(student.id) || [];
    const newNotices = sharedNotices.slice(0, unreadNoticeCount);

    const hasAnyNotifications = unreadReplies.length > 0 || newPraises.length > 0 || newNotices.length > 0;

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">🔔 알림</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="max-h-80 overflow-y-auto">
                ${hasAnyNotifications ? `
                    <div class="space-y-3">
                        ${newNotices.length > 0 ? `
                            <div class="mb-4">
                                <p class="text-sm font-medium text-gray-600 mb-2">📋 새 알림장</p>
                                ${newNotices.map(notice => {
        const noticeDate = notice.date || '';
        const [ny, nm, nd] = noticeDate.split('-');
        const dateDisplay = nm && nd ? `${Number(nm)}월 ${Number(nd)}일` : '';
        return `
                                        <div class="notification-item p-3 rounded-xl bg-emerald-50 cursor-pointer hover:bg-emerald-100 transition-colors"
                                             data-notice-id="${notice.id}">
                                            <div class="flex items-start gap-3">
                                                <span class="text-2xl">📋</span>
                                                <div class="flex-1">
                                                    <p class="text-sm font-medium text-gray-700">${notice.title || '알림장'}</p>
                                                    <p class="text-xs text-gray-500 mt-1">${(notice.plainText || '').substring(0, 60)}${(notice.plainText || '').length > 60 ? '...' : ''}</p>
                                                    <p class="text-xs text-gray-400 mt-1">${dateDisplay}</p>
                                                </div>
                                                <span class="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0 mt-2"></span>
                                            </div>
                                        </div>
                                    `;
    }).join('')}
                            </div>
                        ` : ''}

                        ${unreadReplies.length > 0 ? `
                            <div class="mb-4">
                                <p class="text-sm font-medium text-gray-600 mb-2">💌 새로운 답장</p>
                                ${unreadReplies.map(emotion => {
        const convos = emotion.conversations || [];
        const lastReply = convos.slice().reverse().find(c => c.teacherReply);
        const replyMessage = lastReply?.teacherReply || emotion.reply?.message || '';
        const emotionTime = new Date(emotion.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        return `
                                        <div class="notification-item p-3 rounded-xl bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors"
                                             data-emotion-id="${emotion.id || emotion.firebaseId}"
                                             data-emotion-timestamp="${emotion.timestamp}">
                                            <div class="flex items-start gap-3">
                                                <span class="text-2xl">💬</span>
                                                <div class="flex-1">
                                                    <p class="text-sm font-medium text-gray-700">펫이 답장을 보냈어요</p>
                                                    <p class="text-xs text-gray-500 mt-1 italic">"${replyMessage.substring(0, 50)}${replyMessage.length > 50 ? '...' : ''}"</p>
                                                    <p class="text-xs text-gray-400 mt-1">${emotionTime}</p>
                                                </div>
                                                <span class="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></span>
                                            </div>
                                        </div>
                                    `;
    }).join('')}
                            </div>
                        ` : ''}

                        ${newPraises.length > 0 ? `
                            <div>
                                <p class="text-sm font-medium text-gray-600 mb-2">⭐ 새로운 칭찬</p>
                                ${newPraises.map(praise => {
        const praiseTime = getTimeAgo(praise.timestamp || praise.createdAt);
        return `
                                        <div class="notification-item p-3 rounded-xl bg-yellow-50 cursor-pointer hover:bg-yellow-100 transition-colors"
                                             data-praise-id="${praise.id}">
                                            <div class="flex items-start gap-3">
                                                <span class="text-2xl">🌟</span>
                                                <div class="flex-1">
                                                    <p class="text-sm font-medium text-gray-700">칭찬을 받았어요!</p>
                                                    <p class="text-xs text-gray-500 mt-1">${praise.reason || praise.category || ''}</p>
                                                    <p class="text-xs text-gray-400 mt-1">${praiseTime}</p>
                                                </div>
                                                <span class="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 mt-2"></span>
                                            </div>
                                        </div>
                                    `;
    }).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : `
                    <div class="text-center py-8 text-gray-500">
                        <div class="text-4xl mb-3">🔕</div>
                        <p>새로운 알림이 없어요</p>
                    </div>
                `}
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 칭찬 확인 시 lastSeenPraiseCount 업데이트
    if (newPraises.length > 0) {
        sessionStorage.setItem('lastSeenPraiseCount', praises.length.toString());
    }

    // 알림장 클릭 시 알림장 페이지로 이동
    document.querySelectorAll('[data-notice-id]').forEach(item => {
        item.addEventListener('click', () => {
            closeModal();
            router.navigate('student-notice');
        });
    });

    // 답장 클릭 시 읽음 처리 + 마음 탭 기록보기로 이동
    document.querySelectorAll('[data-emotion-id]').forEach(item => {
        item.addEventListener('click', () => {
            const emotionId = item.dataset.emotionId;
            const timestamp = item.dataset.emotionTimestamp;
            store.markReplyAsRead(emotionId);
            closeModal();
            if (timestamp) {
                setHistoryDate(new Date(timestamp));
            }
            setStudentTab('history');
            if (router.getCurrentRoute() === 'student-main') {
                router.handleRoute(); // 같은 라우트 → 강제 리렌더
            } else {
                router.navigate('student-main');
            }
        });
    });

    // 칭찬 클릭 시 받은 칭찬 페이지로 이동
    document.querySelectorAll('[data-praise-id]').forEach(item => {
        item.addEventListener('click', () => {
            closeModal();
            router.navigate('student-praise');
        });
    });

    // 뱃지 업데이트
    updateStudentNotificationBadge();
}

/**
 * 시간 경과 표시
 */
function getTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = Math.floor((now - date) / 1000); // 초 단위

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
}

/**
 * 오늘 날짜 업데이트
 */
export function updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const today = new Date();
        const month = today.getMonth() + 1;
        const date = today.getDate();
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const day = days[today.getDay()];
        dateEl.textContent = `${month}/${date} (${day})`;
    }
}

/**
 * 온도계 모달 표시
 */
let thermoEditMilestones = [];

export function showThermometerModal() {
    const thermoTemp = store.getThermoTemp();
    const thermoSettings = store.getThermostatSettings();
    const totalPraises = store.getClassTotalPraises();
    const sortedMilestones = [...(thermoSettings.milestones || [])].sort((a, b) => a.temp - b.temp);
    const tubeHeight = 260;
    const bulbOffset = 80;

    const modalContent = `
        <div class="space-y-3">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">🌡️ 학급 온도계</h3>
                <div class="flex items-center gap-2">
                    <button id="thermoSettingsBtn" class="text-xs font-semibold text-gray-400 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">⚙️ 설정</button>
                    <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
                </div>
            </div>

            <!-- 세로 온도계 비주얼 -->
            <div class="thermo-visual">
                <!-- 마일스톤 라벨 -->
                <div class="thermo-ms-col">
                    ${sortedMilestones.map((ms, i) => {
                        const achieved = thermoTemp >= ms.temp;
                        const side = i % 2 === 0 ? 'ms-left' : 'ms-right';
                        const bottomPx = bulbOffset + (ms.temp / 100) * tubeHeight;
                        return `<div class="thermo-ms-tag ${side} ${achieved ? 'achieved' : ''}" style="bottom: ${bottomPx}px">
                            <span class="thermo-ms-reward">${ms.reward}</span>
                            <span class="thermo-ms-temp">${ms.temp}°C ${achieved ? '✅' : ''}</span>
                        </div>`;
                    }).join('')}
                </div>

                <!-- 온도계 본체 -->
                <div class="thermo-body-col">
                    <div class="thermo-tube">
                        <div class="thermo-tube-bg"></div>
                        <div class="thermo-tube-fill" style="height: ${thermoTemp}%"></div>
                    </div>
                    <div class="thermo-bulb">
                        <div class="thermo-bulb-fill"></div>
                        <div class="thermo-face">
                            <div class="thermo-eyes">
                                <span class="thermo-eye"></span>
                                <span class="thermo-eye"></span>
                            </div>
                            <div class="thermo-mouth"></div>
                        </div>
                    </div>
                    <div class="thermo-cheeks">
                        <span class="thermo-cheek left"></span>
                        <span class="thermo-cheek right"></span>
                    </div>
                </div>
            </div>

            <!-- 현재 온도 -->
            <div class="thermo-temp">${thermoTemp}°C</div>
            <div class="text-center text-xs text-gray-400">${totalPraises} / ${thermoSettings.targetPraises} 칭찬</div>

            <!-- 마일스톤 칩 -->
            <div class="thermo-ms-list">
                ${sortedMilestones.map(ms => `
                    <span class="thermo-ms-chip ${thermoTemp >= ms.temp ? 'achieved' : ''}">
                        ${ms.temp}°C ${ms.reward} ${thermoTemp >= ms.temp ? '✅' : ''}
                    </span>
                `).join('')}
            </div>

            <!-- 온도계 설정 (토글) -->
            <div id="thermoSettingsPanel" class="thermo-settings">
                <div class="thermo-setting-row">
                    <label>100°C 기준</label>
                    <input type="number" id="thermoTargetInput" value="${thermoSettings.targetPraises}" min="10" max="9999" style="width: 80px" />
                    <span class="thermo-ms-unit">개 칭찬</span>
                </div>
                <div id="thermoMilestoneEditor"></div>
                <button class="w-full mt-2 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-lg hover:bg-indigo-600 transition-colors" id="thermoSaveBtn">저장</button>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 설정 토글
    const settingsBtn = document.getElementById('thermoSettingsBtn');
    const settingsPanel = document.getElementById('thermoSettingsPanel');
    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.toggle('open');
            if (settingsPanel.classList.contains('open')) {
                thermoEditMilestones = [...(thermoSettings.milestones || DEFAULT_THERMOSTAT.milestones)].sort((a, b) => a.temp - b.temp);
                renderThermoMilestoneEditor();
            }
        });
    }

    // 저장
    document.getElementById('thermoSaveBtn')?.addEventListener('click', () => {
        const targetPraises = parseInt(document.getElementById('thermoTargetInput')?.value) || 200;
        const validMilestones = thermoEditMilestones
            .filter(ms => ms.temp > 0 && ms.temp <= 100 && ms.reward.trim())
            .sort((a, b) => a.temp - b.temp);

        store.saveThermostatSettings({
            targetPraises,
            milestones: validMilestones,
        });

        showToast('온도계 설정이 저장되었습니다', 'success');
        closeModal();
    });
}

/**
 * 온도계 마일스톤 편집기 렌더링
 */
function renderThermoMilestoneEditor() {
    const container = document.getElementById('thermoMilestoneEditor');
    if (!container) return;

    container.innerHTML = `
        <div class="thermo-ms-editor-title">보상 마일스톤 편집</div>
        ${thermoEditMilestones.map((ms, i) => `
            <div class="thermo-ms-edit-row" data-idx="${i}">
                <input type="number" class="ms-temp-input" value="${ms.temp}" min="1" max="100" />
                <span class="thermo-ms-unit">°C</span>
                <input type="text" class="ms-reward-input" value="${ms.reward}" placeholder="보상 내용" />
                <button class="thermo-ms-remove-btn" data-idx="${i}">×</button>
            </div>
        `).join('')}
        <button class="thermo-ms-add-btn" id="thermoMsAddBtn">+ 마일스톤 추가</button>
    `;

    container.querySelectorAll('.ms-temp-input').forEach((input, i) => {
        input.addEventListener('change', () => {
            thermoEditMilestones[i].temp = parseInt(input.value) || 0;
        });
    });

    container.querySelectorAll('.ms-reward-input').forEach((input, i) => {
        input.addEventListener('change', () => {
            thermoEditMilestones[i].reward = input.value.trim();
        });
    });

    container.querySelectorAll('.thermo-ms-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            thermoEditMilestones.splice(idx, 1);
            renderThermoMilestoneEditor();
        });
    });

    document.getElementById('thermoMsAddBtn')?.addEventListener('click', () => {
        const maxTemp = thermoEditMilestones.length > 0 ? Math.max(...thermoEditMilestones.map(m => m.temp)) : 0;
        thermoEditMilestones.push({ temp: Math.min(maxTemp + 10, 100), reward: '' });
        renderThermoMilestoneEditor();
    });
}

/**
 * 학생 PIN 변경 모달 표시
 */
export function showStudentPinChangeModal() {
    // 다른 모달 닫기
    window.classpet?.closeModal?.();

    const modal = document.getElementById('studentPinChangeModal');
    if (!modal) return;

    // 모달 표시
    modal.classList.remove('hidden');

    // 입력 필드 초기화
    const inputs = modal.querySelectorAll('.global-pin-input');
    inputs.forEach(input => {
        input.value = '';
        input.classList.remove('border-red-400');
    });

    // 에러 메시지 숨기기
    const errorEl = document.getElementById('globalPinChangeError');
    if (errorEl) {
        errorEl.classList.add('hidden');
        errorEl.textContent = '';
    }

    // 첫 번째 입력에 포커스
    const firstInput = modal.querySelector('.global-pin-input[data-group="current"][data-index="0"]');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }

    // PIN 입력 이벤트 바인딩
    bindGlobalPinInputs(modal);

    // 취소 버튼
    const cancelBtn = document.getElementById('globalCancelPinBtn');
    if (cancelBtn) {
        cancelBtn.onclick = () => modal.classList.add('hidden');
    }

    // 확인 버튼
    const confirmBtn = document.getElementById('globalConfirmPinBtn');
    if (confirmBtn) {
        confirmBtn.onclick = () => handleGlobalPinChange(modal);
    }

    // 배경 클릭으로 닫기
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    };
}

/**
 * 전역 PIN 입력 바인딩
 */
function bindGlobalPinInputs(modal) {
    const inputs = modal.querySelectorAll('.global-pin-input');

    inputs.forEach(input => {
        // 입력 시 다음 필드로 이동
        input.oninput = (e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = value;

            if (value && value.length === 1) {
                const group = e.target.dataset.group;
                const index = parseInt(e.target.dataset.index);

                // 같은 그룹의 다음 입력으로 이동
                let nextInput = modal.querySelector(`.global-pin-input[data-group="${group}"][data-index="${index + 1}"]`);

                // 그룹의 마지막이면 다음 그룹으로
                if (!nextInput) {
                    const groups = ['current', 'new', 'confirm'];
                    const currentGroupIndex = groups.indexOf(group);
                    if (currentGroupIndex < groups.length - 1) {
                        nextInput = modal.querySelector(`.global-pin-input[data-group="${groups[currentGroupIndex + 1]}"][data-index="0"]`);
                    }
                }

                if (nextInput) nextInput.focus();
            }
        };

        // 백스페이스로 이전 필드로 이동
        input.onkeydown = (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                const group = e.target.dataset.group;
                const index = parseInt(e.target.dataset.index);

                let prevInput = modal.querySelector(`.global-pin-input[data-group="${group}"][data-index="${index - 1}"]`);

                // 그룹의 첫 번째면 이전 그룹으로
                if (!prevInput && index === 0) {
                    const groups = ['current', 'new', 'confirm'];
                    const currentGroupIndex = groups.indexOf(group);
                    if (currentGroupIndex > 0) {
                        prevInput = modal.querySelector(`.global-pin-input[data-group="${groups[currentGroupIndex - 1]}"][data-index="3"]`);
                    }
                }

                if (prevInput) {
                    prevInput.focus();
                    prevInput.value = '';
                }
            }
        };
    });
}

/**
 * 전역 PIN 변경 처리
 */
async function handleGlobalPinChange(modal) {
    const errorEl = document.getElementById('globalPinChangeError');

    // PIN 값 수집
    const getPin = (group) => {
        const inputs = modal.querySelectorAll(`.global-pin-input[data-group="${group}"]`);
        return Array.from(inputs).map(i => i.value).join('');
    };

    const currentPin = getPin('current');
    const newPin = getPin('new');
    const confirmPin = getPin('confirm');

    // 유효성 검사
    if (currentPin.length !== 4) {
        showGlobalPinError(errorEl, '현재 PIN 4자리를 입력해주세요');
        return;
    }

    if (newPin.length !== 4) {
        showGlobalPinError(errorEl, '새 PIN 4자리를 입력해주세요');
        return;
    }

    if (newPin !== confirmPin) {
        showGlobalPinError(errorEl, '새 PIN이 일치하지 않아요');
        return;
    }

    // 현재 학생 확인
    const student = store.getCurrentStudent();
    if (!student) {
        showGlobalPinError(errorEl, '학생 정보를 찾을 수 없어요');
        return;
    }

    // 현재 PIN 확인
    if (student.pin !== currentPin) {
        showGlobalPinError(errorEl, '현재 PIN이 맞지 않아요');
        return;
    }

    try {
        // PIN 변경
        await store.updateStudentPin(student.id, newPin);

        // 모달 닫기
        modal.classList.add('hidden');

        // 성공 메시지
        showToast('PIN이 변경되었어요! 🔐', 'success');
    } catch (error) {
        console.error('PIN 변경 실패:', error);
        showGlobalPinError(errorEl, 'PIN 변경에 실패했어요');
    }
}

/**
 * 전역 PIN 에러 표시
 */
function showGlobalPinError(errorEl, message) {
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

/**
 * 학생 로그아웃 처리 (커스텀 확인 모달 사용)
 */
export function handleStudentLogout() {
    // 모든 모달 닫기
    window.classpet?.closeModal?.();
    const pinModal = document.getElementById('studentPinChangeModal');
    if (pinModal) pinModal.classList.add('hidden');

    // 커스텀 확인 모달 표시
    const modalContent = `
        <div class="text-center">
            <div class="text-4xl mb-4">🚪</div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">로그아웃</h3>
            <p class="text-gray-600 mb-6">정말 로그아웃 하시겠습니까?</p>
            <div class="flex gap-3 justify-center">
                <button id="cancelLogoutBtn" class="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors">
                    취소
                </button>
                <button id="confirmLogoutBtn" class="px-6 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">
                    로그아웃
                </button>
            </div>
        </div>
    `;

    // showModal이 있으면 사용, 없으면 직접 DOM에 모달 생성
    let closeModalFn;
    if (window.classpet?.showModal) {
        window.classpet.showModal(modalContent);
        closeModalFn = () => window.classpet?.closeModal?.();
    } else {
        // fallback: 직접 DOM에 모달 추가
        let overlay = document.getElementById('logoutModalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'logoutModalOverlay';
            overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = `<div class="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">${modalContent}</div>`;
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';

        closeModalFn = () => {
            overlay.style.display = 'none';
        };
    }

    // 버튼 이벤트 바인딩
    setTimeout(() => {
        const cancelBtn = document.getElementById('cancelLogoutBtn');
        const confirmBtn = document.getElementById('confirmLogoutBtn');

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                closeModalFn();
            };
        }

        if (confirmBtn) {
            confirmBtn.onclick = () => {
                closeModalFn();
                store.studentLogout();
                router.navigate('student-login');
            };
        }
    }, 50);
}
