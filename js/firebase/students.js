/**
 * Firebase 학생 관리 모듈
 */

import {
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getDb,
    getCurrentTeacherUid,
    getCurrentClassId,
    getUnsubscribeFunctions,
    serverTimestamp
} from './init.js';

/**
 * 학생 저장
 */
export async function saveStudent(teacherUid, classId, student) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const studentId = String(student.id);
        const studentRef = doc(db, 'teachers', uid, 'classes', cId, 'students', studentId);

        await setDoc(studentRef, {
            ...student,
            updatedAt: serverTimestamp()
        }, { merge: true });

        return student;
    } catch (error) {
        console.error('학생 저장 실패:', error);
        return null;
    }
}

/**
 * 모든 학생 저장 (배치)
 */
export async function saveAllStudents(teacherUid, classId, students) {
    const db = getDb();
    if (!db || !students?.length) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const promises = students.map(student => saveStudent(uid, cId, student));
        await Promise.all(promises);
        return students;
    } catch (error) {
        console.error('학생 일괄 저장 실패:', error);
        return null;
    }
}

/**
 * 모든 학생 가져오기
 */
export async function getAllStudents(teacherUid, classId) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const studentsRef = collection(db, 'teachers', uid, 'classes', cId, 'students');
        const snapshot = await getDocs(studentsRef);

        const students = [];
        const seenNumbers = new Set();
        snapshot.forEach(doc => {
            // 숫자로만 구성된 ID만 숫자로 변환 (parseInt("6BUG...")=6 방지)
            const id = /^\d+$/.test(doc.id) ? parseInt(doc.id) : doc.id;
            const data = { ...doc.data(), id };

            // number 기준 중복 제거 (숫자 ID 문서 우선, 자동생성 ID 문서 스킵)
            const num = data.number;
            if (num != null && seenNumbers.has(num)) return;
            if (num != null) seenNumbers.add(num);

            students.push(data);
        });

        students.sort((a, b) => a.number - b.number);
        return students;
    } catch (error) {
        console.error('학생 목록 가져오기 실패:', error);
        return [];
    }
}

/**
 * 학생 삭제
 */
export async function deleteStudent(teacherUid, classId, studentId) {
    const db = getDb();
    if (!db) return false;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return false;

    try {
        await deleteDoc(doc(db, 'teachers', uid, 'classes', cId, 'students', String(studentId)));
        return true;
    } catch (error) {
        console.error('학생 삭제 실패:', error);
        return false;
    }
}

/**
 * 학생 데이터 실시간 구독
 */
export function subscribeToStudents(teacherUid, classId, callback) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const studentsRef = collection(db, 'teachers', uid, 'classes', cId, 'students');
        const unsubscribe = onSnapshot(studentsRef, (snapshot) => {
            const students = [];
            const seenNumbers = new Set();
            snapshot.forEach(doc => {
                // 숫자로만 구성된 ID만 숫자로 변환 (parseInt("6BUG...")=6 방지)
                const id = /^\d+$/.test(doc.id) ? parseInt(doc.id) : doc.id;
                const data = { ...doc.data(), id };

                // number 기준 중복 제거 (숫자 ID 문서 우선, 자동생성 ID 문서 스킵)
                const num = data.number;
                if (num != null && seenNumbers.has(num)) return;
                if (num != null) seenNumbers.add(num);

                students.push(data);
            });
            students.sort((a, b) => a.number - b.number);
            callback(students);
        }, (error) => {
            console.error('학생 구독 오류:', error);
        });

        getUnsubscribeFunctions().push(unsubscribe);
        return unsubscribe;
    } catch (error) {
        console.error('학생 구독 실패:', error);
        return null;
    }
}
