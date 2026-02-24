/**
 * Firebase 알림장 관리 모듈
 */

import {
    collection,
    doc,
    setDoc,
    getDocs,
    addDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getDb,
    getCurrentTeacherUid,
    getCurrentClassId,
    getUnsubscribeFunctions,
    serverTimestamp
} from './init.js';

export async function saveNotice(teacherUid, classId, notice) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const noticesRef = collection(db, 'teachers', uid, 'classes', cId, 'notices');

        const noticeData = {
            ...notice,
            updatedAt: serverTimestamp()
        };

        if (notice.id) {
            const noticeRef = doc(db, 'teachers', uid, 'classes', cId, 'notices', String(notice.id));
            await setDoc(noticeRef, noticeData, { merge: true });
            return { id: notice.id, ...noticeData };
        } else {
            noticeData.createdAt = serverTimestamp();
            const docRef = await addDoc(noticesRef, noticeData);
            return { id: docRef.id, ...noticeData };
        }
    } catch (error) {
        console.error('알림장 저장 실패:', error);
        return null;
    }
}

export async function getAllNotices(teacherUid, classId) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const noticesRef = collection(db, 'teachers', uid, 'classes', cId, 'notices');
        const q = query(noticesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const notices = [];
        snapshot.forEach(doc => {
            notices.push({ id: doc.id, ...doc.data() });
        });

        return notices;
    } catch (error) {
        console.error('알림장 목록 가져오기 실패:', error);
        return [];
    }
}

export async function deleteNotice(teacherUid, classId, noticeId) {
    const db = getDb();
    if (!db) return false;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return false;

    try {
        await deleteDoc(doc(db, 'teachers', uid, 'classes', cId, 'notices', String(noticeId)));
        return true;
    } catch (error) {
        console.error('알림장 삭제 실패:', error);
        return false;
    }
}

/**
 * 알림장 실시간 구독 (onSnapshot)
 * @returns {Function} 구독 해제 함수
 */
export function subscribeToNotices(teacherUid, classId, callback) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const noticesRef = collection(db, 'teachers', uid, 'classes', cId, 'notices');
        const q = query(noticesRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notices = [];
            snapshot.forEach(doc => {
                notices.push({ id: doc.id, ...doc.data() });
            });
            callback(notices);
        }, (error) => {
            console.error('알림장 실시간 구독 오류:', error);
        });

        getUnsubscribeFunctions().push(unsubscribe);
        return unsubscribe;
    } catch (error) {
        console.error('알림장 구독 실패:', error);
        return null;
    }
}
