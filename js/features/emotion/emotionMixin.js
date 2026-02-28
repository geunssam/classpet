/**
 * 감정 관리 Mixin
 * 감정 로그 CRUD, 구독, 답장, Firebase 동기화/조회
 */

import { firebase, STORAGE_KEYS } from '../../shared/store/Store.js';
import { toDateString } from '../../shared/utils/dateUtils.js';
import { showToast } from '../../shared/utils/animations.js';
import { isNegativeEmotion, mapLegacyEmotion } from '../../shared/utils/emotionHelpers.js';

export const emotionMixin = {
    // ==================== 감정 로그 관련 ====================

    getEmotionLog() {
        const data = localStorage.getItem(STORAGE_KEYS.EMOTION_LOG);
        return data ? JSON.parse(data) : null;
    },

    saveEmotionLog(log) {
        // firebaseId 기반 중복 제거
        const seen = new Set();
        const deduped = log.filter(e => {
            if (!e.firebaseId) return true;
            if (seen.has(e.firebaseId)) return false;
            seen.add(e.firebaseId);
            return true;
        });
        localStorage.setItem(STORAGE_KEYS.EMOTION_LOG, JSON.stringify(deduped));
        this.notify('emotionLog', deduped);
    },

    /**
     * 감정 체크인 추가 (conversations 배열 구조)
     * Firebase 먼저 저장 → firebaseId 확보 후 로컬 저장 (중복 방지)
     */
    async addEmotion(emotion) {
        const log = this.getEmotionLog() || [];
        const now = new Date().toISOString();

        const isStudent = emotion.source === 'student';
        const newEmotion = {
            id: Date.now(),
            timestamp: now,
            studentId: emotion.studentId,
            studentName: emotion.studentName,
            studentNumber: emotion.studentNumber,
            emotion: emotion.emotion,
            memo: emotion.memo || null,
            source: emotion.source || 'teacher',
            // conversations: 학생이 보낸 경우만 studentMessage로 저장
            conversations: isStudent ? [
                {
                    studentMessage: emotion.memo || null,
                    studentAt: now,
                    teacherReply: null,
                    replyAt: null,
                    read: false
                }
            ] : []
        };

        // Firebase 먼저 저장하여 firebaseId 확보 (실시간 구독 중복 방지)
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (teacherUid && classId && this.firebaseEnabled && this.isOnline) {
            try {
                const result = await firebase.saveEmotion(teacherUid, classId, newEmotion);
                if (result && result.id) {
                    newEmotion.firebaseId = result.id;
                }
            } catch (error) {
                console.error('Firebase 감정 저장 실패, 오프라인 큐에 추가:', error);
                showToast('저장에 실패했어요. 나중에 다시 시도합니다.', 'warning');
                this.addToOfflineQueue({ type: 'saveEmotion', teacherUid, classId, data: newEmotion });
            }
        } else if (teacherUid && classId && this.firebaseEnabled) {
            this.addToOfflineQueue({ type: 'saveEmotion', teacherUid, classId, data: newEmotion });
        }

        // 로컬에 저장 (firebaseId 포함)
        log.unshift(newEmotion);
        if (log.length > 1000) log.pop();
        this.saveEmotionLog(log);

        return newEmotion;
    },

    /**
     * 오늘 감정 기록 실시간 구독 (Firebase → 로컬 머지 + 알림 생성)
     */
    subscribeToTodayEmotions(callback) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        return firebase.subscribeToTodayEmotions(teacherUid, classId, (firebaseEmotions) => {
            // Firebase 데이터를 로컬 형식으로 변환 후 머지
            const localLog = this.getEmotionLog() || [];
            const existingFirebaseIds = new Set(localLog.map(e => e.firebaseId).filter(Boolean));
            let hasNew = false;

            firebaseEmotions.forEach(fe => {
                if (existingFirebaseIds.has(fe.id)) {
                    // 기존 데이터 업데이트 (conversations 등)
                    const idx = localLog.findIndex(e => e.firebaseId === fe.id);
                    if (idx !== -1) {
                        const localConvos = localLog[idx].conversations || [];
                        const conversations = (fe.conversations || []).map((c, i) => ({
                            ...c,
                            studentAt: c.studentAt?.toDate?.()?.toISOString() || c.studentAt,
                            replyAt: c.replyAt?.toDate?.()?.toISOString() || c.replyAt,
                            // 로컬에서 이미 읽음 처리한 상태 보존 (Firebase 동기화 지연 대응)
                            read: (localConvos[i]?.read === true) ? true : (c.read ?? false)
                        }));
                        const firstMessage = conversations[0]?.studentMessage || '';
                        const noteText = firstMessage || fe.note || fe.memo || '';
                        localLog[idx].conversations = conversations;
                        localLog[idx].note = noteText;
                        localLog[idx].memo = noteText;
                        localLog[idx].emotion = fe.emotion;
                        localLog[idx].source = fe.source || localLog[idx].source;
                        // reply 객체도 Firebase 데이터로 동기화 (로컬 read 보존)
                        if (fe.reply) {
                            const localReplyRead = localLog[idx].reply?.read === true;
                            localLog[idx].reply = {
                                message: fe.reply.message,
                                timestamp: fe.reply.timestamp?.toDate?.()?.toISOString() || fe.reply.timestamp,
                                read: localReplyRead ? true : (fe.reply.read ?? false)
                            };
                        }
                        // 기존 감정은 알림 재생성하지 않음 (onSnapshot 재트리거 시 중복 방지)
                    }
                } else {
                    // 새 데이터 추가
                    const conversations = (fe.conversations || []).map(c => ({
                        ...c,
                        studentAt: c.studentAt?.toDate?.()?.toISOString() || c.studentAt,
                        replyAt: c.replyAt?.toDate?.()?.toISOString() || c.replyAt
                    }));
                    const firstMessage = conversations[0]?.studentMessage || '';
                    const noteText = firstMessage || fe.note || fe.memo || '';
                    const newEmotion = {
                        id: Date.now() + Math.random(),
                        firebaseId: fe.id,
                        timestamp: fe.timestamp || fe.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                        studentId: fe.studentId,
                        studentName: fe.studentName,
                        studentNumber: fe.studentNumber,
                        emotion: fe.emotion,
                        note: noteText,
                        memo: noteText,
                        source: fe.source || 'student',
                        conversations
                    };
                    localLog.unshift(newEmotion);
                    hasNew = true;

                    // 학생이 보낸 감정이면 알림 생성 (firebaseId로 중복 방지)
                    if (fe.source === 'student') {
                        this.createEmotionNotification(fe.studentId, fe.emotion, noteText, fe.id);
                    }
                }
            });

            this.saveEmotionLog(localLog);
            callback(localLog);
        });
    },

    /**
     * 학생 모드: 특정 학생의 감정 기록 실시간 구독
     * 교사 답장을 실시간으로 로컬에 반영
     */
    subscribeToStudentEmotions(studentId, callback) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        return firebase.subscribeToStudentEmotions(teacherUid, classId, studentId, (firebaseEmotions) => {
            const localLog = this.getEmotionLog() || [];
            const existingFirebaseIds = new Set(localLog.map(e => e.firebaseId).filter(Boolean));

            firebaseEmotions.forEach(fe => {
                if (existingFirebaseIds.has(fe.id)) {
                    // 기존 데이터 업데이트 (conversations, reply 등)
                    const idx = localLog.findIndex(e => e.firebaseId === fe.id);
                    if (idx !== -1) {
                        const localConvos = localLog[idx].conversations || [];
                        const conversations = (fe.conversations || []).map((c, i) => ({
                            ...c,
                            studentAt: c.studentAt?.toDate?.()?.toISOString() || c.studentAt,
                            replyAt: c.replyAt?.toDate?.()?.toISOString() || c.replyAt,
                            // 로컬에서 이미 읽음 처리한 상태 보존
                            read: (localConvos[i]?.read === true) ? true : (c.read ?? false)
                        }));
                        localLog[idx].conversations = conversations;
                        // reply 객체도 동기화 (로컬 read 보존)
                        if (fe.reply) {
                            const localReplyRead = localLog[idx].reply?.read === true;
                            localLog[idx].reply = {
                                message: fe.reply.message,
                                timestamp: fe.reply.timestamp?.toDate?.()?.toISOString() || fe.reply.timestamp,
                                read: localReplyRead ? true : (fe.reply.read ?? false)
                            };
                        }
                    }
                } else {
                    // 새 데이터 추가
                    const conversations = (fe.conversations || []).map(c => ({
                        ...c,
                        studentAt: c.studentAt?.toDate?.()?.toISOString() || c.studentAt,
                        replyAt: c.replyAt?.toDate?.()?.toISOString() || c.replyAt
                    }));
                    const firstMessage = conversations[0]?.studentMessage || '';
                    const noteText = firstMessage || fe.note || fe.memo || '';
                    const newEmotion = {
                        id: Date.now() + Math.random(),
                        firebaseId: fe.id,
                        timestamp: fe.timestamp || fe.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                        studentId: fe.studentId,
                        studentName: fe.studentName,
                        studentNumber: fe.studentNumber,
                        emotion: fe.emotion,
                        note: noteText,
                        memo: noteText,
                        source: fe.source || 'student',
                        conversations,
                        reply: fe.reply ? {
                            message: fe.reply.message,
                            timestamp: fe.reply.timestamp?.toDate?.()?.toISOString() || fe.reply.timestamp,
                            read: fe.reply.read ?? false
                        } : undefined
                    };
                    localLog.unshift(newEmotion);
                }
            });

            this.saveEmotionLog(localLog);
            if (callback) callback(localLog.filter(e => String(e.studentId) === String(studentId)));
        });
    },

    getEmotionsByStudent(studentId) {
        const log = this.getEmotionLog() || [];
        return log.filter(e => String(e.studentId) === String(studentId));
    },

    getTodayEmotions() {
        const log = this.getEmotionLog() || [];
        const today = toDateString();
        return log.filter(e => {
            return toDateString(new Date(e.timestamp)) === today;
        });
    },

    getStudentsNeedingAttention() {
        const students = this.getStudents() || [];
        const todayEmotions = this.getTodayEmotions();

        return students.filter(student => {
            const emotion = todayEmotions.find(e => e.studentId === student.id);
            return emotion && isNegativeEmotion(emotion.emotion);
        });
    },

    // === 답장 관련 (conversations 배열 구조) ===

    /**
     * 교사 답장 추가 (conversations 배열의 특정 항목에)
     * @param {number|string} emotionId - 감정 기록 ID
     * @param {string} message - 답장 메시지
     * @param {number} conversationIndex - 대화 인덱스 (기본: 마지막 항목)
     */
    addReplyToEmotion(emotionId, message, conversationIndex = -1) {
        const log = this.getEmotionLog() || [];
        const eid = String(emotionId);
        const index = log.findIndex(e => String(e.id) === eid || String(e.firebaseId) === eid);

        if (index !== -1) {
            const conversations = log[index].conversations || [];
            const targetIdx = conversationIndex === -1 ? conversations.length - 1 : conversationIndex;

            if (targetIdx >= 0 && targetIdx < conversations.length) {
                const now = new Date().toISOString();
                conversations[targetIdx].teacherReply = message;
                conversations[targetIdx].replyAt = now;
                conversations[targetIdx].read = false;

                log[index].conversations = conversations;

                // 학생 페이지 호환: reply 객체도 업데이트
                log[index].reply = {
                    message,
                    timestamp: now,
                    read: false
                };

                this.saveEmotionLog(log);

                // Firebase 동기화
                const firebaseId = log[index].firebaseId || (typeof emotionId === 'string' ? emotionId : null);
                if (firebaseId) {
                    this.syncReplyToFirebase(firebaseId, log[index].studentId, message, targetIdx);
                }

                return log[index];
            }
        }
        return null;
    },

    /**
     * 학생 추가 메시지 보내기 (conversations 배열에 새 항목 추가)
     */
    addStudentMessage(emotionId, message) {
        const log = this.getEmotionLog() || [];
        const index = log.findIndex(e => e.id === emotionId || e.firebaseId === emotionId);

        if (index !== -1 && message) {
            const conversations = log[index].conversations || [];

            conversations.push({
                studentMessage: message,
                studentAt: new Date().toISOString(),
                teacherReply: null,
                replyAt: null,
                read: false
            });

            log[index].conversations = conversations;
            this.saveEmotionLog(log);

            // Firebase 동기화
            const firebaseId = log[index].firebaseId || (typeof emotionId === 'string' ? emotionId : null);
            if (firebaseId) {
                this.syncStudentMessageToFirebase(firebaseId, log[index].studentId, message);
            }

            return log[index];
        }
        return null;
    },

    /**
     * Firebase에 답장 동기화
     */
    async syncReplyToFirebase(emotionId, studentId, message, conversationIndex = -1) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            if (typeof emotionId === 'string' && emotionId.length > 10) {
                await firebase.addReplyToEmotion(teacherUid, classId, studentId, emotionId, message, conversationIndex);
            }
        } catch (error) {
            console.error('Firebase 답장 동기화 실패:', error);
        }
    },

    /**
     * Firebase에 학생 메시지 동기화
     */
    async syncStudentMessageToFirebase(emotionId, studentId, message) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            if (typeof emotionId === 'string' && emotionId.length > 10) {
                await firebase.addStudentMessage(teacherUid, classId, studentId, emotionId, message);
            }
        } catch (error) {
            console.error('Firebase 학생 메시지 동기화 실패:', error);
        }
    },

    /**
     * 답장 읽음 처리 (특정 대화 또는 전체)
     * @param {number|string} emotionId - 감정 기록 ID
     * @param {number} conversationIndex - 대화 인덱스 (-1이면 전체)
     */
    markReplyAsRead(emotionId, conversationIndex = -1) {
        const log = this.getEmotionLog() || [];
        const index = log.findIndex(e => e.id === emotionId || e.firebaseId === emotionId);

        if (index !== -1) {
            const conversations = log[index].conversations || [];

            if (conversationIndex === -1) {
                // 전체 읽음 처리
                conversations.forEach(conv => {
                    if (conv.teacherReply) {
                        conv.read = true;
                    }
                });
            } else if (conversationIndex >= 0 && conversationIndex < conversations.length) {
                // 특정 대화만 읽음 처리
                conversations[conversationIndex].read = true;
            }

            log[index].conversations = conversations;
            this.saveEmotionLog(log);

            // Firebase 동기화
            const firebaseId = log[index].firebaseId || (typeof emotionId === 'string' ? emotionId : null);
            if (firebaseId) {
                this.markReplyAsReadInFirebase(firebaseId, log[index].studentId, conversationIndex);
            }

            return log[index];
        }
        return null;
    },

    /**
     * Firebase에서 답장 읽음 처리
     */
    async markReplyAsReadInFirebase(emotionId, studentId, conversationIndex = -1) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            if (typeof emotionId === 'string' && emotionId.length > 10) {
                await firebase.markEmotionReplyAsRead(teacherUid, classId, studentId, emotionId, conversationIndex);
            }
        } catch (error) {
            console.error('Firebase 답장 읽음 처리 실패:', error);
        }
    },

    /**
     * 미읽은 답장 수 (conversations 배열에서 계산)
     */
    getUnreadReplyCount(studentId) {
        const log = this.getEmotionLog() || [];
        let count = 0;

        log.filter(e => e.studentId === studentId).forEach(e => {
            const conversations = e.conversations || [];
            conversations.forEach(conv => {
                if (conv.teacherReply && !conv.read) {
                    count++;
                }
            });
        });

        return count;
    },

    /**
     * 답장이 있는 감정 기록 가져오기
     */
    getEmotionsWithReply(studentId) {
        const log = this.getEmotionLog() || [];
        return log.filter(e => {
            if (e.studentId !== studentId) return false;
            const conversations = e.conversations || [];
            return conversations.some(conv => conv.teacherReply);
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    /**
     * 답장 대기 중인 메시지가 있는 감정 기록 (교사용)
     */
    getEmotionsWaitingReply() {
        const log = this.getEmotionLog() || [];
        return log.filter(e => {
            const conversations = e.conversations || [];
            // 마지막 대화에 teacherReply가 없으면 답장 대기 중
            const lastConv = conversations[conversations.length - 1];
            return lastConv && lastConv.studentMessage && !lastConv.teacherReply;
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    // === Firebase 추가 조회 메서드 ===

    /**
     * Firebase에서 감정 타입별 조회
     */
    async getEmotionsByTypeFromFirebase(emotionType, limitCount = 100) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return [];

        try {
            return await firebase.getEmotionsByType(teacherUid, classId, emotionType, limitCount);
        } catch (error) {
            console.error('감정 타입별 조회 실패:', error);
            return [];
        }
    },

    /**
     * Firebase에서 날짜+감정 타입별 조회
     */
    async getEmotionsByDateAndTypeFromFirebase(date, emotionType) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return [];

        try {
            return await firebase.getEmotionsByDateAndType(teacherUid, classId, date, emotionType);
        } catch (error) {
            console.error('날짜+감정 타입별 조회 실패:', error);
            return [];
        }
    }
};
