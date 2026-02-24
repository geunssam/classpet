/**
 * Classpet 베타 피드백 구글 폼 자동 생성 스크립트
 *
 * 사용법:
 * 1. https://script.google.com 접속
 * 2. 새 프로젝트 생성
 * 3. 이 코드를 전체 복사하여 붙여넣기
 * 4. ▶ 실행 버튼 클릭 (함수: createClasspetFeedbackForm)
 * 5. 권한 승인 후 로그에서 폼 URL 확인
 */

function createClasspetFeedbackForm() {
  const form = FormApp.create('🐾 Classpet 베타 피드백 설문');
  form.setDescription(
    'Classpet 베타 테스트에 참여해 주셔서 감사합니다!\n\n' +
    '여러분의 소중한 피드백이 더 좋은 서비스를 만듭니다.\n' +
    '솔직한 의견을 자유롭게 남겨주세요. (소요 시간: 약 5~7분)\n\n' +
    '🔗 Classpet: https://classpet.netlify.app'
  );
  form.setConfirmationMessage(
    '피드백을 보내주셔서 정말 감사합니다! 🐾\n' +
    '보내주신 의견은 Classpet 개선에 소중하게 반영하겠습니다.'
  );
  form.setProgressBar(true);
  form.setShowLinkToRespondAgain(false);

  // ═══════════════════════════════════════════════════
  // 섹션 1: 개인정보 수집·이용 동의
  // ═══════════════════════════════════════════════════

  form.addSectionHeaderItem()
    .setTitle('📋 개인정보 수집·이용 동의')
    .setHelpText(
      '본 설문은 Classpet 서비스 개선을 위한 베타 피드백 수집 목적으로 진행됩니다.\n\n' +
      '[ 수집 항목 ]\n' +
      '- 필수: 이메일 주소 (응답 확인 및 후속 안내용)\n' +
      '- 선택: 학교명, 학년, 담당 교과\n\n' +
      '[ 수집 목적 ]\n' +
      '- 베타 테스트 피드백 수집 및 분석\n' +
      '- 서비스 개선 사항 반영\n' +
      '- 정식 출시 안내 발송\n\n' +
      '[ 보유 기간 ]\n' +
      '- 수집일로부터 1년, 또는 정식 서비스 출시 후 6개월 중 먼저 도래하는 시점에 파기\n\n' +
      '[ 동의 거부 권리 ]\n' +
      '- 동의를 거부할 수 있으며, 거부 시 설문 참여가 제한됩니다.'
    );

  form.addMultipleChoiceItem()
    .setTitle('위 개인정보 수집·이용에 동의하십니까?')
    .setChoiceValues(['동의합니다'])
    .setRequired(true)
    .setHelpText('동의하지 않으시면 설문에 참여하실 수 없습니다.');

  // ═══════════════════════════════════════════════════
  // 섹션 2: 기본 정보
  // ═══════════════════════════════════════════════════

  form.addPageBreakItem()
    .setTitle('👤 기본 정보')
    .setHelpText('응답자님에 대해 간단히 알려주세요.');

  form.addTextItem()
    .setTitle('이메일 주소')
    .setHelpText('후속 안내 및 정식 출시 알림 수신용 (선택)')
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('현재 직업/역할은 무엇인가요?')
    .setChoiceValues([
      '초등학교 교사 (담임)',
      '초등학교 교사 (전담)',
      '중학교 교사',
      '고등학교 교사',
      '예비 교사 (교대/사대생)',
      '교육 관련 종사자',
      '기타'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('담당 학년은 어떻게 되시나요?')
    .setChoiceValues([
      '1~2학년 (저학년)',
      '3~4학년 (중학년)',
      '5~6학년 (고학년)',
      '중등 이상',
      '해당 없음'
    ])
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('Classpet을 얼마나 사용해 보셨나요?')
    .setChoiceValues([
      '처음 접속해 봄 (둘러보기만)',
      '1~2일 사용',
      '3~7일 사용',
      '1주일 이상 사용',
      '학급에 실제 적용해 봄'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('어떤 기기로 주로 사용하셨나요?')
    .setChoiceValues([
      '아이패드 / 아이폰',
      '안드로이드 태블릿 / 스마트폰',
      'PC / 노트북',
      '여러 기기 혼합 사용'
    ])
    .setRequired(false);

  // ═══════════════════════════════════════════════════
  // 섹션 3: 기능 평가
  // ═══════════════════════════════════════════════════

  form.addPageBreakItem()
    .setTitle('⚙️ 기능 평가')
    .setHelpText(
      'Classpet의 각 기능에 대해 평가해 주세요.\n' +
      '사용해보지 않은 기능은 "사용 안 해봄"을 선택해 주세요.'
    );

  // 3-1. 빠른 칭찬
  var praiseGrid = form.addGridItem();
  praiseGrid.setTitle('빠른 칭찬 기능');
  praiseGrid.setHelpText('플로팅 버튼(+)으로 학생에게 칭찬을 보내는 기능');
  praiseGrid.setRows([
    '칭찬 보내기가 쉬웠다',
    '카테고리(6종) 구분이 직관적이었다',
    '복수 학생 선택이 편리했다',
    '학생에게 실시간 알림이 잘 전달되었다'
  ]);
  praiseGrid.setColumns(['매우 그렇다', '그렇다', '보통', '그렇지 않다', '매우 그렇지 않다', '사용 안 해봄']);

  // 3-2. 감정 체크 & 채팅
  var emotionGrid = form.addGridItem();
  emotionGrid.setTitle('감정 체크 & 채팅 기능');
  emotionGrid.setHelpText('학생 감정 확인 + 1:1 실시간 대화 기능');
  emotionGrid.setRows([
    '학생 감정 현황 파악이 유용했다',
    '감정 채팅(교사↔학생)이 자연스러웠다',
    '펫 말투 변환이 재미있었다',
    '실시간 알림(배지)이 잘 작동했다'
  ]);
  emotionGrid.setColumns(['매우 그렇다', '그렇다', '보통', '그렇지 않다', '매우 그렇지 않다', '사용 안 해봄']);

  // 3-3. 펫 성장 시스템
  var petGrid = form.addGridItem();
  petGrid.setTitle('펫 성장 시스템');
  petGrid.setHelpText('칭찬 → 경험치 → 레벨업 → 펫 성장');
  petGrid.setRows([
    '펫 12종 선택이 다양하고 재미있었다',
    '레벨업(15단계) 속도가 적절했다',
    '펫 성장 과정이 학생 동기부여에 도움이 되었다',
    '펫 농장에서 전체 현황 파악이 편리했다'
  ]);
  petGrid.setColumns(['매우 그렇다', '그렇다', '보통', '그렇지 않다', '매우 그렇지 않다', '사용 안 해봄']);

  // 3-4. 실시간 연동
  var syncGrid = form.addGridItem();
  syncGrid.setTitle('실시간 연동');
  syncGrid.setHelpText('교사↔학생 기기 간 실시간 동기화');
  syncGrid.setRows([
    '칭찬이 학생 기기에 즉시 반영되었다',
    '감정 채팅이 실시간으로 주고받아졌다',
    '펫 경험치/레벨이 즉시 동기화되었다',
    '전반적인 실시간 연동이 안정적이었다'
  ]);
  syncGrid.setColumns(['매우 그렇다', '그렇다', '보통', '그렇지 않다', '매우 그렇지 않다', '사용 안 해봄']);

  // 3-5. 기타 기능
  var etcGrid = form.addGridItem();
  etcGrid.setTitle('기타 기능');
  etcGrid.setRows([
    '시간표 기능이 유용했다',
    '통계 화면이 도움이 되었다',
    '뽑기 기능이 편리했다',
    '타이머 기능이 유용했다',
    '학생 상세 화면 정보가 충분했다',
    '설정(학생 관리/백업 등)이 사용하기 쉬웠다'
  ]);
  etcGrid.setColumns(['매우 그렇다', '그렇다', '보통', '그렇지 않다', '매우 그렇지 않다', '사용 안 해봄']);

  form.addParagraphTextItem()
    .setTitle('기능 관련 추가 의견')
    .setHelpText('불편했던 점, 개선 아이디어, 추가되었으면 하는 기능 등을 자유롭게 적어주세요.')
    .setRequired(false);

  // ═══════════════════════════════════════════════════
  // 섹션 4: UI / 디자인 평가
  // ═══════════════════════════════════════════════════

  form.addPageBreakItem()
    .setTitle('🎨 UI / 디자인 평가')
    .setHelpText('화면 디자인, 레이아웃, 색상 등에 대해 평가해 주세요.');

  var uiGrid = form.addGridItem();
  uiGrid.setTitle('UI/디자인 항목별 평가');
  uiGrid.setRows([
    '전반적인 디자인이 깔끔하고 보기 좋았다',
    '색상 조합(파랑/보라/민트)이 조화로웠다',
    '글자 크기와 간격이 읽기 편했다',
    '아이콘과 이모지가 직관적이었다',
    '메뉴 구조가 이해하기 쉬웠다',
    '화면 전환이 자연스러웠다',
    '학생 모드 화면이 아이들에게 적합했다'
  ]);
  uiGrid.setColumns(['매우 그렇다', '그렇다', '보통', '그렇지 않다', '매우 그렇지 않다']);

  form.addMultipleChoiceItem()
    .setTitle('가장 마음에 드는 화면은 어디였나요?')
    .setChoiceValues([
      '대시보드',
      '빠른 칭찬',
      '펫 농장',
      '감정 체크 & 채팅',
      '학생 메인 (내 펫)',
      '통계',
      '기타'
    ])
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('UI/디자인 관련 추가 의견')
    .setHelpText('어색하거나 불편한 화면, 색상/폰트 관련 제안 등')
    .setRequired(false);

  // ═══════════════════════════════════════════════════
  // 섹션 5: 접근성 & 성능 평가
  // ═══════════════════════════════════════════════════

  form.addPageBreakItem()
    .setTitle('📱 접근성 & 성능 평가')
    .setHelpText('접속, 설치, 속도, 호환성 등에 대해 평가해 주세요.');

  var accessGrid = form.addGridItem();
  accessGrid.setTitle('접근성 & 성능 항목별 평가');
  accessGrid.setRows([
    '웹 주소로 접속하기 쉬웠다',
    '홈 화면 추가(PWA 설치)가 간편했다',
    '페이지 로딩 속도가 빨랐다',
    '화면 전환 시 끊김이 없었다',
    '태블릿/모바일에서 터치 조작이 편했다',
    '인터넷 불안정 시에도 안정적이었다',
    '교사 로그인(Google)이 간편했다',
    '학생 로그인(학급코드+번호+PIN)이 쉬웠다'
  ]);
  accessGrid.setColumns(['매우 그렇다', '그렇다', '보통', '그렇지 않다', '매우 그렇지 않다', '사용 안 해봄']);

  form.addParagraphTextItem()
    .setTitle('접속/성능 관련 불편 사항')
    .setHelpText('오류, 느린 화면, 호환성 문제 등이 있었다면 알려주세요. (기기/브라우저 정보 포함 시 도움됨)')
    .setRequired(false);

  // ═══════════════════════════════════════════════════
  // 섹션 6: 교육 활용도 평가
  // ═══════════════════════════════════════════════════

  form.addPageBreakItem()
    .setTitle('🏫 교육 활용도 평가')
    .setHelpText('실제 학급 경영에 Classpet이 얼마나 도움이 되는지 평가해 주세요.');

  var eduGrid = form.addGridItem();
  eduGrid.setTitle('교육 활용도 항목별 평가');
  eduGrid.setRows([
    '학생 동기부여(칭찬/펫 성장)에 효과적이다',
    '학생 감정 파악(감정 체크)에 도움이 된다',
    '학급 분위기 개선에 기여할 수 있다',
    '기존 학급 경영 도구(클래스팅 등) 대비 장점이 있다',
    '학기 전체를 통해 꾸준히 사용할 수 있다'
  ]);
  eduGrid.setColumns(['매우 그렇다', '그렇다', '보통', '그렇지 않다', '매우 그렇지 않다']);

  form.addCheckboxItem()
    .setTitle('Classpet이 가장 유용할 것 같은 상황은? (복수 선택)')
    .setChoiceValues([
      '일상 수업 중 즉석 칭찬',
      '아침 활동 감정 체크인',
      '모둠 활동 평가',
      '학기 장기 프로젝트 (펫 성장)',
      '학부모 상담 자료 (통계)',
      '생활지도 (감정 채팅)',
      '기타'
    ])
    .setRequired(false);

  // ═══════════════════════════════════════════════════
  // 섹션 7: 구독 & 결제 의향
  // ═══════════════════════════════════════════════════

  form.addPageBreakItem()
    .setTitle('💳 구독 & 결제 의향')
    .setHelpText(
      'Classpet의 향후 운영 방향을 결정하는 데 중요한 정보입니다.\n' +
      '솔직하게 답변해 주세요.'
    );

  form.addMultipleChoiceItem()
    .setTitle('Classpet이 유료 서비스가 된다면, 구독 또는 앱으로 구매하실 의향이 있으신가요?')
    .setChoiceValues([
      '예, 유료라도 사용하겠다',
      '가격에 따라 다르다',
      '무료라면 사용하겠다',
      '무료여도 사용하지 않을 것 같다',
      '잘 모르겠다'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('월 구독료는 얼마가 적당하다고 생각하시나요?')
    .setHelpText('현재 기능 기준으로 적정하다고 생각하는 금액을 선택해 주세요.')
    .setChoiceValues([
      '무료여야 한다',
      '월 1,000원 이하',
      '월 1,000원 ~ 2,000원',
      '월 2,000원 ~ 3,000원',
      '월 3,000원 ~ 5,000원',
      '월 5,000원 ~ 10,000원',
      '월 10,000원 이상도 괜찮다'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('선호하는 결제 방식은 무엇인가요?')
    .setChoiceValues([
      '월 구독 (매월 자동 결제)',
      '연 구독 (1년 단위, 할인 적용)',
      '학기 단위 구독 (6개월)',
      '일회성 구매 (평생 이용)',
      '프리미엄 기능만 유료 (기본 무료)'
    ])
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle('유료로 전환 시, 어떤 프리미엄 기능이 있으면 결제하시겠어요? (복수 선택)')
    .setChoiceValues([
      '학급 여러 개 운영 (멀티 학급)',
      '상세 통계 & 리포트 (PDF 출력)',
      '학부모 공유 기능',
      '커스텀 칭찬 카테고리',
      '추가 펫 종류 & 꾸미기',
      '학생 포트폴리오 자동 생성',
      '광고 제거',
      '우선 고객 지원',
      '기타'
    ])
    .setRequired(false);

  // ═══════════════════════════════════════════════════
  // 섹션 8: 종합 평가
  // ═══════════════════════════════════════════════════

  form.addPageBreakItem()
    .setTitle('⭐ 종합 평가')
    .setHelpText('마지막으로 Classpet에 대한 전반적인 평가를 부탁드립니다.');

  form.addMultipleChoiceItem()
    .setTitle('Classpet의 전체 별점은 몇 점인가요? (5점 만점)')
    .setHelpText('0.5점 간격으로 선택해 주세요.')
    .setChoiceValues([
      '⭐ 0.5점',
      '⭐ 1.0점',
      '⭐ 1.5점',
      '⭐⭐ 2.0점',
      '⭐⭐ 2.5점',
      '⭐⭐⭐ 3.0점',
      '⭐⭐⭐ 3.5점',
      '⭐⭐⭐⭐ 4.0점',
      '⭐⭐⭐⭐ 4.5점',
      '⭐⭐⭐⭐⭐ 5.0점'
    ])
    .setRequired(true);

  form.addScaleItem()
    .setTitle('동료 교사에게 Classpet을 추천하시겠습니까?')
    .setHelpText('0 = 전혀 추천하지 않음, 10 = 적극 추천 (NPS)')
    .setBounds(0, 10)
    .setLabels('전혀 추천 안 함', '적극 추천')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Classpet의 가장 좋았던 점은 무엇인가요?')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Classpet의 가장 아쉬웠던 점 또는 개선이 필요한 점은 무엇인가요?')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('추가되었으면 하는 기능이나 자유 의견을 남겨주세요.')
    .setRequired(false);

  // ═══════════════════════════════════════════════════
  // 완료 로그
  // ═══════════════════════════════════════════════════

  var formUrl = form.getEditUrl();
  var publishUrl = form.getPublishedUrl();
  var shortenedUrl = form.shortenFormUrl(publishUrl);

  Logger.log('═══════════════════════════════════════');
  Logger.log('✅ Classpet 베타 피드백 폼 생성 완료!');
  Logger.log('═══════════════════════════════════════');
  Logger.log('📝 편집 URL: ' + formUrl);
  Logger.log('🔗 배포 URL: ' + publishUrl);
  if (shortenedUrl) {
    Logger.log('🔗 단축 URL: ' + shortenedUrl);
  }
  Logger.log('═══════════════════════════════════════');

  return form;
}
