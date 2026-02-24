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
import { deleteNotesByStudent } from './notes.js';

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
        const studentsRef = collection(db, 'teachers', uid, 'classes', cId, 'students');
        const { id, ...dataWithoutId } = student;

        // 기존 Firestore 문서 ID(문자열)가 있으면 그대로 사용, 없거나 숫자면 자동생성
        let studentRef;
        if (id != null && typeof id === 'string' && !/^\d+$/.test(id)) {
            studentRef = doc(studentsRef, id);
        } else {
            studentRef = doc(studentsRef); // 자동생성 ID
        }

        await setDoc(studentRef, {
            ...dataWithoutId,
            updatedAt: serverTimestamp()
        }, { merge: true });

        // 생성된 문서 ID 반환
        return { ...student, id: studentRef.id };
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
        const sid = String(studentId);
        const basePath = ['teachers', uid, 'classes', cId, 'students', sid];

        // 하위 컬렉션 삭제 (Firestore는 부모 삭제 시 하위 자동 삭제 안 함)
        const subCollections = ['praises', 'pets', 'emotions'];
        for (const sub of subCollections) {
            const snap = await getDocs(collection(db, ...basePath, sub));
            for (const d of snap.docs) await deleteDoc(d.ref);
        }

        // 클래스 레벨 notes에서 해당 학생 메모 삭제
        await deleteNotesByStudent(uid, cId, studentId);

        // 학생 문서 삭제
        await deleteDoc(doc(db, ...basePath));
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
