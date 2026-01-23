# ClassPet Firebase 우선 구조 전환 계획

## 목표
localStorage 기반 → **Firebase 우선** 구조로 전환
- 교사: Google 로그인 (1계정 다중 학급 관리)
- 오프라인: localStorage 백업 유지

---

## 새로운 Firebase 데이터 구조

```
/teachers/{uid}/                    # 교사 프로필 (Google UID)
  ├── email, displayName, photoURL
  └── createdAt, updatedAt

/classes/{classId}/                 # 학급 (자동 ID)
  ├── ownerId (교사 UID)
  ├── classCode (6자리 공유코드)
  ├── className, schoolYear, semester
  │
  ├── students/{studentId}/         # 학생
  │     ├── name, number, pin
  │     ├── petType, petName, level, exp
  │     └── totalPraises, completedPets
  │
  ├── emotions/{emotionId}/         # 감정 기록
  │     ├── studentId, emotion, memo
  │     ├── date, source
  │     └── reply { message, timestamp, read }
  │
  ├── praises/{praiseId}/           # 칭찬 기록
  │     ├── studentId, category, reason
  │     └── expGained, date
  │
  ├── timetable/schedule            # 시간표
  │
  └── notes/{noteId}/               # 메모

/classCodes/{code}/                 # 학급코드 → classId 매핑
  └── classId
```

---

## 새로운 로그인 화면 UI

```
┌─────────────────────────────┐
│        🐾 ClassPet          │
│                             │
│   [🔐 Google로 로그인]       │  ← 교사 전용
│                             │
│   ────── 또는 ──────        │
│                             │
│   [👦 학생으로 입장]         │  ← 학급코드 입력
│                             │
└─────────────────────────────┘
```

## 새로운 로그인 흐름

### 교사
```
[Google 로그인] → 신규면 프로필 생성 → [학급 선택/생성] → 대시보드
```

### 학생 (기존 유지)
```
[학생으로 입장] → 학급코드 입력 → 번호 선택 → PIN → 학생 메인
```

---

## 구현 단계 (5단계)

### Phase 1: Firebase 기반 구축
| 파일 | 변경 내용 |
|------|----------|
| `js/firebase-config.js` | Google Auth Provider, 새 데이터 CRUD 함수 |
| `js/store.js` | Firebase 우선 로직, 오프라인 큐, currentClassId 상태 |
| `firestore.rules` | 새로운 보안 규칙 |

### Phase 2: 교사 인증 구현
| 파일 | 변경 내용 |
|------|----------|
| `js/components/LoginSelect.js` | Google 로그인 버튼 추가 |
| `js/components/TeacherLogin.js` | Google 로그인 처리, 학급 선택 UI |
| `js/components/ClassSelect.js` | **새 파일** - 학급 선택/생성 화면 |
| `js/router.js` | 'class-select' 라우트 추가 |

### Phase 3: 데이터 동기화
| 파일 | 변경 내용 |
|------|----------|
| `js/store.js` | 오프라인 큐 처리, 충돌 해결 |
| `js/app.js` | 초기화 로직, 인증 상태 리스너 |

### Phase 4: UI 업데이트
| 파일 | 변경 내용 |
|------|----------|
| `js/components/Settings.js` | 다중 학급 관리 UI |
| `js/components/Dashboard.js` | 현재 학급 정보, 전환 버튼 |
| `js/components/StudentLogin.js` | Firebase 학급코드 검증 |

### Phase 5: 마이그레이션 & 테스트
- 기존 localStorage 데이터 → Firebase 이전 도구
- 오프라인 시나리오 테스트
- 다중 학급 전환 테스트

---

## Firebase Security Rules (핵심)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isClassOwner(classId) {
      return request.auth != null &&
             get(/databases/$(database)/documents/classes/$(classId)).data.ownerId == request.auth.uid;
    }

    // 교사 프로필: 본인만
    match /teachers/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

    // 학급: 소유자만
    match /classes/{classId} {
      allow read, write: if isClassOwner(classId);

      match /{subcollection}/{docId} {
        allow read, write: if isClassOwner(classId);
      }
    }

    // 학급코드: 인증 사용자 읽기 가능
    match /classCodes/{code} {
      allow read: if request.auth != null;
    }
  }
}
```

---

## 검증 방법

1. **교사 Google 로그인** → 프로필 생성 확인
2. **새 학급 생성** → classCode 발급, Firebase 저장 확인
3. **학생 로그인** → 학급코드로 접속, 데이터 조회
4. **오프라인 테스트** → WiFi 끄고 데이터 저장 → 복귀 시 동기화
5. **다중 학급** → 학급 전환 후 데이터 분리 확인

---

## 주요 변경 파일 요약

| 우선순위 | 파일 | 작업량 |
|---------|------|-------|
| 1 | `firebase-config.js` | 대규모 추가 |
| 2 | `store.js` | 대규모 수정 |
| 3 | `TeacherLogin.js` | 전면 재작성 |
| 4 | `ClassSelect.js` | 새 파일 |
| 5 | `firestore.rules` | 새 파일 |
| 6 | `LoginSelect.js` | 소규모 수정 |
| 7 | `Settings.js` | 중규모 추가 |
| 8 | `router.js` | 소규모 추가 |

---

## 작성일
2025-01-23
