/**
 * 학급 관리 Mixin
 * 학급 생성/삭제/참가, 교사UID/학급ID 관리, Firebase 데이터 로드
 */

import { firebase, STORAGE_KEYS } from '../../shared/store/Store.js';

export const classMixin = {
    /**
     * 현재 교사 UID 설정
     */
    setCurrentTeacherUid(uid) {
        this.currentTeacherUid = uid;
        firebase.setCurrentTeacherUid(uid);
        localStorage.setItem(STORAGE_KEYS.CURRENT_TEACHER_UID, uid || '');
    },

    /**
     * 현재 교사 UID 가져오기
     */
    getCurrentTeacherUid() {
        return this.currentTeacherUid || firebase.getCurrentTeacherUid();
    },

    /**
     * 현재 학급 ID 설정
     */
    setCurrentClassId(classId) {
        // 학급 전환 시 이전 학급의 Firebase 구독 해제
        if (this.currentClassId && this.currentClassId !== classId) {
            this.unsubscribeAllFirebase();
        }
        this.currentClassId = classId;
        firebase.setCurrentClassId(classId);
        localStorage.setItem(STORAGE_KEYS.CURRENT_CLASS_ID, classId || '');
        this.notify('classChange', classId);
    },

    /**
     * 현재 학급 ID 가져오기
     */
    getCurrentClassId() {
        return this.currentClassId || firebase.getCurrentClassId();
    },

    /**
     * 현재 학급 전체 정보 (teacherUid + classId) 설정
     */
    setCurrentClass(teacherUid, classId) {
        this.setCurrentTeacherUid(teacherUid);
        this.setCurrentClassId(classId);
    },

    /**
     * 현재 학급 데이터 설정
     */
    setCurrentClassData(classData) {
        this.currentClassData = classData;
        // classData에 teacherUid가 있으면 자동으로 설정
        if (classData?.teacherUid) {
            this.setCurrentTeacherUid(classData.teacherUid);
        }
    },

    /**
     * 현재 학급 데이터 가져오기
     */
    getCurrentClassData() {
        return this.currentClassData;
    },

    /**
     * 새 학급 생성 (계층 구조)
     */
    async createClass(classData) {
        // Firebase 상태 재확인 (타임아웃으로 인한 상태 불일치 방지)
        if (!this.firebaseEnabled && firebase.isFirebaseInitialized()) {
            this.firebaseEnabled = true;
            console.log('Firebase 상태 재동기화: 활성화');
        }

        if (!this.firebaseEnabled) {
            return { success: false, error: 'Firebase가 활성화되지 않았습니다' };
        }

        try {
            const newClass = await firebase.createClass(classData);
            if (newClass) {
                // 계층 구조: teacherUid + classId 저장
                this.setCurrentClass(newClass.teacherUid, newClass.id);
                this.setCurrentClassData(newClass);
                // 로컬 설정도 업데이트
                this.updateSettings({
                    ...classData,
                    classCode: newClass.classCode,
                    classId: newClass.id,
                    teacherUid: newClass.teacherUid
                });
                return { success: true, classId: newClass.id, teacherUid: newClass.teacherUid, classData: newClass };
            }
            return { success: false, error: '학급 생성에 실패했어요' };
        } catch (error) {
            console.error('학급 생성 실패:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 학급 삭제
     */
    async deleteClass(classId) {
        if (!this.firebaseEnabled) {
            return { success: false, error: 'Firebase가 활성화되지 않았습니다' };
        }

        try {
            const teacherUid = this.getCurrentTeacherUid();
            if (!teacherUid) {
                return { success: false, error: '교사 정보를 찾을 수 없습니다' };
            }

            const result = await firebase.deleteClass(teacherUid, classId);
            if (result) {
                // 현재 선택된 학급이 삭제된 학급이면 초기화
                if (this.getCurrentClassId() === classId) {
                    this.setCurrentClassId(null);
                }
                return { success: true };
            }
            return { success: false, error: '학급 삭제에 실패했어요' };
        } catch (error) {
            console.error('학급 삭제 실패:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 교사의 모든 학급 가져오기
     */
    async getTeacherClasses() {
        // Firebase 초기화 대기 (최대 3초)
        if (!firebase.isFirebaseInitialized()) {
            for (let i = 0; i < 30; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                if (firebase.isFirebaseInitialized()) break;
            }
        }

        // Firebase 상태 재확인 (타임아웃으로 인한 상태 불일치 방지)
        if (!this.firebaseEnabled && firebase.isFirebaseInitialized()) {
            this.firebaseEnabled = true;
            console.log('🔥 Firebase 연동: 활성화 (getTeacherClasses)');
        }

        // uid 가져오기: Firebase 우선, 없으면 세션에서
        let uid = this.getCurrentUser()?.uid;
        if (!uid) {
            const session = this.getTeacherSession();
            uid = session?.uid;
        }

        if (!uid || !this.firebaseEnabled) {
            console.log('학급 목록 조회 불가: uid=', uid, 'firebaseEnabled=', this.firebaseEnabled);
            return [];
        }

        try {
            return await firebase.getTeacherClasses(uid);
        } catch (error) {
            console.error('학급 목록 조회 실패:', error);
            return [];
        }
    },

    /**
     * 학급 참가 (학생용) - StudentLogin.js에서 호출
     * @param {string} code - 6자리 학급코드
     * @returns {boolean} 성공 여부
     */
    async joinClass(code) {
        try {
            // Firebase 상태 재확인 (타임아웃으로 인한 상태 불일치 방지)
            if (!this.firebaseEnabled && firebase.isFirebaseInitialized()) {
                this.firebaseEnabled = true;
                console.log('Firebase 상태 재동기화: 활성화 (joinClass)');
            }

            // 항상 Firebase에서 학급 참가 시도 (학생 QR 스캔 시에도 동작하도록)
            // joinClassByCode 내부에서 익명 인증 후 Firebase 초기화됨
            try {
                const classData = await this.joinClassByCode(code);
                if (classData) {
                    // Firebase 활성화
                    this.firebaseEnabled = true;
                    // Firebase에서 학생 목록 로드
                    await this.loadClassDataFromFirebase();
                    return true;
                }
            } catch (firebaseError) {
                console.warn('Firebase 학급 참가 실패, 오프라인 모드로 전환:', firebaseError);
            }

            // Firebase 실패 시 오프라인 모드로 폴백
            // 로컬에 이미 같은 학급 코드가 있으면 성공
            const settings = this.getSettings();
            if (settings?.classCode === code) {
                return true;
            }

            // 새 학급코드 저장 (오프라인 모드) - Firebase 실패 시에만
            // 단, Firebase가 단순히 초기화 안 된 상태가 아니라 실제로 학급을 못 찾은 경우
            // 이 경우는 false를 반환해야 함
            return false;
        } catch (error) {
            console.error('학급 참가 오류:', error);
            return false;
        }
    },

    /**
     * 학급코드로 학급 참가 (학생용) - Firebase 전용 (계층 구조)
     */
    async joinClassByCode(code) {
        try {
            // 익명 인증 (Firebase가 초기화되지 않았어도 이 과정에서 초기화됨)
            await firebase.signInAnonymouslyIfNeeded();

            // 학급코드로 teacherUid + classId 조회 (계층 구조)
            const classInfo = await firebase.getClassIdByCode(code);
            if (!classInfo || !classInfo.teacherUid || !classInfo.classId) {
                console.warn('유효하지 않은 학급코드:', code);
                return null;
            }

            const { teacherUid, classId } = classInfo;

            // 학급 정보 가져오기 (계층 구조)
            const classData = await firebase.getClass(teacherUid, classId);
            if (!classData) {
                console.warn('학급 정보를 찾을 수 없음:', teacherUid, classId);
                return null;
            }

            // 현재 학급으로 설정 (계층 구조: teacherUid + classId)
            this.setCurrentClass(teacherUid, classId);
            this.setCurrentClassData(classData);

            // 로컬 설정 업데이트
            this.updateSettings({
                className: classData.className,
                schoolYear: classData.schoolYear,
                semester: classData.semester,
                classCode: classData.classCode,
                classId: classId,
                teacherUid: teacherUid
            });

            // getClassCode()가 올바른 값을 반환하도록 동기화
            firebase.setClassCode(classData.classCode);

            return classData;
        } catch (error) {
            console.error('학급 참가 실패:', error);
            return null;
        }
    },

    /**
     * 학급코드 유효성 검사
     */
    async validateClassCode(code) {
        if (!this.firebaseEnabled) return false;
        return await firebase.validateClassCode(code);
    },

    /**
     * 오늘의 한마디 가져오기
     */
    getDailyMessage() {
        return this.currentClassData?.dailyMessage?.text || '';
    },

    /**
     * 오늘의 한마디 설정 (Firebase class 문서에 저장)
     */
    async setDailyMessage(text) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return false;

        try {
            const update = text
                ? { dailyMessage: { text, updatedAt: new Date().toISOString() } }
                : { dailyMessage: null };
            await firebase.updateClass(teacherUid, classId, update);
            // 로컬 캐시도 업데이트
            if (this.currentClassData) {
                this.currentClassData.dailyMessage = text ? update.dailyMessage : null;
            }
            return true;
        } catch (error) {
            console.error('한마디 저장 실패:', error);
            return false;
        }
    },

    /**
     * 학급 문서 실시간 구독 (학생 모드에서 한마디 등 실시간 반영)
     */
    subscribeToClassDoc(callback) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;
        return firebase.subscribeToClassDoc(teacherUid, classId, (classData) => {
            // 로컬 캐시 업데이트
            if (classData) {
                this.currentClassData = { ...this.currentClassData, ...classData };
            }
            if (callback) callback(classData);
        });
    },

    /**
     * Firebase에서 현재 학급 데이터 로드 (학생 목록 등) - 계층 구조
     */
    async loadClassDataFromFirebase() {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId) return false;

        // Firebase 초기화 대기 (최대 3초) — getTeacherClasses()와 동일 패턴
        if (!firebase.isFirebaseInitialized()) {
            for (let i = 0; i < 30; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                if (firebase.isFirebaseInitialized()) break;
            }
        }
        // Firebase 상태 재확인
        if (!this.firebaseEnabled && firebase.isFirebaseInitialized()) {
            this.firebaseEnabled = true;
            console.log('🔥 Firebase 연동: 활성화 (loadClassDataFromFirebase)');
        }
        if (!this.firebaseEnabled) return false;

        try {
            // 1. 학생 목록 로드 (계층 구조)
            const students = await firebase.getAllStudents(teacherUid, classId);
            const studentList = students || [];
            console.log(`Firebase에서 ${studentList.length}명의 학생 로드 완료`);

            // 학생 세션이면 collectionGroup 쿼리(감정/칭찬) 스킵
            // (학생은 StudentMode.js에서 직접 경로로 자기 데이터를 별도 조회)
            const isStudentSession = !!sessionStorage.getItem('classpet_student_session');

            // 2. 칭찬 로그 로드 (교사만 - collectionGroup 쿼리 사용)
            let praiseLog = [];
            if (!isStudentSession) try {
                const praises = await firebase.getAllPraises(teacherUid, classId);
                if (praises && praises.length > 0) {
                    praiseLog = praises.map(p => ({
                        id: p.id || Date.now(),
                        timestamp: p.timestamp || p.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                        studentId: p.studentId,
                        studentName: p.studentName,
                        studentNumber: p.studentNumber,
                        category: p.category,
                        expGain: p.expGain
                    }));
                    console.log(`Firebase에서 ${praiseLog.length}개의 칭찬 로드 완료`);
                }
            } catch (praiseError) {
                console.error('Firebase 칭찬 로드 실패:', praiseError);
            }

            // 3. 감정 로그 로드 (교사만 - collectionGroup 쿼리 사용)
            let emotionLog = [];
            if (!isStudentSession) try {
                const emotions = await firebase.getAllEmotions(teacherUid, classId);
                if (emotions && emotions.length > 0) {
                    emotionLog = emotions.filter(e => e.studentId != null).map(e => {
                        // conversations에서 Timestamp 변환
                        const conversations = (e.conversations || []).map(c => ({
                            ...c,
                            studentAt: c.studentAt?.toDate?.()?.toISOString() || c.studentAt,
                            replyAt: c.replyAt?.toDate?.()?.toISOString() || c.replyAt
                        }));

                        // 학생 메시지: conversations[0].studentMessage 최우선 (Firestore 정본)
                        const firstMessage = conversations[0]?.studentMessage || '';
                        const noteText = firstMessage || e.note || e.memo || '';

                        // 교사 답장: 최상위 reply 또는 conversations의 마지막 teacherReply
                        const lastReply = [...conversations].reverse().find(c => c.teacherReply);
                        const replyData = e.reply || (lastReply ? {
                            message: lastReply.teacherReply,
                            timestamp: lastReply.replyAt,
                            read: lastReply.read ?? false
                        } : null);

                        return {
                            id: Date.now() + Math.random(),
                            firebaseId: e.id,
                            timestamp: e.timestamp || e.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                            studentId: e.studentId,
                            studentName: e.studentName,
                            studentNumber: e.studentNumber,
                            emotion: e.emotion,
                            note: noteText,
                            memo: noteText,
                            source: e.source || 'student',
                            conversations,
                            reply: replyData
                        };
                    });
                    console.log(`Firebase에서 ${emotionLog.length}개의 감정 로드 완료`);
                }
            } catch (emotionError) {
                console.error('Firebase 감정 로드 실패:', emotionError);
            }

            // 4. 각 학생별 pets 하위 컬렉션에서 펫 데이터 로드 (정본)
            const mergedStudents = await Promise.all(studentList.map(async (student) => {
                try {
                    const activePet = await firebase.getActivePet(teacherUid, classId, student.id);
                    const completedPets = await firebase.getCompletedPets(teacherUid, classId, student.id);

                    const petData = {};
                    if (activePet) {
                        petData.petType = activePet.petType;
                        petData.petName = activePet.petName;
                        petData.exp = activePet.exp || 0;
                        petData.level = activePet.level || 1;
                        console.log(`학생 ${student.name} 펫 로드: petType=${activePet.petType}, exp=${activePet.exp || 0}, level=${activePet.level || 1}`);
                    }

                    if (completedPets && completedPets.length > 0) {
                        petData.completedPets = completedPets.map(p => ({
                            type: p.petType,
                            name: p.petName,
                            completedAt: p.completedAt
                        }));
                    }

                    // 해당 학생의 칭찬 수 계산
                    const studentPraises = praiseLog.filter(p => p.studentId === student.id);

                    return {
                        ...student,
                        petType: petData.petType ?? student.petType ?? null,
                        petName: petData.petName ?? student.petName ?? null,
                        exp: petData.exp ?? student.exp ?? 0,
                        level: petData.level ?? student.level ?? 1,
                        completedPets: petData.completedPets ?? student.completedPets ?? [],
                        totalPraises: studentPraises.length
                    };
                } catch (petError) {
                    console.warn(`학생 ${student.name} 펫 로드 실패:`, petError);
                    return student;
                }
            }));

            // 5. localStorage에 완전한 데이터 저장
            this.saveStudents(mergedStudents);
            this.savePraiseLog(praiseLog);
            this.saveEmotionLog(emotionLog);
            this.saveNotifications([]);  // 학급 전환 시 알림 초기화

            // 6. 설정 정보 로드 (classData에서) - 계층 구조
            const classData = await firebase.getClass(teacherUid, classId);
            if (classData) {
                this.updateSettings({
                    className: classData.className,
                    schoolYear: classData.schoolYear,
                    semester: classData.semester,
                    classCode: classData.classCode,
                    classId: classId,
                    teacherUid: teacherUid
                });

                // 칭찬 카테고리 동기화 (Firestore → localStorage)
                if (classData.praiseCategories) {
                    this.savePraiseCategoriesLocal(classData.praiseCategories);
                }
            }

            // 7. 데이터 로드 완료 알림 (화면 갱신용)
            this.notify('dataLoaded', { students: true, praises: true, emotions: true });

            return true;
        } catch (error) {
            console.error('Firebase 학급 데이터 로드 실패:', error);
            return false;
        }
    }
};
