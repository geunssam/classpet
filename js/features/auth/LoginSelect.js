/**
 * 로그인 선택 컴포넌트
 * 교사/학생 로그인 선택 화면
 *
 * 새로운 흐름:
 * - 교사: Google 로그인 → (신규 시 약관 동의) → 학급 선택/생성 → 대시보드
 * - 학생: 개인코드 4자리 입력 → 학생 메인
 */

import { store } from '../../store.js';
import { router } from '../../router.js';
import { showToast } from '../../shared/utils/animations.js';
import { getTermsHTML, getPrivacyPolicyHTML } from '../../shared/utils/termsContent.js';
import { saveTermsAgreement } from '../../firebase-config.js';

/**
 * 렌더링
 */
export function render() {
    return `
        <div class="login-select-container flex flex-col items-center justify-start px-4 pt-8 overflow-hidden" style="height: 100dvh;">
            <!-- 로고 영역 -->
            <div class="text-center mb-10">
                <div class="text-6xl mb-4 animate-bounce-slow">🐾</div>
                <h1 class="text-3xl font-bold text-gray-800 mb-2">클래스펫</h1>
                <p class="text-gray-500">펫과 함께 즐거운 학교생활</p>
            </div>

            <!-- 로그인 선택 버튼 -->
            <div class="w-full max-w-sm space-y-4">
                <!-- Google 로그인 (교사) -->
                <button id="googleLoginBtn" class="login-select-btn w-full p-5 bg-gradient-to-r from-purple-300/10 via-blue-300/10 to-pink-200/10 backdrop-blur-sm text-gray-700 rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 border-2 border-purple-400/50">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" class="w-7 h-7">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        </div>
                        <div class="text-left flex-1">
                            <p class="font-bold text-lg">Google로 로그인</p>
                            <p class="text-sm text-gray-600">선생님 전용</p>
                        </div>
                        <span class="text-2xl text-gray-600">→</span>
                    </div>
                </button>

                <!-- 구분선 -->
                <div class="flex items-center gap-4 my-6">
                    <div class="flex-1 h-px bg-gray-200"></div>
                    <span class="text-sm text-gray-400">또는</span>
                    <div class="flex-1 h-px bg-gray-200"></div>
                </div>

                <!-- 학생 로그인 -->
                <button id="studentLoginBtn" class="login-select-btn w-full p-5 bg-gradient-to-r from-purple-300/10 via-blue-300/10 to-pink-200/10 backdrop-blur-sm text-gray-700 rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 border-2 border-purple-400/50">
                    <div class="flex items-center gap-4">
                        <span class="text-4xl">👦</span>
                        <div class="text-left flex-1">
                            <p class="font-bold text-lg">학생으로 입장</p>
                            <p class="text-sm text-gray-600">학급코드로 접속하기</p>
                        </div>
                        <span class="text-2xl text-gray-600">→</span>
                    </div>
                </button>
            </div>

            <!-- 하단 안내 -->
            <div class="mt-12 text-center text-sm text-gray-400">
                <p>🔒 안전한 Google 계정으로 로그인하세요</p>
            </div>

            <!-- 로딩 오버레이 -->
            <div id="loginLoadingOverlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-2xl p-8 text-center">
                    <div class="animate-spin text-4xl mb-4">🔄</div>
                    <p class="text-gray-700 font-medium">로그인 중...</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    // Google 로그인 버튼
    const googleBtn = document.getElementById('googleLoginBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
    }

    // 학생 로그인 버튼
    const studentBtn = document.getElementById('studentLoginBtn');
    if (studentBtn) {
        studentBtn.addEventListener('click', () => {
            router.navigate('student-login');
        });
    }
}

/**
 * Google 로그인 처리
 */
async function handleGoogleLogin() {
    const loadingOverlay = document.getElementById('loginLoadingOverlay');

    try {
        // 로딩 표시
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }

        // Google 로그인 시도
        const result = await store.signInWithGoogle();

        if (result.success) {
            // 약관 미동의 사용자 → 약관 동의 모달
            if (result.needsTermsAgreement) {
                // 로딩 숨기기
                if (loadingOverlay) {
                    loadingOverlay.classList.add('hidden');
                }
                showTermsAgreementModal(result.user);
                return;
            }

            // 기존 사용자 → 바로 학급 선택
            showToast(`환영합니다, ${result.user.displayName || '선생님'}! 🎉`, 'success');
            router.navigate('class-select');
        } else {
            throw new Error(result.error || '로그인에 실패했어요');
        }
    } catch (error) {
        console.error('Google 로그인 오류:', error);

        // 사용자가 취소한 경우
        if (error.code === 'auth/popup-closed-by-user') {
            showToast('로그인이 취소되었습니다', 'info');
        } else {
            showToast(error.message || '로그인에 실패했어요', 'error');
        }
    } finally {
        // 로딩 숨기기
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }
}

/**
 * 약관 동의 모달 표시 (신규 사용자)
 * 디자인: 글라스모피즘 + 파스텔 블루 (#7C9EF5)
 */
function showTermsAgreementModal(user) {
    // 스타일 삽입 (한 번만)
    if (!document.getElementById('termsModalStyle')) {
        const style = document.createElement('style');
        style.id = 'termsModalStyle';
        style.textContent = `
            @keyframes termsModalIn {
                from { opacity: 0; transform: scale(0.95); }
                to   { opacity: 1; transform: scale(1); }
            }
            @keyframes termsOverlayIn {
                from { opacity: 0; }
                to   { opacity: 1; }
            }
            .terms-overlay {
                animation: termsOverlayIn 0.25s ease-out;
            }
            .terms-modal {
                animation: termsModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .terms-checkbox {
                width: 20px; height: 20px;
                border: 2px solid #cbd5e1; border-radius: 4px;
                appearance: none; -webkit-appearance: none;
                cursor: pointer; transition: all 0.15s;
                flex-shrink: 0;
            }
            .terms-checkbox:checked {
                background: #7C9EF5; border-color: #7C9EF5;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E");
                background-size: 14px; background-position: center; background-repeat: no-repeat;
            }
            .terms-btn-active {
                background: linear-gradient(135deg, #7C9EF5 0%, #6B8DE8 100%);
                cursor: pointer; box-shadow: 0 4px 14px rgba(124,158,245,0.4);
            }
            .terms-btn-active:hover {
                box-shadow: 0 6px 20px rgba(124,158,245,0.5);
                transform: translateY(-1px);
            }
            .terms-content-panel {
                max-height: 0; overflow: hidden;
                transition: max-height 0.3s ease;
            }
            .terms-content-panel.open {
                max-height: 300px; overflow-y: auto;
            }
        `;
        document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.id = 'termsAgreementOverlay';
    overlay.className = 'terms-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;';

    overlay.innerHTML = `
        <div class="terms-modal" style="
            width:100%; max-width:400px; max-height:85vh;
            background:#fff; border-radius:20px;
            box-shadow:0 24px 48px rgba(0,0,0,0.15);
            display:flex; flex-direction:column; overflow:hidden;
        ">
            <!-- 헤더 -->
            <div style="text-align:center; padding:28px 24px 20px; border-bottom:1px solid rgba(124,158,245,0.08);">
                <div style="font-size:48px; margin-bottom:12px;">🐾</div>
                <h2 style="font-size:20px; font-weight:700; color:#1e293b; margin:0 0 6px;">클래스펫에 오신 것을 환영합니다!</h2>
                <p style="font-size:14px; color:#94a3b8; margin:0;">서비스 이용을 위해 아래 약관에 동의해 주세요.</p>
            </div>

            <!-- 바디 -->
            <div style="flex:1; overflow-y:auto; padding:20px 24px;">
                <!-- 전체 동의 -->
                <div id="termsAllAgreeCard" style="
                    background:rgba(124,158,245,0.08); border-radius:8px; padding:12px 14px;
                    display:flex; align-items:center; gap:10px; cursor:pointer; margin-bottom:16px;
                ">
                    <input type="checkbox" id="termsAllCheck" class="terms-checkbox">
                    <span style="font-size:15px; font-weight:600; color:#1e293b;">전체 동의</span>
                </div>

                <!-- 구분선 -->
                <div style="height:1px; background:rgba(124,158,245,0.08); margin-bottom:14px;"></div>

                <!-- 이용약관 -->
                <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="checkbox" id="termsCheck" class="terms-checkbox">
                        <span style="font-size:13px; font-weight:600; color:#7C9EF5;">[필수]</span>
                        <span style="font-size:14px; color:#334155;">이용약관</span>
                    </div>
                    <button id="termsToggle" style="font-size:13px; color:#94a3b8; text-decoration:underline; background:none; border:none; cursor:pointer; padding:4px;">보기</button>
                </div>
                <div id="termsContent" class="terms-content-panel" style="
                    background:#f8fafc; border-radius:8px; padding:0 14px;
                    border:1px solid rgba(124,158,245,0.08);
                ">
                    <div style="padding:14px 0;">
                        <div style="display:flex; flex-direction:column; gap:12px; font-size:13px; color:#64748b;">
                            ${getTermsHTML()}
                        </div>
                    </div>
                </div>

                <!-- 개인정보처리방침 -->
                <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; margin-top:4px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="checkbox" id="privacyCheck" class="terms-checkbox">
                        <span style="font-size:13px; font-weight:600; color:#7C9EF5;">[필수]</span>
                        <span style="font-size:14px; color:#334155;">개인정보처리방침</span>
                    </div>
                    <button id="privacyToggle" style="font-size:13px; color:#94a3b8; text-decoration:underline; background:none; border:none; cursor:pointer; padding:4px;">보기</button>
                </div>
                <div id="privacyContent" class="terms-content-panel" style="
                    background:#f8fafc; border-radius:8px; padding:0 14px;
                    border:1px solid rgba(124,158,245,0.08);
                ">
                    <div style="padding:14px 0;">
                        <div style="display:flex; flex-direction:column; gap:12px; font-size:13px; color:#64748b;">
                            ${getPrivacyPolicyHTML()}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 푸터 -->
            <div style="padding:16px 24px 24px;">
                <button id="termsAgreeBtn" disabled style="
                    width:100%; padding:14px 0; border:none; border-radius:12px;
                    font-size:16px; font-weight:700; color:#fff;
                    background:#cbd5e1; cursor:not-allowed;
                    transition: all 0.2s ease;
                ">동의하고 시작하기</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // 요소 참조
    const allCheck = document.getElementById('termsAllCheck');
    const termsCheck = document.getElementById('termsCheck');
    const privacyCheck = document.getElementById('privacyCheck');
    const agreeBtn = document.getElementById('termsAgreeBtn');
    const termsToggle = document.getElementById('termsToggle');
    const privacyToggle = document.getElementById('privacyToggle');
    const termsContent = document.getElementById('termsContent');
    const privacyContent = document.getElementById('privacyContent');
    const allAgreeCard = document.getElementById('termsAllAgreeCard');

    // 버튼 활성화 상태 업데이트
    function updateAgreeButton() {
        const allChecked = termsCheck.checked && privacyCheck.checked;
        allCheck.checked = allChecked;
        agreeBtn.disabled = !allChecked;
        if (allChecked) {
            agreeBtn.className = 'terms-btn-active';
            agreeBtn.style.cssText = 'width:100%;padding:14px 0;border:none;border-radius:12px;font-size:16px;font-weight:700;color:#fff;transition:all 0.2s ease;background:linear-gradient(135deg,#7C9EF5 0%,#6B8DE8 100%);cursor:pointer;box-shadow:0 4px 14px rgba(124,158,245,0.4);';
        } else {
            agreeBtn.className = '';
            agreeBtn.style.cssText = 'width:100%;padding:14px 0;border:none;border-radius:12px;font-size:16px;font-weight:700;color:#fff;transition:all 0.2s ease;background:#cbd5e1;cursor:not-allowed;';
        }
    }

    // 전체 동의 카드 클릭
    allAgreeCard.addEventListener('click', (e) => {
        if (e.target === allCheck) return; // 체크박스 직접 클릭은 아래에서 처리
        allCheck.checked = !allCheck.checked;
        termsCheck.checked = allCheck.checked;
        privacyCheck.checked = allCheck.checked;
        updateAgreeButton();
    });

    allCheck.addEventListener('change', () => {
        termsCheck.checked = allCheck.checked;
        privacyCheck.checked = allCheck.checked;
        updateAgreeButton();
    });

    termsCheck.addEventListener('change', updateAgreeButton);
    privacyCheck.addEventListener('change', updateAgreeButton);

    // 보기 토글
    function togglePanel(panel, btn) {
        const isOpen = panel.classList.contains('open');
        panel.classList.toggle('open');
        btn.textContent = isOpen ? '보기' : '접기';
    }

    termsToggle.addEventListener('click', () => togglePanel(termsContent, termsToggle));
    privacyToggle.addEventListener('click', () => togglePanel(privacyContent, privacyToggle));

    // 동의 버튼 클릭
    agreeBtn.addEventListener('click', async () => {
        if (agreeBtn.disabled) return;

        agreeBtn.disabled = true;
        agreeBtn.textContent = '처리 중...';
        agreeBtn.style.opacity = '0.7';

        try {
            await saveTermsAgreement(user.uid);
            overlay.remove();
            showToast(`환영합니다, ${user.displayName || '선생님'}! 🎉`, 'success');
            router.navigate('class-select');
        } catch (error) {
            console.error('약관 동의 저장 실패:', error);
            showToast('약관 동의 저장에 실패했어요. 다시 시도해주세요.', 'error');
            agreeBtn.disabled = false;
            agreeBtn.textContent = '동의하고 시작하기';
            agreeBtn.style.opacity = '1';
        }
    });
}
