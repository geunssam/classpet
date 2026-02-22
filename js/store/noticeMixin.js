/**
 * 알림장 관리 Mixin
 * 알림장 CRUD, Firebase 동기화, 실시간 구독
 */

import { firebase, STORAGE_KEYS } from './Store.js';
import { toDateString } from '../utils/dateUtils.js';
import { sanitizeHTML, stripHTML } from '../utils/htmlSanitizer.js';
import { showToast } from '../utils/animations.js';

export const noticeMixin = {
    // ==================== 로컬 캐시 ====================

    getNotices() {
        const data = localStorage.getItem(STORAGE_KEYS.NOTICES);
        return data ? JSON.parse(data) : [];
    },

    saveNoticesLocal(notices) {
        localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
        this.notify('notices', notices);
    },

    // ==================== CRUD ====================

    addNotice(data) {
        const notices = this.getNotices();
        const content = sanitizeHTML(data.content || '');
        const plainText = stripHTML(content);

        const newNotice = {
            id: `notice_${Date.now()}`,
            title: data.title || `${toDateString()} 알림장`,
            content,
            plainText,
            date: toDateString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        notices.unshift(newNotice);
        this.saveNoticesLocal(notices);
        this.syncNoticeToFirebase(newNotice);

        return newNotice;
    },

    deleteNoticeById(noticeId) {
        const notices = this.getNotices();
        const filtered = notices.filter(n => n.id !== noticeId);
        this.saveNoticesLocal(filtered);

        // Firebase 삭제
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (teacherUid && classId && this.firebaseEnabled) {
            firebase.deleteNotice(teacherUid, classId, noticeId).catch(err => {
                console.error('알림장 Firebase 삭제 실패:', err);
            });
        }
    },

    // ==================== Firebase 동기화 ====================

    async syncNoticeToFirebase(notice) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return;

        if (this.isOnline) {
            try {
                await firebase.saveNotice(teacherUid, classId, notice);
            } catch (error) {
                console.error('Firebase 알림장 저장 실패:', error);
                showToast('저장에 실패했어요. 나중에 다시 시도합니다.', 'warning');
                this.addToOfflineQueue({ type: 'saveNotice', teacherUid, classId, data: notice });
            }
        } else {
            this.addToOfflineQueue({ type: 'saveNotice', teacherUid, classId, data: notice });
        }
    },

    // ==================== 실시간 구독 ====================

    subscribeToNoticesRealtime(callback) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        return firebase.subscribeToNotices(teacherUid, classId, (firebaseNotices) => {
            const notices = firebaseNotices.map(n => ({
                id: n.id,
                title: n.title || '',
                content: n.content || '',
                plainText: n.plainText || '',
                date: n.date || '',
                createdAt: n.createdAt?.toDate?.()?.toISOString() || n.createdAt || '',
                updatedAt: n.updatedAt?.toDate?.()?.toISOString() || n.updatedAt || ''
            }));
            this.saveNoticesLocal(notices);
            if (callback) callback(notices);
        });
    },

    // ==================== 학생 공유 ====================

    async shareNotice(noticeId, studentIds) {
        const notices = this.getNotices();
        const notice = notices.find(n => n.id === noticeId);
        if (!notice) return false;

        notice.sharedTo = studentIds;
        notice.sharedAt = new Date().toISOString();
        this.saveNoticesLocal(notices);

        await this.syncNoticeToFirebase(notice);
        return true;
    },

    // ==================== 새 알림 감지 ====================

    getLastSeenNoticeId() {
        return localStorage.getItem(STORAGE_KEYS.LAST_SEEN_NOTICE_ID) || '';
    },

    setLastSeenNoticeId(noticeId) {
        localStorage.setItem(STORAGE_KEYS.LAST_SEEN_NOTICE_ID, noticeId || '');
    },

    getUnreadNoticeCount() {
        const notices = this.getNotices();
        if (notices.length === 0) return 0;

        const lastSeenId = this.getLastSeenNoticeId();
        if (!lastSeenId) return notices.length;

        const lastSeenIndex = notices.findIndex(n => n.id === lastSeenId);
        if (lastSeenIndex === -1) return notices.length;

        return lastSeenIndex;
    }
};
