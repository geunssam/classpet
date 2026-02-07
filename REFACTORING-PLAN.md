# ClassPet 코드베이스 리팩토링 계획

## 현재 상태 요약

| 파일 | 줄 수 | 문제점 |
|------|-------|--------|
| `js/firebase-config.js` | 2,176줄 | 8개 도메인(인증/학급/학생/감정/칭찬/시간표/메모/펫) CRUD가 한 파일에 |
| `js/store.js` | 3,113줄 | 상수 정의 + Store 클래스 + 비즈니스 로직 전부 혼재 |
| `js/app.js` | 1,407줄 | 초기화 + 라우팅 + UI관리 + 모달 + 전역함수 혼재 |
| `css/style.css` | 3,315줄 | 모든 스타일이 한 파일에 |
| `service-worker.js` | 132줄 | 존재하지 않는 파일 3개 참조 (버그) |

### Service Worker 버그 (즉시 수정 필요)
`STATIC_ASSETS`에서 없는 파일 참조:
- `/js/utils/router.js` → 존재하지 않음 (실제 라우터: `js/router.js`)
- `/js/utils/toast.js` → 존재하지 않음 (toast는 `animations.js` 안에 있음)
- `/js/components/Login.js` → 존재하지 않음 (실제: `LoginSelect.js`)

---

## Git 브랜치 전략

```
main (현재 안정 버전)
 └── refactor/base ← 리팩토링 공통 브랜치 (main에서 분기)
      ├── refactor/phase0-sw-fix ← Service Worker 버그 수정
      ├── refactor/phase1-constants ← 상수/데이터 분리
      ├── refactor/phase2-firebase ← Firebase 모듈 분할
      ├── refactor/phase3-store ← Store 책임 분리
      ├── refactor/phase4-app ← app.js 분할
      └── refactor/phase5-css ← CSS 정리
```

**머지 순서:** 각 phase 브랜치 → `refactor/base` → 전체 완료 후 `main`에 머지

---

## Phase 0: Service Worker 버그 수정
**브랜치:** `refactor/phase0-sw-fix`

### 작업 내용
`service-worker.js`의 `STATIC_ASSETS` 배열을 실제 존재하는 파일로 수정:

```
수정 전                          → 수정 후
/js/utils/router.js             → /js/router.js
/js/utils/toast.js              → /js/utils/animations.js
/js/components/Login.js         → /js/components/LoginSelect.js
```

누락된 파일도 추가:
- `/js/utils/petLogic.js`
- `/js/utils/nameUtils.js`
- 나머지 컴포넌트 파일들 (현재 19개 중 9개만 캐시됨)

### 수정 파일
- `service-worker.js`

### 검증
- 브라우저 DevTools > Application > Service Workers에서 정상 설치 확인
- 캐시 스토리지에 모든 파일 존재 확인

---

## Phase 1: 상수 및 데이터 정의 분리
**브랜치:** `refactor/phase1-constants`

### 목표
`store.js`의 1~226줄에 있는 상수/데이터 정의를 별도 파일로 분리

### 새 파일 구조
```
js/
  constants/
    storageKeys.js      ← STORAGE_KEYS
    subjects.js         ← DEFAULT_SUBJECT_LIST, DEFAULT_SUBJECT_COLORS, COLOR_PRESETS
    pets.js             ← PET_TYPES, PET_SPEECH_STYLES, PET_REACTIONS
    praise.js           ← PRAISE_CATEGORIES
    emotions.js         ← EMOTION_TYPES
    timetable.js        ← DEFAULT_TIMETABLE
    settings.js         ← DEFAULT_SETTINGS
    index.js            ← 모든 상수를 re-export하는 배럴 파일
```

### 작업 순서
1. `js/constants/` 폴더 생성
2. `store.js`에서 상수 정의를 각 파일로 이동
3. `js/constants/index.js`에서 모든 상수를 re-export
4. `store.js`에서 `import * as constants from './constants/index.js'`로 변경
5. `store.js`에서 기존 이름으로 재할당 (`const PET_TYPES = constants.PET_TYPES` 등)
6. 다른 파일에서 상수를 직접 import하도록 변경 (`petLogic.js` 등)

### 수정 파일
- `js/store.js` (상수 제거, import 추가)
- `js/utils/petLogic.js` (PET_TYPES import 경로 변경)
- `service-worker.js` (새 파일들 캐시 목록 추가)

### 하위 호환성
- `store.js`의 export 목록에서 상수들을 유지 (re-export) → 기존 코드 깨지지 않음
- 점진적으로 컴포넌트들이 `constants/`에서 직접 import하도록 전환

### 검증
- 앱 정상 부팅 확인
- 교사 로그인 → 대시보드 진입 확인
- 학생 로그인 → 펫 화면 정상 표시 확인
- 칭찬 카테고리 6개 정상 표시 확인

---

## Phase 2: Firebase 모듈 분할
**브랜치:** `refactor/phase2-firebase`

### 목표
`firebase-config.js` (2,176줄)를 도메인별 모듈로 분리

### 새 파일 구조
```
js/
  firebase/
    init.js             ← Firebase 앱/인증/Firestore 초기화 + 전역 상태
    auth.js             ← 인증 관련 (signIn, signOut, onAuthChange 등)
    classes.js          ← 학급 CRUD (createClass, getClass, deleteClass 등)
    students.js         ← 학생 CRUD (saveStudent, getAllStudents 등)
    emotions.js         ← 감정 CRUD + 실시간 구독
    praises.js          ← 칭찬 CRUD
    timetable.js        ← 시간표 CRUD
    notes.js            ← 메모 CRUD
    pets.js             ← 펫 CRUD + 실시간 구독
    helpers.js          ← 공통 헬퍼 (studentSubRef, studentSubDoc, timestampToISO)
    index.js            ← 모든 함수를 re-export하는 배럴 파일
```

### 작업 순서
1. `js/firebase/` 폴더 생성
2. `init.js` 작성: Firebase 초기화 + `db`, `auth` 인스턴스 export
3. `helpers.js` 작성: 공통 참조 헬퍼 함수 이동
4. 도메인별 파일로 관련 함수 이동 (auth → classes → students → ...)
5. `index.js`에서 모든 함수를 re-export
6. 기존 `firebase-config.js`를 `js/firebase/index.js`로의 프록시로 변경

### 핵심 의존성 주의사항
- `init.js`의 `db`, `auth` 인스턴스를 다른 모든 firebase 모듈이 import
- `helpers.js`의 `getCurrentClassPath()`, `studentSubRef()`, `studentSubDoc()`를 students, emotions, praises, pets가 사용
- `currentClassId`, `currentTeacherUid` 전역 상태는 `init.js`에서 관리

### 하위 호환성
- 기존 `firebase-config.js`는 삭제하지 않고, `js/firebase/index.js`를 re-export하는 브릿지로 유지
  ```javascript
  // firebase-config.js (브릿지)
  export * from './firebase/index.js';
  ```
- 이렇게 하면 `store.js`의 `import * as firebase from './firebase-config.js'`가 그대로 동작

### 수정 파일
- `js/firebase-config.js` → 브릿지 파일로 축소
- `js/firebase/*.js` → 새 파일 9개 생성
- `service-worker.js` (캐시 목록 업데이트)

### 검증
- Google 로그인 정상 작동
- 학급 생성/선택 정상
- 학생 CRUD 정상
- 감정 기록 + 교사 답장 정상
- 칭찬 → 경험치 → 레벨업 플로우 정상
- 실시간 구독 (감정/펫) 정상 동작

---

## Phase 3: Store 책임 분리
**브랜치:** `refactor/phase3-store`

### 목표
`store.js` (3,113줄)에서 Store 클래스의 메서드들을 도메인별 Mixin으로 분리

### 새 파일 구조
```
js/
  store/
    Store.js            ← Store 핵심 (constructor, subscribe/notify, localStorage, 온/오프라인)
    authMixin.js        ← 인증 관련 메서드 (signIn, logout, isTeacherLoggedIn 등)
    classMixin.js       ← 학급 관련 메서드 (setCurrentClass, loadClassData 등)
    studentMixin.js     ← 학생 CRUD 메서드
    emotionMixin.js     ← 감정 관련 메서드
    praiseMixin.js      ← 칭찬 관련 메서드
    petMixin.js         ← 펫 관련 메서드
    timetableMixin.js   ← 시간표 관련 메서드
    notificationMixin.js ← 알림 관련 메서드
    settingsMixin.js    ← 설정 관련 메서드
    offlineMixin.js     ← 오프라인 큐 관련 메서드
    index.js            ← Store 인스턴스 생성 + 상수 re-export
```

### Mixin 패턴 설명
```javascript
// authMixin.js 예시
export const authMixin = {
    signInWithGoogle() { ... },
    teacherLogout() { ... },
    isTeacherLoggedIn() { ... },
    // ...
};

// Store.js에서 조합
import { authMixin } from './authMixin.js';
import { classMixin } from './classMixin.js';

class Store {
    constructor() { ... }
    subscribe(listener) { ... }
    notify(type, data) { ... }
}

// Mixin 적용
Object.assign(Store.prototype, authMixin, classMixin, ...);
```

### 하위 호환성
- 기존 `js/store.js`를 브릿지로 유지:
  ```javascript
  export { store, PET_TYPES, PRAISE_CATEGORIES, ... } from './store/index.js';
  ```
- 모든 컴포넌트의 import 경로가 변경 없이 동작

### 수정 파일
- `js/store.js` → 브릿지 파일로 축소
- `js/store/*.js` → 새 파일 12개 생성
- `service-worker.js` (캐시 목록 업데이트)

### 검증
- 전체 인증 플로우 (교사/학생)
- 상태 변경 → UI 업데이트 (subscribe/notify)
- localStorage 저장/복원
- 오프라인 → 온라인 전환 시 큐 처리

---

## Phase 4: app.js 분할
**브랜치:** `refactor/phase4-app`

### 목표
`app.js` (1,407줄)의 책임을 분리

### 새 파일 구조
```
js/
  app/
    init.js             ← initApp() 메인 초기화 로직
    navigation.js       ← 네비게이션 바인딩, 탭 전환, 드로어
    header.js           ← 헤더 UI 관리, 학급정보 표시, 날짜 표시
    modals.js           ← 학생/메모 추가/편집/삭제 모달
    globalFunctions.js  ← window.classpet 네임스페이스 함수 등록
    routes.js           ← 라우트 정의 (14개 라우트 + 인증 가드)
  app.js                ← 브릿지: app/init.js의 initApp() 호출
```

### 수정 파일
- `js/app.js` → 브릿지
- `js/app/*.js` → 새 파일 6개
- `service-worker.js` (캐시 목록 업데이트)

### 검증
- 앱 초기화 정상
- 모든 라우트 이동 정상
- 모바일 드로어 메뉴 정상
- 학생 추가/편집/삭제 모달 정상
- 알림 모달 정상

---

## Phase 5: CSS 정리
**브랜치:** `refactor/phase5-css`

### 목표
`style.css` (3,315줄)를 논리적 섹션으로 분리

### 새 파일 구조
```
css/
  input.css             ← Tailwind 지시문 + @import 문
  base/
    variables.css       ← CSS 커스텀 속성, 색상 변수
    layout.css          ← 기본 레이아웃, safe-area
    typography.css      ← 폰트, 텍스트 스타일
  components/
    navbar.css          ← 상단 네비바, 탭
    toolbar.css         ← 우측 툴바
    drawer.css          ← 모바일 드로어
    modal.css           ← 모달 스타일
    toast.css           ← 토스트 알림
    cards.css           ← 카드 컴포넌트
    timetable.css       ← 시간표 그리드
    pet.css             ← 펫 관련 (경험치바, 레벨뱃지)
    praise.css          ← 칭찬 카테고리 버튼
  utilities/
    animations.css      ← 키프레임, 전환 효과
    responsive.css      ← 미디어 쿼리
    glass.css           ← 리퀴드 글라스 효과
  style.css             ← 모든 파일 @import (빌드 불필요, 직접 로드)
```

### 접근 방식
- CSS는 `@import`로 합치거나, `input.css`에서 Tailwind 빌드 시 통합
- 기존 `style.css`는 모든 섹션을 `@import`하는 진입점으로 변경
- `index.html`의 CSS 로드 경로 변경 불필요

### 수정 파일
- `css/style.css` → import 진입점으로 축소
- `css/base/*.css`, `css/components/*.css`, `css/utilities/*.css` → 새 파일들
- `service-worker.js` (캐시 목록 업데이트)

### 검증
- 전체 페이지 시각적 검수 (교사/학생 모드)
- 모바일 반응형 확인
- 애니메이션 정상 동작
- 리퀴드 글라스 효과 유지

---

## 전체 리팩토링 순서 요약

| 순서 | Phase | 핵심 작업 | 위험도 |
|------|-------|----------|--------|
| 1 | Phase 0 | Service Worker 버그 수정 | 낮음 |
| 2 | Phase 1 | 상수/데이터 분리 | 낮음 |
| 3 | Phase 2 | Firebase 모듈 분할 | 중간 |
| 4 | Phase 3 | Store 책임 분리 | 중간 |
| 5 | Phase 4 | app.js 분할 | 중간 |
| 6 | Phase 5 | CSS 정리 | 낮음 |

### 리스크 관리 원칙
1. **각 Phase 완료 후 반드시 앱 전체 테스트** (로그인 → 주요 기능 → 학생모드)
2. **브릿지 파일 패턴**: 기존 파일을 삭제하지 않고 re-export로 유지 → import 경로 호환성 보장
3. **한 번에 한 Phase만 진행**: 여러 Phase를 동시에 진행하지 않음
4. **문제 발생 시 `git checkout`으로 즉시 롤백** 가능

### 수동 검증 체크리스트 (매 Phase마다)
- [ ] 앱 정상 부팅 (로딩 화면 → 로그인 화면)
- [ ] 교사 Google 로그인
- [ ] 학급 선택 → 대시보드 진입
- [ ] 학생 목록 표시
- [ ] 칭찬 입력 → 경험치 증가
- [ ] 감정 기록 → 교사 답장
- [ ] 학생 로그인 → 펫 화면
- [ ] 시간표 표시
- [ ] 오프라인 페이지 (네트워크 차단 시)
