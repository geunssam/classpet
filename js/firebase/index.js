/**
 * Firebase 모듈 통합 인덱스
 * 모든 firebase 함수를 한 곳에서 re-export
 */

// init.js - 초기화, 전역 상태, 유틸리티
export {
    initializeFirebase,
    isFirebaseInitialized,
    getCurrentClassId,
    setCurrentClassId,
    getCurrentTeacherUid,
    setCurrentTeacherUid,
    getCurrentClassPath,
    unsubscribeAll,
    timestampToISO,
    setClassCode,
    getClassCode,
    db,
    auth,
    app
} from './init.js';

// auth.js - 인증
export {
    signInWithGoogle,
    checkRedirectResult,
    firebaseSignOut,
    signInAnonymouslyIfNeeded,
    getCurrentUser,
    onAuthChange,
    isTeacherUser,
    createOrUpdateTeacherProfile,
    getTeacherProfile
} from './auth.js';

// classes.js - 학급 관리
export {
    generateClassCode,
    createClass,
    getTeacherClasses,
    getClass,
    getClassIdByCode,
    validateClassCode,
    updateClass,
    deleteClass
} from './classes.js';

// students.js - 학생 관리
export {
    saveStudent,
    saveAllStudents,
    getAllStudents,
    deleteStudent,
    subscribeToStudents
} from './students.js';

// emotions.js - 감정 기록
export {
    saveEmotion,
    addReplyToEmotion,
    addStudentMessage,
    getTodayEmotions,
    getStudentEmotions,
    getEmotionsByDate,
    subscribeToTodayEmotions,
    subscribeToStudentEmotions,
    getAllEmotions,
    getEmotionsByType,
    getEmotionsByDateAndType,
    getUnreadReplyCount,
    markEmotionReplyAsRead
} from './emotions.js';

// praises.js - 칭찬 기록
export {
    savePraise,
    getTodayPraises,
    getAllPraises,
    getPraisesByCategory,
    getPraisesByDate,
    getPraisesByDateAndCategory,
    getStudentPraises,
    getStudentPraisesByCategory,
    subscribeToStudentPraises
} from './praises.js';

// timetable.js - 시간표
export {
    saveTimetable,
    getTimetable,
    saveTimetableOverrides,
    getTimetableOverrides,
    saveSubjectColors,
    getSubjectColors
} from './timetable.js';

// notes.js - 메모
export {
    saveNote,
    getAllNotes,
    deleteNote
} from './notes.js';

// pets.js - 펫 관리
export {
    savePet,
    getActivePet,
    getCompletedPets,
    getStudentPets,
    hasCompletedPetType,
    updatePet,
    deletePet,
    subscribeToStudentPets
} from './pets.js';
