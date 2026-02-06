/**
 * 저장소 키 상수
 * localStorage/sessionStorage에서 사용하는 키 이름 관리
 */

export const STORAGE_KEYS = {
    SETTINGS: 'classpet_settings',
    STUDENTS: 'classpet_students',
    TIMETABLE: 'classpet_timetable',
    TIMETABLE_OVERRIDES: 'classpet_timetable_overrides',
    SUBJECT_COLORS: 'classpet_subject_colors',
    SUBJECT_LIST: 'classpet_subject_list',
    PRAISE_LOG: 'classpet_praise_log',
    EMOTION_LOG: 'classpet_emotion_log',
    NOTES: 'classpet_notes',
    NOTIFICATIONS: 'classpet_notifications',
    OFFLINE_QUEUE: 'classpet_offline_queue',
    CURRENT_CLASS_ID: 'classpet_current_class_id',
    CURRENT_TEACHER_UID: 'classpet_current_teacher_uid',
    PRAISE_CATEGORIES_CUSTOM: 'classpet_praise_categories'
};

export const SESSION_KEYS = {
    STUDENT_SESSION: 'classpet_student_session',
    TEACHER_SESSION: 'classpet_teacher_session'
};
