# Firestore 컬렉션 구조 변경: 학생 서브컬렉션으로 이동

## 목표

감정/칭찬/펫 컬렉션을 학생 문서의 서브컬렉션으로 변경

```
현재 (Flat):
teachers/{uid}/classes/{classId}/emotions/{emotionId}     ← studentId는 필드
teachers/{uid}/classes/{classId}/praises/{praiseId}
teachers/{uid}/classes/{classId}/pets/{petId}

변경 후 (Nested):
teachers/{uid}/classes/{classId}/students/{studentId}/emotions/{emotionId}
teachers/{uid}/classes/{classId}/students/{studentId}/praises/{praiseId}
teachers/{uid}/classes/{classId}/students/{studentId}/pets/{petId}
```

## 핵심 설계 결정: Cross-Student 쿼리

"오늘 전체 학급 감정 조회" 같은 쿼리는 서브컬렉션 구조에서 `collectionGroup` 필요.
- `collectionGroup(db, 'emotions')`는 **전체 DB**의 emotions를 대상으로 하므로
- 각 문서에 `teacherUid`, `classId` 필드를 추가하여 범위 필터링

---

## 수정 파일 및 작업

### 1. `js/firebase-config.js` (핵심 - 24개 함수 변경)

**A. import에 `collectionGroup` 추가**

**B. 헬퍼 함수 추가**
```javascript
function studentSubRef(uid, classId, studentId, sub) {
    return collection(db, 'teachers', uid, 'classes', classId, 'students', String(studentId), sub);
}
function studentSubDoc(uid, classId, studentId, sub, docId) {
    return doc(db, 'teachers', uid, 'classes', classId, 'students', String(studentId), sub, String(docId));
}
```

**C. Per-Student 함수 (17개) - 경로를 서브컬렉션으로 변경**

| 컬렉션 | 함수 | 변경 |
|--------|------|------|
| emotions | `saveEmotion` | 경로 변경 + classId/teacherUid 필드 추가 |
| emotions | `getStudentEmotions` | 경로 변경, `where('studentId')` 제거 |
| emotions | `getUnreadReplyCount` | 경로 변경, `where('studentId')` 제거 |
| emotions | `addReplyToEmotion` | **시그니처에 studentId 추가** |
| emotions | `addStudentMessage` | **시그니처에 studentId 추가** |
| emotions | `markEmotionReplyAsRead` | **시그니처에 studentId 추가** |
| praises | `savePraise` | 경로 변경 + classId/teacherUid 필드 추가 |
| praises | `getStudentPraises` | 경로 변경, `where('studentId')` 제거 |
| praises | `getStudentPraisesByCategory` | 경로 변경, `where('studentId')` 제거 |
| pets | `savePet` | 경로 변경 + classId/teacherUid 필드 추가 |
| pets | `getActivePet` | 경로 변경, `where('studentId')` 제거 |
| pets | `getCompletedPets` | 경로 변경, `where('studentId')` 제거 |
| pets | `getStudentPets` | 경로 변경, `where('studentId')` 제거 |
| pets | `hasCompletedPetType` | 경로 변경, `where('studentId')` 제거 |
| pets | `updatePet` | **시그니처에 studentId 추가** |
| pets | `deletePet` | **시그니처에 studentId 추가** |
| pets | `subscribeToStudentPets` | 경로 변경, `where('studentId')` 제거 |

**D. Cross-Student 함수 (10개) - collectionGroup 사용**

| 컬렉션 | 함수 |
|--------|------|
| emotions | `getTodayEmotions`, `getEmotionsByDate`, `getEmotionsByType`, `getEmotionsByDateAndType`, `subscribeToTodayEmotions` |
| praises | `getTodayPraises`, `getAllPraises`, `getPraisesByCategory`, `getPraisesByDate`, `getPraisesByDateAndCategory` |

패턴: `collection(...)` → `collectionGroup(db, 'emotions')` + `where('teacherUid', '==', uid)` + `where('classId', '==', cId)`

### 2. `js/store.js` (호출부 수정 - 6곳)

시그니처 변경된 firebase 함수 호출부에 studentId 전달:

| store.js 함수 | firebase 함수 | studentId 출처 |
|---------------|--------------|----------------|
| `syncReplyToFirebase()` | `addReplyToEmotion` | `log[index].studentId` |
| `syncStudentMessageToFirebase()` | `addStudentMessage` | `log[index].studentId` |
| `markReplyAsReadInFirebase()` | `markEmotionReplyAsRead` | `log[index].studentId` |
| `updatePetExpInFirebase()` | `updatePet` | 함수 파라미터 `studentId` |
| `completePetInFirebase()` | `updatePet` | 함수 파라미터 `studentId` |
| `deletePetFromFirebase()` (있으면) | `deletePet` | 스코프 내 studentId |

### 3. `firestore.rules` (보안 규칙 - 시니어 리뷰 반영)

서브컬렉션 경로로 변경 + collectionGroup 규칙 **교사 소유권 검증 강화**:
```
// 서브컬렉션 규칙 (classes/{classId} match 내부)
match /students/{studentId}/emotions/{emotionId} {
    allow read, write: if isOwner(uid);           // 교사: 전체 권한
    allow create, read: if isAuthenticated();      // 학생: 생성+읽기
}
match /students/{studentId}/praises/{praiseId} {
    allow read, write: if isOwner(uid);
    allow read: if isAuthenticated();
}
match /students/{studentId}/pets/{petId} {
    allow read, write: if isOwner(uid);
    allow create, read: if isAuthenticated();
}

// 최상위: collectionGroup 쿼리용 (교사 소유권 확인)
match /{path=**}/emotions/{emotionId} {
    allow read: if request.auth.uid == resource.data.teacherUid;
}
match /{path=**}/praises/{praiseId} {
    allow read: if request.auth.uid == resource.data.teacherUid;
}
```

> **시니어 리뷰 반영**: `request.auth != null`만으로는 다른 교사 데이터까지 읽힘.
> `resource.data.teacherUid == request.auth.uid`로 소유권 검증 추가.

### 4. `firestore.indexes.json` (인덱스 사전 정의 - 시니어 리뷰 반영)

collectionGroup 인덱스를 파일로 관리하여 배포 시 자동 생성:
```json
{
  "indexes": [
    {
      "collectionGroup": "emotions",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "teacherUid", "order": "ASCENDING" },
        { "fieldPath": "classId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "emotions",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "teacherUid", "order": "ASCENDING" },
        { "fieldPath": "classId", "order": "ASCENDING" },
        { "fieldPath": "emotion", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "praises",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "teacherUid", "order": "ASCENDING" },
        { "fieldPath": "classId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "praises",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "teacherUid", "order": "ASCENDING" },
        { "fieldPath": "classId", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

> **시니어 리뷰 반영**: 콘솔 수동 생성 → JSON 파일 사전 정의로 변경.
> `firebase deploy --only firestore:indexes`로 자동 배포 가능.

### 5. 데이터 마이그레이션 (1회성 스크립트 - 시니어 리뷰 반영)

**사전 준비: Firebase Console에서 기존 데이터 Export 백업**

기존 flat 컬렉션 데이터를 새 서브컬렉션으로 이동:
1. Firebase Console → Firestore → Export로 전체 백업
2. `classes/{classId}/emotions/*` → 각 문서의 studentId 읽어서 → `students/{studentId}/emotions/*`로 복사 (teacherUid, classId 필드 추가)
3. praises, pets 동일
4. 마이그레이션 완료 확인 후 기존 컬렉션은 수동 삭제

> **시니어 리뷰 반영**: 백업 단계 추가. 규모(학생 30명, 문서 수백~수천 건)상
> 배치 처리/트랜잭션/롤백 스크립트는 불필요 (과도한 엔지니어링).

---

## 구현 순서

1. firebase-config.js: collectionGroup import + 헬퍼 함수
2. firebase-config.js: Per-student 함수 17개 변경
3. firebase-config.js: Cross-student 함수 10개 변경
4. store.js: 호출부 6곳 수정
5. firestore.rules: 보안 규칙 업데이트 (소유권 검증 강화)
6. firestore.indexes.json: collectionGroup 인덱스 사전 정의
7. Firebase Console에서 기존 데이터 Export 백업
8. 마이그레이션 스크립트 실행
9. Netlify 배포 + `firebase deploy --only firestore:indexes,firestore:rules`

## 검증

1. 감정 전송 → Firebase `students/{id}/emotions/`에 문서 생성 확인
2. 칭찬 → Firebase `students/{id}/praises/`에 문서 생성 확인
3. 펫 선택 → Firebase `students/{id}/pets/`에 문서 생성 확인
4. 교사 대시보드 → 전체 학급 감정/칭찬 조회 정상 (collectionGroup)
5. 다른 교사 계정으로 로그인 → 데이터 접근 불가 확인 (보안 규칙)
6. 기존 데이터 마이그레이션 후 조회 정상

## 시니어 리뷰 반영 요약

| 리뷰 항목 | 반영 여부 | 이유 |
|-----------|----------|------|
| 보안 규칙 강화 | ✅ 반영 | teacherUid 소유권 검증 필수 |
| 마이그레이션 백업 | ✅ 반영 | 데이터 안전 기본 |
| 인덱스 사전 정의 | ✅ 반영 | JSON 파일 관리가 수동보다 안전 |
| 배치 처리/트랜잭션/롤백 | ❌ 미반영 | 30명 학급, 수백~수천 건 규모에서 과도 |
| Denormalization | ❌ 미반영 | Firestore 1MB 문서 제한 + hot document 위험 |
| 성능 테스트 20% 검증 | ❌ 미반영 | 소규모 앱에서 무의미. 목적은 데이터 조직화 |
| 1주일 모니터링 리포트 | ❌ 미반영 | Console 확인으로 충분 |
