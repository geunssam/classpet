/**
 * Firebase 감정 기록 모듈
 */

import {
    collection,
    getDocs,
    addDoc,
    getDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    collectionGroup
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getDb,
    getCurrentTeacherUid,
    getCurrentClassId,
    getUnsubscribeFunctions,
    serverTimestamp
} from './init.js';
import { studentSubRef, studentSubDoc } from './helpers.js';

export async function saveEmotion(teacherUid, classId, emotion) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const studentId = emotion.studentId;
        const emotionsRef = studentSubRef(uid, cId, studentId, 'emotions');
        const now = new Date();
        const nowISO = now.toISOString();
        const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const emotionData = {
            studentId: emotion.studentId,
            studentName: emotion.studentName || '',
            studentNumber: emotion.studentNumber || 0,
            emotion: emotion.emotion,
            memo: emotion.memo || null,
            timestamp: nowISO,
            source: emotion.source || 'teacher',
            date: localDate,
            teacherUid: uid,
            classId: cId,
            conversations: emotion.source === 'student' ? [
                {
                    studentMessage: emotion.memo || null,
                    studentAt: nowISO,
                    teacherReply: null,
                    replyAt: null,
                    read: false
                }
            ] : [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(emotionsRef, emotionData);
        return { id: docRef.id, ...emotionData };
    } catch (error) {
        console.error('감정 저장 실패:', error);
        return null;
    }
}

export async function addReplyToEmotion(teacherUid, classId, studentId, emotionId, message, conversationIndex = -1) {
    const db = getDb();
    if (!db || !emotionId || !studentId) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const emotionRef = studentSubDoc(uid, cId, studentId, 'emotions', emotionId);

        const emotionDoc = await getDoc(emotionRef);
        if (!emotionDoc.exists()) {
            console.error('감정 문서를 찾을 수 없음:', emotionId);
            return null;
        }

        const data = emotionDoc.data();
        const conversations = data.conversations || [];

        const targetIndex = conversationIndex === -1 ? conversations.length - 1 : conversationIndex;

        if (targetIndex < 0 || targetIndex >= conversations.length) {
            console.error('유효하지 않은 대화 인덱스:', targetIndex);
            return null;
        }

        const now = new Date().toISOString();
        conversations[targetIndex].teacherReply = message;
        conversations[targetIndex].replyAt = now;
        conversations[targetIndex].read = false;

        await updateDoc(emotionRef, {
            conversations: conversations,
            reply: {
                message,
                timestamp: now,
                read: false
            },
            updatedAt: serverTimestamp()
        });

        return { emotionId, conversationIndex: targetIndex, reply: message };
    } catch (error) {
        console.error('답장 저장 실패:', error);
        return null;
    }
}

export async function addStudentMessage(teacherUid, classId, studentId, emotionId, message) {
    const db = getDb();
    if (!db || !emotionId || !message || !studentId) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const emotionRef = studentSubDoc(uid, cId, studentId, 'emotions', emotionId);

        const emotionDoc = await getDoc(emotionRef);
        if (!emotionDoc.exists()) {
            console.error('감정 문서를 찾을 수 없음:', emotionId);
            return null;
        }

        const data = emotionDoc.data();
        const conversations = data.conversations || [];

        const newConversation = {
            studentMessage: message,
            studentAt: new Date().toISOString(),
            teacherReply: null,
            replyAt: null,
            read: false
        };

        conversations.push(newConversation);

        await updateDoc(emotionRef, {
            conversations: conversations,
            updatedAt: serverTimestamp()
        });

        return { emotionId, conversationIndex: conversations.length - 1, message };
    } catch (error) {
        console.error('학생 메시지 추가 실패:', error);
        return null;
    }
}

export async function getTodayEmotions(teacherUid, classId) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const emotionsGroup = collectionGroup(db, 'emotions');
        const q = query(
            emotionsGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('date', '==', today),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const emotions = [];
        snapshot.forEach(doc => {
            emotions.push({ id: doc.id, ...doc.data() });
        });

        return emotions;
    } catch (error) {
        console.error('오늘 감정 가져오기 실패:', error);
        return [];
    }
}

export async function getStudentEmotions(teacherUid, classId, studentId, limitCount = 30) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const emotionsRef = studentSubRef(uid, cId, studentId, 'emotions');
        const q = query(
            emotionsRef,
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const emotions = [];
        snapshot.forEach(doc => {
            emotions.push({ id: doc.id, ...doc.data() });
        });

        return emotions;
    } catch (error) {
        console.error('학생 감정 가져오기 실패:', error);
        return [];
    }
}

export async function getEmotionsByDate(teacherUid, classId, date) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const emotionsGroup = collectionGroup(db, 'emotions');
        const q = query(
            emotionsGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('date', '==', date),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const emotions = [];
        snapshot.forEach(doc => {
            emotions.push({ id: doc.id, ...doc.data() });
        });

        return emotions;
    } catch (error) {
        console.error('날짜별 감정 가져오기 실패:', error);
        return [];
    }
}

export function subscribeToTodayEmotions(teacherUid, classId, callback) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const emotionsGroup = collectionGroup(db, 'emotions');
        const q = query(
            emotionsGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('date', '==', today),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const emotions = [];
            snapshot.forEach(doc => {
                emotions.push({ id: doc.id, ...doc.data() });
            });
            callback(emotions);
        }, (error) => {
            console.error('감정 구독 오류:', error);
        });

        getUnsubscribeFunctions().push(unsubscribe);
        return unsubscribe;
    } catch (error) {
        console.error('감정 구독 실패:', error);
        return null;
    }
}

export function subscribeToStudentEmotions(teacherUid, classId, studentId, callback) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return null;

    try {
        const emotionsRef = collection(db, 'teachers', uid, 'classes', cId, 'students', String(studentId), 'emotions');
        const q = query(emotionsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const emotions = [];
            snapshot.forEach(doc => {
                emotions.push({ id: doc.id, ...doc.data() });
            });
            callback(emotions);
        }, (error) => {
            console.error('학생 감정 구독 오류:', error);
        });

        getUnsubscribeFunctions().push(unsubscribe);
        return unsubscribe;
    } catch (error) {
        console.error('학생 감정 구독 실패:', error);
        return null;
    }
}

export async function getAllEmotions(teacherUid, classId, limitCount = 500) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const emotionsGroup = collectionGroup(db, 'emotions');
        const q = query(
            emotionsGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const emotions = [];
        snapshot.forEach(doc => {
            emotions.push({ id: doc.id, ...doc.data() });
        });

        return emotions;
    } catch (error) {
        console.error('전체 감정 목록 가져오기 실패:', error);
        return [];
    }
}

export async function getEmotionsByType(teacherUid, classId, emotionType, limitCount = 100) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !emotionType) return [];

    try {
        const emotionsGroup = collectionGroup(db, 'emotions');
        const q = query(
            emotionsGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('emotion', '==', emotionType),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const emotions = [];
        snapshot.forEach(doc => {
            emotions.push({ id: doc.id, ...doc.data() });
        });

        return emotions;
    } catch (error) {
        console.error('감정 타입별 조회 실패:', error);
        return [];
    }
}

export async function getEmotionsByDateAndType(teacherUid, classId, date, emotionType) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !date || !emotionType) return [];

    try {
        const emotionsGroup = collectionGroup(db, 'emotions');
        const q = query(
            emotionsGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('date', '==', date),
            where('emotion', '==', emotionType),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const emotions = [];
        snapshot.forEach(doc => {
            emotions.push({ id: doc.id, ...doc.data() });
        });

        return emotions;
    } catch (error) {
        console.error('날짜+감정 타입별 조회 실패:', error);
        return [];
    }
}

export async function getUnreadReplyCount(teacherUid, classId, studentId) {
    const db = getDb();
    if (!db) return 0;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return 0;

    try {
        const emotionsRef = studentSubRef(uid, cId, studentId, 'emotions');
        const snapshot = await getDocs(emotionsRef);
        let unreadCount = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            const conversations = data.conversations || [];
            conversations.forEach(conv => {
                if (conv.teacherReply && !conv.read) {
                    unreadCount++;
                }
            });
        });

        return unreadCount;
    } catch (error) {
        console.error('미읽은 답장 수 조회 실패:', error);
        return 0;
    }
}

export async function markEmotionReplyAsRead(teacherUid, classId, studentId, emotionId, conversationIndex = -1) {
    const db = getDb();
    if (!db || !emotionId || !studentId) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const emotionRef = studentSubDoc(uid, cId, studentId, 'emotions', emotionId);

        const emotionDoc = await getDoc(emotionRef);
        if (!emotionDoc.exists()) return null;

        const data = emotionDoc.data();
        const conversations = data.conversations || [];

        if (conversationIndex === -1) {
            conversations.forEach(conv => {
                if (conv.teacherReply) {
                    conv.read = true;
                }
            });
        } else if (conversationIndex >= 0 && conversationIndex < conversations.length) {
            conversations[conversationIndex].read = true;
        }

        await updateDoc(emotionRef, {
            conversations: conversations,
            updatedAt: serverTimestamp()
        });

        return { emotionId, read: true };
    } catch (error) {
        console.error('답장 읽음 처리 실패:', error);
        return null;
    }
}
