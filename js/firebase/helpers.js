/**
 * Firebase 공용 헬퍼 함수
 */

import {
    collection,
    doc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getDb } from './init.js';

/**
 * 학생 서브컬렉션 참조 헬퍼
 * 경로: /teachers/{uid}/classes/{classId}/students/{studentId}/{sub}
 */
export function studentSubRef(uid, classId, studentId, sub) {
    return collection(getDb(), 'teachers', uid, 'classes', classId, 'students', String(studentId), sub);
}

/**
 * 학생 서브컬렉션 문서 참조 헬퍼
 * 경로: /teachers/{uid}/classes/{classId}/students/{studentId}/{sub}/{docId}
 */
export function studentSubDoc(uid, classId, studentId, sub, docId) {
    return doc(getDb(), 'teachers', uid, 'classes', classId, 'students', String(studentId), sub, String(docId));
}
