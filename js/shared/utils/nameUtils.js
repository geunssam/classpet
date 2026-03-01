/**
 * 이름 호칭 유틸리티
 * 한국어 이름에서 성을 제거하고 받침에 따른 조사(아/야) 처리
 */

/**
 * 성 제거 (첫 글자 제거)
 * @param {string} fullName - 전체 이름 (예: "김민준")
 * @returns {string} - 이름만 (예: "민준")
 */
export function getFirstName(fullName) {
    if (!fullName || typeof fullName !== 'string') return '';
    // 숫자만인 경우(번호) 그대로 반환
    if (/^\d+$/.test(fullName)) return fullName;
    return fullName.length > 1 ? fullName.slice(1) : fullName;
}

/**
 * 받침 여부 확인 (한글 유니코드 계산 + 숫자 처리)
 * @param {string} str - 확인할 문자열
 * @returns {boolean} - 마지막 글자에 받침이 있으면 true
 */
export function hasFinalConsonant(str) {
    if (!str || typeof str !== 'string') return false;

    const lastChar = str.charAt(str.length - 1);

    // 숫자인 경우: 한국어 읽기 기준 받침 여부
    // 받침 있음: 1(일),7(칠),8(팔),0(영/공)
    // 받침 없음: 2(이),3(삼→ 받침있음),4(사),5(오),6(육→ 받침있음),9(구)
    if (/\d/.test(lastChar)) {
        return ['0', '1', '3', '6', '7', '8'].includes(lastChar);
    }

    const code = lastChar.charCodeAt(0);

    // 한글 범위: 0xAC00 (가) ~ 0xD7A3 (힣)
    if (code < 0xAC00 || code > 0xD7A3) return false;

    // (code - 0xAC00) % 28 === 0 이면 받침 없음
    return (code - 0xAC00) % 28 !== 0;
}

/**
 * 이름 + 호칭 (아/야) 반환
 * @param {string} fullName - 전체 이름 (예: "김민준")
 * @returns {string} - 이름 + 호칭 (예: "민준아")
 */
export function getNameWithSuffix(fullName) {
    const firstName = getFirstName(fullName);
    if (!firstName) return '';

    const suffix = hasFinalConsonant(firstName) ? '아' : '야';
    return firstName + suffix;
}

/**
 * 이/가 조사 반환
 * @param {string} str - 확인할 문자열
 * @returns {string} - "이" 또는 "가"
 */
export function getSubjectParticle(str) {
    return hasFinalConsonant(str) ? '이' : '가';
}

/**
 * 을/를 조사 반환
 * @param {string} str - 확인할 문자열
 * @returns {string} - "을" 또는 "를"
 */
export function getObjectParticle(str) {
    return hasFinalConsonant(str) ? '을' : '를';
}

/**
 * 은/는 조사 반환
 * @param {string} str - 확인할 문자열
 * @returns {string} - "은" 또는 "는"
 */
export function getTopicParticle(str) {
    return hasFinalConsonant(str) ? '은' : '는';
}
