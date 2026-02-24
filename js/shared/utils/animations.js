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
        // 기존 방식: 지정된 시간 후 제거 (기본 2.5초)
        const duration = typeof options === 'number' ? options : (options.duration || 2500);
        setTimeout(() => {
            toast.remove();
        }, duration);
    }
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
