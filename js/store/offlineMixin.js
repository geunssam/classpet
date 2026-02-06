/**
 * 오프라인 큐 관리 Mixin
 */

import { firebase, STORAGE_KEYS } from './Store.js';

export const offlineMixin = {
    loadOfflineQueue() {
        const queue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
        this.offlineQueue = queue ? JSON.parse(queue) : [];
    },

    saveOfflineQueue() {
        localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.offlineQueue));
    },

    addToOfflineQueue(action) {
        this.offlineQueue.push({
            ...action,
            timestamp: new Date().toISOString()
        });
        this.saveOfflineQueue();
    },

    async processOfflineQueue() {
        if (!this.isOnline || !this.firebaseEnabled || this.offlineQueue.length === 0) {
            return;
        }

        console.log(`오프라인 큐 처리 시작: ${this.offlineQueue.length}개`);

        const queue = [...this.offlineQueue];
        this.offlineQueue = [];

        for (const action of queue) {
            try {
                await this.executeQueuedAction(action);
            } catch (error) {
                console.error('큐 처리 실패:', action, error);
                this.offlineQueue.push(action);
            }
        }

        this.saveOfflineQueue();
        console.log('오프라인 큐 처리 완료');
    },

    async executeQueuedAction(action) {
        // 계층 구조: teacherUid + classId 필요
        const teacherUid = action.teacherUid || this.currentTeacherUid;
        const classId = action.classId || this.currentClassId;
        if (!teacherUid || !classId) return;

        switch (action.type) {
            case 'saveStudent':
                await firebase.saveStudent(teacherUid, classId, action.data);
                break;
            case 'saveEmotion':
                await firebase.saveEmotion(teacherUid, classId, action.data);
                break;
            case 'savePraise':
                await firebase.savePraise(teacherUid, classId, action.data);
                break;
            case 'saveTimetable':
                await firebase.saveTimetable(teacherUid, classId, action.data);
                break;
            case 'saveNote':
                await firebase.saveNote(teacherUid, classId, action.data);
                break;
        }
    }
};
