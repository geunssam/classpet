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
import { bindToolbarToggle, bindMobileDrawer, updateNotificationBadge, updateStudentNotificationBadge } from './navigation.js';

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

    // 날짜 버튼 → 감정 히스토리로 이동
    bindDateHistoryButton();

    // 툴바 토글 바인딩
    bindToolbarToggle();

    // 모바일 드로어 바인딩 (알림 표시 함수 전달)
    bindMobileDrawer(showNotifications);

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
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

        // 날짜 선택 시 감정 히스토리로 이동
        historyDatePicker.addEventListener('change', (e) => {
            const selectedDate = e.target.value; // "2025-01-22" 형식
            if (selectedDate) {
                // sessionStorage에 선택한 날짜 저장
                sessionStorage.setItem('emotionHistoryDate', selectedDate);
                // 감정 페이지로 이동
                router.navigate('emotion');
            }
        });
    }
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

            // 감정 관련 알림이면 해당 학생 상세로 이동
            const notification = notifications.find(n => n.id === notificationId);
            if (notification && notification.type === 'emotion' && notification.studentId) {
                closeModal();
                router.navigate('student', { id: notification.studentId });
            }
        });
    });
}

/**
 * 학생 알림 모달 표시 (미읽은 답장 + 새 칭찬)
 */
export function showStudentNotifications() {
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

    const hasAnyNotifications = unreadReplies.length > 0 || newPraises.length > 0;

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">🔔 알림</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="max-h-80 overflow-y-auto">
                ${hasAnyNotifications ? `
                    <div class="space-y-3">
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
                                             data-emotion-id="${emotion.id || emotion.firebaseId}">
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

    // 답장 클릭 시 읽음 처리 + 마음 탭으로 이동
    document.querySelectorAll('[data-emotion-id]').forEach(item => {
        item.addEventListener('click', () => {
            const emotionId = item.dataset.emotionId;
            store.markReplyAsRead(emotionId);
            closeModal();
            router.navigate('student-main');
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
 * 학생 PIN 변경 모달 표시
 */
function showStudentPinChangeModal() {
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
