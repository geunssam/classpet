# Classpet Feature Folder 전면 리팩토링 계획서 v2

**작성일**: 2026-02-24
**검증 기준**: main 브랜치 커밋 f072e9e (현재 프로덕션)
**실제 파일**: 78개 JS, 22,643줄 (유령 파일 0개)

---

## 최우선 원칙: main 브랜치 절대 보호

```
main (프로덕션 배포 중, Netlify 연동)
  │
  └── refactor/feature-folders (새 브랜치, 여기서만 작업)
        │
        ├── 파일 이동
        ├── import 경로 수정
        ├── service-worker.js 경로 수정
        ├── 브라우저 테스트
        └── 모든 검증 통과 후에만 main에 머지
```

**규칙**:
- main에서는 단 한 줄도 수정하지 않는다
- 리팩토링 중 main에 핫픽스가 필요하면, main에서 직접 수정 후 리팩토링 브랜치에 rebase
- Netlify는 main만 배포하므로 리팩토링 브랜치에서 아무리 망쳐도 서비스 무영향
- 실패 시 브랜치 삭제로 완전 원복 (`git branch -D refactor/feature-folders`)

---

## 현재 코드베이스 (검증 완료, 78개 파일)

### 디렉토리별 현황

| 디렉토리 | 파일 수 | 줄 수 | 역할 |
|---|---|---|---|
| js/ (루트) | 4 | 434 | 브릿지 파일 (app.js, store.js, router.js, firebase-config.js) |
| js/app/ | 6 | 2,494 | 앱 인프라 (라우팅, 헤더, 초기화, 모달, 네비게이션) |
| js/components/ | 23 | 11,839 | UI 컴포넌트 |
| js/constants/ | 8 | 283 | 상수 정의 |
| js/firebase/ | 12 | 2,477 | Firestore CRUD |
| js/services/ | 2 | 119 | 실시간 구독 서비스 (Pet, Emotion) |
| js/store/ | 14 | 3,596 | 상태 관리 (Store + 12 mixin) |
| js/tools/ | 3 | 668 | 교실 도구 유틸 (소리, 타이머, 호루라기) |
| js/utils/ | 6 | 705 | 유틸리티 함수 |
| **합계** | **78** | **22,643** | |

### 핵심 허브 파일 (가장 많은 파일이 의존)

| 파일 | 줄 수 | import 당하는 횟수 | 역할 |
|---|---|---|---|
| js/store.js | 20 | ~36회 | 브릿지 — 거의 모든 컴포넌트가 import |
| js/router.js | 392 | ~16회 | SPA 라우터 |
| js/firebase-config.js | 13 | ~14회 | Firebase 브릿지 |
| js/app/routes.js | 316 | 1회 (init.js) | 23개 컴포넌트 import 집결지 |
| js/store/index.js | 68 | 1회 (store.js) | 12개 mixin + 10개 상수 조합 |
| js/firebase/index.js | 124 | 2회 | 70개 함수 re-export 허브 |
| js/constants/index.js | 12 | 1회 (store/index.js) | 상수 re-export 허브 |

---

## 목표 폴더 구조 (10개 기능 폴더)

```
js/
├── features/                        ← 10개 도메인 폴더
│   ├── auth/                        ← 로그인/인증 (5파일, 1,477줄)
│   │   ├── TeacherLogin.js            (320줄, components/)
│   │   ├── StudentLogin.js            (686줄, components/)
│   │   ├── LoginSelect.js             (141줄, components/)
│   │   ├── authMixin.js               (159줄, store/)
│   │   └── auth.firebase.js           (210줄, firebase/auth.js에서 이름변경)
│   │
│   ├── class/                       ← 학급 관리 (5파일, 1,708줄)
│   │   ├── ClassSelect.js             (583줄, components/)
│   │   ├── classMixin.js              (448줄, store/)
│   │   ├── studentMixin.js            (181줄, store/)
│   │   ├── classes.firebase.js        (300줄, firebase/classes.js)
│   │   └── students.firebase.js       (196줄, firebase/students.js)
│   │
│   ├── pet/                         ← 펫 시스템 (8파일, 1,660줄)
│   │   ├── PetFarm.js                 (238줄, components/)
│   │   ├── PetSelection.js            (414줄, components/)
│   │   ├── PetCollection.js           (223줄, components/)
│   │   ├── PetChat.js                 (158줄, components/)
│   │   ├── petMixin.js                (289줄, store/)
│   │   ├── PetService.js              (78줄, services/)
│   │   ├── pets.firebase.js           (245줄, firebase/pets.js)
│   │   └── pets.constants.js          (132줄, constants/pets.js)
│   │
│   ├── praise/                      ← 칭찬 시스템 (7파일, 1,569줄)
│   │   ├── QuickPraise.js             (355줄, components/)
│   │   ├── PraiseManagement.js        (472줄, components/)
│   │   ├── StudentPraise.js           (254줄, components/)
│   │   ├── praiseMixin.js             (285줄, store/)
│   │   ├── thermostatMixin.js         (90줄, store/)
│   │   ├── praises.firebase.js        (306줄, firebase/praises.js)
│   │   └── praise.constants.js        (12줄, constants/praise.js)
│   │
│   ├── emotion/                     ← 감정 시스템 (6파일, 1,834줄)
│   │   ├── Emotion.js                 (782줄, components/)
│   │   ├── emotionMixin.js            (500줄, store/)
│   │   ├── EmotionService.js          (41줄, services/)
│   │   ├── emotions.firebase.js       (500줄, firebase/emotions.js)
│   │   ├── emotions.constants.js      (11줄, constants/emotions.js)
│   │   └── sessionTimeout.js          (101줄, utils/ → auth와 emotion 모두 사용)
│   │
│   ├── timetable/                   ← 시간표 (5파일, 2,155줄)
│   │   ├── Timetable.js               (1,482줄, components/)
│   │   ├── StudentTimetable.js        (302줄, components/)
│   │   ├── timetableMixin.js          (480줄, store/)
│   │   ├── timetable.firebase.js      (155줄, firebase/timetable.js)
│   │   └── timetable.constants.js     (38줄, constants/timetable.js)
│   │
│   ├── notice/                      ← 알림장 (4파일, 957줄)
│   │   ├── Notice.js                  (449줄, components/)
│   │   ├── StudentNotice.js           (195줄, components/)
│   │   ├── noticeMixin.js             (181줄, store/)
│   │   └── notices.firebase.js        (133줄, firebase/notices.js)
│   │
│   ├── classroom-tools/             ← 교실 도구 (5파일, 2,259줄)
│   │   ├── Picker.js                  (1,182줄, components/)
│   │   ├── TimerView.js               (409줄, components/)
│   │   ├── whistle.js                 (417줄, tools/)
│   │   ├── timer.js                   (120줄, tools/)
│   │   └── sound.js                   (131줄, tools/)
│   │
│   ├── stats/                       ← 통계 (2파일, 868줄)
│   │   ├── Stats.js                   (272줄, components/)
│   │   └── StudentDetail.js           (596줄, components/)
│   │
│   └── dashboard/                   ← 대시보드+학생모드 (2파일, 1,371줄)
│       ├── Dashboard.js               (343줄, components/)
│       └── StudentMode.js             (1,028줄, components/)
│
├── shared/                          ← 여러 기능이 공유하는 기반 (14파일, 2,039줄)
│   ├── store/                         5파일, 887줄
│   │   ├── Store.js                   (123줄)
│   │   ├── index.js                   (68줄, mixin import 경로만 수정)
│   │   ├── offlineMixin.js            (89줄)
│   │   ├── notificationMixin.js       (87줄)
│   │   └── settingsMixin.js           (436줄) ← 추후 분해 가능, 이번엔 이동만
│   │
│   ├── firebase/                      5파일, 594줄
│   │   ├── index.js                   (124줄, re-export 경로만 수정)
│   │   ├── init.js                    (162줄)
│   │   ├── config.js                  (0줄, 필요시 생성) ← firebase-config.js가 대체
│   │   ├── helpers.js                 (25줄)
│   │   └── notes.js                   (121줄, 여러 기능에서 사용)
│   │
│   ├── constants/                     3파일, 60줄
│   │   ├── index.js                   (12줄, re-export 경로만 수정)
│   │   ├── storageKeys.js             (29줄)
│   │   └── settings.js                (19줄)
│   │
│   └── utils/                         5파일, 604줄 ← subjects.js 추가
│       ├── animations.js              (201줄)
│       ├── dateUtils.js               (14줄)
│       ├── nameUtils.js               (72줄)
│       ├── htmlSanitizer.js           (80줄)
│       └── petLogic.js                (237줄, pet 전용이지만 store에서도 참조)
│
├── app/                             ← 앱 인프라 (6파일, 2,494줄 — 이동 안 함, 경로만 수정)
│   ├── header.js                      (1,001줄)
│   ├── navigation.js                  (587줄)
│   ├── routes.js                      (316줄, 23개 컴포넌트 import 경로 수정)
│   ├── init.js                        (272줄)
│   ├── modals.js                      (243줄)
│   └── globalFunctions.js             (75줄)
│
├── app.js                           ← 브릿지 (9줄, 이동 안 함)
├── store.js                         ← 브릿지 (20줄, 경로만 수정)
├── router.js                        ← 라우터 (392줄, 이동 안 함)
└── firebase-config.js               ← 브릿지 (13줄, 경로만 수정)
```

### 파일 배치 의사결정 기록

| 결정 사항 | 선택 | 이유 |
|---|---|---|
| sessionTimeout.js 위치 | features/emotion/ | auth보다 emotion 체크인과 더 밀접, 추후 이동 가능 |
| petLogic.js 위치 | shared/utils/ | pet 전용이지만 store/petMixin + praiseMixin 모두 사용 |
| subjects.constants.js 위치 | shared/utils/ | timetable + settings 양쪽에서 사용 |
| StudentMode.js 위치 | features/dashboard/ | 독립 폴더보다 dashboard와 묶는 것이 탐색 편의성 높음 |
| PetService/EmotionService | 각 features/ 폴더 | 해당 도메인 전용 서비스 |
| app/ 폴더 | 이동 안 함 | 앱 인프라는 기능이 아니라 프레임워크, import 경로만 수정 |
| 4개 루트 브릿지 파일 | 이동 안 함 | index.html의 진입점 + 36개 파일이 의존, 위치 고정이 안전 |

---

## 실행 전략

### Step 0: 브랜치 생성 및 안전장치

```bash
# main에서 새 브랜치 생성
git checkout main
git checkout -b refactor/feature-folders

# 작업 시작 태그 (실패 시 여기로 복귀)
git tag refactor-start
```

**확인**: `git branch` → `* refactor/feature-folders` 인지 반드시 확인 후 진행

### Step 1: 폴더 구조 생성 (파일 이동 없이)

```bash
mkdir -p js/features/{auth,class,pet,praise,emotion,timetable,notice,classroom-tools,stats,dashboard}
mkdir -p js/shared/{store,firebase,constants,utils}
```

### Step 2: 파일 이동 (git mv, 내용 변경 없음)

**이동 순서**: shared(기반) → features(도메인) → 이름변경 필요 파일

총 이동 파일: **62개** (루트 브릿지 4 + app/ 6 = 10개는 이동 안 함, 허브 index.js 3개는 shared/로)

#### 2-1. shared/ 기반 파일 이동 (18파일)

```bash
# shared/store/ (5파일)
git mv js/store/Store.js js/shared/store/
git mv js/store/index.js js/shared/store/
git mv js/store/offlineMixin.js js/shared/store/
git mv js/store/notificationMixin.js js/shared/store/
git mv js/store/settingsMixin.js js/shared/store/

# shared/firebase/ (4파일)
git mv js/firebase/index.js js/shared/firebase/
git mv js/firebase/init.js js/shared/firebase/
git mv js/firebase/helpers.js js/shared/firebase/
git mv js/firebase/notes.js js/shared/firebase/

# shared/constants/ (3파일)
git mv js/constants/index.js js/shared/constants/
git mv js/constants/storageKeys.js js/shared/constants/
git mv js/constants/settings.js js/shared/constants/

# shared/utils/ (6파일)
git mv js/utils/animations.js js/shared/utils/
git mv js/utils/dateUtils.js js/shared/utils/
git mv js/utils/nameUtils.js js/shared/utils/
git mv js/utils/htmlSanitizer.js js/shared/utils/
git mv js/utils/petLogic.js js/shared/utils/
git mv js/constants/subjects.js js/shared/utils/subjects.constants.js
```

#### 2-2. features/ 도메인 파일 이동 (44파일)

```bash
# features/auth/ (5파일)
git mv js/components/TeacherLogin.js js/features/auth/
git mv js/components/StudentLogin.js js/features/auth/
git mv js/components/LoginSelect.js js/features/auth/
git mv js/store/authMixin.js js/features/auth/
git mv js/firebase/auth.js js/features/auth/auth.firebase.js

# features/class/ (5파일)
git mv js/components/ClassSelect.js js/features/class/
git mv js/store/classMixin.js js/features/class/
git mv js/store/studentMixin.js js/features/class/
git mv js/firebase/classes.js js/features/class/classes.firebase.js
git mv js/firebase/students.js js/features/class/students.firebase.js

# features/pet/ (8파일)
git mv js/components/PetFarm.js js/features/pet/
git mv js/components/PetSelection.js js/features/pet/
git mv js/components/PetCollection.js js/features/pet/
git mv js/components/PetChat.js js/features/pet/
git mv js/store/petMixin.js js/features/pet/
git mv js/services/PetService.js js/features/pet/
git mv js/firebase/pets.js js/features/pet/pets.firebase.js
git mv js/constants/pets.js js/features/pet/pets.constants.js

# features/praise/ (7파일)
git mv js/components/QuickPraise.js js/features/praise/
git mv js/components/PraiseManagement.js js/features/praise/
git mv js/components/StudentPraise.js js/features/praise/
git mv js/store/praiseMixin.js js/features/praise/
git mv js/store/thermostatMixin.js js/features/praise/
git mv js/firebase/praises.js js/features/praise/praises.firebase.js
git mv js/constants/praise.js js/features/praise/praise.constants.js

# features/emotion/ (6파일)
git mv js/components/Emotion.js js/features/emotion/
git mv js/store/emotionMixin.js js/features/emotion/
git mv js/services/EmotionService.js js/features/emotion/
git mv js/firebase/emotions.js js/features/emotion/emotions.firebase.js
git mv js/constants/emotions.js js/features/emotion/emotions.constants.js
git mv js/utils/sessionTimeout.js js/features/emotion/

# features/timetable/ (5파일)
git mv js/components/Timetable.js js/features/timetable/
git mv js/components/StudentTimetable.js js/features/timetable/
git mv js/store/timetableMixin.js js/features/timetable/
git mv js/firebase/timetable.js js/features/timetable/timetable.firebase.js
git mv js/constants/timetable.js js/features/timetable/timetable.constants.js

# features/notice/ (4파일)
git mv js/components/Notice.js js/features/notice/
git mv js/components/StudentNotice.js js/features/notice/
git mv js/store/noticeMixin.js js/features/notice/
git mv js/firebase/notices.js js/features/notice/notices.firebase.js

# features/classroom-tools/ (5파일)
git mv js/components/Picker.js js/features/classroom-tools/
git mv js/components/TimerView.js js/features/classroom-tools/
git mv js/tools/whistle.js js/features/classroom-tools/
git mv js/tools/timer.js js/features/classroom-tools/
git mv js/tools/sound.js js/features/classroom-tools/

# features/stats/ (2파일)
git mv js/components/Stats.js js/features/stats/
git mv js/components/StudentDetail.js js/features/stats/

# features/dashboard/ (2파일)
git mv js/components/Dashboard.js js/features/dashboard/
git mv js/components/StudentMode.js js/features/dashboard/
```

#### 2-3. 빈 디렉토리 정리

```bash
# git mv 후 빈 폴더는 Git이 자동 무시하지만, 명시적 확인
# js/components/, js/constants/, js/firebase/, js/store/, js/services/, js/tools/, js/utils/
# → 모두 비어야 함 (파일이 남아있으면 누락된 것)
```

#### 2-4. 커밋 (내용 변경 없음, 이동만)

```bash
git add -A
git commit -m "refactor: 기능별 폴더 구조로 78개 파일 이동 (git mv, 내용 변경 없음)"
```

### Step 3: Import 경로 일괄 수정

**수정 대상**: 약 280~350개 import 문

#### 3-1. 허브 파일 (가장 먼저, 가장 중요)

| 파일 | 수정 내용 |
|---|---|
| `js/store.js` | `./store/index.js` → `./shared/store/index.js` |
| `js/firebase-config.js` | `./firebase/index.js` → `./shared/firebase/index.js` |
| `js/shared/store/index.js` | 12개 mixin import를 features/ 경로로 변경 |
| `js/shared/firebase/index.js` | 10개 firebase 모듈 import를 features/ 경로로 변경 |
| `js/shared/constants/index.js` | 도메인별 상수 import를 features/ 경로로 변경 |
| `js/app/routes.js` | 23개 컴포넌트 import를 features/ 경로로 변경 |
| `js/app/init.js` | 서비스/유틸 import 경로 변경 |
| `js/app/header.js` | 6개 디렉토리에서 import → 새 경로 |

#### 3-2. 각 features/ 파일 내부 import

모든 feature 파일은 같은 도메인 내 파일은 `./` 로, shared는 `../../shared/` 로, store.js 브릿지는 기존과 동일한 상대경로로 수정.

**예시** — features/pet/petMixin.js 수정 전후:
```js
// 수정 전 (현재)
import { store } from '../store.js';           // 루트의 store.js
import { calculateLevel } from '../utils/petLogic.js';

// 수정 후
import { store } from '../../store.js';        // 깊이 하나 더 들어감
import { calculateLevel } from '../../shared/utils/petLogic.js';
```

#### 3-3. 커밋

```bash
git add -A
git commit -m "refactor: 전체 import 경로 수정 (~300개 import문)"
```

### Step 4: service-worker.js STATIC_ASSETS 전면 교체

71개 JS 경로를 새 구조에 맞게 **전부 교체**.

**수정 원칙**: 새 파일 목록을 `find js -name '*.js' | sort` 결과로 자동 생성

```bash
# CACHE_NAME 타임스탬프도 강제 갱신
npm run update:sw
```

#### 커밋

```bash
git add service-worker.js
git commit -m "refactor: service-worker.js STATIC_ASSETS 새 경로로 전면 교체"
```

### Step 5: 검증 (브라우저 테스트)

#### 5-1. 콘솔 에러 체크

```
브라우저 DevTools > Console
→ "Failed to resolve module specifier" 에러 0건이어야 함
```

#### 5-2. 기능별 테스트 체크리스트

| # | 테스트 항목 | 확인 |
|---|---|---|
| 1 | 교사 Google 로그인 → 대시보드 진입 | □ |
| 2 | 학급 선택/생성 → 학생 목록 로드 | □ |
| 3 | 칭찬하기 → EXP 증가 → 펫 레벨 반영 | □ |
| 4 | 감정 체크인 → 교사 화면 실시간 반영 | □ |
| 5 | 시간표 편집 → 저장 → 새로고침 후 유지 | □ |
| 6 | 알림장 작성 → 학생 모드에서 확인 | □ |
| 7 | 술래뽑기 → 결과 애니메이션 | □ |
| 8 | 타이머/호루라기 작동 | □ |
| 9 | 통계 페이지 → 학생 상세 | □ |
| 10 | 설정 → 학생 추가/삭제 | □ |
| 11 | 학생 로그인 → 펫 확인 → 칭찬 확인 | □ |
| 12 | 오프라인 → 온라인 복귀 시 동기화 | □ |
| 13 | 서비스 워커 캐시 → 오프라인 접근 가능 | □ |

#### 5-3. 검증 통과 커밋

```bash
git commit --allow-empty -m "test: 전체 기능 검증 완료 (브라우저 수동 테스트)"
```

### Step 6: main 머지

```bash
git checkout main
git merge refactor/feature-folders
git push origin main
```

Netlify가 자동 배포 → 프로덕션 URL에서 최종 확인

---

## 위험성 분석 (v2, 수치 보정 완료)

| 위험 | 확률 | 영향 | 완화책 |
|---|---|---|---|
| Import 경로 누락 | 높음 | 치명적 | 허브 파일 7개 먼저 수정 후 브라우저 확인 → 나머지 진행 |
| SW 캐시 경로 불일치 (**71개**, v1의 2배) | 높음 | 치명적 | `find js -name '*.js'`로 자동 생성, 수동 작성 금지 |
| 브릿지 파일 경로 깨짐 | 중간 | 치명적 | store.js, firebase-config.js 2개만 수정 (1줄씩), 가장 먼저 테스트 |
| header.js 크로스 import | 중간 | 중간 | 6개 import를 수작업으로 정확히 매핑 |
| Git 히스토리 파편화 | 100% | 낮음 | `git log --follow`로 추적 가능, git mv 사용으로 rename detection 확보 |
| 배포 후 사용자 캐시 | 중간 | 중간 | CACHE_NAME 타임스탬프 갱신 + activate에서 old cache 삭제 (이미 구현됨) |

---

## 커밋 전략 (최종)

| 순서 | 커밋 메시지 | 내용 |
|---|---|---|
| 1 | `refactor: features/ 및 shared/ 폴더 구조로 62개 파일 이동` | git mv만, 내용 변경 없음 |
| 2 | `refactor: 전체 import 경로 수정 (~300개)` | 모든 JS 파일의 import문 수정 |
| 3 | `refactor: service-worker.js STATIC_ASSETS 경로 전면 교체` | 71개 JS 경로 교체 |
| 4 | `test: 전체 기능 검증 완료` | 검증 후 빈 커밋 또는 미세 수정 |

**커밋 1~2 사이에 앱은 작동 불가** — 이것은 정상이며, 리팩토링 브랜치에서만 발생합니다. main은 무관합니다.

---

## 하지 않는 것 (이번 리팩토링 범위 밖)

| 항목 | 이유 |
|---|---|
| settingsMixin 분해 | 파일 이동과 로직 변경을 섞으면 디버깅 불가. 별도 PR로 |
| 거대 컴포넌트 분해 (Timetable 1,482줄 등) | 아키텍처 변경. 별도 PR로 |
| 이벤트 기반 디커플링 | Store에 emit/on 추가는 아키텍처 변경. 별도 PR로 |
| TypeScript 전환 | 바이브 코딩 워크플로우에 맞지 않음 |
| 테스트 코드 추가 | 리팩토링 완료 후 안정화된 시점에 검토 |

---

## 롤백 시나리오

| 상황 | 조치 |
|---|---|
| 리팩토링 중 포기 | `git checkout main` → `git branch -D refactor/feature-folders` |
| 머지 후 프로덕션 문제 | `git revert --no-commit HEAD~4..HEAD && git commit -m "revert: 리팩토링 롤백"` |
| 긴급 롤백 | `git reset --hard f072e9e && git push origin main --force` (최후의 수단) |

---

## 체크 포인트 요약

```
[시작] main에서 분기
  │
  ├─ Step 0: git checkout -b refactor/feature-folders ✓ main 절대 건드리지 않음
  ├─ Step 1: 폴더 생성
  ├─ Step 2: git mv (커밋 1)
  ├─ Step 3: import 경로 수정 (커밋 2)
  ├─ Step 4: service-worker.js (커밋 3)
  ├─ Step 5: 브라우저 검증 13항목 (커밋 4)
  │
  └─ [완료] main에 머지 → Netlify 배포 → 프로덕션 확인
```
