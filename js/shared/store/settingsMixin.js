/**
 * 설정/메모/통계/백업/세션/Firebase유틸 Mixin
 */

import { firebase, STORAGE_KEYS, SESSION_KEYS } from './Store.js';
import { DEFAULT_SETTINGS } from '../constants/index.js';
import { showToast } from '../utils/animations.js';

export const settingsMixin = {
    // ==================== 설정 관련 ====================

    getSettings() {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : null;
    },

    saveSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        this.notify('settings', settings);
    },

    updateSettings(updates) {
        const current = this.getSettings() || DEFAULT_SETTINGS;
        const updated = { ...current, ...updates };
        this.saveSettings(updated);
        return updated;
    },

    // ==================== 메모/노트 관련 ====================

    getNotes() {
        const data = localStorage.getItem(STORAGE_KEYS.NOTES);
        return data ? JSON.parse(data) : null;
    },

    saveNotes(notes) {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
        this.notify('notes', notes);
    },

    addNote(note) {
        const notes = this.getNotes() || [];
        const newNote = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...note
        };
        notes.unshift(newNote);
        this.saveNotes(notes);

        // Firebase 동기화
        this.syncNoteToFirebase(newNote);

        return newNote;
    },

    async syncNoteToFirebase(note) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return;

        if (this.isOnline) {
            try {
                await firebase.saveNote(teacherUid, classId, note);
            } catch (error) {
                showToast('저장에 실패했어요. 나중에 다시 시도합니다.', 'warning');
                this.addToOfflineQueue({ type: 'saveNote', teacherUid, classId, data: note });
            }
        } else {
            this.addToOfflineQueue({ type: 'saveNote', teacherUid, classId, data: note });
        }
    },

    updateNote(noteId, updates) {
        const notes = this.getNotes() || [];
        const index = notes.findIndex(n => n.id === noteId);
        if (index !== -1) {
            notes[index] = { ...notes[index], ...updates };
            this.saveNotes(notes);
            return notes[index];
        }
        return null;
    },

    deleteNote(noteId) {
        let notes = this.getNotes() || [];
        notes = notes.filter(n => n.id !== noteId);
        this.saveNotes(notes);
    },

    getNotesByStudent(studentId) {
        const notes = this.getNotes() || [];
        return notes.filter(n => String(n.studentId) === String(studentId));
    },

    // ==================== 통계 관련 ====================

    getStats() {
        const students = this.getStudents() || [];
        const todayPraises = this.getTodayPraises();
        const allPraises = this.getPraiseLog() || [];
        const todayEmotions = this.getTodayEmotions();
        const needAttention = this.getStudentsNeedingAttention();

        const categoryStats = {};
        const categories = this.getPraiseCategories();
        Object.keys(categories).forEach(cat => {
            categoryStats[cat] = allPraises.filter(p => p.category === cat).length;
        });

        const levelDistribution = {};
        students.forEach(s => {
            levelDistribution[s.level] = (levelDistribution[s.level] || 0) + 1;
        });

        const todayPraiseCount = {};
        todayPraises.forEach(p => {
            todayPraiseCount[p.studentId] = (todayPraiseCount[p.studentId] || 0) + 1;
        });

        let mvpId = null;
        let maxPraises = 0;
        Object.entries(todayPraiseCount).forEach(([id, count]) => {
            if (count > maxPraises) {
                maxPraises = count;
                mvpId = parseInt(id);
            }
        });

        const mvp = mvpId ? students.find(s => s.id === mvpId) : null;

        return {
            totalStudents: students.length,
            todayPraises: todayPraises.length,
            totalPraises: allPraises.length,
            todayEmotionChecked: todayEmotions.length,
            needAttentionCount: needAttention.length,
            categoryStats,
            levelDistribution,
            mvp,
            mvpPraiseCount: maxPraises,
            averageLevel: students.length > 0
                ? (students.reduce((sum, s) => sum + s.level, 0) / students.length).toFixed(1)
                : 0
        };
    },

    // ==================== 세션 관리 ====================

    studentLogin(studentId) {
        const student = this.getStudent(studentId);
        if (!student) return null;

        const session = {
            studentId: student.id,
            studentName: student.name,
            loginTime: new Date().toISOString()
        };

        sessionStorage.setItem(SESSION_KEYS.STUDENT_SESSION, JSON.stringify(session));
        this.notify('studentLogin', session);
        return session;
    },

    studentLogout() {
        sessionStorage.removeItem(SESSION_KEYS.STUDENT_SESSION);
        this.notify('studentLogout', null);
    },

    getStudentSession() {
        const data = sessionStorage.getItem(SESSION_KEYS.STUDENT_SESSION);
        return data ? JSON.parse(data) : null;
    },

    isStudentLoggedIn() {
        const session = this.getStudentSession();
        if (!session) return false;
        const student = this.getStudent(session.studentId);
        return !!student;
    },

    getCurrentStudent() {
        const session = this.getStudentSession();
        if (!session) return null;
        return this.getStudent(session.studentId);
    },

    hasStudentCheckedEmotionToday(studentId) {
        const todayEmotions = this.getTodayEmotions();
        return todayEmotions.some(e => e.studentId === studentId);
    },

    getStudentTodayEmotion(studentId) {
        const todayEmotions = this.getTodayEmotions();
        return todayEmotions.find(e => e.studentId === studentId) || null;
    },

    getStudentTodayEmotions(studentId) {
        const todayEmotions = this.getTodayEmotions();
        return todayEmotions.filter(e => e.studentId === studentId);
    },

    // === 교사 세션 ===

    teacherLogin() {
        const settings = this.getSettings();
        const user = this.getCurrentUser();

        const session = {
            teacherName: user?.displayName || settings?.teacherName || '선생님',
            email: user?.email || null,
            uid: user?.uid || null,
            isGoogleAuth: !!user && !user.isAnonymous,
            loginTime: new Date().toISOString()
        };

        sessionStorage.setItem(SESSION_KEYS.TEACHER_SESSION, JSON.stringify(session));
        this.notify('teacherLogin', session);
        return session;
    },

    teacherLogout() {
        sessionStorage.removeItem(SESSION_KEYS.TEACHER_SESSION);
        this.notify('teacherLogout', null);
    },

    getTeacherSession() {
        const data = sessionStorage.getItem(SESSION_KEYS.TEACHER_SESSION);
        return data ? JSON.parse(data) : null;
    },

    isTeacherLoggedIn() {
        return !!this.getTeacherSession();
    },

    // ==================== 데이터 백업/복원 ====================

    exportData() {
        return {
            settings: this.getSettings(),
            students: this.getStudents(),
            timetable: this.getTimetable(),
            praiseLog: this.getPraiseLog(),
            emotionLog: this.getEmotionLog(),
            notes: this.getNotes(),
            exportDate: new Date().toISOString()
        };
    },

    importData(data) {
        if (data.settings) this.saveSettings(data.settings);
        if (data.students) this.saveStudents(data.students);
        if (data.timetable) this.saveTimetable(data.timetable);
        if (data.praiseLog) this.savePraiseLog(data.praiseLog);
        if (data.emotionLog) this.saveEmotionLog(data.emotionLog);
        if (data.notes) this.saveNotes(data.notes);
        this.notify('import', data);
    },

    clearAllData() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.currentClassId = null;
        this.currentClassData = null;
        this.initLocalData();
        this.notify('clear', null);
    },

    // ==================== Firebase 관련 유틸리티 ====================

    isFirebaseEnabled() {
        return this.firebaseEnabled && firebase.isFirebaseInitialized();
    },

    /**
     * Firebase 수동 활성화 (인증 타임아웃 후 뒤늦게 인증 성공 시 사용)
     */
    enableFirebase() {
        if (firebase.isFirebaseInitialized()) {
            this.firebaseEnabled = true;
            console.log('🔥 Firebase 연동: 활성화 (수동)');
            return true;
        }
        return false;
    },

    generateClassCode() {
        return firebase.generateClassCode();
    },

    // 레거시 호환
    setClassCode(code) {
        firebase.setClassCode(code);
        const settings = this.getSettings();
        if (settings) {
            this.updateSettings({ classCode: code });
        }
    },

    getClassCode() {
        return firebase.getClassCode();
    },

    unsubscribeAllFirebase() {
        this.firebaseListeners.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        this.firebaseListeners = [];
        firebase.unsubscribeAll();
    },

    /**
     * localStorage 데이터를 Firebase로 마이그레이션 (계층 구조)
     * @param {Function} progressCallback - 진행 상황 콜백 (message, percent)
     * @returns {Object} { success, message, stats }
     */
    async migrateToFirebase(progressCallback = () => {}) {
        if (!this.firebaseEnabled) {
            return { success: false, message: 'Firebase가 활성화되지 않았습니다.' };
        }

        if (!this.isGoogleTeacher()) {
            return { success: false, message: 'Google 계정으로 로그인해주세요.' };
        }

        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId) {
            return { success: false, message: '먼저 학급을 선택하거나 생성해주세요.' };
        }

        const stats = {
            students: 0,
            praises: 0,
            emotions: 0,
            timetable: false,
            notes: 0
        };

        try {
            progressCallback('마이그레이션 시작...', 0);

            // 1. 학생 데이터 마이그레이션 (20%)
            const students = this.getStudents() || [];
            if (students.length > 0) {
                progressCallback(`학생 ${students.length}명 업로드 중...`, 10);
                for (let i = 0; i < students.length; i++) {
                    await firebase.saveStudent(teacherUid, classId, students[i]);
                    stats.students++;
                }
                progressCallback(`학생 ${stats.students}명 완료`, 20);
            }

            // 2. 칭찬 데이터 마이그레이션 (40%)
            const praises = this.getPraiseLog() || [];
            if (praises.length > 0) {
                progressCallback(`칭찬 ${praises.length}건 업로드 중...`, 25);
                for (let i = 0; i < praises.length; i++) {
                    await firebase.savePraise(teacherUid, classId, praises[i]);
                    stats.praises++;
                }
                progressCallback(`칭찬 ${stats.praises}건 완료`, 40);
            }

            // 3. 감정 데이터 마이그레이션 (60%)
            const emotions = this.getEmotionLog() || [];
            if (emotions.length > 0) {
                progressCallback(`감정 기록 ${emotions.length}건 업로드 중...`, 45);
                for (let i = 0; i < emotions.length; i++) {
                    await firebase.saveEmotion(teacherUid, classId, emotions[i]);
                    stats.emotions++;
                }
                progressCallback(`감정 기록 ${stats.emotions}건 완료`, 60);
            }

            // 4. 시간표 마이그레이션 (80%)
            const timetable = this.getTimetable();
            if (timetable && Object.keys(timetable).length > 0) {
                progressCallback('시간표 업로드 중...', 65);
                await firebase.saveTimetable(teacherUid, classId, timetable);
                stats.timetable = true;
                progressCallback('시간표 완료', 80);
            }

            // 5. 메모 마이그레이션 (100%)
            const notes = this.getNotes() || [];
            if (notes.length > 0) {
                progressCallback(`메모 ${notes.length}건 업로드 중...`, 85);
                for (let i = 0; i < notes.length; i++) {
                    await firebase.saveNote(teacherUid, classId, notes[i]);
                    stats.notes++;
                }
                progressCallback(`메모 ${stats.notes}건 완료`, 95);
            }

            progressCallback('마이그레이션 완료!', 100);

            return {
                success: true,
                message: '마이그레이션이 완료되었습니다!',
                stats
            };
        } catch (error) {
            console.error('마이그레이션 실패:', error);
            return {
                success: false,
                message: `마이그레이션 중 오류: ${error.message}`,
                stats
            };
        }
    },

    /**
     * 마이그레이션 가능 여부 확인 (계층 구조)
     */
    canMigrate() {
        const students = this.getStudents() || [];
        const praises = this.getPraiseLog() || [];
        const emotions = this.getEmotionLog() || [];
        const timetable = this.getTimetable() || {};
        const notes = this.getNotes() || [];

        return {
            canMigrate: this.firebaseEnabled && this.isGoogleTeacher() && this.getCurrentTeacherUid() && this.getCurrentClassId(),
            hasData: students.length > 0 || praises.length > 0 || emotions.length > 0 || Object.keys(timetable).length > 0 || notes.length > 0,
            counts: {
                students: students.length,
                praises: praises.length,
                emotions: emotions.length,
                timetable: Object.keys(timetable).length,
                notes: notes.length
            }
        };
    }
};
