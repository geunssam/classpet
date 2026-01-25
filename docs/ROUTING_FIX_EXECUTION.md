# ClassPet 라우팅 버그 수정 실행 계획서

## 작성일: 2026-01-25
## 상태: 진행 중

---

## 문제 요약
- `/` 접속 시 `#teacher-login`으로 리다이렉트됨 (버그)
- `/#login` 접속 시 정상 작동 (LoginSelect 표시)
- 원인: Firebase 세션 복원 + 히스토리 오염 + 잘못된 리다이렉트 대상

---

## Phase 1: 핫픽스 (즉시 적용)

### 1-1. 해시 설정 방식 변경
- **파일**: `index.html:175`
- **변경 전**: `window.location.hash = '#login'` (히스토리 오염)
- **변경 후**: `window.history.replaceState(null, '', '#login')` (클린)

### 1-2. 디버그 로깅 추가
- **파일**: `app.js:78` (`initRouter()` 직전)
- **목적**: 라우팅 상태 추적

**상태**: ⬜ 대기

---

## Phase 2: 핵심 수정 (근본 해결)

### 2-1. 리다이렉트 대상 변경
- **파일**: `app.js`
- **위치**: 7곳 (line 274, 285, 296, 307, 318, 329, 340)
- **변경**: `router.navigate('teacher-login')` → `router.navigate('login')`

### 2-2. (선택) beforeEach 훅 추가
- **파일**: `router.js`
- **목적**: 구조적 Auth Guard 패턴

**상태**: ⬜ 대기

---

## Phase 3: 모바일 최적화

### 3-1. iOS safe-area 패딩
- **파일**: `css/style.css`
- **내용**: `env(safe-area-inset-bottom)` 추가

### 3-2. reduced-motion 지원
- **파일**: `css/style.css`
- **내용**: `prefers-reduced-motion` 미디어 쿼리

**상태**: ⬜ 대기

---

## Phase 4: 정리 및 배포

### 4-1. 디버그 로깅 제거
- 테스트 완료 후 제거

### 4-2. 테스트 체크리스트
- [ ] `/` 접속 → LoginSelect 표시
- [ ] `/#login` 접속 → LoginSelect 표시
- [ ] `/#teacher-login` 접속 → TeacherLogin 표시
- [ ] 로그아웃 후 → LoginSelect로 이동
- [ ] 시크릿 모드 테스트

### 4-3. 배포
- Netlify 자동 배포

**상태**: ⬜ 대기

---

## 스킵 항목
| 항목 | 이유 |
|------|------|
| `_redirects` 파일 | `netlify.toml`에 이미 존재 |
| `css/main.css` | 파일 없음, `style.css` 사용 |

---

## 진행 로그

| 시간 | Phase | 작업 | 결과 |
|------|-------|------|------|
| - | - | - | - |
