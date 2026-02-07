/**
 * 펫 관리 Mixin
 * 펫 선택/생성/완성/경험치, Firebase 연동
 */

import { firebase } from './Store.js';
import { PET_TYPES } from '../constants/index.js';

export const petMixin = {
    /**
     * 펫 선택 (새 펫 생성)
     * @param {number} studentId - 학생 ID
     * @param {string} petType - 펫 종류
     * @param {string} petName - 펫 이름 (선택)
     */
    async selectPet(studentId, petType, petName = null) {
        if (!PET_TYPES[petType]) return null;

        const student = this.getStudent(studentId);
        if (!student) return null;

        const finalPetName = petName?.trim() || PET_TYPES[petType].name;

        // 로컬 학생 데이터 업데이트 (하위 호환성)
        const updatedStudent = this.updateStudent(studentId, {
            petType,
            petName: finalPetName,
            exp: 0,
            level: 1
        });

        // Firebase pets 컬렉션에 새 펫 생성
        await this.createPetInFirebase(studentId, petType, finalPetName);

        return updatedStudent;
    },

    /**
     * Firebase에 새 펫 생성
     */
    async createPetInFirebase(studentId, petType, petName) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        const student = this.getStudent(studentId);
        if (!student) return null;

        try {
            const petData = {
                studentId: String(studentId),
                studentName: student.name,
                petType: petType,
                petName: petName,
                status: 'active',
                exp: 0,
                level: 1
            };

            const result = await firebase.savePet(teacherUid, classId, petData);
            console.log('✅ Firebase 펫 생성 완료:', result);
            return result;
        } catch (error) {
            console.error('Firebase 펫 생성 실패:', error);
            return null;
        }
    },

    hasSelectedPet(studentId) {
        const student = this.getStudent(studentId);
        // petType이 실제로 존재하고 유효한 값인지 체크 (null, undefined, 빈 문자열 제외)
        return student && !!student.petType;
    },

    /**
     * 펫 완성 및 새 펫으로 교체
     */
    async completeAndChangePet(studentId, newPetType, newPetName = null) {
        const student = this.getStudent(studentId);
        if (!student || !student.petType) return null;
        if (!PET_TYPES[newPetType]) return null;

        const completedPets = student.completedPets || [];
        completedPets.push({
            type: student.petType,
            name: student.petName || PET_TYPES[student.petType].name,
            completedAt: new Date().toISOString().split('T')[0]
        });

        const finalPetName = newPetName?.trim() || PET_TYPES[newPetType].name;

        // 로컬 학생 데이터 업데이트 (하위 호환성)
        const updatedStudent = this.updateStudent(studentId, {
            petType: newPetType,
            petName: finalPetName,
            level: 1,
            exp: 0,
            completedPets
        });

        // Firebase에서 현재 펫 완성 처리 후 새 펫 생성
        await this.completePetInFirebase(studentId);
        await this.createPetInFirebase(studentId, newPetType, finalPetName);

        return updatedStudent;
    },

    /**
     * Firebase에서 현재 활성 펫을 완성 처리
     */
    async completePetInFirebase(studentId) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            const activePet = await firebase.getActivePet(teacherUid, classId, studentId);
            if (activePet) {
                await firebase.updatePet(teacherUid, classId, studentId, activePet.id, {
                    status: 'completed',
                    completedAt: new Date().toISOString()
                });
                console.log('✅ Firebase 펫 완성 처리:', activePet.id);
            }
            return activePet;
        } catch (error) {
            console.error('Firebase 펫 완성 처리 실패:', error);
            return null;
        }
    },

    /**
     * 펫 경험치 추가 (칭찬 시 호출)
     * @param {number} studentId - 학생 ID
     * @param {number} expAmount - 추가할 경험치 (기본 10)
     */
    async addPetExp(studentId, expAmount = 10) {
        const student = this.getStudent(studentId);
        if (!student || !student.petType) return null;

        let newExp = (student.exp || 0) + expAmount;
        let newLevel = student.level || 1;
        let levelUp = false;

        // 레벨업 체크 (100 exp = 1 level)
        while (newExp >= 100 && newLevel < 5) {
            newExp -= 100;
            newLevel++;
            levelUp = true;
        }

        // 레벨 5 도달 시 exp 100으로 고정
        if (newLevel >= 5) {
            newExp = 100;
            newLevel = 5;
        }

        // 로컬 업데이트
        const updatedStudent = this.updateStudent(studentId, {
            exp: newExp,
            level: newLevel
        });

        // Firebase 펫 업데이트
        await this.updatePetExpInFirebase(studentId, newExp, newLevel);

        return { student: updatedStudent, levelUp, newLevel };
    },

    /**
     * Firebase에서 펫 경험치/레벨 업데이트
     */
    async updatePetExpInFirebase(studentId, exp, level) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            const activePet = await firebase.getActivePet(teacherUid, classId, studentId);
            if (activePet) {
                await firebase.updatePet(teacherUid, classId, studentId, activePet.id, {
                    exp,
                    level,
                    ...(level >= 5 ? { status: 'completed', completedAt: new Date().toISOString() } : {})
                });
                console.log('✅ Firebase 펫 경험치 업데이트:', { exp, level });
            }
            return activePet;
        } catch (error) {
            console.error('Firebase 펫 경험치 업데이트 실패:', error);
            return null;
        }
    },

    getCompletedPets(studentId) {
        const student = this.getStudent(studentId);
        return student?.completedPets || [];
    },

    hasCompletedPet(studentId, petType) {
        const completedPets = this.getCompletedPets(studentId);
        return completedPets.some(p => p.type === petType);
    },

    hasPet(studentId, petType) {
        const student = this.getStudent(studentId);
        if (!student) return false;
        return student.petType === petType || this.hasCompletedPet(studentId, petType);
    },

    /**
     * Firebase에서 학생의 펫 데이터 로드
     */
    async loadPetsFromFirebase(studentId) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            // 활성 펫 로드
            const activePet = await firebase.getActivePet(teacherUid, classId, studentId);

            // 완성된 펫 목록 로드
            const completedPets = await firebase.getCompletedPets(teacherUid, classId, studentId);

            // 로컬 학생 데이터에 반영
            if (activePet || completedPets.length > 0) {
                const updates = {};

                if (activePet) {
                    updates.petType = activePet.petType;
                    updates.petName = activePet.petName;
                    updates.exp = activePet.exp || 0;
                    updates.level = activePet.level || 1;
                }

                if (completedPets.length > 0) {
                    updates.completedPets = completedPets.map(p => ({
                        type: p.petType,
                        name: p.petName,
                        completedAt: p.completedAt
                    }));
                }

                this.updateStudent(studentId, updates);
            }

            return { activePet, completedPets };
        } catch (error) {
            console.error('Firebase 펫 로드 실패:', error);
            return null;
        }
    },

    /**
     * 학생의 펫 실시간 구독 (PetService에서 호출)
     */
    subscribeToStudentPets(studentId, callback) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;
        return firebase.subscribeToStudentPets(teacherUid, classId, studentId, callback);
    },

    /**
     * Firebase에서 학생의 활성 펫 가져오기
     */
    async getActivePetFromFirebase(studentId) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            return await firebase.getActivePet(teacherUid, classId, studentId);
        } catch (error) {
            console.error('Firebase 활성 펫 조회 실패:', error);
            return null;
        }
    },

    /**
     * Firebase에서 학생의 완성된 펫 도감 가져오기
     */
    async getCompletedPetsFromFirebase(studentId) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return [];

        try {
            return await firebase.getCompletedPets(teacherUid, classId, studentId);
        } catch (error) {
            console.error('Firebase 완성 펫 조회 실패:', error);
            return [];
        }
    }
};
