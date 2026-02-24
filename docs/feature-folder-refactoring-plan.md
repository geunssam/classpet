# Classpet 기능별 폴더(Feature Folder) 전면 리팩토링

## Context
바이브코더로서 "로그인 수정" 시 4~5개 폴더를 돌아다녀야 하는 문제를 해결하기 위해, 현재 계층별(layer-based) 폴더 구조를 기능별(feature-based) 폴더 구조로 전면 전환한다. 새 브랜치에서 안전하게 진행.

---

## 코드베이스 현황 (검증 완료)

- **총 ~70개 JS 파일**, 모두 ES6 module (`import/export`)
- **100% 상대 경로** 사용, 순환 참조 없음
- **중앙 허브 패턴**: `firebase/index.js`, `constants/index.js`가 re-export 허브
- **service-worker.js에 38개 JS 경로 하드코딩** (STATIC_ASSETS 배열)
- **routes.js가 25개 컴포넌트 정적 import** (중앙 집결지)
- **store/index.js가 13개 mixin 정적 import** (중앙 집결지)
- 컴포넌트는 firebase를 직접 import하지 않음 (store를 통해 간접)

---

## 목표 폴더 구조

```
js/
├── features/
│   ├── auth/                    ← 로그인/인증 (11파일)
│   │   ├── TeacherLogin.js
│   │   ├── StudentLogin.js
│   │   ├── LoginSelect.js
│   │   ├── ConsentGate.js
│   │   ├── authMixin.js
│   │   ├── auth.firebase.js
│   │   ├── consent.firebase.js
│   │   ├── sessionTimeout.js
│   │   ├── crypto.js
│   │   ├── betaGate.js
│   │   └── consent.js
│   │
│   ├── class/                   ← 학급 관리 (5파일)
│   │   ├── ClassSelect.js
│   │   ├── classMixin.js
│   │   ├── studentMixin.js
│   │   ├── classes.firebase.js
│   │   └── students.firebase.js
│   │
│   ├── pet/                     ← 펫 시스템 (9파일)
│   │   ├── PetFarm.js
│   │   ├── PetSelection.js
│   │   ├── PetCollection.js
│   │   ├── PetChat.js
│   │   ├── petMixin.js
│   │   ├── petLogic.js
│   │   ├── PetService.js
│   │   ├── pets.firebase.js
│   │   └── pets.constants.js
│   │
│   ├── praise/                  ← 칭찬 시스템 (7파일)
│   │   ├── QuickPraise.js
│   │   ├── PraiseManagement.js
│   │   ├── StudentPraise.js
│   │   ├── praiseMixin.js
│   │   ├── thermostatMixin.js
│   │   ├── praises.firebase.js
│   │   └── praise.constants.js
│   │
│   ├── emotion/                 ← 감정 시스템 (5파일)
│   │   ├── Emotion.js
│   │   ├── emotionMixin.js
│   │   ├── EmotionService.js
│   │   ├── emotions.firebase.js
│   │   └── emotions.constants.js
│   │
│   ├── timetable/               ← 시간표 (6파일)
│   │   ├── Timetable.js
│   │   ├── StudentTimetable.js
│   │   ├── timetableMixin.js
│   │   ├── timetable.firebase.js
│   │   ├── timetable.constants.js
│   │   └── subjects.constants.js
│   │
│   ├── notice/                  ← 알림장 (4파일)
│   │   ├── Notice.js
│   │   ├── StudentNotice.js
│   │   ├── noticeMixin.js
│   │   └── notices.firebase.js
│   │
│   ├── classroom-tools/         ← 교실 도구 (5파일)
│   │   ├── Picker.js
│   │   ├── TimerView.js
│   │   ├── whistle.js
│   │   ├── timer.js
│   │   └── sound.js
│   │
│   ├── stats/                   ← 통계 (2파일)
│   │   ├── Stats.js
│   │   └── StudentDetail.js
│   │
│   ├── subscription/            ← 구독/결제 (4파일)
│   │   ├── Pricing.js
│   │   ├── Subscription.js
│   │   ├── subscription.js
│   │   └── payment.js
│   │
│   ├── dashboard/               ← 대시보드 (1파일)
│   │   └── Dashboard.js
│   │
│   ├── student-mode/            ← 학생 메인 (1파일)
│   │   └── StudentMode.js
│   │
│   └── legal/                   ← 법적 문서 (2파일)
│       ├── Privacy.js
│       └── Terms.js
│
├── shared/                      ← 여러 기능이 공유
│   ├── store/
│   │   ├── Store.js
│   │   ├── index.js             ← 모든 mixin 조합 (경로 업데이트)
│   │   ├── offlineMixin.js
│   │   ├── notificationMixin.js
│   │   └── settingsMixin.js     ← 설정/메모/백업/Firebase유틸 (추후 분해 가능)
│   │
│   ├── firebase/
│   │   ├── index.js             ← re-export 허브 (경로 업데이트)
│   │   ├── init.js
│   │   ├── config.js
│   │   ├── helpers.js
│   │   └── notes.js             ← 메모(notes)는 여러 기능에서 사용
│   │
│   ├── constants/
│   │   ├── index.js             ← re-export 허브 (경로 업데이트)
│   │   ├── icons.js
│   │   ├── storageKeys.js
│   │   └── settings.js
│   │
│   └── utils/
│       ├── animations.js
│       ├── dateUtils.js
│       ├── nameUtils.js
│       ├── htmlSanitizer.js
│       └── errorMonitor.js
│
├── app/                         ← 앱 인프라 (변경 없음, 경로만 업데이트)
│   ├── header.js
│   ├── navigation.js
│   ├── routes.js
│   ├── init.js
│   ├── modals.js
│   └── globalFunctions.js
│
├── app.js                       ← 브릿지 (변경 없음)
├── store.js                     ← re-export 브릿지 (경로만 업데이트)
├── router.js                    ← 라우터 (변경 없음)
└── firebase-config.js           ← Firebase 설정 브릿지 (경로만 업데이트)
```

---

## 실행 전략: 안전한 전면 전환

### Step 0: 새 브랜치 생성
```bash
git checkout -b refactor/feature-folders
```

### Step 1: 폴더 구조 생성 (파일 이동 없이)
- `js/features/` 하위 13개 폴더 생성
- `js/shared/` 하위 4개 폴더 생성

### Step 2: 파일 이동 (git mv 사용)
`git mv`를 사용하면 Git이 파일 이동을 추적하여 히스토리 보존.
기능별로 묶어서 이동 — 한 기능씩 이동 후 커밋.

**파일 이름 규칙 (확정)**:
- Firebase 파일: `praises.firebase.js`, `auth.firebase.js` (접미사 `.firebase.js`)
- 상수 파일: `praise.constants.js`, `pets.constants.js` (접미사 `.constants.js`)
- 기타 파일: 이름 변경 없음 (petMixin.js, PetFarm.js 등 그대로)

**이동 순서** (의존성 하위→상위):
1. `shared/` 먼저 (constants, firebase, utils, store 기반 파일)
2. `features/` 각 도메인 (auth, class, pet, praise, emotion, timetable, notice, classroom-tools, stats, subscription, dashboard, student-mode, legal)

### Step 3: Import 경로 일괄 수정
모든 파일의 `import` 문을 새 경로에 맞게 수정.

**핵심 수정 파일** (다른 파일에 가장 많이 영향):
1. `js/shared/store/index.js` — 13개 mixin import 경로
2. `js/shared/firebase/index.js` — 도메인별 firebase 모듈 경로
3. `js/shared/constants/index.js` — 도메인별 상수 모듈 경로
4. `js/app/routes.js` — 25개 컴포넌트 import 경로
5. `js/app/init.js` — 서비스/유틸 import 경로
6. `js/app/header.js` — StudentMode, QuickPraise 함수 import 경로
7. `js/store.js` — shared/store/index.js 브릿지 경로
8. `js/firebase-config.js` — shared/firebase 브릿지 경로

**모든 feature 파일** — 각자의 import 경로를 새 위치 기준으로 수정

### Step 4: service-worker.js 경로 업데이트
STATIC_ASSETS 배열의 38개 JS 경로를 새 구조에 맞게 전부 수정.

### Step 5: 검증
- 브라우저에서 전체 기능 테스트
- 교사 로그인 → 대시보드 → 각 탭 이동
- 학생 로그인 → 감정 체크인 → 펫 확인
- 칭찬 → EXP 증가 → 레벨업
- 시간표, 알림장, 교실 도구 확인
- 서비스 워커 캐시 정상 동작 확인

### Step 6: 커밋 & main 머지

---

## 위험성 분석

### 위험 1: Import 경로 누락 (확률: 높음, 영향: 치명적)
- **상황**: 70개 파일 × 파일당 평균 5개 import = ~350개 import 경로 수정
- **한 개라도 틀리면**: 해당 기능 전체 작동 불가 (모듈 로드 실패)
- **증상**: 콘솔에 `Failed to resolve module specifier` 에러
- **완화책**:
  - 파일 이동 후 **자동화 스크립트로 경로 일괄 수정** (수동 X)
  - 각 기능별로 이동+수정+테스트를 묶어서 진행
  - 브라우저 콘솔 에러를 단계별로 확인

### 위험 2: service-worker.js 캐시 불일치 (확률: 높음, 영향: 중간)
- **상황**: STATIC_ASSETS에 옛 경로가 남아있으면 캐시 실패
- **증상**: 오프라인 모드에서 특정 기능 로드 불가, 또는 옛 버전 캐시 사용
- **완화책**:
  - STATIC_ASSETS 배열을 features/ 구조에 맞게 **완전히 새로 작성**
  - 캐시 버전 강제 갱신 (`CACHE_NAME` 타임스탬프 변경)
  - 배포 후 서비스 워커 업데이트 확인

### 위험 3: store.js / firebase-config.js 브릿지 파일 경로 깨짐 (확률: 중간, 영향: 치명적)
- **상황**: `js/store.js`와 `js/firebase-config.js`는 루트 브릿지 파일
- 이 파일들이 `shared/store/index.js`와 `shared/firebase/index.js`를 가리키는데, 경로 한 글자 틀리면 앱 전체가 안 뜸
- **완화책**:
  - 브릿지 파일은 **가장 먼저 수정하고 테스트**
  - `js/store.js`의 내용은 단순 re-export이므로 변경량 최소

### 위험 4: header.js의 크로스 기능 import (확률: 중간, 영향: 중간)
- **상황**: `header.js`가 `StudentMode.js`(student-mode/)와 `QuickPraise.js`(praise/)의 특정 함수를 직접 import
- `thermostatMixin.js`도 직접 import: `import { DEFAULT_THERMOSTAT } from '../store/thermostatMixin.js'`
- 이런 크로스 기능 참조가 새 경로에서 깨질 수 있음
- **완화책**:
  - header.js의 import 목록을 사전에 완전히 파악 (완료)
  - 크로스 기능 import는 수작업으로 정확히 경로 맞춤

### 위험 5: Git 히스토리 파편화 (확률: 100%, 영향: 낮음)
- **상황**: `git mv`를 사용해도 GitHub에서 `git blame`이 파일 이동 전후로 끊길 수 있음
- **완화책**:
  - `git mv`를 사용하면 `git log --follow` 옵션으로 이동 전 히스토리 추적 가능
  - 파일 이동과 내용 변경을 **별도 커밋으로 분리** → Git의 rename detection 정확도 높임
  - **커밋 1**: `git mv`로 파일 이동만 (내용 변경 없음)
  - **커밋 2**: import 경로 수정

### 위험 6: 배포 후 사용자 캐시 문제 (확률: 중간, 영향: 중간)
- **상황**: 기존 사용자 브라우저에 옛 경로의 서비스 워커가 캐시되어 있음
- 새 배포 후 서비스 워커가 업데이트되지 않으면 옛 경로로 요청 → 404
- **완화책**:
  - `CACHE_NAME` 타임스탬프 강제 변경
  - 서비스 워커의 `activate` 이벤트에서 옛 캐시 전부 삭제 (이미 구현 확인 필요)
  - Netlify의 캐시 무효화 설정 확인

### 위험 7: Netlify 빌드 스크립트 (확률: 낮음, 영향: 낮음)
- **상황**: `npm run build`가 `tailwindcss` + `service-worker 버전 갱신`
- Tailwind는 CSS만 처리하므로 JS 구조 변경에 영향 없음
- service-worker 버전 갱신 스크립트는 정규식 기반이므로 파일 위치와 무관
- **완화책**: 없음 (위험 낮음)

---

## 커밋 전략 (히스토리 보존 극대화)

파일 이동과 내용 수정을 분리하여 Git rename detection을 극대화.

**가장 현실적인 방식**:
```
커밋 1: refactor: 기능별 폴더 구조로 전체 파일 이동 (git mv)
커밋 2: refactor: 전체 import 경로 수정 + service-worker 업데이트
```
→ 커밋 사이에 앱이 깨진 상태를 최소화

---

## 검증 체크리스트

- [ ] 브라우저 콘솔에 module import 에러 없음
- [ ] 교사 Google 로그인 → 학급 선택 → 대시보드 정상
- [ ] 칭찬하기 → EXP 증가 → 펫 레벨 반영
- [ ] 감정 체크인 → 교사 화면에 실시간 반영
- [ ] 시간표 편집 → 저장 → 새로고침 후 유지
- [ ] 알림장 작성 → 학생 모드에서 확인
- [ ] 교실 도구 (술래뽑기, 타이머) 작동
- [ ] 설정 → 학생 관리 → 추가/삭제
- [ ] 오프라인 → 온라인 복귀 시 데이터 동기화
- [ ] 서비스 워커: 캐시 → 오프라인 접근 가능
- [ ] Netlify 배포 후 실제 URL에서 정상 동작

---

## 부록: 도메인 분석 문서 검증 결과

### 정확한 부분 (신뢰도 높음)

| 항목 | 검증 결과 |
|------|----------|
| 10개 도메인 분류 | 실제 코드 구조와 잘 맞음 |
| 펫 12종 이름/구성 | 100% 일치 (`js/constants/pets.js`) |
| 칭찬 6대 역량 카테고리 | 100% 일치 (`js/constants/praise.js`) |
| 감정 5단계 | 100% 일치 (`js/constants/emotions.js`) |
| 15레벨 EXP 테이블 (0~2400) | 100% 일치 (`js/utils/petLogic.js`) |
| 성장 단계 (egg/baby/growing/adult) | 100% 일치 |
| RankTier S/A/B/C/D 기준 | 100% 일치 |
| 온도계 6개 마일스톤 | 100% 일치 (`thermostatMixin.js`) |
| 구독 플랜 3단 (무료/스탠다드/프로) | 가격·기능 제한 100% 일치 |
| FEATURE_MATRIX, canAccess() | 정확히 구현됨 (`js/utils/subscription.js`) |
| Firestore 계층 구조 | 규칙 파일과 정확히 일치 |
| Store mixin 패턴 (12개) | `Object.assign()` 프로토타입 혼합 확인 |
| 서비스 2개만 존재 (Pet, Emotion) | 정확 — 나머지는 서비스 계층 없음 |
| 연속 칭찬 보너스 (최대 50%) | 구현됨 (`petLogic.js:146`) |
| 균형 보너스 | 문서대로 "설계됨, 미구현" 맞음 (주석만 존재) |

### 사실과 다르거나 부정확한 부분

| 항목 | 문서 | 실제 |
|------|------|------|
| whistle.js "12K" | 12,000줄로 읽힐 수 있음 | 417줄, 파일 크기 12KB |
| emotionMixin.js "21K" | 동일 이슈 | 500줄 |
| 드래그 앤 드롭 시간표 | "dragState 지원" | dragState 변수 존재하나 모바일 터치 미구현 |
| 알림장 "독립" 분류 | 완전 독립 | 학급 데이터에 약한 결합 |
| settingsMixin 규모 | 구체적 수치 없음 | 30개+ 메서드, 6개 기능군 혼재 |

### 문서가 놓친 것들

- **offlineMixin**: 교실 환경(불안정 WiFi)에서 핵심, 문서에서 거의 언급 없음
- **notificationMixin**: 87줄이지만 학생 알림 배지 담당, 완전 누락
- **header.js (999줄)**: app/ 디렉토리 자체를 다루지 않음
- **보안**: betaGate.js 코드 하드코딩, webhook 서명 검증 없음, TOSS 테스트키 하드코딩

### 종합 평가

| 항목 | 평가 |
|------|------|
| 문서 전체 정확도 | **90~95%** — 매우 신뢰할 수 있음 |
| 도메인 분류 | 타당함 — 10개 분류가 실제 코드와 잘 맞음 |
| "개선 필요" 평가 | 대체로 동의 — God Object, 거대 컴포넌트 지적 정확 |

---

*작성일: 2026-02-24*
*검증 방법: 실제 코드베이스 전수 조사 (5개 탐색 에이전트 병렬 실행)*
