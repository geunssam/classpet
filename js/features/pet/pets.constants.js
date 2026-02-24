/**
 * 펫 관련 상수
 */

export const PET_TYPES = {
    dog: {
        name: '강아지',
        category: 'mammal',
        stages: { baby: '🐕', child: '🐕', teen: '🐕', adult: '🦮' },
        images: {
            baby: 'pet-assets/dog/png/dog_stage1_newborn.png',
            child: 'pet-assets/dog/png/dog_stage2_baby_v2.png',
            teen: 'pet-assets/dog/png/dog_stage3_growing.png',
            adult: 'pet-assets/dog/png/dog_stage4_adult.png'
        }
    },
    cat: {
        name: '고양이',
        category: 'mammal',
        stages: { baby: '🐱', child: '🐱', teen: '🐱', adult: '🐈' },
        images: {
            baby: 'pet-assets/cat/png/cat_stage1_newborn.png',
            child: 'pet-assets/cat/png/cat_stage2_baby.png',
            teen: 'pet-assets/cat/png/cat_stage3_growing.png',
            adult: 'pet-assets/cat/png/cat_stage4_adult.png'
        }
    },
    rabbit: {
        name: '토끼',
        category: 'mammal',
        stages: { baby: '🐰', child: '🐰', teen: '🐰', adult: '🐇' },
        images: {
            baby: 'pet-assets/rabbit/png/rabbit_stage1_newborn.png',
            child: 'pet-assets/rabbit/png/rabbit_stage2_baby.png',
            teen: 'pet-assets/rabbit/png/rabbit_stage3_growing.png',
            adult: 'pet-assets/rabbit/png/rabbit_stage4_adult.png'
        }
    },
    hamster: {
        name: '햄스터',
        category: 'mammal',
        stages: { baby: '🐹', child: '🐹', teen: '🐹', adult: '🐹' }
    },
    fox: {
        name: '여우',
        category: 'mammal',
        stages: { baby: '🦊', child: '🦊', teen: '🦊', adult: '🦊' }
    },
    bear: {
        name: '곰',
        category: 'mammal',
        stages: { baby: '🐻', child: '🐻', teen: '🐻', adult: '🐻' }
    },
    panda: {
        name: '판다',
        category: 'mammal',
        stages: { baby: '🐼', child: '🐼', teen: '🐼', adult: '🐼' }
    },
    lion: {
        name: '사자',
        category: 'mammal',
        stages: { baby: '🦁', child: '🦁', teen: '🦁', adult: '🦁' }
    },
    chick: {
        name: '병아리',
        category: 'bird',
        stages: { baby: '🐣', child: '🐣', teen: '🐤', adult: '🐓' }
    },
    penguin: {
        name: '펭귄',
        category: 'bird',
        stages: { baby: '🐧', child: '🐧', teen: '🐧', adult: '🐧' }
    },
    turtle: {
        name: '거북이',
        category: 'reptile',
        stages: { baby: '🐢', child: '🐢', teen: '🐢', adult: '🐢' }
    },
    dragon: {
        name: '드래곤',
        category: 'fantasy',
        stages: { baby: '🐉', child: '🐉', teen: '🐉', adult: '🐉' },
        images: {
            baby: 'pet-assets/dragon/png/dragon_stage1_newborn.png',
            child: 'pet-assets/dragon/png/dragon_stage2_baby.png',
            teen: 'pet-assets/dragon/png/dragon_stage3_growing.png',
            adult: 'pet-assets/dragon/png/dragon_stage4_adult.png'
        }
    }
};

export const PET_SPEECH_STYLES = {
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

export const PET_REACTIONS = {
    great: { animation: 'pet-jump', message: '야호! 🎉 나도 기뻐!', emoji: '✨' },
    good: { animation: 'pet-wiggle', message: '다행이다 🌟', emoji: '💫' },
    soso: { animation: 'pet-tilt', message: '음... 알겠어 💭', emoji: '🤔' },
    bad: { animation: 'pet-approach', message: '괜찮아, 내가 옆에 있을게 💕', emoji: '🫂' },
    terrible: { animation: 'pet-hug', message: '힘들었구나... 🫂 말해줘서 고마워', emoji: '💝' }
};

/**
 * 선생님 메시지를 펫 말투로 변환
 */
export function convertToPetSpeech(message, petType, petName) {
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
        const hash = message.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const endingIndex = hash % style.endings.length;
        petMessage = `${petMessage} ${style.endings[endingIndex]}`;
    }

    petMessage = petMessage + trailingEmoji;

    return {
        petMessage: petMessage,
        greeting: style.greeting,
        petName: petName
    };
}
