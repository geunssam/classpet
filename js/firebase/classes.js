/**
 * Firebase 학급 관리 모듈
 */

import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getDb,
    getCurrentTeacherUid,
    getCurrentClassId,
    setCurrentTeacherUid,
    serverTimestamp
} from './init.js';
import { getCurrentUser } from './auth.js';

/**
 * 새 학급 코드 생성 (6자리 영숫자)
 */
export function generateClassCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * 새 학급 생성
 */
export async function createClass(classData) {
    const db = getDb();
    if (!db) return null;

    const user = getCurrentUser();
    if (!user || user.isAnonymous) {
        console.error('학급 생성: 교사 로그인 필요');
        return null;
    }

    try {
        let classCode = generateClassCode();
        let codeExists = true;
        let attempts = 0;

        while (codeExists && attempts < 10) {
            const codeRef = doc(db, 'classCodes', classCode);
            const codeDoc = await getDoc(codeRef);
            codeExists = codeDoc.exists();
            if (codeExists) {
                classCode = generateClassCode();
                attempts++;
            }
        }

        const teacherUid = user.uid;
        const classRef = doc(collection(db, 'teachers', teacherUid, 'classes'));
        const classId = classRef.id;

        const newClass = {
            classCode: classCode,
            className: classData.className || '우리 반',
            schoolYear: classData.schoolYear || new Date().getFullYear(),
            semester: classData.semester || 1,
            teacherName: classData.teacherName || user.displayName || '선생님',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(classRef, newClass);

        await setDoc(doc(db, 'classCodes', classCode), {
            teacherUid: teacherUid,
            classId: classId,
            createdAt: serverTimestamp()
        });

        if (classData.students && Array.isArray(classData.students)) {
            const studentsRef = collection(db, 'teachers', teacherUid, 'classes', classId, 'students');

            for (const student of classData.students) {
                const studentDoc = doc(studentsRef);
                await setDoc(studentDoc, {
                    number: student.number,
                    name: student.name,
                    pin: student.pin || String(student.number).padStart(4, '0'),
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            console.log(`학생 ${classData.students.length}명 추가 완료`);
        }

        setCurrentTeacherUid(teacherUid);

        console.log('학급 생성 완료:', teacherUid, classId, classCode);
        return { id: classId, teacherUid, studentCount: classData.students?.length || 0, ...newClass };
    } catch (error) {
        console.error('학급 생성 실패:', error);
        return null;
    }
}

/**
 * 교사의 모든 학급 가져오기
 */
export async function getTeacherClasses(uid) {
    const db = getDb();
    if (!db || !uid) return [];

    try {
        const classesRef = collection(db, 'teachers', uid, 'classes');
        const snapshot = await getDocs(classesRef);

        const classes = [];
        snapshot.forEach(doc => {
            classes.push({ id: doc.id, teacherUid: uid, ...doc.data() });
        });

        for (const cls of classes) {
            const studentsRef = collection(db, 'teachers', uid, 'classes', cls.id, 'students');
            const studentsSnapshot = await getDocs(studentsRef);
            cls.studentCount = studentsSnapshot.size;
        }

        classes.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime - aTime;
        });

        return classes;
    } catch (error) {
        console.error('학급 목록 조회 실패:', error);
        return [];
    }
}

/**
 * 학급 정보 가져오기
 */
export async function getClass(teacherUid, classId) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const classRef = doc(db, 'teachers', uid, 'classes', cId);
        const classDoc = await getDoc(classRef);

        if (classDoc.exists()) {
            return { id: classDoc.id, teacherUid: uid, ...classDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('학급 조회 실패:', error);
        return null;
    }
}

/**
 * 학급코드로 학급 정보 조회
 */
export async function getClassIdByCode(code) {
    const db = getDb();
    if (!db || !code) return null;

    try {
        const codeRef = doc(db, 'classCodes', code.toUpperCase());
        const codeDoc = await getDoc(codeRef);

        if (codeDoc.exists()) {
            const data = codeDoc.data();
            return { teacherUid: data.teacherUid, classId: data.classId };
        }
        return null;
    } catch (error) {
        console.error('학급코드 조회 실패:', error);
        return null;
    }
}

export async function validateClassCode(code) {
    const result = await getClassIdByCode(code);
    return !!result && !!result.classId && !!result.teacherUid;
}

/**
 * 학급 정보 업데이트
 */
export async function updateClass(teacherUid, classId, updates) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const classRef = doc(db, 'teachers', uid, 'classes', cId);
        await updateDoc(classRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        return { id: cId, teacherUid: uid, ...updates };
    } catch (error) {
        console.error('학급 업데이트 실패:', error);
        return null;
    }
}

/**
 * 학급 삭제 (하위 컬렉션 포함 재귀 삭제)
 */
export async function deleteClass(teacherUid, classId) {
    const db = getDb();
    if (!db) return false;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return false;

    try {
        const classData = await getClass(uid, cId);

        const studentsRef = collection(db, 'teachers', uid, 'classes', cId, 'students');
        const studentsSnap = await getDocs(studentsRef);

        for (const studentDoc of studentsSnap.docs) {
            const sid = studentDoc.id;
            const emotionsRef = collection(db, 'teachers', uid, 'classes', cId, 'students', sid, 'emotions');
            const emotionsSnap = await getDocs(emotionsRef);
            for (const emotionDoc of emotionsSnap.docs) {
                await deleteDoc(emotionDoc.ref);
            }
            const petsRef = collection(db, 'teachers', uid, 'classes', cId, 'students', sid, 'pets');
            const petsSnap = await getDocs(petsRef);
            for (const petDoc of petsSnap.docs) {
                await deleteDoc(petDoc.ref);
            }
            await deleteDoc(studentDoc.ref);
        }

        await deleteDoc(doc(db, 'teachers', uid, 'classes', cId));

        if (classData?.classCode) {
            await deleteDoc(doc(db, 'classCodes', classData.classCode));
        }

        console.log('학급 삭제 완료 (하위 데이터 포함):', uid, cId);
        return true;
    } catch (error) {
        console.error('학급 삭제 실패:', error);
        return false;
    }
}

/**
 * 학급 문서 실시간 구독
 * teachers/{uid}/classes/{classId} 문서 변경 시 콜백 호출
 * @returns {Function} 구독 해제 함수
 */
export function subscribeToClassDoc(teacherUid, classId, callback) {
    const db = getDb();
    if (!db || !teacherUid || !classId) return null;

    try {
        const classRef = doc(db, 'teachers', teacherUid, 'classes', classId);
        return onSnapshot(classRef, (docSnap) => {
            if (docSnap.exists()) {
                callback({ id: docSnap.id, teacherUid, ...docSnap.data() });
            }
        }, (error) => {
            console.error('학급 문서 실시간 구독 오류:', error);
        });
    } catch (error) {
        console.error('학급 문서 구독 설정 실패:', error);
        return null;
    }
}
