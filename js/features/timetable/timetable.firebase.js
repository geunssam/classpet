/**
 * Firebase 시간표 관리 모듈
 */

import {
    doc,
    setDoc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getDb,
    getCurrentTeacherUid,
    getCurrentClassId,
    serverTimestamp
} from '../../shared/firebase/init.js';

export async function saveTimetable(teacherUid, classId, timetable) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const timetableRef = doc(db, 'teachers', uid, 'classes', cId, 'timetable', 'schedule');
        await setDoc(timetableRef, {
            ...timetable,
            updatedAt: serverTimestamp()
        });

        return timetable;
    } catch (error) {
        console.error('시간표 저장 실패:', error);
        return null;
    }
}

export async function getTimetable(teacherUid, classId) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const timetableRef = doc(db, 'teachers', uid, 'classes', cId, 'timetable', 'schedule');
        const timetableDoc = await getDoc(timetableRef);

        if (timetableDoc.exists()) {
            const data = timetableDoc.data();
            const { updatedAt, ...timetable } = data;
            return timetable;
        }
        return null;
    } catch (error) {
        console.error('시간표 가져오기 실패:', error);
        return null;
    }
}

export async function saveTimetableOverrides(teacherUid, classId, overrides) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const overridesRef = doc(db, 'teachers', uid, 'classes', cId, 'timetable', 'overrides');
        await setDoc(overridesRef, {
            data: overrides,
            updatedAt: serverTimestamp()
        });

        console.log('시간표 오버라이드 저장 완료');
        return overrides;
    } catch (error) {
        console.error('시간표 오버라이드 저장 실패:', error);
        return null;
    }
}

export async function getTimetableOverrides(teacherUid, classId) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const overridesRef = doc(db, 'teachers', uid, 'classes', cId, 'timetable', 'overrides');
        const overridesDoc = await getDoc(overridesRef);

        if (overridesDoc.exists()) {
            return overridesDoc.data().data || {};
        }
        return {};
    } catch (error) {
        console.error('시간표 오버라이드 가져오기 실패:', error);
        return {};
    }
}

export async function saveSubjectColors(teacherUid, classId, colors) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const colorsRef = doc(db, 'teachers', uid, 'classes', cId, 'timetable', 'subjectColors');
        await setDoc(colorsRef, {
            data: colors,
            updatedAt: serverTimestamp()
        });
        return colors;
    } catch (error) {
        console.error('과목 색상 저장 실패:', error);
        return null;
    }
}

export async function getSubjectColors(teacherUid, classId) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const colorsRef = doc(db, 'teachers', uid, 'classes', cId, 'timetable', 'subjectColors');
        const colorsDoc = await getDoc(colorsRef);

        if (colorsDoc.exists()) {
            return colorsDoc.data().data || {};
        }
        return null;
    } catch (error) {
        console.error('과목 색상 가져오기 실패:', error);
        return null;
    }
}
