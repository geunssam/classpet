# 클래스펫 - 학급 코드 공유 및 학생 로그인 개선

## 핵심 흐름

```
교사 로그인 → 클래스 개설 → QR코드/학급코드 공유
                                    ↓
         학생이 QR 스캔 또는 학급 코드 직접 입력
                                    ↓
         클래스에서 자기 번호 확인 → 펫, PIN 설정
```

---

## 문제점

1. **학급 코드 공유가 불편함** - 복사 버튼만 있어서 학생들에게 알려주기 귀찮음
2. **학생 첫 로그인 시 학급 코드 입력 안 됨** - Firebase 활성화 조건에 의존해서 코드 입력 화면이 안 뜸

---

## 해결 방안

### 1. QR 코드 공유 기능 추가 (Settings.js)

| 기능 | 설명 |
|-----|------|
| QR 코드 보기 | 모달로 QR 표시, 학생이 스캔하면 자동 접속 |

### 2. 학생 로그인 흐름 수정 (StudentLogin.js)

**현재 문제**:
```javascript
if (isFirebaseEnabled && !classCode) { ... }
```
Firebase 활성화 여부에 의존

**해결**:
```javascript
if (!classCode) { ... }
```
학급 코드 없으면 무조건 입력 화면 표시

### 3. URL 파라미터 자동 처리 (app.js)

QR 스캔 시 URL: `localhost:8080/?code=GLCHAA`
→ 자동으로 학급 코드 설정 → 학생 로그인 화면 이동

---

## 수정 파일 (4개)

| 파일 | 변경 내용 |
|-----|---------|
| `index.html` | QR 코드 라이브러리 CDN 추가 |
| `js/app.js` | URL 파라미터 처리 로직 추가 |
| `js/components/Settings.js` | QR 코드 생성/표시 UI 추가 |
| `js/components/StudentLogin.js` | 학급 코드 입력 조건 수정 |

---

## 구현 상세

### 1단계: index.html - QR 라이브러리 추가

```html
<!-- Firebase SDK 전에 추가 -->
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
```

### 2단계: app.js - URL 파라미터 처리

`initApp()` 함수 시작 부분에 추가:
```javascript
// URL 파라미터로 학급 코드 자동 설정
const urlParams = new URLSearchParams(window.location.search);
const codeParam = urlParams.get('code');
if (codeParam) {
    store.setClassCode(codeParam.toUpperCase());
    window.history.replaceState({}, '', window.location.pathname);
    router.navigate('student-login');
    return; // 초기화 중단하고 학생 로그인으로
}
```

### 3단계: Settings.js - QR 코드 버튼 및 모달 추가

버튼 추가 (line 48 근처, 복사하기 버튼 옆):
```html
<button id="showQRCodeBtn" class="text-sm px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
    📱 QR 코드
</button>
```

QR 모달 함수 추가:
```javascript
function showQRCodeModal() {
    const classCode = store.getClassCode();
    const url = `${window.location.origin}${window.location.pathname}?code=${classCode}`;

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">📱 학급 QR 코드</h3>
                <button onclick="window.classpet.closeModal()">✕</button>
            </div>
            <div class="text-center py-4">
                <canvas id="qrCanvas" class="mx-auto"></canvas>
                <p class="text-2xl font-mono font-bold text-primary mt-4">${classCode}</p>
                <p class="text-sm text-gray-500 mt-2">학생들이 스캔하면 바로 참가해요!</p>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // QR 코드 생성
    QRCode.toCanvas(document.getElementById('qrCanvas'), url, {
        width: 200,
        margin: 2
    });
}
```

### 4단계: StudentLogin.js - 조건 수정

**line 24** 수정:
```javascript
// 기존: if (isFirebaseEnabled && !classCode)
if (!classCode) {
    showClassCodeInput = true;
}
```

**line 29** 수정:
```javascript
// 기존: if (showClassCodeInput && isFirebaseEnabled)
if (showClassCodeInput) {
    return renderClassCodeInput(settings);
}
```

---

## 사용자 흐름

### 교사
1. 로그인 → 대시보드 → 설정
2. 학급 코드 생성 (이미 있으면 생략)
3. **📱 QR 코드** 버튼 클릭
4. 화면에 QR 표시 → 학생들에게 스캔하라고 안내

### 학생
1. QR 코드 스캔 (또는 학생 로그인 → 학급 코드 직접 입력)
2. 학급에 참가 완료
3. 자기 번호 선택
4. PIN 입력 (처음: 번호 4자리, 예: 1번 → 0001)
5. 펫 선택 → 메인 화면

---

## 검증 방법

1. 교사 설정 → QR 코드 버튼 클릭 → QR 모달 표시 확인
2. QR 스캔 시 `?code=XXXX` URL로 이동 → 학생 로그인 화면 확인
3. 학급 코드 없이 학생 로그인 접속 → 코드 입력 화면 표시 확인
4. 코드 입력 후 번호 선택 → PIN 입력 → 펫 선택 흐름 확인

---

## 상태

- [ ] 구현 대기 중
- 작성일: 2025-01-22
