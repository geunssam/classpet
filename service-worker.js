// 클래스펫 Service Worker
const CACHE_NAME = 'classpet-v1770528852315';
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
    '/js/app.js',
    '/js/store.js',
    '/js/firebase-config.js',
    '/js/firebase/index.js',
    '/js/firebase/init.js',
    '/js/firebase/helpers.js',
    '/js/firebase/auth.js',
    '/js/firebase/classes.js',
    '/js/firebase/students.js',
    '/js/firebase/emotions.js',
    '/js/firebase/praises.js',
    '/js/firebase/timetable.js',
    '/js/firebase/notes.js',
    '/js/firebase/pets.js',
    '/js/router.js',
    '/js/constants/index.js',
    '/js/constants/storageKeys.js',
    '/js/constants/subjects.js',
    '/js/constants/pets.js',
    '/js/constants/praise.js',
    '/js/constants/emotions.js',
    '/js/constants/timetable.js',
    '/js/constants/settings.js',
    '/js/store/index.js',
    '/js/store/Store.js',
    '/js/store/offlineMixin.js',
    '/js/store/authMixin.js',
    '/js/store/classMixin.js',
    '/js/store/studentMixin.js',
    '/js/store/petMixin.js',
    '/js/store/timetableMixin.js',
    '/js/store/praiseMixin.js',
    '/js/store/emotionMixin.js',
    '/js/store/settingsMixin.js',
    '/js/store/notificationMixin.js',
    '/js/app/init.js',
    '/js/app/routes.js',
    '/js/app/navigation.js',
    '/js/app/header.js',
    '/js/app/modals.js',
    '/js/app/globalFunctions.js',
    '/js/utils/animations.js',
    '/js/utils/petLogic.js',
    '/js/utils/nameUtils.js',
    '/js/components/ClassSelect.js',
    '/js/components/Dashboard.js',
    '/js/components/LoginSelect.js',
    '/js/components/TeacherLogin.js',
    '/js/components/Settings.js',
    '/js/components/Timetable.js',
    '/js/components/PetSelection.js',
    '/js/components/PetFarm.js',
    '/js/components/PetChat.js',
    '/js/components/PetCollection.js',
    '/js/components/Emotion.js',
    '/js/components/StudentLogin.js',
    '/js/components/StudentMode.js',
    '/js/components/StudentDetail.js',
    '/js/components/StudentTimetable.js',
    '/js/components/StudentPraise.js',
    '/js/components/Stats.js',
    '/js/components/QuickPraise.js',
    '/js/components/PraiseManagement.js',
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
                return caches.match(request);
            })
    );
});

// 메시지 이벤트 - 캐시 업데이트 요청 처리
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
