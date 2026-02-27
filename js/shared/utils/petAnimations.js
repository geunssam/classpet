/**
 * 펫 클릭 애니메이션 유틸리티
 * 동물별 특색 있는 클릭 반응 + 파티클 이펙트
 * 영상이 있는 펫+단계는 영상 재생, 나머지는 CSS 애니메이션
 */

import { getGrowthStage } from './petLogic.js';

const PET_CLICK_ANIMATIONS = {
    dog:     { class: 'pet-click-bounce',  particles: ['🐾', '💛', '⭐'], duration: 600 },
    cat:     { class: 'pet-click-wiggle',  particles: ['🐾', '💜', '✨'], duration: 700 },
    rabbit:  { class: 'pet-click-bounce',  particles: ['🥕', '💗', '⭐'], duration: 600 },
    dragon:  { class: 'pet-click-bounce',  particles: ['🔥', '💎', '⭐'], duration: 600 },
    hamster: { class: 'pet-click-wiggle',  particles: ['🌻', '💛', '✨'], duration: 700 },
    fox:     { class: 'pet-click-wiggle',  particles: ['🍂', '🧡', '✨'], duration: 700 },
    bear:    { class: 'pet-click-bounce',  particles: ['🍯', '💛', '⭐'], duration: 600 },
    panda:   { class: 'pet-click-bounce',  particles: ['🎋', '🖤', '⭐'], duration: 600 },
    lion:    { class: 'pet-click-bounce',  particles: ['👑', '💛', '🔥'], duration: 600 },
    chick:   { class: 'pet-click-wiggle',  particles: ['🌾', '💛', '✨'], duration: 700 },
    penguin: { class: 'pet-click-wiggle',  particles: ['❄️', '💙', '✨'], duration: 700 },
    turtle:  { class: 'pet-click-bounce',  particles: ['🍀', '💚', '⭐'], duration: 600 },
    elephant:{ class: 'pet-click-bounce',  particles: ['🌿', '💙', '⭐'], duration: 600 },
    hedgehog:{ class: 'pet-click-wiggle',  particles: ['🍎', '💛', '✨'], duration: 700 },
    otter:   { class: 'pet-click-wiggle',  particles: ['💧', '💙', '✨'], duration: 700 },
    unicorn: { class: 'pet-click-bounce',  particles: ['🌈', '💜', '⭐'], duration: 600 },
};

const DEFAULT_ANIMATION = { class: 'pet-click-bounce', particles: ['💫', '⭐'], duration: 600 };

/** 동물+성장단계별 클릭 영상 매핑 */
const PET_CLICK_VIDEOS = {
    'lion_baby': 'pet-assets/lion/video/lion_stage1_baby.mp4',
    'lion_adult': 'pet-assets/lion/video/lion_stage4_adult.mp4',
};

/** 특정 펫+단계의 영상 경로 반환 (없으면 null) */
export function getPetVideo(petType, stage) {
    return PET_CLICK_VIDEOS[`${petType}_${stage}`] || null;
}

/**
 * 펫 클릭 애니메이션 재생
 * @param {HTMLElement} element - 펫 이미지 요소 (#petEmoji 등)
 * @param {string} petType - 동물 종류 (dog, cat, ...)
 * @param {number} [level] - 펫 레벨 (영상 재생 판별용, 없으면 CSS 애니메이션만)
 */
export function playPetClickAnimation(element, petType, level) {
    if (!element) return;

    // 접근성: 모션 감소 선호 시 간단한 opacity 피드백만
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const target = element.querySelector('.pet-img') || element;
        target.style.opacity = '0.7';
        setTimeout(() => { target.style.opacity = '1'; }, 200);
        return;
    }

    // 영상이 있는 조합이면 영상 재생
    if (level != null && petType) {
        const stage = getGrowthStage(level);
        const videoKey = `${petType}_${stage}`;
        const videoSrc = PET_CLICK_VIDEOS[videoKey];
        if (videoSrc) {
            playPetVideo(element, videoSrc, petType);
            return;
        }
    }

    // 영상 없으면 기존 CSS 애니메이션
    playCssAnimation(element, petType);
}

/**
 * 영상 재생: img 숨기기 → video 생성 → 재생 → 페이드아웃 → img 페이드인 복원
 */
function playPetVideo(element, videoSrc, petType) {
    const img = element.querySelector('.pet-img');
    if (!img) return;

    // 이미 영상 재생 중이면 무시
    if (element.querySelector('video')) return;

    // idle 애니메이션 멈춤
    element.classList.remove('pet-pulse');

    // 파티클 이펙트
    const config = PET_CLICK_ANIMATIONS[petType] || DEFAULT_ANIMATION;
    const container = element.closest('#petEmojiContainer') || element.parentElement;
    if (container) {
        createClickParticles(container, config.particles);
    }

    // img는 그대로 두고, video를 절대 위치로 위에 덮어씌움 (레이아웃 이동 방지)
    element.style.position = 'relative';

    const video = document.createElement('video');
    video.src = videoSrc;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = false;
    video.className = img.className;
    Object.assign(video.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'opacity 0.8s ease-out',
    });

    element.appendChild(video);

    // 영상 끝나기 1.2초 전부터 서서히 페이드아웃 시작
    let fadeStarted = false;
    video.addEventListener('timeupdate', () => {
        if (fadeStarted || !video.duration) return;
        if (video.currentTime >= video.duration - 1.2) {
            fadeStarted = true;
            video.style.opacity = '0';
        }
    });

    // 영상 종료 → 제거 + idle 복귀
    video.addEventListener('ended', () => {
        setTimeout(() => {
            video.remove();
            element.classList.add('pet-pulse');
        }, 300);
    });

    // 재생 실패 시에도 복원
    video.addEventListener('error', () => {
        video.remove();
        element.classList.add('pet-pulse');
    });
}

/**
 * 기존 CSS 애니메이션 재생
 */
function playCssAnimation(element, petType) {
    const target = element.querySelector('.pet-img') || element.querySelector('.pet-emoji-text') || element;
    const config = PET_CLICK_ANIMATIONS[petType] || DEFAULT_ANIMATION;

    // 1. idle 애니메이션 잠시 멈춤
    element.classList.remove('pet-pulse');

    // 2. 기존 클릭 애니메이션 제거
    target.classList.remove('pet-click-bounce', 'pet-click-wiggle');
    void target.offsetWidth; // reflow 트리거

    // 3. 동물별 CSS 클래스 적용
    target.classList.add(config.class);

    // 4. 파티클 이펙트
    const container = element.closest('#petEmojiContainer') || element.parentElement;
    if (container) {
        createClickParticles(container, config.particles);
    }

    // 5. 애니메이션 종료 후 클릭 클래스 제거 + idle 복귀
    setTimeout(() => {
        target.classList.remove(config.class);
        element.classList.add('pet-pulse');
    }, config.duration);
}

/**
 * 클릭 파티클 생성
 * @param {HTMLElement} container - 파티클을 담을 컨테이너 (position: relative 필요)
 * @param {string[]} particles - 이모지 배열
 */
export function createClickParticles(container, particles) {
    if (!container || !particles?.length) return;

    // 컨테이너에 position: relative 보장
    const style = getComputedStyle(container);
    if (style.position === 'static') {
        container.style.position = 'relative';
    }

    const count = 3 + Math.floor(Math.random() * 3); // 3~5개

    for (let i = 0; i < count; i++) {
        const span = document.createElement('span');
        span.className = 'pet-particle';
        span.textContent = particles[Math.floor(Math.random() * particles.length)];

        // 방사 방향 (중심 기준, 360도 랜덤)
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const distance = 20 + Math.random() * 20; // 20~40px
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        span.style.setProperty('--tx', `${tx}px`);
        span.style.setProperty('--ty', `${ty}px`);
        span.style.left = '50%';
        span.style.top = '50%';
        span.style.transform = `translate(-50%, -50%)`;

        container.appendChild(span);

        // 애니메이션 종료 후 제거
        setTimeout(() => {
            span.remove();
        }, 850);
    }
}
