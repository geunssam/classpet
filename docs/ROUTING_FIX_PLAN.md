# 클래스펫 라우팅 버그 수정 계획서

## 작성일: 2026-01-25
## 작성자: Claude (선임 개발자 자문 기반)

---

## 1. 문제 요약

### 증상
- URL에 해시 없이 접속 시 (`classpet.netlify.app/`) → `#teacher-login`으로 리다이렉트
- `#login` 명시적 접속 시 → 정상 (LoginSelect 표시)
- 로그아웃 후 → 정상 (LoginSelect 표시)
- 시크릿 모드에서도 동일 현상 발생

### 영향
- 신규 사용자가 구버전 로그인 화면(TeacherLogin)을 먼저 보게 됨
- 최신 UI(LoginSelect - Google 로그인/학생 입장 선택)가 정상 노출되지 않음

---

## 2. 원인 분석

### 2.1 유력 원인: Firebase Auth 상태 복원 타이밍 문제

**app.js 초기화 흐름:**
```
1. store.js 로드 → Store 생성자 실행 → Firebase 초기화
2. DOMContentLoaded → initApp() 호출
3. waitForAuthReady() → Firebase onAuthStateChanged 대기 (최대 5초)
4. initRouter() → router.init() → handleRoute()
5. 보호된 라우트 접근 시 → isTeacherLoggedIn() 체크 → teacher-login 리다이렉트
```

**문제 지점 (app.js:142-154):**
```javascript
if (user && !user.isAnonymous) {
    // Google 로그인 사용자 - 세션 복원
    sessionStorage.setItem('classpet_teacher_session', ...);
}
```

Firebase IndexedDB에 저장된 이전 세션이 복원되면서:
1. `authUser`가 truthy 반환
2. sessionStorage에 세션 생성
3. `isTeacherLoggedIn()` = true
4. `navigate('dashboard')` 호출
5. Dashboard 라우트에서 재검증 실패 시 `teacher-login`으로 리다이렉트

### 2.2 보조 원인: 해시 없을 때 기본값 처리 타이밍

**router.js:61:**
```javascript
let hash = window.location.hash.slice(1) || 'login';
```

코드 자체는 정상이지만, Firebase 콜백이 라우터 초기화 후에 실행되면서 navigate() 호출 가능

---

## 3. 수정 계획

### 3.1 즉시 적용 (임시 해결책)

**파일: `index.html`**

app.js 로드 전에 해시 강제 설정:

```html
<!-- app.js 로드 전에 추가 -->
<script>
  // 해시 없으면 즉시 #login 설정 (라우터 초기화 전)
  if (!window.location.hash) {
    history.replaceState(null, '', '#login');
  }
</script>
<script type="module" src="js/app.js?v=20260125c"></script>
```

**장점:**
- 즉시 적용 가능
- 기존 코드 수정 최소화
- `replaceState`로 히스토리 오염 방지

---

### 3.2 근본 해결 (권장)

**파일: `js/app.js`**

#### 수정 1: Auth Guard 패턴 도입

```javascript
// 기존 코드
if (authUser && store.isTeacherLoggedIn()) {
    const currentClassId = store.getCurrentClassId();
    if (currentClassId) {
        router.navigate('dashboard');
    } else {
        router.navigate('class-select');
    }
}

// 수정 코드
if (authUser && store.isTeacherLoggedIn()) {
    // 현재 해시가 login 계열이면 리다이렉트
    const currentHash = window.location.hash.slice(1);
    if (!currentHash || currentHash === 'login' || currentHash === 'teacher-login') {
        const currentClassId = store.getCurrentClassId();
        if (currentClassId) {
            router.navigate('dashboard');
        } else {
            router.navigate('class-select');
        }
    }
    // 다른 라우트면 그대로 유지 (뒤로가기 등)
}
```

#### 수정 2: setupAuthStateListener 보강

```javascript
function setupAuthStateListener() {
    store.onAuthChange(async (user) => {
        if (!store.isAuthLoading()) {
            // 로그인 화면에서는 자동 리다이렉트 하지 않음
            const currentRoute = router.getCurrentRoute();
            if (currentRoute === 'login' || currentRoute === 'teacher-login') {
                return; // 사용자가 명시적으로 로그인 화면에 있으면 유지
            }
            // ... 기존 로직
        }
    });
}
```

---

### 3.3 보호된 라우트 로직 개선

**파일: `js/app.js` (라우트 정의 부분)**

```javascript
// 기존: setTimeout으로 비동기 리다이렉트
'dashboard': {
    render: () => {
        if (!store.isTeacherLoggedIn()) {
            setTimeout(() => router.navigate('teacher-login'), 0);
            return '<div>로그인이 필요합니다...</div>';
        }
        // ...
    }
}

// 개선: 명확한 Auth Guard
'dashboard': {
    render: () => {
        if (!store.isTeacherLoggedIn()) {
            // login으로 리다이렉트 (teacher-login 아님)
            setTimeout(() => router.navigate('login'), 0);
            return '<div>로그인이 필요합니다...</div>';
        }
        // ...
    }
}
```

**변경 포인트:** `teacher-login` → `login`
- 모든 미인증 사용자는 LoginSelect로 이동
- TeacherLogin은 오프라인 모드 전용으로 유지

---

## 4. 적용 순서

| 단계 | 작업 | 파일 | 예상 시간 |
|------|------|------|-----------|
| 1 | 해시 강제 설정 스크립트 추가 | index.html | 5분 |
| 2 | 배포 및 테스트 | - | 10분 |
| 3 | Auth Guard 패턴 적용 | app.js | 30분 |
| 4 | 보호된 라우트 리다이렉트 대상 변경 | app.js | 15분 |
| 5 | 전체 테스트 및 배포 | - | 20분 |

---

## 5. 테스트 체크리스트

### 5.1 라우팅 테스트
- [ ] `classpet.netlify.app/` 접속 → LoginSelect 표시
- [ ] `classpet.netlify.app/#login` 접속 → LoginSelect 표시
- [ ] `classpet.netlify.app/#teacher-login` 접속 → TeacherLogin 표시
- [ ] 로그아웃 후 → LoginSelect로 이동
- [ ] 뒤로가기 → 이전 페이지 정상 이동

### 5.2 인증 테스트
- [ ] Google 로그인 → class-select 또는 dashboard 이동
- [ ] 로그인 상태에서 새로고침 → 현재 페이지 유지
- [ ] 시크릿 모드에서 위 테스트 반복

### 5.3 모바일 테스트
- [ ] iOS Safari에서 위 테스트 반복
- [ ] Android Chrome에서 위 테스트 반복

---

## 6. 롤백 계획

문제 발생 시 즉시 롤백:
```bash
git revert HEAD
git push origin main
netlify deploy --prod
```

---

## 7. 향후 개선 사항 (중장기)

1. **라우터 강화**
   - Auth Guard 미들웨어 패턴 도입
   - beforeEach / afterEach 훅 추가

2. **상태 관리 개선**
   - 인증 상태와 라우팅 상태 분리
   - Firebase 세션 vs 앱 세션 명확히 구분

3. **SvelteKit 전환 검토**
   - 내장 라우터 + SSR 지원
   - Firebase 통합 간소화

---

## 부록: 관련 파일 목록

| 파일 | 역할 | 수정 필요 |
|------|------|-----------|
| `index.html` | 진입점, 스크립트 로딩 | ✅ |
| `js/app.js` | 앱 초기화, 라우트 매핑 | ✅ |
| `js/router.js` | 해시 라우터 | ❌ |
| `js/store.js` | 상태 관리, 인증 | ❌ |
| `js/components/LoginSelect.js` | 정상 로그인 화면 | ❌ |
| `js/components/TeacherLogin.js` | 오프라인 로그인 화면 | ❌ |
