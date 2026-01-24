/**
 * 애니메이션 유틸리티
 * CSS 애니메이션 트리거 및 효과
 */

/**
 * 펫 바운스 애니메이션
 */
export function bounceAnimation(element) {
    if (!element) return;
    element.classList.add('pet-bounce');
    setTimeout(() => {
        element.classList.remove('pet-bounce');
    }, 500);
}

/**
 * 펫 흔들기 애니메이션
 */
export function wiggleAnimation(element) {
    if (!element) return;
    element.classList.add('pet-wiggle');
    setTimeout(() => {
        element.classList.remove('pet-wiggle');
    }, 300);
}

/**
 * 레벨업 애니메이션
 */
export function levelUpAnimation(element) {
    if (!element) return;
    element.classList.add('pet-levelup');
    setTimeout(() => {
        element.classList.remove('pet-levelup');
    }, 800);
}

/**
 * 반짝임 애니메이션 시작
 */
export function startSparkle(element) {
    if (!element) return;
    element.classList.add('pet-sparkle');
}

/**
 * 반짝임 애니메이션 중지
 */
export function stopSparkle(element) {
    if (!element) return;
    element.classList.remove('pet-sparkle');
}

/**
 * 펄스 애니메이션 시작
 */
export function startPulse(element) {
    if (!element) return;
    element.classList.add('pet-pulse');
}

/**
 * 펄스 애니메이션 중지
 */
export function stopPulse(element) {
    if (!element) return;
    element.classList.remove('pet-pulse');
}

/**
 * 칭찬 시 파티클 효과
 */
export function createPraiseParticles(container, emoji = '⭐') {
    if (!container) return;

    const particles = ['⭐', '✨', '💫', '🌟', '❤️'];
    const rect = container.getBoundingClientRect();

    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('span');
        particle.className = 'confetti';
        particle.textContent = particles[Math.floor(Math.random() * particles.length)];
        particle.style.left = `${Math.random() * rect.width}px`;
        particle.style.animationDelay = `${Math.random() * 0.3}s`;

        container.appendChild(particle);

        // 애니메이션 종료 후 제거
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }
}

/**
 * 토스트 메시지 표시
 */
export function showToast(message, type = 'default', options = {}) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    // 기존 토스트 제거
    container.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = 'toast';

    // clickToClose 옵션: 클릭 시 사라짐 (자동 사라짐 없음)
    if (options.clickToClose) {
        toast.classList.add('toast-persistent');
    }

    // 리퀴드 글라스 스타일 (공통)
    toast.style.cssText = `
        background: linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.9) 100%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.8);
        color: #1F2937;
    `;
    toast.textContent = message;

    container.appendChild(toast);

    if (options.clickToClose) {
        // 아무 곳이나 클릭하면 토스트 제거
        const removeToast = () => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
            document.removeEventListener('click', removeToast);
        };
        // 약간의 딜레이 후 클릭 이벤트 등록 (즉시 사라지는 것 방지)
        setTimeout(() => {
            document.addEventListener('click', removeToast);
        }, 100);
    } else {
        // 기존 방식: 지정된 시간 후 제거
        const duration = typeof options === 'number' ? options : (options.duration || 6000);
        setTimeout(() => {
            toast.remove();
        }, duration);
    }
}

/**
 * 경험치 바 애니메이션
 */
export function animateExpBar(element, targetPercent, duration = 500) {
    if (!element) return;

    const startPercent = parseFloat(element.style.width) || 0;
    const diff = targetPercent - startPercent;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 이징 함수 (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentPercent = startPercent + (diff * easeOut);

        element.style.width = `${currentPercent}%`;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

/**
 * 숫자 카운트업 애니메이션
 */
export function animateNumber(element, targetNumber, duration = 500, prefix = '', suffix = '') {
    if (!element) return;

    const startNumber = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
    const diff = targetNumber - startNumber;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 이징 함수 (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentNumber = Math.round(startNumber + (diff * easeOut));

        element.textContent = `${prefix}${currentNumber}${suffix}`;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

/**
 * 카드 페이드인 애니메이션
 */
export function fadeInCards(container, selector = '.card', delay = 100) {
    if (!container) return;

    const cards = container.querySelectorAll(selector);
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * delay);
    });
}

/**
 * 셰이크 애니메이션 (에러/경고용)
 */
export function shakeAnimation(element) {
    if (!element) return;

    element.style.animation = 'none';
    element.offsetHeight; // 리플로우 트리거
    element.style.animation = 'shake 0.5s ease';

    // CSS에 shake 애니메이션 없으면 인라인으로 추가
    if (!document.querySelector('#shake-keyframes')) {
        const style = document.createElement('style');
        style.id = 'shake-keyframes';
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

/**
 * 모달 열기 애니메이션
 */
export function openModal(modalId = 'modalContainer') {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // 백드롭 클릭 시 닫기
    const backdrop = modal.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.onclick = () => closeModal(modalId);
    }
}

/**
 * 모달 닫기 애니메이션
 */
export function closeModal(modalId = 'modalContainer') {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('show');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * 모달 내용 설정
 */
export function setModalContent(content, modalId = 'modalContainer') {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const contentEl = modal.querySelector('.modal-content');
    if (contentEl) {
        contentEl.innerHTML = content;
    }
}

/**
 * 로딩 오버레이 표시
 */
export function showLoading(message = '로딩 중...') {
    let overlay = document.querySelector('.loading-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay overlay';
        overlay.innerHTML = `
            <div class="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
                <div class="spinner"></div>
                <p class="text-gray-600 loading-message">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        overlay.querySelector('.loading-message').textContent = message;
    }

    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
}

/**
 * 로딩 오버레이 숨기기
 */
export function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

/**
 * 스크롤 애니메이션
 */
export function smoothScrollTo(element, offset = 0) {
    if (!element) return;

    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
        top,
        behavior: 'smooth'
    });
}

/**
 * 리플 효과 (버튼 클릭)
 */
export function createRipple(event, color = 'rgba(255, 255, 255, 0.5)') {
    const button = event.currentTarget;
    const ripple = document.createElement('span');

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${x}px;
        top: ${y}px;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    `;

    // 리플 애니메이션 CSS 추가
    if (!document.querySelector('#ripple-keyframes')) {
        const style = document.createElement('style');
        style.id = 'ripple-keyframes';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * 타이핑 효과
 */
export function typeWriter(element, text, speed = 50, callback = null) {
    if (!element) return;

    element.textContent = '';
    let index = 0;

    function type() {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
            setTimeout(type, speed);
        } else if (callback) {
            callback();
        }
    }

    type();
}
