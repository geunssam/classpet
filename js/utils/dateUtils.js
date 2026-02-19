/**
 * 날짜 유틸리티
 * YYYY-MM-DD 포맷 등 공통 날짜 처리
 */

/**
 * Date 객체를 YYYY-MM-DD 문자열로 변환
 * @param {Date|string} date - 변환할 날짜 (기본: 현재)
 * @returns {string} YYYY-MM-DD 형식 문자열
 */
export function toDateString(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
