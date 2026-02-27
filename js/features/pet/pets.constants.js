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
        stages: { baby: '🐹', child: '🐹', teen: '🐹', adult: '🐹' },
        images: {
            baby: 'pet-assets/hamster/png/hamster_stage1_newborn.png',
            child: 'pet-assets/hamster/png/hamster_stage2_baby.png',
            teen: 'pet-assets/hamster/png/hamster_stage3_growing.png',
            adult: 'pet-assets/hamster/png/hamster_stage4_adult.png'
        }
    },
    fox: {
        name: '여우',
        category: 'mammal',
        stages: { baby: '🦊', child: '🦊', teen: '🦊', adult: '🦊' },
        images: {
            baby: 'pet-assets/fox/png/fox_stage1_newborn.png',
            child: 'pet-assets/fox/png/fox_stage2_baby.png',
            teen: 'pet-assets/fox/png/fox_stage3_growing.png',
            adult: 'pet-assets/fox/png/fox_stage4_adult.png'
        }
    },
    bear: {
        name: '곰',
        category: 'mammal',
        stages: { baby: '🐻', child: '🐻', teen: '🐻', adult: '🐻' },
        images: {
            baby: 'pet-assets/bear/png/bear_stage1_newborn.png',
            child: 'pet-assets/bear/png/bear_stage2_baby.png',
            teen: 'pet-assets/bear/png/bear_stage3_growing.png',
            adult: 'pet-assets/bear/png/bear_stage4_adult.png'
        }
    },
    panda: {
        name: '판다',
        category: 'mammal',
        stages: { baby: '🐼', child: '🐼', teen: '🐼', adult: '🐼' },
        images: {
            baby: 'pet-assets/panda/png/panda_stage1_newborn.png',
            child: 'pet-assets/panda/png/panda_stage2_baby.png',
            teen: 'pet-assets/panda/png/panda_stage3_growing.png',
            adult: 'pet-assets/panda/png/panda_stage4_adult.png'
        }
    },
    lion: {
        name: '사자',
        category: 'mammal',
        stages: { baby: '🦁', child: '🦁', teen: '🦁', adult: '🦁' },
        images: {
            baby: 'pet-assets/lion/png/lion_stage1_newborn.png',
            child: 'pet-assets/lion/png/lion_stage2_baby.png',
            teen: 'pet-assets/lion/png/lion_stage3_growing.png',
            adult: 'pet-assets/lion/png/lion_stage4_adult.png'
        }
    },
    chick: {
        name: '병아리',
        category: 'bird',
        stages: { baby: '🐣', child: '🐣', teen: '🐤', adult: '🐓' },
        images: {
            baby: 'pet-assets/chick/png/chick_stage1_newborn.png',
            child: 'pet-assets/chick/png/chick_stage2_baby.png',
            teen: 'pet-assets/chick/png/chick_stage3_growing.png',
            adult: 'pet-assets/chick/png/chick_stage4_adult.png'
        }
    },
    penguin: {
        name: '펭귄',
        category: 'bird',
        stages: { baby: '🐧', child: '🐧', teen: '🐧', adult: '🐧' },
        images: {
            baby: 'pet-assets/penguin/png/penguin_stage1_newborn.png',
            child: 'pet-assets/penguin/png/penguin_stage2_baby.png',
            teen: 'pet-assets/penguin/png/penguin_stage3_growing.png',
            adult: 'pet-assets/penguin/png/penguin_stage4_adult.png'
        }
    },
    turtle: {
        name: '거북이',
        category: 'reptile',
        stages: { baby: '🐢', child: '🐢', teen: '🐢', adult: '🐢' },
        images: {
            baby: 'pet-assets/turtle/png/turtle_stage1_newborn.png',
            child: 'pet-assets/turtle/png/turtle_stage2_baby.png',
            teen: 'pet-assets/turtle/png/turtle_stage3_growing.png',
            adult: 'pet-assets/turtle/png/turtle_stage4_adult.png'
        }
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
    },
    elephant: {
        name: '코끼리',
        category: 'mammal',
        stages: { baby: '🐘', child: '🐘', teen: '🐘', adult: '🐘' },
        images: {
            baby: 'pet-assets/elephant/png/elephant_stage1_newborn.png',
            child: 'pet-assets/elephant/png/elephant_stage2_baby.png',
            teen: 'pet-assets/elephant/png/elephant_stage3_growing.png',
            adult: 'pet-assets/elephant/png/elephant_stage4_adult.png'
        }
    },
    hedgehog: {
        name: '고슴도치',
        category: 'mammal',
        stages: { baby: '🦔', child: '🦔', teen: '🦔', adult: '🦔' },
        images: {
            baby: 'pet-assets/hedgehog/png/hedgehog_stage1_newborn.png',
            child: 'pet-assets/hedgehog/png/hedgehog_stage2_baby.png',
            teen: 'pet-assets/hedgehog/png/hedgehog_stage3_growing.png',
            adult: 'pet-assets/hedgehog/png/hedgehog_stage4_adult.png'
        }
    },
    otter: {
        name: '수달',
        category: 'mammal',
        stages: { baby: '🦦', child: '🦦', teen: '🦦', adult: '🦦' },
        images: {
            baby: 'pet-assets/otter/png/otter_stage1_newborn.png',
            child: 'pet-assets/otter/png/otter_stage2_baby.png',
            teen: 'pet-assets/otter/png/otter_stage3_growing.png',
            adult: 'pet-assets/otter/png/otter_stage4_adult.png'
        }
    },
    unicorn: {
        name: '유니콘',
        category: 'fantasy',
        stages: { baby: '🦄', child: '🦄', teen: '🦄', adult: '🦄' },
        images: {
            baby: 'pet-assets/unicorn/png/unicorn_stage1_newborn.png',
            child: 'pet-assets/unicorn/png/unicorn_stage2_baby.png',
            teen: 'pet-assets/unicorn/png/unicorn_stage3_growing.png',
            adult: 'pet-assets/unicorn/png/unicorn_stage4_adult.png'
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
    dragon: { suffix: '드라곤', endings: ['드라곤!', '용용~', '푸하~'], greeting: '날개 펼치며~' },
    elephant: { suffix: '코끼리', endings: ['뿌우!', '코끼리~', '뿌뿌!'], greeting: '코를 흔들며~' },
    hedgehog: { suffix: '도치', endings: ['도치!', '찌릿~', '도치도치!'], greeting: '가시 세우며~' },
    otter: { suffix: '수달', endings: ['수달!', '미끌~', '첨벙!'], greeting: '배영하며~' },
    unicorn: { suffix: '유니콘', endings: ['유니콘!', '반짝~', '빛나!'], greeting: '뿔이 빛나며~' }
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
