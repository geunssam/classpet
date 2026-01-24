/**
 * 클래스펫 상태 관리 모듈
 * Firebase 우선 구조 + LocalStorage 백업
 * 다중 학급 지원
 */

// Firebase 연동 모듈
import * as firebase from './firebase-config.js';

// 저장소 키
const STORAGE_KEYS = {
    SETTINGS: 'classpet_settings',
    STUDENTS: 'classpet_students',
    TIMETABLE: 'classpet_timetable',
    TIMETABLE_OVERRIDES: 'classpet_timetable_overrides',  // 주간 오버라이드
    SUBJECT_COLORS: 'classpet_subject_colors',  // 과목별 커스텀 색상
    PRAISE_LOG: 'classpet_praise_log',
    EMOTION_LOG: 'classpet_emotion_log',
    NOTES: 'classpet_notes',
    NOTIFICATIONS: 'classpet_notifications',
    OFFLINE_QUEUE: 'classpet_offline_queue',
    CURRENT_CLASS_ID: 'classpet_current_class_id',
    CURRENT_TEACHER_UID: 'classpet_current_teacher_uid'
};

// 기본 과목 색상 (Timetable.js의 SUBJECT_COLORS와 동일)
const DEFAULT_SUBJECT_COLORS = {
    '국어': { bg: '#DBEAFE', text: '#1E40AF' },      // 연한 파랑
    '수학': { bg: '#FEE2E2', text: '#B91C1C' },      // 연한 빨강
    '사회': { bg: '#FFEDD5', text: '#C2410C' },      // 연한 주황
    '과학': { bg: '#D1FAE5', text: '#047857' },      // 연한 초록
    '영어': { bg: '#EDE9FE', text: '#6D28D9' },      // 연한 보라
    '체육': { bg: '#FEF9C3', text: '#A16207' },      // 연한 노랑
    '음악': { bg: '#FCE7F3', text: '#BE185D' },      // 연한 핑크
    '미술': { bg: '#CCFBF1', text: '#0F766E' },      // 연한 청록
    '도덕': { bg: '#F3F4F6', text: '#4B5563' },      // 연한 회색
    '실과': { bg: '#E5E7EB', text: '#374151' },      // 회색
    '창체': { bg: '#D1D5DB', text: '#1F2937' }       // 진한 회색
};

// 색상 프리셋 (8개)
const COLOR_PRESETS = [
    { name: '파랑', bg: '#DBEAFE', text: '#1E40AF' },
    { name: '빨강', bg: '#FEE2E2', text: '#B91C1C' },
    { name: '주황', bg: '#FFEDD5', text: '#C2410C' },
    { name: '초록', bg: '#D1FAE5', text: '#047857' },
    { name: '보라', bg: '#EDE9FE', text: '#6D28D9' },
    { name: '노랑', bg: '#FEF9C3', text: '#A16207' },
    { name: '핑크', bg: '#FCE7F3', text: '#BE185D' },
    { name: '청록', bg: '#CCFBF1', text: '#0F766E' }
];

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
    schedule: {}
};

// 펫 타입 정의 (12종)
const PET_TYPES = {
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
    turtle: {
        name: '거북이',
        category: 'reptile',
        stages: { egg: '🥚', baby: '🐢', growing: '🐢', adult: '🐢' }
    },
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

// 펫 말투 스타일
const PET_SPEECH_STYLES = {
    dog: { suffix: '멍', endings: ['멍!', '왈왈!', '멍멍~'], greeting: '꼬리 살랑살랑~' },
    cat: { suffix: '냥', endings: ['냥~', '야옹~', '냥냥!'], greeting: '그루밍 중~' },
    rabbit: { suffix: '깡총', endings: ['깡총!', '토토~', '깡깡!'], greeting: '귀 쫑긋~' },
    hamster: { suffix: '햄', endings: ['햄!', '쪼꼼~', '햄햄!'], greeting: '볼 빵빵~' },
    fox: { suffix: '콘', endings: ['콘콘!', '여우~', '콘!'], greeting: '꼬리 흔들~' },
    bear: { suffix: '곰', endings: ['곰곰!', '웅~', '곰!'], greeting: '큰 포옹~' },
    panda: { suffix: '다', endings: ['빤다!', '대나무~', '판다!'], greeting: '뒹굴뒹굴~' },
    lion: { suffix: '으르렁', endings: ['어흥!', '으르렁~', '왕!'], greeting: '갈기 휘날리며~' },
    chick: { suffix: '삐약', endings: ['삐약!', '삐~', '삐삐!'], greeting: '날개 파닥파닥~' },
    penguin: { suffix: '펭', endings: ['펭펭!', '뒤뚱~', '펭!'], greeting: '배로 슬라이딩~' },
    turtle: { suffix: '엉금', endings: ['엉금!', '거북~', '느긋~'], greeting: '천천히 다가가며~' },
    dragon: { suffix: '드라곤', endings: ['드라곤!', '용용~', '푸하~'], greeting: '날개 펼치며~' }
};

// 펫 반응 메시지
const PET_REACTIONS = {
    great: { animation: 'pet-jump', message: '야호! 🎉 나도 기뻐!', emoji: '✨' },
    good: { animation: 'pet-wiggle', message: '다행이다 🌟', emoji: '💫' },
    soso: { animation: 'pet-tilt', message: '음... 알겠어 💭', emoji: '🤔' },
    bad: { animation: 'pet-approach', message: '괜찮아, 내가 옆에 있을게 💕', emoji: '🫂' },
    terrible: { animation: 'pet-hug', message: '힘들었구나... 🫂 말해줘서 고마워', emoji: '💝' }
};

// 샘플 학생 데이터
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
 * Firebase 우선 + LocalStorage 백업 구조
 */
class Store {
    constructor() {
        this.listeners = new Set();
        this.firebaseEnabled = false;
        this.firebaseListeners = [];
        this.currentClassId = null;
        this.currentTeacherUid = null;  // 계층 구조용 교사 UID
        this.currentClassData = null;
        this.offlineQueue = [];
        this.isOnline = navigator.onLine;
        this.authLoading = true;  // Firebase 인증 초기화 중

        // 네트워크 상태 감지
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        this.init();
    }

    /**
     * 초기화
     */
    async init() {
        // Firebase 초기화
        await this.initFirebase();

        // 저장된 현재 학급 정보 복원 (계층 구조: teacherUid + classId)
        this.currentClassId = localStorage.getItem(STORAGE_KEYS.CURRENT_CLASS_ID);
        this.currentTeacherUid = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER_UID);

        // Firebase 모듈에도 동기화
        if (this.currentTeacherUid) {
            firebase.setCurrentTeacherUid(this.currentTeacherUid);
        }
        if (this.currentClassId) {
            firebase.setCurrentClassId(this.currentClassId);
        }

        // 오프라인 큐 복원
        this.loadOfflineQueue();

        // 로컬 데이터 초기화 (Firebase 연결 없을 때 폴백용)
        this.initLocalData();
    }

    /**
     * 로컬 데이터 초기화 (폴백용)
     */
    initLocalData() {
        if (!this.getSettings()) {
            this.saveSettings(DEFAULT_SETTINGS);
        }
        if (!this.getStudents() || this.getStudents().length === 0) {
            this.saveStudents(SAMPLE_STUDENTS);
        }
        if (!this.getTimetable() || Object.keys(this.getTimetable()).length === 0) {
            this.saveTimetable(SAMPLE_TIMETABLE);
        }
        if (!this.getPraiseLog()) this.savePraiseLog([]);
        if (!this.getEmotionLog()) this.saveEmotionLog([]);
        if (!this.getNotes()) this.saveNotes([]);
        if (!this.getNotifications()) this.saveNotifications([]);
    }

    /**
     * Firebase 초기화
     */
    async initFirebase() {
        try {
            const result = firebase.initializeFirebase();
            if (result) {
                this.firebaseEnabled = firebase.isFirebaseInitialized();
                console.log('Firebase 연동:', this.firebaseEnabled ? '활성화' : '비활성화');
            }
        } catch (error) {
            console.warn('Firebase 초기화 실패:', error);
            this.firebaseEnabled = false;
        }
    }

    // ==================== 네트워크 상태 관리 ====================

    handleOnline() {
        this.isOnline = true;
        console.log('온라인 상태로 전환');
        this.processOfflineQueue();
    }

    handleOffline() {
        this.isOnline = false;
        console.log('오프라인 상태로 전환');
    }

    // ==================== 오프라인 큐 관리 ====================

    loadOfflineQueue() {
        const queue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
        this.offlineQueue = queue ? JSON.parse(queue) : [];
    }

    saveOfflineQueue() {
        localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.offlineQueue));
    }

    addToOfflineQueue(action) {
        this.offlineQueue.push({
            ...action,
            timestamp: new Date().toISOString()
        });
        this.saveOfflineQueue();
    }

    async processOfflineQueue() {
        if (!this.isOnline || !this.firebaseEnabled || this.offlineQueue.length === 0) {
            return;
        }

        console.log(`오프라인 큐 처리 시작: ${this.offlineQueue.length}개`);

        const queue = [...this.offlineQueue];
        this.offlineQueue = [];

        for (const action of queue) {
            try {
                await this.executeQueuedAction(action);
            } catch (error) {
                console.error('큐 처리 실패:', action, error);
                this.offlineQueue.push(action);
            }
        }

        this.saveOfflineQueue();
        console.log('오프라인 큐 처리 완료');
    }

    async executeQueuedAction(action) {
        // 계층 구조: teacherUid + classId 필요
        const teacherUid = action.teacherUid || this.currentTeacherUid;
        const classId = action.classId || this.currentClassId;
        if (!teacherUid || !classId) return;

        switch (action.type) {
            case 'saveStudent':
                await firebase.saveStudent(teacherUid, classId, action.data);
                break;
            case 'saveEmotion':
                await firebase.saveEmotion(teacherUid, classId, action.data);
                break;
            case 'savePraise':
                await firebase.savePraise(teacherUid, classId, action.data);
                break;
            case 'saveTimetable':
                await firebase.saveTimetable(teacherUid, classId, action.data);
                break;
            case 'saveNote':
                await firebase.saveNote(teacherUid, classId, action.data);
                break;
        }
    }

    // ==================== 변경 리스너 ====================

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(type, data) {
        this.listeners.forEach(listener => listener(type, data));
    }

    // ==================== 학급 관리 (계층 구조: teacherUid + classId) ====================

    /**
     * 현재 교사 UID 설정
     */
    setCurrentTeacherUid(uid) {
        this.currentTeacherUid = uid;
        firebase.setCurrentTeacherUid(uid);
        localStorage.setItem(STORAGE_KEYS.CURRENT_TEACHER_UID, uid || '');
    }

    /**
     * 현재 교사 UID 가져오기
     */
    getCurrentTeacherUid() {
        return this.currentTeacherUid || firebase.getCurrentTeacherUid();
    }

    /**
     * 현재 학급 ID 설정
     */
    setCurrentClassId(classId) {
        this.currentClassId = classId;
        firebase.setCurrentClassId(classId);
        localStorage.setItem(STORAGE_KEYS.CURRENT_CLASS_ID, classId || '');
        this.notify('classChange', classId);
    }

    /**
     * 현재 학급 ID 가져오기
     */
    getCurrentClassId() {
        return this.currentClassId || firebase.getCurrentClassId();
    }

    /**
     * 현재 학급 전체 정보 (teacherUid + classId) 설정
     */
    setCurrentClass(teacherUid, classId) {
        this.setCurrentTeacherUid(teacherUid);
        this.setCurrentClassId(classId);
    }

    /**
     * 현재 학급 데이터 설정
     */
    setCurrentClassData(classData) {
        this.currentClassData = classData;
        // classData에 teacherUid가 있으면 자동으로 설정
        if (classData?.teacherUid) {
            this.setCurrentTeacherUid(classData.teacherUid);
        }
    }

    /**
     * 현재 학급 데이터 가져오기
     */
    getCurrentClassData() {
        return this.currentClassData;
    }

    /**
     * Google 로그인
     */
    async signInWithGoogle() {
        try {
            const result = await firebase.signInWithGoogle();
            console.log('🔍 store.signInWithGoogle result:', JSON.stringify(result, null, 2));
            console.log('🔍 result.success:', result?.success);
            console.log('🔍 result.user exists:', !!result?.user);
            console.log('🔍 result.user type:', typeof result?.user);

            // user 객체가 있으면 성공으로 처리 (success 플래그와 무관하게)
            const user = result?.user;
            if (user) {
                this.firebaseEnabled = true;

                // 교사 UID 저장 (계층 구조용)
                this.setCurrentTeacherUid(user.uid);

                // 교사 세션 저장 (Google 로그인 정보 포함)
                const teacherSession = {
                    isLoggedIn: true,
                    isGoogleAuth: true,
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    loginTime: Date.now()
                };
                sessionStorage.setItem(SESSION_KEYS.TEACHER_SESSION, JSON.stringify(teacherSession));

                // 인증 상태 변경 알림
                this.notify('auth', { isLoggedIn: true, user: user });
                this.notify('teacherLogin', teacherSession);

                return { success: true, user: user };
            }

            // 리다이렉트 중인 경우 (pending 상태)
            if (result?.pending) {
                return { success: false, pending: true };
            }

            return { success: false, error: result?.error || '로그인에 실패했습니다' };
        } catch (error) {
            console.error('Google 로그인 실패:', error);
            throw error;
        }
    }

    /**
     * 리다이렉트 로그인 결과 확인 (페이지 로드 시)
     */
    async checkRedirectResult() {
        try {
            const result = await firebase.checkRedirectResult();
            if (result?.success && result?.user) {
                const user = result.user;
                this.firebaseEnabled = true;
                this.setCurrentTeacherUid(user.uid);

                const teacherSession = {
                    isLoggedIn: true,
                    isGoogleAuth: true,
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    loginTime: Date.now()
                };
                sessionStorage.setItem(SESSION_KEYS.TEACHER_SESSION, JSON.stringify(teacherSession));
                this.notify('auth', { isLoggedIn: true, user: user });
                this.notify('teacherLogin', teacherSession);

                console.log('✅ 리다이렉트 로그인 완료:', user.email);
                return { success: true, user: user };
            }
            return null;
        } catch (error) {
            console.error('리다이렉트 결과 확인 실패:', error);
            return null;
        }
    }

    /**
     * 로그아웃
     */
    async signOut() {
        try {
            await firebase.firebaseSignOut();
            this.currentClassId = null;
            this.currentTeacherUid = null;
            this.currentClassData = null;
            this.teacherLogout();
            this.studentLogout();
            localStorage.removeItem(STORAGE_KEYS.CURRENT_CLASS_ID);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_TEACHER_UID);

            // 인증 상태 변경 알림
            this.notify('auth', { isLoggedIn: false, user: null });
        } catch (error) {
            console.error('로그아웃 실패:', error);
            throw error;
        }
    }

    /**
     * 현재 Firebase 사용자
     */
    getCurrentUser() {
        return firebase.getCurrentUser();
    }

    /**
     * 교사인지 확인 (Google 로그인)
     */
    isGoogleTeacher() {
        // Firebase 인증 상태 먼저 확인
        if (firebase.isTeacherUser()) {
            return true;
        }

        // 세션 스토리지에서 Google 로그인 정보 확인 (페이지 새로고침 시)
        const session = this.getTeacherSession();
        return session?.isGoogleAuth === true;
    }

    /**
     * 인증 상태 리스너
     */
    onAuthChange(callback) {
        return firebase.onAuthChange(callback);
    }

    /**
     * 인증 로딩 상태 설정
     */
    setAuthLoading(loading) {
        this.authLoading = loading;
        this.notify('authLoading', loading);
    }

    /**
     * 인증 로딩 상태 확인
     */
    isAuthLoading() {
        return this.authLoading;
    }

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
            return { success: false, error: '학급 생성에 실패했습니다' };
        } catch (error) {
            console.error('학급 생성 실패:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 교사의 모든 학급 가져오기
     */
    async getTeacherClasses() {
        // Firebase 상태 재확인 (타임아웃으로 인한 상태 불일치 방지)
        if (!this.firebaseEnabled && firebase.isFirebaseInitialized()) {
            this.firebaseEnabled = true;
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
    }

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

            // Firebase 활성화 시 Firebase에서 검증
            if (this.firebaseEnabled) {
                const classData = await this.joinClassByCode(code);
                if (classData) {
                    // Firebase에서 학생 목록 로드
                    await this.loadClassDataFromFirebase();
                    return true;
                }
                return false;
            }

            // Firebase 비활성화 시 로컬 검증
            const settings = this.getSettings();
            if (settings?.classCode === code) {
                return true;
            }

            // 새 학급코드 저장 (오프라인 모드)
            this.setClassCode(code);
            return true;
        } catch (error) {
            console.error('학급 참가 오류:', error);
            return false;
        }
    }

    /**
     * 학급코드로 학급 참가 (학생용) - Firebase 전용 (계층 구조)
     */
    async joinClassByCode(code) {
        if (!this.firebaseEnabled) return null;

        try {
            // 익명 인증
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

            return classData;
        } catch (error) {
            console.error('학급 참가 실패:', error);
            return null;
        }
    }

    /**
     * 학급코드 유효성 검사
     */
    async validateClassCode(code) {
        if (!this.firebaseEnabled) return false;
        return await firebase.validateClassCode(code);
    }

    /**
     * Firebase에서 현재 학급 데이터 로드 (학생 목록 등) - 계층 구조
     */
    async loadClassDataFromFirebase() {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return false;

        try {
            // 학생 목록 로드 (계층 구조)
            const students = await firebase.getAllStudents(teacherUid, classId);
            if (students && students.length > 0) {
                this.saveStudents(students);
                console.log(`Firebase에서 ${students.length}명의 학생 로드 완료`);
            }

            // 설정 정보 로드 (classData에서) - 계층 구조
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
            }

            return true;
        } catch (error) {
            console.error('Firebase 학급 데이터 로드 실패:', error);
            return false;
        }
    }

    // ==================== 설정 관련 ====================

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

    // ==================== 학생 관련 ====================

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
            pin: String(newNumber).padStart(4, '0'),
            exp: 0,
            level: 1,
            totalPraises: 0,
            petType: null,
            completedPets: [],
            ...student
        };
        students.push(newStudent);
        this.saveStudents(students);

        // Firebase 동기화
        this.syncStudentToFirebase(newStudent);

        return newStudent;
    }

    updateStudent(studentId, updates) {
        const students = this.getStudents() || [];
        const index = students.findIndex(s => s.id === studentId);
        if (index !== -1) {
            students[index] = { ...students[index], ...updates };
            this.saveStudents(students);

            // Firebase 동기화
            this.syncStudentToFirebase(students[index]);

            return students[index];
        }
        return null;
    }

    deleteStudent(studentId) {
        let students = this.getStudents() || [];
        students = students.filter(s => s.id !== studentId);
        students.forEach((s, i) => s.number = i + 1);
        this.saveStudents(students);

        // Firebase에서도 삭제 (계층 구조)
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (this.firebaseEnabled && teacherUid && classId) {
            firebase.deleteStudent(teacherUid, classId, studentId);
        }
    }

    /**
     * Firebase에 학생 동기화 (계층 구조)
     */
    async syncStudentToFirebase(student) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return;

        if (this.isOnline) {
            try {
                await firebase.saveStudent(teacherUid, classId, student);
            } catch (error) {
                console.warn('학생 Firebase 동기화 실패:', error);
                this.addToOfflineQueue({ type: 'saveStudent', teacherUid, classId, data: student });
            }
        } else {
            this.addToOfflineQueue({ type: 'saveStudent', teacherUid, classId, data: student });
        }
    }

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
    }

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
    }

    // === 펫 관련 ===

    selectPet(studentId, petType, petName = null) {
        if (!PET_TYPES[petType]) return null;
        const finalPetName = petName?.trim() || PET_TYPES[petType].name;
        return this.updateStudent(studentId, { petType, petName: finalPetName });
    }

    hasSelectedPet(studentId) {
        const student = this.getStudent(studentId);
        return student && student.petType !== null;
    }

    completeAndChangePet(studentId, newPetType, newPetName = null) {
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
        return this.updateStudent(studentId, {
            petType: newPetType,
            petName: finalPetName,
            level: 1,
            exp: 0,
            completedPets
        });
    }

    getCompletedPets(studentId) {
        const student = this.getStudent(studentId);
        return student?.completedPets || [];
    }

    hasCompletedPet(studentId, petType) {
        const completedPets = this.getCompletedPets(studentId);
        return completedPets.some(p => p.type === petType);
    }

    hasPet(studentId, petType) {
        const student = this.getStudent(studentId);
        if (!student) return false;
        return student.petType === petType || this.hasCompletedPet(studentId, petType);
    }

    // === PIN 관련 ===

    verifyStudentPin(studentId, pin) {
        const student = this.getStudent(studentId);
        if (!student) return false;
        const studentPin = student.pin || String(student.number).padStart(4, '0');
        return studentPin === pin;
    }

    resetStudentPin(studentId) {
        const student = this.getStudent(studentId);
        if (!student) return null;
        const defaultPin = String(student.number).padStart(4, '0');
        return this.updateStudent(studentId, { pin: defaultPin });
    }

    updateStudentPin(studentId, newPin) {
        if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            return null;
        }
        return this.updateStudent(studentId, { pin: newPin });
    }

    getDefaultPin(studentId) {
        const student = this.getStudent(studentId);
        if (!student) return null;
        return String(student.number).padStart(4, '0');
    }

    // ==================== 과목 색상 관련 ====================

    /**
     * 과목별 색상 가져오기 (저장된 커스텀 + 기본값 병합)
     */
    getSubjectColors() {
        const data = localStorage.getItem(STORAGE_KEYS.SUBJECT_COLORS);
        const customColors = data ? JSON.parse(data) : {};
        // 기본값과 커스텀 색상 병합 (커스텀이 우선)
        return { ...DEFAULT_SUBJECT_COLORS, ...customColors };
    }

    /**
     * 특정 과목 색상 가져오기
     */
    getSubjectColor(subject) {
        const colors = this.getSubjectColors();
        return colors[subject] || { bg: '#F3F4F6', text: '#4B5563' };
    }

    /**
     * 특정 과목 색상 저장
     */
    setSubjectColor(subject, colors) {
        const data = localStorage.getItem(STORAGE_KEYS.SUBJECT_COLORS);
        const customColors = data ? JSON.parse(data) : {};
        customColors[subject] = colors;
        localStorage.setItem(STORAGE_KEYS.SUBJECT_COLORS, JSON.stringify(customColors));
        this.notify('subjectColors', this.getSubjectColors());

        // Firebase 동기화
        this.syncSubjectColorsToFirebase(customColors);
    }

    /**
     * 모든 과목 색상 기본값으로 초기화
     */
    resetSubjectColors() {
        localStorage.removeItem(STORAGE_KEYS.SUBJECT_COLORS);
        this.notify('subjectColors', DEFAULT_SUBJECT_COLORS);
    }

    /**
     * 특정 과목 색상만 기본값으로 초기화
     */
    resetSubjectColor(subject) {
        const data = localStorage.getItem(STORAGE_KEYS.SUBJECT_COLORS);
        const customColors = data ? JSON.parse(data) : {};
        delete customColors[subject];
        localStorage.setItem(STORAGE_KEYS.SUBJECT_COLORS, JSON.stringify(customColors));
        this.notify('subjectColors', this.getSubjectColors());
    }

    /**
     * Firebase에 과목 색상 동기화
     */
    async syncSubjectColorsToFirebase(colors) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return;

        if (this.isOnline) {
            try {
                await firebase.saveSubjectColors(teacherUid, classId, colors);
            } catch (error) {
                console.warn('과목 색상 Firebase 동기화 실패:', error);
            }
        }
    }

    /**
     * Firebase에서 과목 색상 로드
     */
    async loadSubjectColorsFromFirebase() {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            const colors = await firebase.getSubjectColors(teacherUid, classId);
            if (colors) {
                localStorage.setItem(STORAGE_KEYS.SUBJECT_COLORS, JSON.stringify(colors));
                return colors;
            }
            return null;
        } catch (error) {
            console.error('Firebase 과목 색상 로드 실패:', error);
            return null;
        }
    }

    // ==================== 시간표 관련 ====================

    /**
     * 기본 시간표 가져오기
     */
    getTimetable() {
        const data = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
        return data ? JSON.parse(data) : null;
    }

    /**
     * 기본 시간표 저장
     */
    saveTimetable(timetable) {
        localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
        this.notify('timetable', timetable);

        // Firebase 동기화
        this.syncTimetableToFirebase(timetable);
    }

    /**
     * 기본 시간표 셀 업데이트
     */
    updateTimetableCell(key, value) {
        const timetable = this.getTimetable() || {};
        timetable[key] = value;
        this.saveTimetable(timetable);
    }

    // ==================== 주간 오버라이드 관련 ====================

    /**
     * ISO 주차 키 생성 (예: "2025-W04")
     */
    getWeekKey(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }

    /**
     * 월요일 날짜로 주차 키 생성
     */
    getWeekKeyFromMonday(monday) {
        return this.getWeekKey(monday);
    }

    /**
     * 모든 주간 오버라이드 가져오기
     */
    getWeeklyOverrides() {
        const data = localStorage.getItem(STORAGE_KEYS.TIMETABLE_OVERRIDES);
        return data ? JSON.parse(data) : {};
    }

    /**
     * 모든 주간 오버라이드 저장
     */
    saveWeeklyOverrides(overrides) {
        localStorage.setItem(STORAGE_KEYS.TIMETABLE_OVERRIDES, JSON.stringify(overrides));
        this.notify('timetableOverrides', overrides);

        // Firebase 동기화
        this.syncWeeklyOverridesToFirebase(overrides);
    }

    /**
     * 특정 주의 오버라이드 가져오기
     */
    getWeekOverride(weekKey) {
        const overrides = this.getWeeklyOverrides();
        return overrides[weekKey] || null;
    }

    /**
     * 특정 주의 특정 셀 오버라이드 설정
     */
    setWeekOverride(weekKey, cellKey, data) {
        const overrides = this.getWeeklyOverrides();

        if (!overrides[weekKey]) {
            overrides[weekKey] = {
                cells: {},
                updatedAt: new Date().toISOString()
            };
        }

        if (data === null) {
            // null이면 해당 셀의 오버라이드 삭제 (기본으로 복원)
            delete overrides[weekKey].cells[cellKey];
            // 셀이 없으면 주차 자체 삭제
            if (Object.keys(overrides[weekKey].cells).length === 0) {
                delete overrides[weekKey];
            }
        } else {
            overrides[weekKey].cells[cellKey] = data;
            overrides[weekKey].updatedAt = new Date().toISOString();
        }

        this.saveWeeklyOverrides(overrides);
        return overrides;
    }

    /**
     * 특정 주의 시간표 가져오기 (기본 + 오버라이드 병합)
     */
    getTimetableForWeek(weekKey) {
        const baseTimetable = this.getTimetable() || {};
        const weekOverride = this.getWeekOverride(weekKey);

        if (!weekOverride || !weekOverride.cells) {
            return { timetable: baseTimetable, overriddenCells: [] };
        }

        // 기본 시간표 복사 후 오버라이드 적용
        const merged = { ...baseTimetable };
        const overriddenCells = [];

        Object.entries(weekOverride.cells).forEach(([cellKey, cellData]) => {
            merged[cellKey] = cellData;
            overriddenCells.push(cellKey);
        });

        return { timetable: merged, overriddenCells };
    }

    /**
     * 특정 주의 오버라이드 전체 삭제 (기본으로 복원)
     */
    clearWeekOverride(weekKey) {
        const overrides = this.getWeeklyOverrides();
        delete overrides[weekKey];
        this.saveWeeklyOverrides(overrides);
    }

    /**
     * 오버라이드 히스토리 가져오기 (최근 N개 주)
     */
    getOverrideHistory(limit = 10) {
        const overrides = this.getWeeklyOverrides();
        return Object.entries(overrides)
            .map(([weekKey, data]) => ({
                weekKey,
                ...data,
                cellCount: Object.keys(data.cells || {}).length
            }))
            .sort((a, b) => b.weekKey.localeCompare(a.weekKey))
            .slice(0, limit);
    }

    async syncTimetableToFirebase(timetable) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        console.log('🔥 시간표 동기화 시도:', { teacherUid, classId, firebaseEnabled: this.firebaseEnabled });

        if (!teacherUid || !classId || !this.firebaseEnabled) {
            console.warn('❌ 시간표 동기화 조건 미충족:', {
                hasTeacherUid: !!teacherUid,
                hasClassId: !!classId,
                firebaseEnabled: this.firebaseEnabled
            });
            return;
        }
        console.log('✅ 시간표 동기화 조건 충족, Firebase에 저장 시작...');

        if (this.isOnline) {
            try {
                await firebase.saveTimetable(teacherUid, classId, timetable);
                console.log('✅ 시간표 Firebase 저장 성공!', { teacherUid, classId });
            } catch (error) {
                console.error('❌ 시간표 Firebase 저장 실패:', error);
                this.addToOfflineQueue({ type: 'saveTimetable', teacherUid, classId, data: timetable });
            }
        } else {
            console.log('📴 오프라인 상태 - 시간표를 오프라인 큐에 추가');
            this.addToOfflineQueue({ type: 'saveTimetable', teacherUid, classId, data: timetable });
        }
    }

    async syncWeeklyOverridesToFirebase(overrides) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        console.log('🔥 주간 오버라이드 동기화 시도:', { teacherUid, classId, firebaseEnabled: this.firebaseEnabled });

        if (!teacherUid || !classId || !this.firebaseEnabled) {
            console.warn('❌ 주간 오버라이드 동기화 조건 미충족:', {
                hasTeacherUid: !!teacherUid,
                hasClassId: !!classId,
                firebaseEnabled: this.firebaseEnabled
            });
            return;
        }
        console.log('✅ 주간 오버라이드 동기화 조건 충족, Firebase에 저장 시작...');

        if (this.isOnline) {
            try {
                await firebase.saveTimetableOverrides(teacherUid, classId, overrides);
                console.log('✅ 주간 오버라이드 Firebase 저장 성공!', { teacherUid, classId });
            } catch (error) {
                console.error('❌ 주간 오버라이드 Firebase 동기화 실패:', error);
                this.addToOfflineQueue({ type: 'saveTimetableOverrides', teacherUid, classId, data: overrides });
            }
        } else {
            console.log('📴 오프라인 상태 - 주간 오버라이드를 오프라인 큐에 추가');
            this.addToOfflineQueue({ type: 'saveTimetableOverrides', teacherUid, classId, data: overrides });
        }
    }

    async loadTimetableFromFirebase() {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            const timetable = await firebase.getTimetable(teacherUid, classId);
            if (timetable) {
                localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
                return timetable;
            }
            return null;
        } catch (error) {
            console.error('Firebase 시간표 로드 실패:', error);
            return null;
        }
    }

    async loadWeeklyOverridesFromFirebase() {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return null;

        try {
            const overrides = await firebase.getTimetableOverrides(teacherUid, classId);
            if (overrides) {
                localStorage.setItem(STORAGE_KEYS.TIMETABLE_OVERRIDES, JSON.stringify(overrides));
                return overrides;
            }
            return null;
        } catch (error) {
            console.error('Firebase 주간 오버라이드 로드 실패:', error);
            return null;
        }
    }

    // ==================== 칭찬 로그 관련 ====================

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
        log.unshift(newPraise);

        if (log.length > 500) log.pop();
        this.savePraiseLog(log);

        // Firebase 동기화
        this.syncPraiseToFirebase(newPraise);

        return newPraise;
    }

    async syncPraiseToFirebase(praise) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return;

        if (this.isOnline) {
            try {
                await firebase.savePraise(teacherUid, classId, praise);
            } catch (error) {
                this.addToOfflineQueue({ type: 'savePraise', teacherUid, classId, data: praise });
            }
        } else {
            this.addToOfflineQueue({ type: 'savePraise', teacherUid, classId, data: praise });
        }
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

    // ==================== 감정 로그 관련 ====================

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

        if (log.length > 1000) log.pop();
        this.saveEmotionLog(log);

        // Firebase 동기화
        this.syncEmotionToFirebase(newEmotion);

        return newEmotion;
    }

    async syncEmotionToFirebase(emotion) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return;

        if (this.isOnline) {
            try {
                await firebase.saveEmotion(teacherUid, classId, emotion);
            } catch (error) {
                this.addToOfflineQueue({ type: 'saveEmotion', teacherUid, classId, data: emotion });
            }
        } else {
            this.addToOfflineQueue({ type: 'saveEmotion', teacherUid, classId, data: emotion });
        }
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

    // === 답장 관련 ===

    addReplyToEmotion(emotionId, message) {
        const log = this.getEmotionLog() || [];
        const index = log.findIndex(e => e.id === emotionId);

        if (index !== -1) {
            log[index].reply = {
                message: message,
                timestamp: new Date().toISOString(),
                read: false
            };
            this.saveEmotionLog(log);
            return log[index];
        }
        return null;
    }

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

    getUnreadReplyCount(studentId) {
        const log = this.getEmotionLog() || [];
        return log.filter(e =>
            e.studentId === studentId && e.reply && !e.reply.read
        ).length;
    }

    getEmotionsWithReply(studentId) {
        const log = this.getEmotionLog() || [];
        return log.filter(e =>
            e.studentId === studentId && e.reply
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // ==================== 메모/노트 관련 ====================

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

        // Firebase 동기화
        this.syncNoteToFirebase(newNote);

        return newNote;
    }

    async syncNoteToFirebase(note) {
        const teacherUid = this.getCurrentTeacherUid();
        const classId = this.getCurrentClassId();
        if (!teacherUid || !classId || !this.firebaseEnabled) return;

        if (this.isOnline) {
            try {
                await firebase.saveNote(teacherUid, classId, note);
            } catch (error) {
                this.addToOfflineQueue({ type: 'saveNote', teacherUid, classId, data: note });
            }
        } else {
            this.addToOfflineQueue({ type: 'saveNote', teacherUid, classId, data: note });
        }
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

    // ==================== 통계 관련 ====================

    getStats() {
        const students = this.getStudents() || [];
        const todayPraises = this.getTodayPraises();
        const allPraises = this.getPraiseLog() || [];
        const todayEmotions = this.getTodayEmotions();
        const needAttention = this.getStudentsNeedingAttention();

        const categoryStats = {};
        Object.keys(PRAISE_CATEGORIES).forEach(cat => {
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
    }

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
    }

    studentLogout() {
        sessionStorage.removeItem(SESSION_KEYS.STUDENT_SESSION);
        this.notify('studentLogout', null);
    }

    getStudentSession() {
        const data = sessionStorage.getItem(SESSION_KEYS.STUDENT_SESSION);
        return data ? JSON.parse(data) : null;
    }

    isStudentLoggedIn() {
        const session = this.getStudentSession();
        if (!session) return false;
        const student = this.getStudent(session.studentId);
        return !!student;
    }

    getCurrentStudent() {
        const session = this.getStudentSession();
        if (!session) return null;
        return this.getStudent(session.studentId);
    }

    hasStudentCheckedEmotionToday(studentId) {
        const todayEmotions = this.getTodayEmotions();
        return todayEmotions.some(e => e.studentId === studentId);
    }

    getStudentTodayEmotion(studentId) {
        const todayEmotions = this.getTodayEmotions();
        return todayEmotions.find(e => e.studentId === studentId) || null;
    }

    getStudentTodayEmotions(studentId) {
        const todayEmotions = this.getTodayEmotions();
        return todayEmotions.filter(e => e.studentId === studentId);
    }

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
    }

    teacherLogout() {
        sessionStorage.removeItem(SESSION_KEYS.TEACHER_SESSION);
        this.notify('teacherLogout', null);
    }

    getTeacherSession() {
        const data = sessionStorage.getItem(SESSION_KEYS.TEACHER_SESSION);
        return data ? JSON.parse(data) : null;
    }

    isTeacherLoggedIn() {
        return !!this.getTeacherSession();
    }

    // ==================== 알림 관리 ====================

    getNotifications() {
        const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        return data ? JSON.parse(data) : null;
    }

    saveNotifications(notifications) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        this.notify('notifications', notifications);
    }

    addNotification(notification) {
        const notifications = this.getNotifications() || [];
        const newNotification = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };
        notifications.unshift(newNotification);

        if (notifications.length > 100) notifications.pop();
        this.saveNotifications(notifications);
        return newNotification;
    }

    markNotificationRead(notificationId) {
        const notifications = this.getNotifications() || [];
        const index = notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            notifications[index].read = true;
            this.saveNotifications(notifications);
        }
    }

    markAllNotificationsRead() {
        const notifications = this.getNotifications() || [];
        notifications.forEach(n => n.read = true);
        this.saveNotifications(notifications);
    }

    getUnreadNotificationCount() {
        const notifications = this.getNotifications() || [];
        return notifications.filter(n => !n.read).length;
    }

    deleteNotification(notificationId) {
        let notifications = this.getNotifications() || [];
        notifications = notifications.filter(n => n.id !== notificationId);
        this.saveNotifications(notifications);
    }

    getTodayUnreadNotifications() {
        const notifications = this.getNotifications() || [];
        const today = new Date().toISOString().split('T')[0];
        return notifications.filter(n => !n.read && n.timestamp.startsWith(today));
    }

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
        this.currentClassId = null;
        this.currentClassData = null;
        this.initLocalData();
        this.notify('clear', null);
    }

    // ==================== Firebase 관련 유틸리티 ====================

    isFirebaseEnabled() {
        return this.firebaseEnabled && firebase.isFirebaseInitialized();
    }

    generateClassCode() {
        return firebase.generateClassCode();
    }

    // 레거시 호환
    setClassCode(code) {
        firebase.setClassCode(code);
        const settings = this.getSettings();
        if (settings) {
            this.updateSettings({ classCode: code });
        }
    }

    getClassCode() {
        return firebase.getClassCode();
    }

    unsubscribeAllFirebase() {
        this.firebaseListeners.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        this.firebaseListeners = [];
        firebase.unsubscribeAll();
    }

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
    }

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
}

// 싱글톤 인스턴스
const store = new Store();

/**
 * 선생님 메시지를 펫 말투로 변환
 */
function convertToPetSpeech(message, petType, petName) {
    const style = PET_SPEECH_STYLES[petType];
    if (!style) {
        return { petMessage: message, greeting: '' };
    }

    let petMessage = message.trim();
    petMessage = petMessage.replace(/선생님/g, '나');

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u;
    const emojiMatch = petMessage.match(emojiRegex);
    let trailingEmoji = '';
    if (emojiMatch) {
        trailingEmoji = ' ' + emojiMatch[0];
        petMessage = petMessage.slice(0, -emojiMatch[0].length).trim();
    }

    const suffix = style.suffix;
    petMessage = petMessage
        .replace(/([^!?.~]+)([!]+)/g, `$1 ${suffix}$2`)
        .replace(/([^!?.~]+)([?]+)/g, `$1 ${suffix}$2`)
        .replace(/([^!?.~]+)(\.)/g, `$1 ${suffix}$2`)
        .replace(/([^!?.~]+)(~)/g, `$1 ${suffix}$2`);

    const lastChar = petMessage.slice(-1);
    if (!['!', '?', '.', '~'].includes(lastChar)) {
        const randomEnding = style.endings[Math.floor(Math.random() * style.endings.length)];
        petMessage = `${petMessage} ${randomEnding}`;
    }

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
    DEFAULT_SUBJECT_COLORS,
    COLOR_PRESETS,
    convertToPetSpeech
};
