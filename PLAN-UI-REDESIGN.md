# Classpet UI 전면 개편 계획
> grownd 스타일 적용 (상단 탭바 + 우측 툴바)

## 개요
- **목표**: 하단 5탭 → 상단 탭바 + 우측 접이식 툴바로 전환
- **컬러**: 기존 파스텔 블루(#7C9EF5) 유지
- **스타일**: 그라데이션 버튼, 배경 도형 장식, grownd 카드 스타일 적용

---

## Phase 1: 인프라 변경 (핵심)

### 1.1 index.html - 레이아웃 구조 변경

**현재**:
```
header (고정) → main (스크롤) → nav (하단 고정 5탭)
```

**변경 후**:
```
top-navbar (상단 고정, 탭 포함) → main-container (main + right-toolbar)
```

**변경 내용**:
```html
<!-- 기존 nav.app-nav 제거 -->
<!-- header 구조 변경: -->
<header class="top-navbar">
  <div class="navbar-left">
    <span class="logo">🐾</span>
    <h1>클래스펫</h1>
  </div>
  <nav class="navbar-tabs">
    <button data-route="dashboard" class="navbar-tab active">🏠 홈</button>
    <button data-route="timetable" class="navbar-tab">📅 시간표</button>
    <button data-route="petfarm" class="navbar-tab">🐾 펫농장</button>
    <button data-route="emotion" class="navbar-tab">💝 마음</button>
    <button data-route="stats" class="navbar-tab">📊 통계</button>
  </nav>
  <div class="navbar-right">
    <span id="classInfo"></span>
    <button id="hamburgerBtn" class="mobile-only">☰</button>
  </div>
</header>

<div class="main-container">
  <main id="content" class="main-content"></main>
  <aside class="right-toolbar" id="rightToolbar">
    <button class="toolbar-toggle" id="toolbarToggle">◀</button>
    <div class="toolbar-items">
      <button id="dateHistoryBtn">📅 <span id="currentDate"></span></button>
      <button id="notificationBtn">🔔 알림</button>
      <button id="settingsBtn">⚙️ 설정</button>
      <button id="headerLogoutBtn">🚪 로그아웃</button>
    </div>
  </aside>
</div>

<!-- 모바일 드로어 메뉴 추가 -->
<div class="mobile-drawer" id="mobileDrawer">
  <!-- 모바일용 전체 메뉴 -->
</div>
```

### 1.2 css/style.css - 새 디자인 시스템

**제거할 클래스**:
- `.app-nav`, `.nav-dock`, `.nav-item` (하단 네비 관련)

**추가할 클래스**:

```css
/* ===== 상단 네비바 ===== */
.top-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: white;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
}

.navbar-tabs {
  display: flex;
  gap: 4px;
}

.navbar-tab {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
  background: transparent;
  border: none;
}

.navbar-tab:hover {
  background: rgba(124, 158, 245, 0.1);
}

.navbar-tab.active {
  background: linear-gradient(135deg, #7C9EF5 0%, #A78BFA 100%);
  color: white;
}

/* ===== 우측 툴바 ===== */
.main-container {
  display: flex;
  padding-top: 64px; /* navbar 높이 */
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.right-toolbar {
  width: 200px;
  background: white;
  box-shadow: -2px 0 12px rgba(0,0,0,0.05);
  transition: width 0.3s;
  padding: 16px 0;
}

.right-toolbar.collapsed {
  width: 48px;
}

.right-toolbar.collapsed .toolbar-text {
  display: none;
}

.toolbar-toggle {
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  border: none;
  cursor: pointer;
}

.toolbar-items button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  transition: background 0.2s;
  border: none;
  background: transparent;
}

.toolbar-items button:hover {
  background: rgba(124, 158, 245, 0.1);
}

/* ===== 그라데이션 버튼 ===== */
.gradient-btn-primary {
  background: linear-gradient(135deg, #7C9EF5 0%, #A78BFA 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(124, 158, 245, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.gradient-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(124, 158, 245, 0.4);
}

.gradient-btn-secondary {
  background: linear-gradient(135deg, #F5A67C 0%, #F5E07C 100%);
  color: #7C5A00;
}

/* ===== 배경 장식 ===== */
.bg-decorations {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.12;
}

.bg-circle-1 { width: 300px; height: 300px; background: #7C9EF5; top: -100px; right: -50px; }
.bg-circle-2 { width: 200px; height: 200px; background: #F5A67C; bottom: 20%; left: -80px; }
.bg-circle-3 { width: 150px; height: 150px; background: #7CE0A3; bottom: -50px; right: 30%; }

/* ===== 카드 스타일 ===== */
.grownd-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.grownd-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

/* ===== 모바일 반응형 ===== */
@media (max-width: 768px) {
  .navbar-tabs { display: none; }
  .hamburger-btn { display: block; }
  .right-toolbar { display: none; }
  .main-content { padding: 16px; }

  .mobile-drawer {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    transform: translateX(-100%);
    transition: transform 0.3s;
    z-index: 95;
    padding: 24px;
  }

  .mobile-drawer.open {
    transform: translateX(0);
  }
}

@media (min-width: 769px) {
  .hamburger-btn { display: none; }
  .mobile-drawer { display: none; }
}
```

### 1.3 js/app.js - 네비게이션 로직 변경

**변경 사항**:
1. `bindNavigation()` → `.navbar-tab` 바인딩으로 변경
2. 툴바 토글 로직 추가
3. 모바일 햄버거 메뉴 로직 추가

```javascript
// 추가할 함수
function bindToolbarToggle() {
  const toolbar = document.getElementById('rightToolbar');
  const toggleBtn = document.getElementById('toolbarToggle');

  if (toggleBtn && toolbar) {
    toggleBtn.addEventListener('click', () => {
      toolbar.classList.toggle('collapsed');
      toggleBtn.textContent = toolbar.classList.contains('collapsed') ? '▶' : '◀';
    });
  }
}

function bindMobileDrawer() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');

  if (hamburgerBtn && mobileDrawer) {
    hamburgerBtn.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
    });
  }
}

// bindNavigation() 수정
function bindNavigation() {
  const navTabs = document.querySelectorAll('.navbar-tab');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const route = tab.dataset.route;
      if (route) {
        // 활성 탭 업데이트
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        router.navigate(route);
      }
    });
  });
}
```

---

## Phase 2: 컴포넌트별 스타일 업데이트

### 2.1 Dashboard.js (홈)
- 섹션들을 `grownd-card`로 감싸기
- 버튼들 `gradient-btn-primary`로 변경
- 요약 카드 그리드 레이아웃 적용

### 2.2 Timetable.js (시간표)
- 전체를 `grownd-card`로 감싸기
- 컨트롤 버튼들 카드 헤더로 이동
- 그라데이션 버튼 스타일 적용

### 2.3 PetFarm.js (펫농장)
- `grownd-card` 컨테이너 적용
- 펫 카드 hover 효과 개선
- 헤더에 필터 옵션 추가

### 2.4 Emotion.js (마음)
- 탭 스타일 grownd 스타일로 변경
- 감정 버튼 그라데이션 hover
- 히스토리 타임라인 스타일

### 2.5 Stats.js (통계)
- 랭킹 카드 스타일 개선
- 순위 배지 그라데이션 적용
- 진행률 바 스타일 업데이트

### 2.6 Settings.js (설정)
- 섹션별 `grownd-card` 적용
- 폼 인풋 모던 스타일
- 액션 버튼 그라데이션

### 2.7 StudentLogin.js (학생 로그인)
- 중앙 카드 레이아웃
- 상단 그라데이션 배너 (펫 일러스트 영역)
- 번호 버튼 hover 효과

### 2.8 StudentMode.js (학생 화면)
- 전체 화면 펫 디스플레이
- 하단 액션 바 (고정)
- 플로팅 감정 선택 버튼

---

## Phase 3: 구현 순서

| 순서 | 작업 | 파일 | 의존성 |
|------|------|------|--------|
| 1 | 레이아웃 구조 변경 | index.html | - |
| 2 | 새 CSS 클래스 추가 | css/style.css | 1 |
| 3 | 네비게이션 로직 변경 | js/app.js | 1, 2 |
| 4 | Dashboard 스타일 | Dashboard.js | 2 |
| 5 | Timetable 스타일 | Timetable.js | 2 |
| 6 | PetFarm 스타일 | PetFarm.js | 2 |
| 7 | Emotion 스타일 | Emotion.js | 2 |
| 8 | Stats 스타일 | Stats.js | 2 |
| 9 | Settings 스타일 | Settings.js | 2 |
| 10 | StudentLogin 스타일 | StudentLogin.js | 2 |
| 11 | StudentMode 스타일 | StudentMode.js | 2 |

---

## 수정 대상 파일 목록

**핵심 파일 (Phase 1)**:
1. `/Users/iwongeun/Desktop/classpet/index.html`
2. `/Users/iwongeun/Desktop/classpet/css/style.css`
3. `/Users/iwongeun/Desktop/classpet/js/app.js`

**컴포넌트 파일 (Phase 2)**:
4. `/Users/iwongeun/Desktop/classpet/js/components/Dashboard.js`
5. `/Users/iwongeun/Desktop/classpet/js/components/Timetable.js`
6. `/Users/iwongeun/Desktop/classpet/js/components/PetFarm.js`
7. `/Users/iwongeun/Desktop/classpet/js/components/Emotion.js`
8. `/Users/iwongeun/Desktop/classpet/js/components/Stats.js`
9. `/Users/iwongeun/Desktop/classpet/js/components/Settings.js`
10. `/Users/iwongeun/Desktop/classpet/js/components/StudentLogin.js`
11. `/Users/iwongeun/Desktop/classpet/js/components/StudentMode.js`

---

## 검증 방법

### 1. 브라우저 테스트
```bash
# 로컬 서버 실행 (classpet 디렉토리에서)
npx serve .
# 또는
python3 -m http.server 8000
```

### 2. 확인 항목
- [ ] 상단 탭바가 정상 표시되고 라우팅 동작
- [ ] 우측 툴바 접기/펼치기 동작
- [ ] 모바일(768px 이하)에서 햄버거 메뉴 동작
- [ ] 각 페이지 카드 스타일 적용 확인
- [ ] 그라데이션 버튼 hover 효과
- [ ] 배경 도형 장식 표시
- [ ] 로그인/로그아웃 플로우 정상 동작
- [ ] 학생 모드 전환 정상 동작

### 3. 반응형 테스트
- 데스크톱 (1200px+)
- 태블릿 (768px~1199px)
- 모바일 (767px 이하)
