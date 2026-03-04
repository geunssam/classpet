/**
 * 학생 관리 Mixin
 * 학생 CRUD, Firebase 동기화, 개인코드 관리
 */

import { firebase, STORAGE_KEYS } from '../../shared/store/Store.js';

export const studentMixin = {
    // ==================== 학생 관련 ====================

    getStudents() {
        const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        return data ? JSON.parse(data) : null;
    },

    saveStudents(students) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
        this.notify('students', students);
    },

    getStudent(studentId) {
        const students = this.getStudents() || [];
        return students.find(s => String(s.id) === String(studentId));
    },

    async addStudent(student) {
        const students = this.getStudents() || [];
        // number가 전달되면 그것을 id로 사용, 아니면 기존 숫자 ID 중 최대값+1
        const numericIds = students.map(s => s.id).filter(id => typeof id === 'number' && !isNaN(id));
        const newId = student.number || (numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1);
        const newNumber = student.number || students.length + 1;

        // 개인코드 생성
        let studentCode = null;
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (this.firebaseEnabled && teacherUid && classId) {
            studentCode = await firebase.generateStudentCode();
            if (studentCode) {
                await firebase.saveStudentCode(studentCode, {
                    teacherUid,
                    classId,
                    studentId: String(newId)
                });
            }
        }

        const newStudent = {
            id: newId,
            number: newNumber,
            studentCode: studentCode,
            exp: 0,
            level: 1,
            totalPraises: 0,
            petType: null,
            completedPets: [],
            ...student,
            // student에 studentCode가 없으면 생성한 것 사용
            studentCode: student.studentCode || studentCode
        };
        students.push(newStudent);
        students.sort((a, b) => a.number - b.number);
        this.saveStudents(students);

        // Firebase 동기화
        this.syncStudentToFirebase(newStudent);

        return newStudent;
    },

    updateStudent(studentId, updates) {
        const students = this.getStudents() || [];
        const index = students.findIndex(s => String(s.id) === String(studentId));
        if (index !== -1) {
            students[index] = { ...students[index], ...updates };
            this.saveStudents(students);

            // Firebase 동기화
            this.syncStudentToFirebase(students[index]);

            return students[index];
        }
        return null;
    },

    async deleteStudent(studentId) {
        let students = this.getStudents() || [];
        const student = students.find(s => String(s.id) === String(studentId));

        // 학생코드 삭제
        if (student?.studentCode) {
            await firebase.deleteStudentCode(student.studentCode);
        }

        students = students.filter(s => String(s.id) !== String(studentId));
        // 번호 재정렬 하지 않음 — 출석부 번호 유지
        this.saveStudents(students);

        // Firebase에서도 삭제 (계층 구조)
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (this.firebaseEnabled && teacherUid && classId) {
            firebase.deleteStudent(teacherUid, classId, studentId);
        }
    },

    /**
     * Firebase에 학생 동기화 (계층 구조)
     */
    async syncStudentToFirebase(student) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return;

        // pets 하위 컬렉션이 정본(source of truth)이므로 펫 관련 필드는 students 문서에 저장하지 않음
        const { petType, petName, exp, level, completedPets, totalPraises, ...studentData } = student;

        if (this.isOnline) {
            try {
                const result = await firebase.saveStudent(teacherUid, classId, studentData);
                // Firestore 문서 ID가 로컬 ID와 다르면 로컬 업데이트 (문자열 비교)
                if (result && String(result.id) !== String(student.id)) {
                    const students = this.getStudents() || [];
                    const idx = students.findIndex(s => String(s.id) === String(student.id));
                    if (idx !== -1) {
                        students[idx].id = result.id;
                        this.saveStudents(students);
                    }
                }
            } catch (error) {
                console.warn('학생 Firebase 동기화 실패:', error);
                this.addToOfflineQueue({ type: 'saveStudent', teacherUid, classId, data: studentData });
            }
        } else {
            this.addToOfflineQueue({ type: 'saveStudent', teacherUid, classId, data: studentData });
        }
    },

    /**
     * Firebase에서 학생 데이터 로드 (계층 구조)
     */
    async loadStudentsFromFirebase() {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            const students = await firebase.getAllStudents(teacherUid, classId);
            if (students && students.length > 0) {
                this.saveStudents(students);
                return students;
            }
            return null;
        } catch (error) {
            console.error('Firebase 학생 로드 실패:', error);
            return null;
        }
    },

    /**
     * 모든 학생 Firebase에 동기화 (계층 구조)
     */
    async syncAllStudentsToFirebase() {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return false;

        try {
            const students = this.getStudents() || [];
            await firebase.saveAllStudents(teacherUid, classId, students);
            return true;
        } catch (error) {
            console.error('학생 일괄 동기화 실패:', error);
            return false;
        }
    },

    // === 개인코드 관련 ===

    /**
     * 학생코드 재발급 (기존 코드 무효화 + 새 코드 생성)
     */
    async regenerateStudentCode(studentId) {
        const student = this.getStudent(studentId);
        if (!student) return null;

        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        // 기존 코드 삭제
        if (student.studentCode) {
            await firebase.deleteStudentCode(student.studentCode);
        }

        // 새 코드 생성
        const newCode = await firebase.generateStudentCode();
        if (!newCode) return null;

        // 새 코드 문서 생성
        await firebase.saveStudentCode(newCode, {
            teacherUid,
            classId,
            studentId: String(studentId)
        });

        // 학생 문서 업데이트
        this.updateStudent(studentId, { studentCode: newCode });

        return newCode;
    }
};
