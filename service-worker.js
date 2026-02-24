// 클래스펫 Service Worker
const CACHE_NAME = 'classpet-v1771922149422';
const OFFLINE_URL = '/offline.html';

// 캐시할 정적 파일들 (앱 셸)
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/output.css',
    '/css/style.css',
    '/css/base/variables.css',
    '/css/base/layout.css',
    '/css/base/typography.css',
    '/css/components/navbar.css',
    '/css/components/toolbar.css',
    '/css/components/drawer.css',
    '/css/components/header.css',
    '/css/components/cards.css',
    '/css/components/modal.css',
    '/css/components/pet.css',
    '/css/components/timetable.css',
    '/css/components/praise.css',
    '/css/components/student.css',
    '/css/components/notification.css',
    '/css/utilities/animations.css',
    '/css/utilities/glass.css',
    '/css/utilities/responsive.css',
    // 루트 브릿지 + 라우터
    '/js/app.js',
    '/js/store.js',
    '/js/firebase-config.js',
    '/js/router.js',
    // app/ 인프라
    '/js/app/init.js',
    '/js/app/routes.js',
    '/js/app/navigation.js',
    '/js/app/header.js',
    '/js/app/modals.js',
    '/js/app/globalFunctions.js',
    // shared/store/
    '/js/shared/store/index.js',
    '/js/shared/store/Store.js',
    '/js/shared/store/offlineMixin.js',
    '/js/shared/store/notificationMixin.js',
    '/js/shared/store/settingsMixin.js',
    // shared/firebase/
    '/js/shared/firebase/index.js',
    '/js/shared/firebase/init.js',
    '/js/shared/firebase/helpers.js',
    '/js/shared/firebase/notes.js',
    // shared/constants/
    '/js/shared/constants/index.js',
    '/js/shared/constants/storageKeys.js',
    '/js/shared/constants/settings.js',
    // shared/utils/
    '/js/shared/utils/animations.js',
    '/js/shared/utils/petLogic.js',
    '/js/shared/utils/nameUtils.js',
    '/js/shared/utils/dateUtils.js',
    '/js/shared/utils/htmlSanitizer.js',
    '/js/shared/utils/subjects.constants.js',
    // features/auth/
    '/js/features/auth/TeacherLogin.js',
    '/js/features/auth/StudentLogin.js',
    '/js/features/auth/LoginSelect.js',
    '/js/features/auth/authMixin.js',
    '/js/features/auth/auth.firebase.js',
    // features/class/
    '/js/features/class/ClassSelect.js',
    '/js/features/class/Settings.js',
    '/js/features/class/classMixin.js',
    '/js/features/class/studentMixin.js',
    '/js/features/class/classes.firebase.js',
    '/js/features/class/students.firebase.js',
    // features/pet/
    '/js/features/pet/PetFarm.js',
    '/js/features/pet/PetSelection.js',
    '/js/features/pet/PetCollection.js',
    '/js/features/pet/PetChat.js',
    '/js/features/pet/petMixin.js',
    '/js/features/pet/PetService.js',
    '/js/features/pet/pets.firebase.js',
    '/js/features/pet/pets.constants.js',
    // features/praise/
    '/js/features/praise/QuickPraise.js',
    '/js/features/praise/PraiseManagement.js',
    '/js/features/praise/StudentPraise.js',
    '/js/features/praise/praiseMixin.js',
    '/js/features/praise/thermostatMixin.js',
    '/js/features/praise/praises.firebase.js',
    '/js/features/praise/praise.constants.js',
    // features/emotion/
    '/js/features/emotion/Emotion.js',
    '/js/features/emotion/emotionMixin.js',
    '/js/features/emotion/EmotionService.js',
    '/js/features/emotion/emotions.firebase.js',
    '/js/features/emotion/emotions.constants.js',
    '/js/features/emotion/sessionTimeout.js',
    // features/timetable/
    '/js/features/timetable/Timetable.js',
    '/js/features/timetable/StudentTimetable.js',
    '/js/features/timetable/timetableMixin.js',
    '/js/features/timetable/timetable.firebase.js',
    '/js/features/timetable/timetable.constants.js',
    // features/notice/
    '/js/features/notice/Notice.js',
    '/js/features/notice/StudentNotice.js',
    '/js/features/notice/noticeMixin.js',
    '/js/features/notice/notices.firebase.js',
    // features/classroom-tools/
    '/js/features/classroom-tools/Picker.js',
    '/js/features/classroom-tools/TimerView.js',
    '/js/features/classroom-tools/whistle.js',
    '/js/features/classroom-tools/timer.js',
    '/js/features/classroom-tools/sound.js',
    // features/stats/
    '/js/features/stats/Stats.js',
    '/js/features/stats/StudentDetail.js',
    // features/dashboard/
    '/js/features/dashboard/Dashboard.js',
    '/js/features/dashboard/StudentMode.js',
    '/manifest.json'
];

// 캐시하지 않을 URL 패턴들 (Firebase API 요청만 - SDK는 캐시 허용)
const NO_CACHE_PATTERNS = [
    /firestore\.googleapis\.com/,
    /firebase\.googleapis\.com/,
    /identitytoolkit\.googleapis\.com/,
    /securetoken\.googleapis\.com/,
    /firebaseio\.com/
    // gstatic.com (Firebase SDK CDN)은 캐시 허용하여 로딩 속도 개선
];

// 설치 이벤트 - 정적 파일 캐싱
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                // 실패해도 설치 진행 (일부 파일 없을 수 있음)
                return cache.addAll(STATIC_ASSETS).catch((err) => {
                    console.warn('[SW] Some assets failed to cache:', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch 이벤트 - 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // http/https 외의 요청은 무시 (chrome-extension 등)
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // POST 등 GET 외 요청은 무시
    if (request.method !== 'GET') {
        return;
    }

    // Firebase/API 요청은 캐싱하지 않음
    if (NO_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
        return;
    }

    // 네비게이션 요청 (HTML 페이지)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    return caches.match(OFFLINE_URL);
                })
        );
        return;
    }

    // 정적 자산 - 네트워크 우선, 캐시 폴백
    event.respondWith(
        fetch(request)
            .then((response) => {
                // 성공 시 캐시에 저장
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // 네트워크 실패 시 캐시에서 제공
                return caches.match(request).then((cached) => {
                    // 캐시에도 없으면 빈 응답 반환 (undefined 방지)
                    return cached || new Response('', { status: 503, statusText: 'Service Unavailable' });
                });
            })
    );
});

// 메시지 이벤트 - 캐시 업데이트 요청 처리
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
