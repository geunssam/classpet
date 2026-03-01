/**
 * 감정 타입 상수 (12종 × 3대분류)
 * 에크만(Ekman) 기본 감정 + 초등 SEL 확장
 */

/**
 * 대분류 카테고리 (3종)
 */
export const EMOTION_CATEGORIES = {
    sunny: {
        key: 'sunny',
        name: '맑은 기분',
        icon: '☀️',
        description: '기분이 좋고 밝은 느낌이에요',
        gradient: 'linear-gradient(135deg, #FFE0B2 0%, #FFF9C4 100%)',
        emotions: ['happy', 'excited', 'grateful', 'love']
    },
    calm: {
        key: 'calm',
        name: '잔잔한 기분',
        icon: '🌙',
        description: '차분하고 고요한 느낌이에요',
        gradient: 'linear-gradient(135deg, #E1D5F0 0%, #BBDEFB 100%)',
        emotions: ['relaxed', 'neutral', 'surprised', 'shy']
    },
    cloudy: {
        key: 'cloudy',
        name: '흐린 기분',
        icon: '🌧️',
        description: '마음이 무겁고 힘든 느낌이에요',
        gradient: 'linear-gradient(135deg, #CFD8DC 0%, #C5CAE9 100%)',
        emotions: ['sad', 'angry', 'worried', 'lonely']
    }
};

/**
 * 세부 감정 타입 (12종)
 * - icon: 감정 캐릭터 이미지 대체용 이모지 (fallback)
 * - image: emotion-assets/ 내 이미지 파일명
 */
export const EMOTION_TYPES = {
    // ☀️ 맑은 기분
    happy:    { icon: '😊', name: '행복',     color: '#FF8A65', category: 'sunny',  image: 'happy.jpg',    definition: '좋은 일이 생겨서 마음이 반짝반짝해요', prompt: "'행복'을 선택한 이유가 뭐야? 어떤 일이 행복하게 만들었어?" },
    excited:  { icon: '🤩', name: '신남',     color: '#FFA726', category: 'sunny',  image: 'excited.jpg',  definition: '재밌는 일 앞에서 두근두근 설레요', prompt: "'신남'을 선택한 이유가 뭐야? 어떤 일이 신나게 만들었어?" },
    grateful: { icon: '🙏', name: '고마움',   color: '#FFD54F', category: 'sunny',  image: 'grateful.jpg', definition: '누군가 도와줘서 마음이 따뜻해요', prompt: "'고마움'을 선택한 이유가 뭐야? 누구한테 고마운 마음이 들었어?" },
    love:     { icon: '🥰', name: '사랑',     color: '#F48FB1', category: 'sunny',  image: 'love.jpg',     definition: '소중한 사람을 생각하면 포근해요', prompt: "'사랑'을 선택한 이유가 뭐야? 누구를 생각하면 사랑스러워?" },

    // 🌙 잔잔한 기분
    relaxed:   { icon: '😌', name: '편안',     color: '#B39DDB', category: 'calm',   image: 'relaxed.jpg',   definition: '걱정 없이 마음이 느긋해요', prompt: "'편안'을 선택한 이유가 뭐야? 어떤 게 마음을 편안하게 해줬어?" },
    neutral:   { icon: '😐', name: '그냥그래', color: '#D7CCC8', category: 'calm',   image: 'neutral.jpg',   definition: '딱히 좋지도 나쁘지도 않아요', prompt: "'그냥그래'를 선택한 이유가 뭐야? 오늘 하루는 어땠어?" },
    surprised: { icon: '😲', name: '놀람',     color: '#4FC3F7', category: 'calm',   image: 'surprised.jpg', definition: '예상 못한 일에 깜짝 놀랐어요', prompt: "'놀람'을 선택한 이유가 뭐야? 어떤 일이 깜짝 놀라게 했어?" },
    shy:       { icon: '🫣', name: '부끄러움', color: '#CE93D8', category: 'calm',   image: 'shy.jpg',       definition: '얼굴이 뜨거워지고 숨고 싶어요', prompt: "'부끄러움'을 선택한 이유가 뭐야? 어떤 일이 부끄럽게 만들었어?" },

    // 🌧️ 흐린 기분
    sad:     { icon: '😢', name: '슬픔',     color: '#78909C', category: 'cloudy', image: 'sad.jpg',     definition: '마음이 아프고 눈물이 날 것 같아요', prompt: "'슬픔'을 선택한 이유가 뭐야? 어떤 일이 슬프게 만들었어?" },
    angry:   { icon: '😠', name: '화남',     color: '#EF5350', category: 'cloudy', image: 'angry.jpg',   definition: '속상하고 답답해서 터질 것 같아요', prompt: "'화남'을 선택한 이유가 뭐야? 어떤 일 때문에 화가 났어?" },
    worried: { icon: '😰', name: '걱정',     color: '#7E57C2', category: 'cloudy', image: 'worried.jpg', definition: '안 좋은 일이 생길까 봐 불안해요', prompt: "'걱정'을 선택한 이유가 뭐야? 어떤 게 걱정되는 거야?" },
    lonely:  { icon: '😔', name: '외로움',   color: '#5C6BC0', category: 'cloudy', image: 'lonely.jpg',  definition: '혼자인 것 같아서 누군가 있으면 좋겠어요', prompt: "'외로움'을 선택한 이유가 뭐야? 어떨 때 외로운 마음이 들어?" }
};
