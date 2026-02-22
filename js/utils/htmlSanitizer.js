/**
 * HTML Sanitizer
 * 화이트리스트 기반 HTML 정화 (XSS 방지)
 */

const ALLOWED_TAGS = new Set([
    'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'span', 'div'
]);

const ALLOWED_STYLE_PROPS = new Set([
    'font-weight', 'font-style', 'text-decoration', 'color'
]);

/**
 * HTML을 화이트리스트 태그만 남기고 정화
 * @param {string} html - 정화할 HTML 문자열
 * @returns {string} 정화된 HTML
 */
export function sanitizeHTML(html) {
    if (!html || typeof html !== 'string') return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const cleaned = sanitizeNode(doc.body);
    return cleaned.innerHTML;
}

function sanitizeNode(node) {
    const fragment = document.createDocumentFragment();

    for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
            fragment.appendChild(document.createTextNode(child.textContent));
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            const tagName = child.tagName.toLowerCase();

            if (ALLOWED_TAGS.has(tagName)) {
                const el = document.createElement(tagName);

                // style 속성만 허용 (허용된 속성만)
                if (child.hasAttribute('style')) {
                    const cleanStyle = sanitizeStyle(child.style);
                    if (cleanStyle) el.setAttribute('style', cleanStyle);
                }

                // 자식 노드 재귀 처리
                el.appendChild(sanitizeNode(child));
                fragment.appendChild(el);
            } else {
                // 비허용 태그: 자식 콘텐츠만 유지 (태그 자체는 제거)
                fragment.appendChild(sanitizeNode(child));
            }
        }
    }

    const wrapper = document.createElement('div');
    wrapper.appendChild(fragment);
    return wrapper;
}

function sanitizeStyle(style) {
    const parts = [];
    for (const prop of ALLOWED_STYLE_PROPS) {
        const value = style.getPropertyValue(prop);
        if (value) parts.push(`${prop}: ${value}`);
    }
    return parts.join('; ');
}

/**
 * HTML에서 순수 텍스트 추출 (미리보기용)
 * @param {string} html - HTML 문자열
 * @returns {string} 순수 텍스트
 */
export function stripHTML(html) {
    if (!html || typeof html !== 'string') return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || '';
}
