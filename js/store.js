/**
 * 클래스펫 상태 관리 모듈
 * LocalStorage를 활용한 데이터 영속성 관리
 * + Firebase Firestore 실시간 동기화
 */

// Firebase 연동 모듈
import * as firebaseModule from './firebase-config.js';

// 저장소 키
const STORAGE_KEYS = {
    SETTINGS: 'classpet_settings',
    STUDENTS: 'classpet_students',
    TIMETABLE: 'classpet_timetable',
    PRAISE_LOG: 'classpet_praise_log',
    EMOTION_LOG: 'classpet_emotion_log',
    NOTES: 'classpet_notes',
    NOTIFICATIONS: 'classpet_notifications'
};

// 세션 키 (sessionStorage 사용)
const SESSION_KEYS = {
    STUDENT_SESSION: 'classpet_student_session',
    TEACHER_SESSION: 'classpet_teacher_session'
};

// 기본 설정
const DEFAULT_SETTINGS = {
    className: '4학년 2반',
    teacherName: '담임선생님',
    schoolYear: 2025,
    semester: 1,
    initialized: false
};

// 기본 시간표 구조
const DEFAULT_TIMETABLE = {
    periods: ['1교시', '2교시', '3교시', '4교시', '5교시', '6교시'],
    days: ['월', '화', '수', '목', '금'],
    schedule: {} // { 'mon-1': { subject: '국어', progress: 0 } }
};

// 펫 타입 정의 (12종)
// 분류별 초기 단계: 포유류 🎁(선물상자), 조류/파충류 🥚(알), 판타지 ✨(마법)
const PET_TYPES = {
    // 포유류 - 선물상자에서 시작
    dog: {
        name: '강아지',
        category: 'mammal',
        stages: { egg: '🎁', baby: '🐕', growing: '🐕', adult: '🦮' }
    },
    cat: {
        name: '고양이',
        category: 'mammal',
        stages: { egg: '🎁', baby: '🐱', growing: '🐱', adult: '🐈' }
    },
    rabbit: {
        name: '토끼',
        category: 'mammal',
        stages: { egg: '🎁', baby: '🐰', growing: '🐰', adult: '🐇' }
    },
    hamster: {
        name: '햄스터',
        category: 'mammal',
        stages: { egg: '🎁', baby: '🐹', growing: '🐹', adult: '🐹' }
    },
    fox: {
        name: '여우',
        category: 'mammal',
        stages: { egg: '🎁', baby: '🦊', growing: '🦊', adult: '🦊' }
    },
    bear: {
        name: '곰',
        category: 'mammal',
        stages: { egg: '🎁', baby: '🐻', growing: '🐻', adult: '🐻' }
    },
    panda: {
        name: '판다',
        category: 'mammal',
        stages: { egg: '🎁', baby: '🐼', growing: '🐼', adult: '🐼' }
    },
    lion: {
        name: '사자',
        category: 'mammal',
        stages: { egg: '🎁', baby: '🦁', growing: '🦁', adult: '🦁' }
    },
    // 조류 - 알에서 시작
    chick: {
        name: '병아리',
        category: 'bird',
        stages: { egg: '🥚', baby: '🐣', growing: '🐤', adult: '🐓' }
    },
    penguin: {
        name: '펭귄',
        category: 'bird',
        stages: { egg: '🥚', baby: '🐧', growing: '🐧', adult: '🐧' }
    },
    // 파충류 - 알에서 시작
    turtle: {
        name: '거북이',
        category: 'reptile',
        stages: { egg: '🥚', baby: '🐢', growing: '🐢', adult: '🐢' }
    },
    // 판타지 - 마법에서 시작
    dragon: {
        name: '드래곤',
        category: 'fantasy',
        stages: { egg: '✨', baby: '🐉', growing: '🐉', adult: '🐉' }
    }
};

// 칭찬 카테고리
const PRAISE_CATEGORIES = {
    selfManagement: { icon: '🎯', name: '자기관리', exp: 10 },
    knowledge: { icon: '📚', name: '지식정보', exp: 10 },
    creative: { icon: '💡', name: '창의적사고', exp: 10 },
    aesthetic: { icon: '🎨', name: '심미적감성', exp: 10 },
    cooperation: { icon: '🤝', name: '협력적소통', exp: 10 },
    community: { icon: '🏠', name: '공동체', exp: 10 }
};

// 감정 타입
const EMOTION_TYPES = {
    great: { icon: '😄', name: '아주 좋아요', color: '#7CE0A3' },
    good: { icon: '🙂', name: '좋아요', color: '#7C9EF5' },
    soso: { icon: '😐', name: '보통이에요', color: '#F5E07C' },
    bad: { icon: '😢', name: '안 좋아요', color: '#F5A67C' },
    terrible: { icon: '😭', name: '힘들어요', color: '#F57C7C' }
};

// 펫 말투 스타일 (선생님 답장 → 펫 말투 변환용)
const PET_SPEECH_STYLES = {
    dog: {
        suffix: '멍',
        endings: ['멍!', '왈왈!', '멍멍~'],
        greeting: '꼬리 살랑살랑~'
    },
    cat: {
        suffix: '냥',
        endings: ['냥~', '야옹~', '냥냥!'],
        greeting: '그루밍 중~'
    },
    rabbit: {
        suffix: '깡총',
        endings: ['깡총!', '토토~', '깡깡!'],
        greeting: '귀 쫑긋~'
    },
    hamster: {
        suffix: '햄',
        endings: ['햄!', '쪼꼼~', '햄햄!'],
        greeting: '볼 빵빵~'
    },
    fox: {
        suffix: '콘',
        endings: ['콘콘!', '여우~', '콘!'],
        greeting: '꼬리 흔들~'
    },
    bear: {
        suffix: '곰',
        endings: ['곰곰!', '웅~', '곰!'],
        greeting: '큰 포옹~'
    },
    panda: {
        suffix: '다',
        endings: ['빤다!', '대나무~', '판다!'],
        greeting: '뒹굴뒹굴~'
    },
    lion: {
        suffix: '으르렁',
        endings: ['어흥!', '으르렁~', '왕!'],
        greeting: '갈기 휘날리며~'
    },
    chick: {
        suffix: '삐약',
        endings: ['삐약!', '삐~', '삐삐!'],
        greeting: '날개 파닥파닥~'
    },
    penguin: {
        suffix: '펭',
        endings: ['펭펭!', '뒤뚱~', '펭!'],
        greeting: '배로 슬라이딩~'
    },
    turtle: {
        suffix: '엉금',
        endings: ['엉금!', '거북~', '느긋~'],
        greeting: '천천히 다가가며~'
    },
    dragon: {
        suffix: '드라곤',
        endings: ['드라곤!', '용용~', '푸하~'],
        greeting: '날개 펼치며~'
    }
};

// 펫 반응 메시지 (학생 모드용)
const PET_REACTIONS = {
    great: {
        animation: 'pet-jump',
        message: '야호! 🎉 나도 기뻐!',
        emoji: '✨'
    },
    good: {
        animation: 'pet-wiggle',
        message: '다행이다 🌟',
        emoji: '💫'
    },
    soso: {
        animation: 'pet-tilt',
        message: '음... 알겠어 💭',
        emoji: '🤔'
    },
    bad: {
        animation: 'pet-approach',
        message: '괜찮아, 내가 옆에 있을게 💕',
        emoji: '🫂'
    },
    terrible: {
        animation: 'pet-hug',
        message: '힘들었구나... 🫂 말해줘서 고마워',
        emoji: '💝'
    }
};

// 샘플 학생 데이터 (학기 초 상태 - 펫 미선택)
// PIN: 학번 4자리 (1번 → 0001, 12번 → 0012)
// petType: null = 펫 미선택 상태
// completedPets: 레벨 15 달성 후 완성된 펫 기록
const SAMPLE_STUDENTS = [
    { id: 1, name: '김민준', number: 1, pin: '0001', petType: null, exp: 0, level: 1, totalPraises: 0, completedPets: [] },
    { id: 2, name: '이서연', number: 2, pin: '0002', petType: null, exp: 0, level: 1, totalPraises: 0, completedPets: [] },
    { id: 3, name: '박지호', number: 3, pin: '0003', petType: null, exp: 0, level: 1, totalPraises: 0, completedPets: [] },
    { id: 4, name: '최수빈', number: 4, pin: '0004', petType: null, exp: 0, level: 1, totalPraises: 0, completedPets: [] },
    { id: 5, name: '정예준', number: 5, pin: '0005', petType: null, exp: 0, level: 1, totalPraises: 0, completedPets: [] }
];

// 샘플 시간표
const SAMPLE_TIMETABLE = {
    'mon-1': { subject: '국어', progress: 80 },
    'mon-2': { subject: '수학', progress: 75 },
    'mon-3': { subject: '사회', progress: 60 },
    'mon-4': { subject: '체육', progress: 90 },
    'mon-5': { subject: '음악', progress: 70 },
    'tue-1': { subject: '수학', progress: 75 },
    'tue-2': { subject: '국어', progress: 80 },
    'tue-3': { subject: '과학', progress: 65 },
    'tue-4': { subject: '영어', progress: 55 },
    'tue-5': { subject: '미술', progress: 85 },
    'wed-1': { subject: '국어', progress: 80 },
    'wed-2': { subject: '사회', progress: 60 },
    'wed-3': { subject: '수학', progress: 75 },
    'wed-4': { subject: '체육', progress: 90 },
    'wed-5': { subject: '도덕', progress: 70 },
    'thu-1': { subject: '과학', progress: 65 },
    'thu-2': { subject: '국어', progress: 80 },
    'thu-3': { subject: '영어', progress: 55 },
    'thu-4': { subject: '수학', progress: 75 },
    'thu-5': { subject: '창체', progress: 50 },
    'thu-6': { subject: '창체', progress: 50 },
    'fri-1': { subject: '국어', progress: 80 },
    'fri-2': { subject: '수학', progress: 75 },
    'fri-3': { subject: '사회', progress: 60 },
    'fri-4': { subject: '체육', progress: 90 },
    'fri-5': { subject: '실과', progress: 45 }
};

/**
 * 스토어 클래스
 */
class Store {
    constructor() {
        this.listeners = new Set();
        this.firebaseEnabled = false;
        this.firebaseListeners = [];
        this.init();
    }

    /**
     * 초기화
     */
    init() {
        // Firebase 초기화 시도
        this.initFirebase();
        // 설정 불러오기 또는 초기화
        if (!this.getSettings()) {
            this.saveSettings(DEFAULT_SETTINGS);
        }

        // 학생 데이터 없으면 샘플 데이터 로드
        if (!this.getStudents() || this.getStudents().length === 0) {
            this.saveStudents(SAMPLE_STUDENTS);
        }

        // 시간표 데이터 없으면 샘플 데이터 로드
        if (!this.getTimetable() || Object.keys(this.getTimetable()).length === 0) {
            this.saveTimetable(SAMPLE_TIMETABLE);
        }

        // 칭찬 로그 초기화
        if (!this.getPraiseLog()) {
            this.savePraiseLog([]);
        }

        // 감정 로그 초기화
        if (!this.getEmotionLog()) {
            this.saveEmotionLog([]);
        }

        // 메모 초기화
        if (!this.getNotes()) {
            this.saveNotes([]);
        }

        // 알림 초기화
        if (!this.getNotifications()) {
            this.saveNotifications([]);
        }
    }

    /**
     * 변경 리스너 등록
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * 변경 알림
     */
    notify(type, data) {
        this.listeners.forEach(listener => listener(type, data));
    }

    // === 설정 관련 ===
    getSettings() {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : null;
    }

    saveSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        this.notify('settings', settings);
    }

    updateSettings(updates) {
        const current = this.getSettings() || DEFAULT_SETTINGS;
        const updated = { ...current, ...updates };
        this.saveSettings(updated);
        return updated;
    }

    // === 학생 관련 ===
    getStudents() {
        const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        return data ? JSON.parse(data) : null;
    }

    saveStudents(students) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
        this.notify('students', students);
    }

    getStudent(studentId) {
        const students = this.getStudents() || [];
        return students.find(s => s.id === studentId);
    }

    addStudent(student) {
        const students = this.getStudents() || [];
        const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
        const newNumber = students.length + 1;
        const newStudent = {
            id: newId,
            number: newNumber,
            pin: String(newNumber).padStart(4, '0'), // 학번 4자리 PIN
            exp: 0,
            level: 1,
            totalPraises: 0,
            petType: null, // 펫 미선택 상태
            completedPets: [], // 완성된 펫 목록
            ...student
        };
        students.push(newStudent);
        this.saveStudents(students);
        return newStudent;
    }

    /**
     * 학생 펫 선택 (펫 이름 포함)
     * @param {number} studentId - 학생 ID
     * @param {string} petType - 펫 타입
     * @param {string} petName - 펫 이름 (선택, 없으면 펫 타입명 사용)
     */
    selectPet(studentId, petType, petName = null) {
        if (!PET_TYPES[petType]) return null;
        const finalPetName = petName?.trim() || PET_TYPES[petType].name;
        return this.updateStudent(studentId, { petType, petName: finalPetName });
    }

    /**
     * 학생이 펫을 선택했는지 확인
     */
    hasSelectedPet(studentId) {
        const student = this.getStudent(studentId);
        return student && student.petType !== null;
    }

    /**
     * 펫 완성 처리 및 새 펫 선택 (레벨 15 달성 시)
     * @param {number} studentId - 학생 ID
     * @param {string} newPetType - 새로 선택할 펫 타입
     * @param {string} newPetName - 새 펫 이름
     */
    completeAndChangePet(studentId, newPetType, newPetName = null) {
        const student = this.getStudent(studentId);
        if (!student || !student.petType) return null;
        if (!PET_TYPES[newPetType]) return null;

        // 현재 펫을 완성 목록에 추가
        const completedPets = student.completedPets || [];
        completedPets.push({
            type: student.petType,
            name: student.petName || PET_TYPES[student.petType].name,
            completedAt: new Date().toISOString().split('T')[0]
        });

        // 새 펫으로 변경 (레벨 1, 경험치 0으로 초기화)
        const finalPetName = newPetName?.trim() || PET_TYPES[newPetType].name;
        return this.updateStudent(studentId, {
            petType: newPetType,
            petName: finalPetName,
            level: 1,
            exp: 0,
            completedPets
        });
    }

    /**
     * 학생의 완성된 펫 목록 가져오기
     */
    getCompletedPets(studentId) {
        const student = this.getStudent(studentId);
        return student?.completedPets || [];
    }

    /**
     * 학생이 특정 펫을 완성했는지 확인
     */
    hasCompletedPet(studentId, petType) {
        const completedPets = this.getCompletedPets(studentId);
        return completedPets.some(p => p.type === petType);
    }

    /**
     * 학생이 펫을 소유하고 있는지 확인 (현재 키우는 중이거나 완성한 펫)
     */
    hasPet(studentId, petType) {
        const student = this.getStudent(studentId);
        if (!student) return false;
        // 현재 키우는 펫이거나 완성한 펫
        return student.petType === petType || this.hasCompletedPet(studentId, petType);
    }

    // === PIN 관련 함수 ===

    /**
     * 학생 PIN 검증
     */
    verifyStudentPin(studentId, pin) {
        const student = this.getStudent(studentId);
        if (!student) return false;

        // PIN이 없으면 학번 4자리로 비교 (이전 데이터 호환)
        const studentPin = student.pin || String(student.number).padStart(4, '0');
        return studentPin === pin;
    }

    /**
     * 학생 PIN 초기화 (학번 4자리로)
     */
    resetStudentPin(studentId) {
        const student = this.getStudent(studentId);
        if (!student) return null;

        const defaultPin = String(student.number).padStart(4, '0');
        return this.updateStudent(studentId, { pin: defaultPin });
    }

    /**
     * 학생 PIN 변경
     */
    updateStudentPin(studentId, newPin) {
        if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            return null; // 4자리 숫자가 아니면 실패
        }
        return this.updateStudent(studentId, { pin: newPin });
    }

    /**
     * 학생의 기본 PIN 가져오기 (학번 4자리)
     */
    getDefaultPin(studentId) {
        const student = this.getStudent(studentId);
        if (!student) return null;
        return String(student.number).padStart(4, '0');
    }

    updateStudent(studentId, updates) {
        const students = this.getStudents() || [];
        const index = students.findIndex(s => s.id === studentId);
        if (index !== -1) {
            students[index] = { ...students[index], ...updates };
            this.saveStudents(students);
            return students[index];
        }
        return null;
    }

    deleteStudent(studentId) {
        let students = this.getStudents() || [];
        students = students.filter(s => s.id !== studentId);
        // 번호 재정렬
        students.forEach((s, i) => s.number = i + 1);
        this.saveStudents(students);
    }

    // === 시간표 관련 ===
    getTimetable() {
        const data = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
        return data ? JSON.parse(data) : null;
    }

    saveTimetable(timetable) {
        localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
        this.notify('timetable', timetable);
    }

    updateTimetableCell(key, value) {
        const timetable = this.getTimetable() || {};
        timetable[key] = value;
        this.saveTimetable(timetable);
    }

    // === 칭찬 로그 관련 ===
    getPraiseLog() {
        const data = localStorage.getItem(STORAGE_KEYS.PRAISE_LOG);
        return data ? JSON.parse(data) : null;
    }

    savePraiseLog(log) {
        localStorage.setItem(STORAGE_KEYS.PRAISE_LOG, JSON.stringify(log));
        this.notify('praiseLog', log);
    }

    addPraise(praise) {
        const log = this.getPraiseLog() || [];
        const newPraise = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...praise
        };
        log.unshift(newPraise); // 최신순

        // 최대 500개 유지
        if (log.length > 500) {
            log.pop();
        }

        this.savePraiseLog(log);
        return newPraise;
    }

    getPraisesByStudent(studentId) {
        const log = this.getPraiseLog() || [];
        return log.filter(p => p.studentId === studentId);
    }

    getPraisesByCategory(category) {
        const log = this.getPraiseLog() || [];
        return log.filter(p => p.category === category);
    }

    getTodayPraises() {
        const log = this.getPraiseLog() || [];
        const today = new Date().toISOString().split('T')[0];
        return log.filter(p => p.timestamp.startsWith(today));
    }

    // === 감정 로그 관련 ===
    getEmotionLog() {
        const data = localStorage.getItem(STORAGE_KEYS.EMOTION_LOG);
        return data ? JSON.parse(data) : null;
    }

    saveEmotionLog(log) {
        localStorage.setItem(STORAGE_KEYS.EMOTION_LOG, JSON.stringify(log));
        this.notify('emotionLog', log);
    }

    addEmotion(emotion) {
        const log = this.getEmotionLog() || [];
        const newEmotion = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...emotion
        };
        log.unshift(newEmotion);

        // 최대 1000개 유지
        if (log.length > 1000) {
            log.pop();
        }

        this.saveEmotionLog(log);
        return newEmotion;
    }

    getEmotionsByStudent(studentId) {
        const log = this.getEmotionLog() || [];
        return log.filter(e => e.studentId === studentId);
    }

    getTodayEmotions() {
        const log = this.getEmotionLog() || [];
        const today = new Date().toISOString().split('T')[0];
        return log.filter(e => e.timestamp.startsWith(today));
    }

    getStudentsNeedingAttention() {
        const students = this.getStudents() || [];
        const todayEmotions = this.getTodayEmotions();

        return students.filter(student => {
            const emotion = todayEmotions.find(e => e.studentId === student.id);
            return emotion && ['bad', 'terrible'].includes(emotion.emotion);
        });
    }

    // === 선생님 답장 관련 ===

    /**
     * 감정 기록에 선생님 답장 추가
     */
    addReplyToEmotion(emotionId, message) {
        const log = this.getEmotionLog() || [];
        const index = log.findIndex(e => e.id === emotionId);

        if (index !== -1) {
            log[index].reply = {
                message: message,
                timestamp: new Date().toISOString(),
                read: false  // 학생이 아직 읽지 않음
            };
            this.saveEmotionLog(log);
            return log[index];
        }
        return null;
    }

    /**
     * 학생이 답장을 읽음으로 표시
     */
    markReplyAsRead(emotionId) {
        const log = this.getEmotionLog() || [];
        const index = log.findIndex(e => e.id === emotionId);

        if (index !== -1 && log[index].reply) {
            log[index].reply.read = true;
            this.saveEmotionLog(log);
            return log[index];
        }
        return null;
    }

    /**
     * 특정 학생의 읽지 않은 답장 개수
     */
    getUnreadReplyCount(studentId) {
        const log = this.getEmotionLog() || [];
        return log.filter(e =>
            e.studentId === studentId &&
            e.reply &&
            !e.reply.read
        ).length;
    }

    /**
     * 특정 학생의 최근 답장이 있는 감정 기록 조회
     */
    getEmotionsWithReply(studentId) {
        const log = this.getEmotionLog() || [];
        return log.filter(e =>
            e.studentId === studentId &&
            e.reply
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // === 메모/상담 기록 관련 ===
    getNotes() {
        const data = localStorage.getItem(STORAGE_KEYS.NOTES);
        return data ? JSON.parse(data) : null;
    }

    saveNotes(notes) {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
        this.notify('notes', notes);
    }

    addNote(note) {
        const notes = this.getNotes() || [];
        const newNote = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...note
        };
        notes.unshift(newNote);
        this.saveNotes(notes);
        return newNote;
    }

    updateNote(noteId, updates) {
        const notes = this.getNotes() || [];
        const index = notes.findIndex(n => n.id === noteId);
        if (index !== -1) {
            notes[index] = { ...notes[index], ...updates };
            this.saveNotes(notes);
            return notes[index];
        }
        return null;
    }

    deleteNote(noteId) {
        let notes = this.getNotes() || [];
        notes = notes.filter(n => n.id !== noteId);
        this.saveNotes(notes);
    }

    getNotesByStudent(studentId) {
        const notes = this.getNotes() || [];
        return notes.filter(n => n.studentId === studentId);
    }

    // === 통계 관련 ===
    getStats() {
        const students = this.getStudents() || [];
        const todayPraises = this.getTodayPraises();
        const allPraises = this.getPraiseLog() || [];
        const todayEmotions = this.getTodayEmotions();
        const needAttention = this.getStudentsNeedingAttention();

        // 카테고리별 칭찬 수
        const categoryStats = {};
        Object.keys(PRAISE_CATEGORIES).forEach(cat => {
            categoryStats[cat] = allPraises.filter(p => p.category === cat).length;
        });

        // 레벨 분포
        const levelDistribution = {};
        students.forEach(s => {
            levelDistribution[s.level] = (levelDistribution[s.level] || 0) + 1;
        });

        // MVP (오늘 칭찬 많이 받은 학생)
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
    }

    // === 데이터 백업/복원 ===
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
    }

    importData(data) {
        if (data.settings) this.saveSettings(data.settings);
        if (data.students) this.saveStudents(data.students);
        if (data.timetable) this.saveTimetable(data.timetable);
        if (data.praiseLog) this.savePraiseLog(data.praiseLog);
        if (data.emotionLog) this.saveEmotionLog(data.emotionLog);
        if (data.notes) this.saveNotes(data.notes);
        this.notify('import', data);
    }

    clearAllData() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.init();
        this.notify('clear', null);
    }

    // === 학생 세션 관리 ===

    /**
     * 학생 로그인 (세션 생성)
     */
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
    }

    /**
     * 학생 로그아웃 (세션 삭제)
     */
    studentLogout() {
        sessionStorage.removeItem(SESSION_KEYS.STUDENT_SESSION);
        this.notify('studentLogout', null);
    }

    /**
     * 현재 로그인된 학생 세션 가져오기
     */
    getStudentSession() {
        const data = sessionStorage.getItem(SESSION_KEYS.STUDENT_SESSION);
        return data ? JSON.parse(data) : null;
    }

    /**
     * 학생 세션이 유효한지 확인
     */
    isStudentLoggedIn() {
        const session = this.getStudentSession();
        if (!session) return false;

        // 학생이 아직 존재하는지 확인
        const student = this.getStudent(session.studentId);
        return !!student;
    }

    /**
     * 현재 로그인된 학생 정보 가져오기
     */
    getCurrentStudent() {
        const session = this.getStudentSession();
        if (!session) return null;
        return this.getStudent(session.studentId);
    }

    /**
     * 학생이 오늘 감정을 기록했는지 확인
     */
    hasStudentCheckedEmotionToday(studentId) {
        const todayEmotions = this.getTodayEmotions();
        return todayEmotions.some(e => e.studentId === studentId);
    }

    /**
     * 학생의 오늘 감정 기록 가져오기
     */
    getStudentTodayEmotion(studentId) {
        const todayEmotions = this.getTodayEmotions();
        return todayEmotions.find(e => e.studentId === studentId) || null;
    }

    // === 교사 세션 관리 ===

    /**
     * 교사 로그인 (세션 생성)
     */
    teacherLogin() {
        const settings = this.getSettings();
        const session = {
            teacherName: settings?.teacherName || '선생님',
            loginTime: new Date().toISOString()
        };

        sessionStorage.setItem(SESSION_KEYS.TEACHER_SESSION, JSON.stringify(session));
        this.notify('teacherLogin', session);
        return session;
    }

    /**
     * 교사 로그아웃 (세션 삭제)
     */
    teacherLogout() {
        sessionStorage.removeItem(SESSION_KEYS.TEACHER_SESSION);
        this.notify('teacherLogout', null);
    }

    /**
     * 현재 교사 세션 가져오기
     */
    getTeacherSession() {
        const data = sessionStorage.getItem(SESSION_KEYS.TEACHER_SESSION);
        return data ? JSON.parse(data) : null;
    }

    /**
     * 교사가 로그인되어 있는지 확인
     */
    isTeacherLoggedIn() {
        return !!this.getTeacherSession();
    }

    // === 알림 관리 ===

    /**
     * 알림 목록 가져오기
     */
    getNotifications() {
        const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        return data ? JSON.parse(data) : null;
    }

    /**
     * 알림 목록 저장
     */
    saveNotifications(notifications) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        this.notify('notifications', notifications);
    }

    /**
     * 새 알림 추가
     */
    addNotification(notification) {
        const notifications = this.getNotifications() || [];
        const newNotification = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };
        notifications.unshift(newNotification);

        // 최대 100개 유지
        if (notifications.length > 100) {
            notifications.pop();
        }

        this.saveNotifications(notifications);
        return newNotification;
    }

    /**
     * 알림 읽음 처리
     */
    markNotificationRead(notificationId) {
        const notifications = this.getNotifications() || [];
        const index = notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            notifications[index].read = true;
            this.saveNotifications(notifications);
        }
    }

    /**
     * 모든 알림 읽음 처리
     */
    markAllNotificationsRead() {
        const notifications = this.getNotifications() || [];
        notifications.forEach(n => n.read = true);
        this.saveNotifications(notifications);
    }

    /**
     * 읽지 않은 알림 개수
     */
    getUnreadNotificationCount() {
        const notifications = this.getNotifications() || [];
        return notifications.filter(n => !n.read).length;
    }

    /**
     * 알림 삭제
     */
    deleteNotification(notificationId) {
        let notifications = this.getNotifications() || [];
        notifications = notifications.filter(n => n.id !== notificationId);
        this.saveNotifications(notifications);
    }

    /**
     * 오늘의 읽지 않은 알림 가져오기
     */
    getTodayUnreadNotifications() {
        const notifications = this.getNotifications() || [];
        const today = new Date().toISOString().split('T')[0];
        return notifications.filter(n => !n.read && n.timestamp.startsWith(today));
    }

    /**
     * 학생 감정 기록 시 알림 생성
     */
    createEmotionNotification(studentId, emotion, memo) {
        const student = this.getStudent(studentId);
        if (!student) return null;

        const emotionType = EMOTION_TYPES[emotion];
        const notification = {
            type: 'emotion',
            studentId,
            studentName: student.name,
            emotion,
            emotionIcon: emotionType?.icon || '😊',
            emotionName: emotionType?.name || '기분',
            memo: memo || null,
            message: `${student.name}이(가) 오늘의 기분을 알려줬어요! ${emotionType?.icon || '😊'}`
        };

        return this.addNotification(notification);
    }

    // ==================== Firebase 연동 ====================

    /**
     * Firebase 초기화
     */
    async initFirebase() {
        try {
            const result = firebaseModule.initializeFirebase();
            if (result) {
                this.firebaseEnabled = firebaseModule.isFirebaseInitialized();
                if (this.firebaseEnabled) {
                    await firebaseModule.signInAnonymouslyIfNeeded();
                    console.log('Firebase 연동 활성화');
                }
            }
        } catch (error) {
            console.warn('Firebase 초기화 실패 (오프라인 모드):', error);
            this.firebaseEnabled = false;
        }
    }

    /**
     * Firebase 활성화 여부 확인
     */
    isFirebaseEnabled() {
        return this.firebaseEnabled && firebaseModule.isFirebaseInitialized();
    }

    // === 학급 코드 관련 ===

    /**
     * 학급 코드 생성
     */
    generateClassCode() {
        return firebaseModule.generateClassCode();
    }

    /**
     * 학급 코드 설정
     */
    setClassCode(code) {
        firebaseModule.setClassCode(code);
        // 학급 코드 설정 후 설정에 저장
        const settings = this.getSettings();
        if (settings) {
            this.updateSettings({ classCode: code });
        }
    }

    /**
     * 현재 학급 코드 가져오기
     */
    getClassCode() {
        return firebaseModule.getClassCode();
    }

    /**
     * 학급 코드 유효성 검사
     */
    async validateClassCode(code) {
        if (!this.isFirebaseEnabled()) return false;
        return await firebaseModule.validateClassCode(code);
    }

    /**
     * 새 학급 생성 (Firebase)
     */
    async createClass(settings) {
        if (!this.isFirebaseEnabled()) return null;

        // 새 학급 코드 생성
        const classCode = this.generateClassCode();
        firebaseModule.setClassCode(classCode);

        // 설정 저장
        const result = await firebaseModule.saveClassSettings({
            ...settings,
            classCode
        });

        if (result) {
            // 로컬에도 저장
            this.updateSettings({ ...settings, classCode });
            return classCode;
        }
        return null;
    }

    /**
     * 학급 참가 (학생용)
     */
    async joinClass(code) {
        if (!this.isFirebaseEnabled()) return false;

        const isValid = await this.validateClassCode(code);
        if (isValid) {
            firebaseModule.setClassCode(code);
            // 학급 설정 가져오기
            const settings = await firebaseModule.getClassSettings();
            if (settings) {
                this.saveSettings({ ...this.getSettings(), ...settings, classCode: code });
            }
            return true;
        }
        return false;
    }

    // === Firebase 동기화 함수들 ===

    /**
     * 감정 기록 저장 (Firebase + LocalStorage)
     */
    async addEmotionWithSync(emotion) {
        // 로컬에 저장
        const localResult = this.addEmotion(emotion);

        // Firebase에 동기화
        if (this.isFirebaseEnabled() && this.getClassCode()) {
            try {
                await firebaseModule.saveEmotion({
                    ...emotion,
                    timestamp: localResult.timestamp
                });
                console.log('감정 Firebase 동기화 완료');
            } catch (error) {
                console.warn('감정 Firebase 동기화 실패:', error);
            }
        }

        return localResult;
    }

    /**
     * 학생 저장 (Firebase + LocalStorage)
     */
    async saveStudentWithSync(student) {
        // 로컬에 저장
        const students = this.getStudents() || [];
        const index = students.findIndex(s => s.id === student.id);
        if (index !== -1) {
            students[index] = { ...students[index], ...student };
        } else {
            students.push(student);
        }
        this.saveStudents(students);

        // Firebase에 동기화
        if (this.isFirebaseEnabled() && this.getClassCode()) {
            try {
                await firebaseModule.saveStudent(student);
                console.log('학생 Firebase 동기화 완료');
            } catch (error) {
                console.warn('학생 Firebase 동기화 실패:', error);
            }
        }

        return student;
    }

    /**
     * 모든 학생 Firebase에 동기화
     */
    async syncAllStudentsToFirebase() {
        if (!this.isFirebaseEnabled() || !this.getClassCode()) return false;

        try {
            const students = this.getStudents() || [];
            await firebaseModule.saveAllStudents(students);
            console.log('모든 학생 Firebase 동기화 완료');
            return true;
        } catch (error) {
            console.warn('학생 일괄 동기화 실패:', error);
            return false;
        }
    }

    /**
     * Firebase에서 오늘의 감정 가져오기
     */
    async getTodayEmotionsFromFirebase() {
        if (!this.isFirebaseEnabled() || !this.getClassCode()) {
            return this.getTodayEmotions(); // 로컬 데이터 반환
        }

        try {
            const emotions = await firebaseModule.getTodayEmotions();
            return emotions.map(e => ({
                ...e,
                timestamp: firebaseModule.timestampToISO(e.createdAt) || e.timestamp
            }));
        } catch (error) {
            console.warn('Firebase 감정 조회 실패:', error);
            return this.getTodayEmotions();
        }
    }

    /**
     * 오늘의 감정 실시간 구독
     */
    subscribeToTodayEmotions(callback) {
        if (!this.isFirebaseEnabled() || !this.getClassCode()) {
            return null;
        }

        const unsubscribe = firebaseModule.subscribeToTodayEmotions((emotions) => {
            const formattedEmotions = emotions.map(e => ({
                ...e,
                timestamp: firebaseModule.timestampToISO(e.createdAt) || e.timestamp
            }));
            callback(formattedEmotions);
        });

        if (unsubscribe) {
            this.firebaseListeners.push(unsubscribe);
        }
        return unsubscribe;
    }

    /**
     * 학생 데이터 실시간 구독
     */
    subscribeToStudents(callback) {
        if (!this.isFirebaseEnabled() || !this.getClassCode()) {
            return null;
        }

        const unsubscribe = firebaseModule.subscribeToStudents(callback);
        if (unsubscribe) {
            this.firebaseListeners.push(unsubscribe);
        }
        return unsubscribe;
    }

    /**
     * 모든 Firebase 구독 해제
     */
    unsubscribeAllFirebase() {
        this.firebaseListeners.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        this.firebaseListeners = [];
        firebaseModule.unsubscribeAll();
    }

    /**
     * 칭찬 기록 저장 (Firebase + LocalStorage)
     */
    async addPraiseWithSync(praise) {
        // 로컬에 저장
        const localResult = this.addPraise(praise);

        // Firebase에 동기화
        if (this.isFirebaseEnabled() && this.getClassCode()) {
            try {
                await firebaseModule.savePraise({
                    ...praise,
                    timestamp: localResult.timestamp
                });
                console.log('칭찬 Firebase 동기화 완료');
            } catch (error) {
                console.warn('칭찬 Firebase 동기화 실패:', error);
            }
        }

        return localResult;
    }

    /**
     * 특정 학생의 감정 히스토리 가져오기 (Firebase)
     */
    async getStudentEmotionHistory(studentId, limit = 30) {
        if (!this.isFirebaseEnabled() || !this.getClassCode()) {
            // 로컬 데이터 반환
            return this.getEmotionsByStudent(studentId).slice(0, limit);
        }

        try {
            const emotions = await firebaseModule.getStudentEmotions(studentId, limit);
            return emotions.map(e => ({
                ...e,
                timestamp: firebaseModule.timestampToISO(e.createdAt) || e.timestamp
            }));
        } catch (error) {
            console.warn('학생 감정 히스토리 조회 실패:', error);
            return this.getEmotionsByStudent(studentId).slice(0, limit);
        }
    }

    /**
     * 날짜별 감정 기록 가져오기 (Firebase)
     */
    async getEmotionsByDate(date) {
        if (!this.isFirebaseEnabled() || !this.getClassCode()) {
            // 로컬 데이터 반환
            const log = this.getEmotionLog() || [];
            return log.filter(e => e.timestamp.startsWith(date));
        }

        try {
            const emotions = await firebaseModule.getEmotionsByDate(date);
            return emotions.map(e => ({
                ...e,
                timestamp: firebaseModule.timestampToISO(e.createdAt) || e.timestamp
            }));
        } catch (error) {
            console.warn('날짜별 감정 조회 실패:', error);
            const log = this.getEmotionLog() || [];
            return log.filter(e => e.timestamp.startsWith(date));
        }
    }
}

// 싱글톤 인스턴스
const store = new Store();

/**
 * 선생님 메시지를 펫 말투로 변환
 * @param {string} message - 원본 메시지
 * @param {string} petType - 펫 타입 (dog, cat, rabbit 등)
 * @param {string} petName - 펫 이름
 * @returns {object} { petMessage: 변환된 메시지, greeting: 인사 }
 */
function convertToPetSpeech(message, petType, petName) {
    const style = PET_SPEECH_STYLES[petType];
    if (!style) {
        return { petMessage: message, greeting: '' };
    }

    let petMessage = message.trim();

    // 1. "선생님" → "나"로 변경 (펫이 말하는 것처럼)
    petMessage = petMessage.replace(/선생님/g, '나');

    // 2. 끝에 있는 이모지 분리
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u;
    const emojiMatch = petMessage.match(emojiRegex);
    let trailingEmoji = '';
    if (emojiMatch) {
        trailingEmoji = ' ' + emojiMatch[0];
        petMessage = petMessage.slice(0, -emojiMatch[0].length).trim();
    }

    // 3. 각 문장 끝에 펫 말투 추가
    const suffix = style.suffix;

    // 문장 구분자로 나누기 (!, ?, . 다음에 공백이 있는 경우)
    // 각 문장 끝에 펫 말투 삽입
    petMessage = petMessage
        .replace(/([^!?.~]+)([!]+)/g, `$1 ${suffix}$2`)  // ! 앞에 말투
        .replace(/([^!?.~]+)([?]+)/g, `$1 ${suffix}$2`)  // ? 앞에 말투
        .replace(/([^!?.~]+)(\.)/g, `$1 ${suffix}$2`)    // . 앞에 말투
        .replace(/([^!?.~]+)(~)/g, `$1 ${suffix}$2`);    // ~ 앞에 말투

    // 마지막에 문장부호가 없으면 말투 + ! 추가
    const lastChar = petMessage.slice(-1);
    if (!['!', '?', '.', '~'].includes(lastChar)) {
        const randomEnding = style.endings[Math.floor(Math.random() * style.endings.length)];
        petMessage = `${petMessage} ${randomEnding}`;
    }

    // 이모지 다시 붙이기
    petMessage = petMessage + trailingEmoji;

    return {
        petMessage: petMessage,
        greeting: style.greeting,
        petName: petName
    };
}

// 상수 내보내기
export {
    store,
    PET_TYPES,
    PRAISE_CATEGORIES,
    EMOTION_TYPES,
    PET_REACTIONS,
    PET_SPEECH_STYLES,
    DEFAULT_SETTINGS,
    DEFAULT_TIMETABLE,
    convertToPetSpeech
};
