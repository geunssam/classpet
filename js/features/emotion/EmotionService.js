/**
 * EmotionService - Firebase 감정 구독 중앙 관리
 * 단일 Firebase 구독으로 배지 갱신 + 컴포넌트 알림 처리
 */

import { store } from '../store.js';
import { updateNotificationBadge } from '../app/navigation.js';

let unsubscribe = null;
const listeners = new Set();

/** Firebase 감정 구독 시작 (학급 전환 시에도 호출) */
export function startEmotionSubscription() {
    stopEmotionSubscription();
    if (!store.isTeacherLoggedIn() || !store.isFirebaseEnabled()) return;

    unsubscribe = store.subscribeToTodayEmotions((emotions) => {
        // 배지 갱신
        updateNotificationBadge();
        // 등록된 리스너 호출 (에러 격리)
        listeners.forEach(cb => {
            try { cb(emotions); } catch (e) { console.error('EmotionService listener error:', e); }
        });
    });
    if (unsubscribe) console.log('EmotionService: 감정 구독 시작');
}

/** 구독 해제 */
export function stopEmotionSubscription() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
        console.log('EmotionService: 감정 구독 해제');
    }
}

/** 리스너 등록 (Emotion.js 등 컴포넌트에서 사용) */
export function onEmotionUpdate(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}
