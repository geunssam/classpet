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
    happy:    { icon: '😊', name: '행복',     color: '#FF8A65', category: 'sunny',  image: 'happy.png',    definition: '좋은 일이 생겨서 마음이 반짝반짝해요' },
    excited:  { icon: '🤩', name: '신남',     color: '#FFA726', category: 'sunny',  image: 'excited.png',  definition: '재밌는 일 앞에서 두근두근 설레요' },
    grateful: { icon: '🙏', name: '고마움',   color: '#FFD54F', category: 'sunny',  image: 'grateful.png', definition: '누군가 도와줘서 마음이 따뜻해요' },
    love:     { icon: '🥰', name: '사랑',     color: '#F48FB1', category: 'sunny',  image: 'love.png',     definition: '소중한 사람을 생각하면 포근해요' },

    // 🌙 잔잔한 기분
    relaxed:   { icon: '😌', name: '편안',     color: '#B39DDB', category: 'calm',   image: 'relaxed.png',   definition: '걱정 없이 마음이 느긋해요' },
    neutral:   { icon: '😐', name: '그냥그래', color: '#90A4AE', category: 'calm',   image: 'neutral.png',   definition: '딱히 좋지도 나쁘지도 않아요' },
    surprised: { icon: '😲', name: '놀람',     color: '#4FC3F7', category: 'calm',   image: 'surprised.png', definition: '예상 못한 일에 깜짝 놀랐어요' },
    shy:       { icon: '🫣', name: '부끄러움', color: '#CE93D8', category: 'calm',   image: 'shy.png',       definition: '얼굴이 뜨거워지고 숨고 싶어요' },

    // 🌧️ 흐린 기분
    sad:     { icon: '😢', name: '슬픔',     color: '#78909C', category: 'cloudy', image: 'sad.png',     definition: '마음이 아프고 눈물이 날 것 같아요' },
    angry:   { icon: '😠', name: '화남',     color: '#EF5350', category: 'cloudy', image: 'angry.png',   definition: '속상하고 답답해서 터질 것 같아요' },
    worried: { icon: '😰', name: '걱정',     color: '#7E57C2', category: 'cloudy', image: 'worried.png', definition: '안 좋은 일이 생길까 봐 불안해요' },
    lonely:  { icon: '😔', name: '외로움',   color: '#5C6BC0', category: 'cloudy', image: 'lonely.png',  definition: '혼자인 것 같아서 누군가 있으면 좋겠어요' }
};
