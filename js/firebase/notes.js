/**
 * Firebase 메모/노트 관리 모듈
 */

import {
    collection,
    doc,
    setDoc,
    getDocs,
    addDoc,
    deleteDoc,
    query,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getDb,
    getCurrentTeacherUid,
    getCurrentClassId,
    serverTimestamp
} from './init.js';

export async function saveNote(teacherUid, classId, note) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const notesRef = collection(db, 'teachers', uid, 'classes', cId, 'notes');

        const noteData = {
            ...note,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        if (note.id) {
            const noteRef = doc(db, 'teachers', uid, 'classes', cId, 'notes', String(note.id));
            await setDoc(noteRef, noteData, { merge: true });
            return { id: note.id, ...noteData };
        } else {
            const docRef = await addDoc(notesRef, noteData);
            return { id: docRef.id, ...noteData };
        }
    } catch (error) {
        console.error('메모 저장 실패:', error);
        return null;
    }
}

export async function getAllNotes(teacherUid, classId) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return [];

    try {
        const notesRef = collection(db, 'teachers', uid, 'classes', cId, 'notes');
        const q = query(notesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const notes = [];
        snapshot.forEach(doc => {
            notes.push({ id: doc.id, ...doc.data() });
        });

        return notes;
    } catch (error) {
        console.error('메모 목록 가져오기 실패:', error);
        return [];
    }
}

export async function deleteNote(teacherUid, classId, noteId) {
    const db = getDb();
    if (!db) return false;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return false;

    try {
        await deleteDoc(doc(db, 'teachers', uid, 'classes', cId, 'notes', String(noteId)));
        return true;
    } catch (error) {
        console.error('메모 삭제 실패:', error);
        return false;
    }
}
