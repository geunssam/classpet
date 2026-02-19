/**
 * 알림 관리 Mixin
 */

import { STORAGE_KEYS } from './Store.js';
import { EMOTION_TYPES } from '../constants/index.js';
import { toDateString } from '../utils/dateUtils.js';

export const notificationMixin = {
    // ==================== 알림 관리 ====================

    getNotifications() {
        const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        return data ? JSON.parse(data) : null;
    },

    saveNotifications(notifications) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        this.notify('notifications', notifications);
    },

    addNotification(notification) {
        const notifications = this.getNotifications() || [];
        const newNotification = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };
        notifications.unshift(newNotification);

        if (notifications.length > 100) notifications.pop();
        this.saveNotifications(notifications);
        return newNotification;
    },

    markNotificationRead(notificationId) {
        const notifications = this.getNotifications() || [];
        const index = notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            notifications[index].read = true;
            this.saveNotifications(notifications);
        }
    },

    markAllNotificationsRead() {
        const notifications = this.getNotifications() || [];
        notifications.forEach(n => n.read = true);
        this.saveNotifications(notifications);
    },

    getUnreadNotificationCount() {
        const notifications = this.getNotifications() || [];
        return notifications.filter(n => !n.read).length;
    },

    deleteNotification(notificationId) {
        let notifications = this.getNotifications() || [];
        notifications = notifications.filter(n => n.id !== notificationId);
        this.saveNotifications(notifications);
    },

    getTodayUnreadNotifications() {
        const notifications = this.getNotifications() || [];
        const today = toDateString();
        return notifications.filter(n => !n.read && n.timestamp.startsWith(today));
    },

    createEmotionNotification(studentId, emotion, memo) {
        const student = this.getStudent(studentId);
        if (!student) return null;

        const emotionType = EMOTION_TYPES[emotion];
        const notification = {
            type: 'emotion',
            studentId,
            studentName: student.name,
            emotion,
            emotionIcon: emotionType?.icon || '😊',
            emotionName: emotionType?.name || '기분',
            memo: memo || null,
            message: `${student.name}이(가) 오늘의 기분을 알려줬어요! ${emotionType?.icon || '😊'}`
        };

        return this.addNotification(notification);
    }
};
