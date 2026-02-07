# 클래스펫 PWA 구현 계획

## 개요
classpet 프로젝트를 PWA(Progressive Web App)로 변환하여 홈 화면 설치 및 앱처럼 실행 가능하게 만듦

---

## TODO 목록

### Phase 1: 기본 파일 생성 (아이콘 없이 진행 가능)
- [ ] **TODO 1**: manifest.json 생성
- [ ] **TODO 2**: offline.html 생성
- [ ] **TODO 3**: service-worker.js 생성
- [ ] **TODO 4**: index.html 수정 (manifest 링크, SW 등록, theme-color)

### Phase 2: 아이콘 추가 (사용자 이미지 준비 후)
- [ ] **TODO 5**: icons 폴더 생성 및 아이콘 파일 배치
- [ ] **TODO 6**: manifest.json에 아이콘 경로 추가
- [ ] **TODO 7**: index.html apple-touch-icon 경로 수정

### Phase 3: 테스트 및 배포
- [ ] **TODO 8**: 로컬 테스트 (DevTools Application 탭)
- [ ] **TODO 9**: Netlify 배포
- [ ] **TODO 10**: 실제 디바이스 설치 테스트

---

## Phase 1 상세

### TODO 1: manifest.json
```json
{
  "name": "클래스펫 - 학급 경영 도우미",
  "short_name": "클래스펫",
  "description": "교실에서 학생들과 함께하는 펫 기반 학급 경영 도구",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FFF9F0",
  "theme_color": "#7C9EF5",
  "icons": []
}
```

### TODO 2: offline.html
- 간단한 오프라인 안내 페이지
- 앱 스타일과 일치하는 디자인
- "다시 시도" 버튼 포함

### TODO 3: service-worker.js
- 캐싱 전략: Cache First, Network Fallback
- 캐싱 대상: HTML, CSS, JS 정적 파일
- 제외 대상: Firebase API 요청
- 오프라인 시 offline.html 반환

### TODO 4: index.html 수정
- `<meta name="theme-color">` → #7C9EF5
- `<link rel="manifest">` 추가
- Service Worker 등록 스크립트 추가

---

## Phase 2 상세 (사용자 이미지 준비 후)

### 필요한 아이콘
- icon-192x192.png
- icon-512x512.png

### 배치 위치
```
classpet/
├── icons/
│   ├── icon-192x192.png
│   └── icon-512x512.png
```

---

## 검증 방법

1. **Chrome DevTools** → Application 탭
   - Manifest 파싱 확인
   - Service Worker 등록/활성화 확인
   - Cache Storage 확인

2. **Lighthouse PWA 점검**

3. **실제 디바이스 테스트**
   - Android: 홈 화면에 추가
   - iOS: 공유 → 홈 화면에 추가

4. **오프라인 테스트**
   - Network → Offline 체크 후 새로고침
