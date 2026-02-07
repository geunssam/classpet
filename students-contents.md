# 학생 페이지 관련 파일 정리

## 학생 전용 컴포넌트 (5개)

| 파일 | 역할 | 주요 기능 |
|------|------|----------|
| `js/components/StudentLogin.js` | 학생 로그인 | 학급코드 입력, 번호 선택, PIN 인증 |
| `js/components/StudentMode.js` | 학생 메인 화면 | 펫 표시, 감정 입력, 레벨/경험치, PIN 변경 |
| `js/components/PetSelection.js` | 펫 선택 화면 | 최초 로그인 시 펫 종류 선택 및 이름 짓기 |
| `js/components/PetCollection.js` | 펫 도감 | 소유한 펫 컬렉션 표시 |
| `js/components/PetChat.js` | 대화 히스토리 | 펫에게 보낸 감정 기록 목록 |

---

## 교사 페이지와 연동되어야 하는 파일들

### 1. 핵심 상태 관리 - `js/store.js`

**학생 관련 함수들:**
- 세션 관리: `studentLogin()`, `studentLogout()`, `getStudentSession()`, `isStudentLoggedIn()`, `getCurrentStudent()`
- 감정 기록: `addEmotion()`, `getStudentTodayEmotions()`, `getTodayEmotions()`
- PIN 관리: `verifyStudentPin()`, `updateStudentPin()`, `resetStudentPin()`
- 펫 관리: `selectPet()`, `hasSelectedPet()`, `completeAndChangePet()`
- Firebase 동기화: `syncEmotionToFirebase()`, `syncStudentToFirebase()`

**교사가 조회하는 학생 데이터:**
- 학생 목록: `getStudents()`, `getStudent()`
- 감정 통계: `getStudentsNeedingAttention()`, `getTodayEmotions()`
- 알림: `createEmotionNotification()` - 학생이 감정 입력 시 교사에게 알림

### 2. 라우터 - `js/router.js`

**학생 모드 라우트 정의 (7번 줄):**
```javascript
const STUDENT_MODE_ROUTES = ['student-login', 'student-main', 'student-chat', 'pet-selection', 'pet-collection'];
```

**UI 전환 로직:**
- `updateStudentModeUI()` - 학생/교사 모드에 따른 네비게이션 표시/숨김

### 3. 앱 초기화 - `js/app.js`

**학생 모드 라우트 등록 (368~416줄):**
- `student-login`, `student-main`, `student-chat`, `pet-selection`, `pet-collection`
- `updateHeaderForStudentMode()` - 헤더 스타일 변경

---

## 학생에서 사용하는 유틸리티

| 파일 | 역할 | 학생 화면에서 사용 |
|------|------|------------------|
| `js/utils/petLogic.js` | 펫 로직 | 레벨 계산, 성장 단계, 경험치 |
| `js/utils/nameUtils.js` | 이름 처리 | "~야/아" 조사 처리 |
| `js/utils/animations.js` | 애니메이션 | 토스트 메시지, 펫 반응 |

---

## 데이터 흐름 요약

```
┌─────────────────────┐
│     학생 화면        │
│  (StudentMode.js)   │
└─────────┬───────────┘
          │ 감정 입력
          ▼
┌─────────────────────┐
│      store.js       │
│  - addEmotion()     │
│  - syncToFirebase() │
└─────────┬───────────┘
          │ 실시간 동기화
          ▼
┌─────────────────────┐      ┌─────────────────────┐
│     Firebase        │◄────►│     교사 화면        │
│   (감정, 학생 데이터) │      │  (Emotion.js 등)    │
└─────────────────────┘      └─────────────────────┘
```

---

## 수정 시 주의사항

### 학생 전용 파일 수정 시
- `StudentLogin.js` - store의 `joinClass()`, `verifyStudentPin()` 호출
- `StudentMode.js` - store의 감정/펫 관련 함수들 사용

### 교사와 연동되는 데이터 수정 시
- `store.js`의 학생/감정 관련 함수 변경 시 → 교사 화면에서도 영향 받음
- Firebase 스키마 변경 시 → 양쪽 모두 업데이트 필요

### 라우터 수정 시
- `STUDENT_MODE_ROUTES` 배열에 새 라우트 추가 필요
- `app.js`에 라우트 등록 필요

---

*작성일: 2025-01-26*
