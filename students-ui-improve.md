# 학생 페이지 UI 개선 계획

> 교사 페이지 리퀴드 글라스 스타일을 학생 페이지에 적용

---

## 현재 상태 vs 목표

| 요소 | 현재 (학생 페이지) | 목표 (교사 스타일 적용) |
|------|-------------------|----------------------|
| 일반 버튼 | `btn btn-primary` (단순 그라디언트) | 리퀴드 글라스 (반투명 + 블러) |
| 모달 버튼 | 개별 인라인 스타일 | `flex gap-2` + 리퀴드 스타일 |
| 뒤로가기 | 텍스트 링크 | 리퀴드 버튼 |
| 호버 효과 | 단순 색상 변화 | `translateY + scale` |

---

## Phase 1: CSS 스타일 기반 작업

### To-Do

- [ ] **1-1.** `css/style.css`에 학생용 리퀴드 버튼 스타일 추가
  ```css
  /* 추가할 클래스 */
  .liquid-btn-student         /* Primary 큰 버튼 */
  .liquid-btn-student-secondary  /* 보조 버튼 (회색) */
  .liquid-btn-student-sm      /* 작은 버튼 (돌아가기 등) */
  ```

- [ ] **1-2.** 모달 버튼 컨테이너 공통 스타일 추가
  ```css
  .modal-buttons {
      display: flex;
      gap: 8px;
  }
  .modal-buttons button {
      flex: 1;
  }
  ```

---

## Phase 2: StudentLogin.js 수정

### 수정 위치 및 To-Do

- [ ] **2-1.** PIN 모달 버튼 (130-136행)
  - 현재:
    ```html
    <button class="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-600">취소</button>
    <button class="flex-1 py-3 px-4 rounded-xl bg-primary text-white">확인</button>
    ```
  - 변경:
    ```html
    <div class="modal-buttons">
        <button class="liquid-btn-student-secondary">취소</button>
        <button class="liquid-btn-student">확인</button>
    </div>
    ```

- [ ] **2-2.** 학급 참가 버튼 (renderClassCodeInput 함수 내)
  - 리퀴드 스타일 적용

---

## Phase 3: StudentMode.js 수정

### 수정 위치 및 To-Do

- [ ] **3-1.** 펫에게 말하기 버튼 (`#sendEmotionBtn`)
  - `btn btn-primary` → `liquid-btn-student`
  - disabled 상태 스타일도 리퀴드에 맞게 조정

- [ ] **3-2.** 펫 도감 버튼 (`#petCollectionBtn`)
  - 현재 그라디언트 인라인 → `liquid-btn-student-secondary`

- [ ] **3-3.** PIN 변경 버튼 (`#changePinBtn`)
  - `bg-gray-100` → `liquid-btn-student-sm`

- [ ] **3-4.** PIN 변경 모달 버튼 (270-276행)
  - 모달 버튼 스타일 통일

- [ ] **3-5.** 새 펫 선택 버튼 (레벨 15 달성 시)
  - 리퀴드 강조 스타일 적용

---

## Phase 4: PetSelection.js 수정

### 수정 위치 및 To-Do

- [ ] **4-1.** 펫 확인 버튼 (`#confirmPetBtn`, 99-101행)
  - disabled/enabled 상태 모두 리퀴드 스타일

- [ ] **4-2.** 이름 짓기 모달 버튼 (134-139행)
  - "다시 고를래" → `liquid-btn-student-secondary`
  - "이 이름으로!" → `liquid-btn-student`

- [ ] **4-3.** 최종 확인 모달 버튼 (156-159행)
  - 동일하게 리퀴드 스타일

- [ ] **4-4.** 환영 모달 시작하기 버튼 (179행)
  - 강조 리퀴드 스타일

---

## Phase 5: PetCollection.js 수정

### 수정 위치 및 To-Do

- [ ] **5-1.** 뒤로가기 버튼 (`#backToMainBtn`, 51행)
  - 현재: `text-gray-400 hover:text-gray-600`
  - 변경: `liquid-btn-student-sm` + 화살표 아이콘

---

## Phase 6: PetChat.js 수정

### 수정 위치 및 To-Do

- [ ] **6-1.** 돌아가기 버튼 (37행)
  - `liquid-btn-student-sm`

- [ ] **6-2.** 기분 알려주기 버튼 (64행)
  - `btn btn-primary` → `liquid-btn-student`

---

## 유지할 요소 (수정하지 않음)

| 요소 | 파일 | 이유 |
|------|------|------|
| 감정 버튼 | StudentMode.js | 원형 이모지 UI는 학생 친화적 |
| PIN 입력 필드 | StudentLogin.js | 보안 입력 UX 유지 |
| 펫 말풍선 | StudentMode.js | 캐릭터성 있는 디자인 |
| 펫 도감 카드 | PetCollection.js | 컬렉션 특유의 디자인 |
| 펫 선택 카드 | PetSelection.js | 선택 인터랙션 고유 스타일 |
| 번호 선택 그리드 | StudentLogin.js | 빠른 터치 선택 UI |

---

## 검증 체크리스트

### 시각적 확인
- [ ] 학생 로그인 → PIN 모달 버튼 스타일
- [ ] 학생 메인 → 모든 버튼 호버/클릭 효과
- [ ] 펫 선택 → 모달 버튼 일관성
- [ ] 펫 도감/채팅 → 뒤로가기 버튼

### 기능 테스트
- [ ] PIN 입력 → 로그인 정상 동작
- [ ] 감정 선택 → 전송 정상 동작
- [ ] PIN 변경 → 모달 정상 동작
- [ ] 펫 선택 → 전체 플로우 정상

### 반응형 확인
- [ ] 모바일: 버튼 터치 영역 최소 44x44px
- [ ] 태블릿: 버튼 간격 적절

---

## 예상 작업량

| Phase | 난이도 | 파일 수 |
|-------|--------|---------|
| Phase 1 | 쉬움 | 1 |
| Phase 2 | 중간 | 1 |
| Phase 3 | 중간 | 1 |
| Phase 4 | 중간 | 1 |
| Phase 5 | 쉬움 | 1 |
| Phase 6 | 쉬움 | 1 |

---

*작성일: 2025-01-26*
