/**
 * Firebase 칭찬 기록 모듈
 */

import {
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    collectionGroup,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getDb,
    getCurrentTeacherUid,
    getCurrentClassId,
    serverTimestamp,
    getUnsubscribeFunctions
} from '../../shared/firebase/init.js';
import { studentSubRef } from '../../shared/firebase/helpers.js';
import { toDateString } from '../../shared/utils/dateUtils.js';

export async function savePraise(teacherUid, classId, praise) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const studentId = praise.studentId;
        const praisesRef = studentSubRef(uid, cId, studentId, 'praises');

        const praiseData = {
            ...praise,
            date: toDateString(praise.timestamp ? new Date(praise.timestamp) : new Date()),
            teacherUid: uid,
            classId: cId,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(praisesRef, praiseData);
        return { id: docRef.id, ...praiseData };
    } catch (error) {
        console.error('칭찬 저장 실패:', error);
        return null;
    }
}

export async function getTodayPraises(teacherUid, classId) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const today = toDateString();
        const praisesGroup = collectionGroup(db, 'praises');
        const q = query(
            praisesGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('date', '==', today),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const praises = [];
        snapshot.forEach(doc => {
            praises.push({ id: doc.id, ...doc.data() });
        });

        return praises;
    } catch (error) {
        console.error('오늘 칭찬 가져오기 실패:', error);
        return [];
    }
}

export async function getAllPraises(teacherUid, classId, limitCount = 500) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const praisesGroup = collectionGroup(db, 'praises');
        const q = query(
            praisesGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const praises = [];
        snapshot.forEach(doc => {
            praises.push({ id: doc.id, ...doc.data() });
        });

        return praises;
    } catch (error) {
        console.error('칭찬 목록 가져오기 실패:', error);
        return [];
    }
}

export async function getPraisesByCategory(teacherUid, classId, category, limitCount = 100) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !category) return [];

    try {
        const praisesGroup = collectionGroup(db, 'praises');
        const q = query(
            praisesGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('category', '==', category),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const praises = [];
        snapshot.forEach(doc => {
            praises.push({ id: doc.id, ...doc.data() });
        });

        return praises;
    } catch (error) {
        console.error('카테고리별 칭찬 조회 실패:', error);
        return [];
    }
}

export async function getPraisesByDate(teacherUid, classId, date) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !date) return [];

    try {
        const praisesGroup = collectionGroup(db, 'praises');
        const q = query(
            praisesGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('date', '==', date),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const praises = [];
        snapshot.forEach(doc => {
            praises.push({ id: doc.id, ...doc.data() });
        });

        return praises;
    } catch (error) {
        console.error('날짜별 칭찬 조회 실패:', error);
        return [];
    }
}

export async function getPraisesByDateAndCategory(teacherUid, classId, date, category) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !date || !category) return [];

    try {
        const praisesGroup = collectionGroup(db, 'praises');
        const q = query(
            praisesGroup,
            where('teacherUid', '==', uid),
            where('classId', '==', cId),
            where('date', '==', date),
            where('category', '==', category),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const praises = [];
        snapshot.forEach(doc => {
            praises.push({ id: doc.id, ...doc.data() });
        });

        return praises;
    } catch (error) {
        console.error('날짜+카테고리별 칭찬 조회 실패:', error);
        return [];
    }
}

export async function getStudentPraises(teacherUid, classId, studentId, limitCount = 100) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return [];

    try {
        const praisesRef = studentSubRef(uid, cId, studentId, 'praises');
        const q = query(
            praisesRef,
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const praises = [];
        snapshot.forEach(doc => {
            praises.push({ id: doc.id, ...doc.data() });
        });

        return praises;
    } catch (error) {
        console.error('학생별 칭찬 조회 실패:', error);
        return [];
    }
}

export async function getStudentPraisesByCategory(teacherUid, classId, studentId, category) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId || !category) return [];

    try {
        const praisesRef = studentSubRef(uid, cId, studentId, 'praises');
        const q = query(
            praisesRef,
            where('category', '==', category),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const praises = [];
        snapshot.forEach(doc => {
            praises.push({ id: doc.id, ...doc.data() });
        });

        return praises;
    } catch (error) {
        console.error('학생+카테고리별 칭찬 조회 실패:', error);
        return [];
    }
}

export function subscribeToStudentPraises(teacherUid, classId, studentId, callback) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return null;

    try {
        const praisesRef = studentSubRef(uid, cId, studentId, 'praises');
        const q = query(praisesRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const praises = [];
            snapshot.forEach(doc => {
                praises.push({ id: doc.id, ...doc.data() });
            });
            callback(praises);
        }, (error) => {
            console.error('학생 칭찬 구독 오류:', error);
        });

        getUnsubscribeFunctions().push(unsubscribe);
        return unsubscribe;
    } catch (error) {
        console.error('학생 칭찬 구독 실패:', error);
        return null;
    }
}
