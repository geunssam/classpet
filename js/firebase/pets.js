/**
 * Firebase 펫 관리 모듈
 */

import {
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getDb,
    getCurrentTeacherUid,
    getCurrentClassId,
    getUnsubscribeFunctions,
    serverTimestamp
} from './init.js';
import { studentSubRef, studentSubDoc } from './helpers.js';

export async function savePet(teacherUid, classId, pet) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const studentId = pet.studentId;
        const petsRef = studentSubRef(uid, cId, studentId, 'pets');

        const petData = {
            ...pet,
            teacherUid: uid,
            classId: cId,
            createdAt: pet.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        if (pet.id) {
            const petRef = studentSubDoc(uid, cId, studentId, 'pets', pet.id);
            await setDoc(petRef, petData, { merge: true });
            return { id: pet.id, ...petData };
        } else {
            const docRef = await addDoc(petsRef, petData);
            return { id: docRef.id, ...petData };
        }
    } catch (error) {
        console.error('펫 저장 실패:', error);
        return null;
    }
}

export async function getActivePet(teacherUid, classId, studentId) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return null;

    try {
        const petsRef = studentSubRef(uid, cId, studentId, 'pets');
        const q = query(
            petsRef,
            where('status', '==', 'active'),
            limit(1)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('활성 펫 조회 실패:', error);
        return null;
    }
}

export async function getCompletedPets(teacherUid, classId, studentId) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return [];

    try {
        const petsRef = studentSubRef(uid, cId, studentId, 'pets');
        const q = query(
            petsRef,
            where('status', '==', 'completed'),
            orderBy('completedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const pets = [];
        snapshot.forEach(doc => {
            pets.push({ id: doc.id, ...doc.data() });
        });
        return pets;
    } catch (error) {
        console.error('완성 펫 조회 실패:', error);
        return [];
    }
}

export async function getStudentPets(teacherUid, classId, studentId) {
    const db = getDb();
    if (!db) return [];

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return [];

    try {
        const petsRef = studentSubRef(uid, cId, studentId, 'pets');
        const q = query(
            petsRef,
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const pets = [];
        snapshot.forEach(doc => {
            pets.push({ id: doc.id, ...doc.data() });
        });
        return pets;
    } catch (error) {
        console.error('학생 펫 목록 조회 실패:', error);
        return [];
    }
}

export async function hasCompletedPetType(teacherUid, classId, studentId, petType) {
    const db = getDb();
    if (!db) return false;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId || !petType) return false;

    try {
        const petsRef = studentSubRef(uid, cId, studentId, 'pets');
        const q = query(
            petsRef,
            where('petType', '==', petType),
            where('status', '==', 'completed'),
            limit(1)
        );

        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('펫 완성 여부 확인 실패:', error);
        return false;
    }
}

export async function updatePet(teacherUid, classId, studentId, petId, updates) {
    const db = getDb();
    if (!db || !petId || !studentId) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return null;

    try {
        const petRef = studentSubDoc(uid, cId, studentId, 'pets', petId);
        await updateDoc(petRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        return { id: petId, ...updates };
    } catch (error) {
        console.error('펫 업데이트 실패:', error);
        return null;
    }
}

export async function deletePet(teacherUid, classId, studentId, petId) {
    if (!petId || !studentId) return false;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId) return false;

    try {
        await deleteDoc(studentSubDoc(uid, cId, studentId, 'pets', petId));
        return true;
    } catch (error) {
        console.error('펫 삭제 실패:', error);
        return false;
    }
}

export function subscribeToStudentPets(teacherUid, classId, studentId, callback) {
    const db = getDb();
    if (!db) return null;

    const uid = teacherUid || getCurrentTeacherUid();
    const cId = classId || getCurrentClassId();

    if (!uid || !cId || !studentId) return null;

    try {
        const petsRef = studentSubRef(uid, cId, studentId, 'pets');
        const q = query(
            petsRef,
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pets = [];
            snapshot.forEach(doc => {
                pets.push({ id: doc.id, ...doc.data() });
            });
            callback(pets);
        }, (error) => {
            console.error('펫 구독 오류:', error);
        });

        getUnsubscribeFunctions().push(unsubscribe);
        return unsubscribe;
    } catch (error) {
        console.error('펫 구독 실패:', error);
        return null;
    }
}
