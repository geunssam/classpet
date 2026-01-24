/**
 * 클래스펫 라우터 모듈
 * 간단한 SPA 라우팅 시스템
 */

// 학생 모드 라우트 목록
const STUDENT_MODE_ROUTES = ['student-login', 'student-main', 'student-chat', 'pet-selection', 'pet-collection'];

// 로그인 관련 라우트 목록 (하단 네비 숨김)
const LOGIN_ROUTES = ['login', 'teacher-login', 'student-login', 'class-select'];

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.params = {};
        this.contentElement = null;
        this.onRouteChange = null;
    }

    /**
     * 현재 라우트가 학생 모드인지 확인
     */
    isStudentMode() {
        return STUDENT_MODE_ROUTES.includes(this.currentRoute);
    }

    /**
     * 라우터 초기화
     */
    init(contentElementId = 'content') {
        this.contentElement = document.getElementById(contentElementId);

        // 해시 변경 이벤트 리스너
        window.addEventListener('hashchange', () => this.handleRoute());

        // 초기 라우트 처리
        this.handleRoute();
    }

    /**
     * 라우트 등록
     */
    register(path, component) {
        this.routes[path] = component;
    }

    /**
     * 여러 라우트 한번에 등록
     */
    registerAll(routes) {
        Object.entries(routes).forEach(([path, component]) => {
            this.register(path, component);
        });
    }

    /**
     * 현재 해시에서 라우트 정보 추출
     */
    parseHash() {
        let hash = window.location.hash.slice(1) || 'login';
        const params = {};

        // 쿼리 파라미터 분리 (예: student-login?code=ABC123)
        const queryIndex = hash.indexOf('?');
        if (queryIndex !== -1) {
            const queryString = hash.slice(queryIndex + 1);
            hash = hash.slice(0, queryIndex);

            // 쿼리 파라미터 파싱
            const searchParams = new URLSearchParams(queryString);
            searchParams.forEach((value, key) => {
                params[key] = value;
            });
        }

        const parts = hash.split('/');
        const route = parts[0];

        // /route/param1/param2 형태 파싱
        if (parts.length > 1) {
            params.id = parts[1];
        }
        if (parts.length > 2) {
            params.action = parts[2];
        }

        return { route, params };
    }

    /**
     * 라우트 처리
     */
    async handleRoute() {
        const { route, params } = this.parseHash();
        this.params = params;

        const component = this.routes[route];

        if (component) {
            this.currentRoute = route;

            // 네비게이션 업데이트
            this.updateNavigation(route);

            // 컴포넌트 렌더링
            try {
                if (typeof component === 'function') {
                    const content = await component(params);
                    this.render(content);
                } else if (typeof component.render === 'function') {
                    const content = await component.render(params);
                    this.render(content);
                }
            } catch (error) {
                console.error('라우트 렌더링 오류:', error);
                this.render(this.errorPage(error));
            }

            // 라우트 변경 콜백
            if (this.onRouteChange) {
                this.onRouteChange(route, params);
            }
        } else {
            // 404 처리
            this.render(this.notFoundPage());
        }
    }

    /**
     * 컨텐츠 렌더링
     */
    render(content) {
        if (!this.contentElement) return;

        // 문자열이면 innerHTML로
        if (typeof content === 'string') {
            this.contentElement.innerHTML = content;
        }
        // DOM 엘리먼트면 appendChild로
        else if (content instanceof HTMLElement) {
            this.contentElement.innerHTML = '';
            this.contentElement.appendChild(content);
        }

        // 스크롤 맨 위로
        this.contentElement.scrollTop = 0;
    }

    /**
     * 네비게이션 활성 상태 업데이트
     */
    updateNavigation(route) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const itemRoute = item.dataset.route;
            if (itemRoute === route) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 학생 모드 UI 처리
        this.updateStudentModeUI(route);
    }

    /**
     * 학생 모드 UI 업데이트
     */
    updateStudentModeUI(route) {
        const isStudentMode = STUDENT_MODE_ROUTES.includes(route);
        const isLoginScreen = LOGIN_ROUTES.includes(route);
        const bottomNav = document.querySelector('nav.fixed');
        const quickPraiseBtn = document.getElementById('quickPraiseBtn');
        const header = document.querySelector('header');
        const content = document.getElementById('content');

        if (isLoginScreen) {
            // 로그인 화면: 하단 네비, 빠른 칭찬 버튼, 헤더 숨기기
            if (bottomNav) bottomNav.classList.add('hidden');
            if (quickPraiseBtn) quickPraiseBtn.classList.add('hidden');
            if (header) header.classList.add('hidden');

            // 컨텐츠 영역 패딩 조정
            if (content) {
                content.classList.remove('pb-20');
            }
        } else if (isStudentMode) {
            // 학생 모드: 하단 네비, 빠른 칭찬 버튼 숨기기
            if (bottomNav) bottomNav.classList.add('hidden');
            if (quickPraiseBtn) quickPraiseBtn.classList.add('hidden');
            if (header) header.classList.remove('hidden');

            // 헤더 스타일 변경 (학생 모드) - 크림색 유지
            if (header) {
                header.classList.remove('bg-gradient-to-r', 'from-primary', 'to-primary-dark', 'from-success', 'to-primary');
            }

            // 컨텐츠 영역 패딩 조정
            if (content) {
                content.classList.remove('pb-20');
            }
        } else {
            // 교사 모드: 원래대로
            if (bottomNav) bottomNav.classList.remove('hidden');
            if (quickPraiseBtn) quickPraiseBtn.classList.remove('hidden');
            if (header) header.classList.remove('hidden');

            // 헤더 스타일 복원 - 크림색 유지
            if (header) {
                header.classList.remove('bg-gradient-to-r', 'from-primary', 'to-primary-dark', 'from-success', 'to-primary');
            }

            // 컨텐츠 영역 패딩 복원
            if (content) {
                content.classList.add('pb-20');
            }
        }
    }

    /**
     * 프로그래매틱 네비게이션
     */
    navigate(path, params = {}) {
        let hash = path;

        // 파라미터가 있으면 추가
        if (params.id) {
            hash += `/${params.id}`;
        }
        if (params.action) {
            hash += `/${params.action}`;
        }

        window.location.hash = hash;
    }

    /**
     * 뒤로 가기
     */
    back() {
        window.history.back();
    }

    /**
     * 현재 파라미터 가져오기
     */
    getParams() {
        return this.params;
    }

    /**
     * 현재 라우트 가져오기
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * 404 페이지
     */
    notFoundPage() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">페이지를 찾을 수 없어요</h3>
                <p class="text-gray-500 mb-4">요청하신 페이지가 존재하지 않습니다.</p>
                <button onclick="router.navigate('login')" class="btn btn-primary">
                    홈으로 돌아가기
                </button>
            </div>
        `;
    }

    /**
     * 에러 페이지
     */
    errorPage(error) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">오류가 발생했어요</h3>
                <p class="text-gray-500 mb-4">${error.message || '알 수 없는 오류'}</p>
                <button onclick="router.navigate('login')" class="btn btn-primary">
                    홈으로 돌아가기
                </button>
            </div>
        `;
    }
}

// 싱글톤 인스턴스
const router = new Router();

export { router };
