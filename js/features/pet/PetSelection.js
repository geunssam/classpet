/**
 * 펫 선택 컴포넌트
 * 학생이 처음 로그인할 때 자신의 펫을 선택하고 이름을 지어주는 화면
 */

import { store, PET_TYPES } from '../../store.js';
import { router } from '../../router.js';
import { getNameWithSuffix, hasFinalConsonant } from '../../shared/utils/nameUtils.js';
import { getPetStageImageHTML } from '../../shared/utils/petLogic.js';

// 선택된 펫 타입
let selectedPetType = null;
// 입력한 펫 이름
let inputPetName = '';

/**
 * 분류별 초기 이모지 가져오기
 */
function getInitialEmoji(category) {
    switch (category) {
        case 'mammal': return '🎁';
        case 'bird': return '🥚';
        case 'reptile': return '🥚';
        case 'fantasy': return '✨';
        default: return '🥚';
    }
}

/**
 * 분류 한글명 가져오기
 */
function getCategoryName(category) {
    switch (category) {
        case 'mammal': return '포유류';
        case 'bird': return '조류';
        case 'reptile': return '파충류';
        case 'fantasy': return '판타지';
        default: return '';
    }
}

/**
 * 렌더링
 */
export function render() {
    const session = store.getStudentSession();
    const student = session ? store.getStudent(session.studentId) : null;

    if (!student) {
        return `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <p class="text-gray-500">로그인이 필요해요</p>
                    <a href="#student-login" class="text-primary hover:underline">로그인하기</a>
                </div>
            </div>
        `;
    }

    return `
        <div class="pet-selection-container min-h-screen bg-gradient-to-b from-primary/5 to-white py-6 px-4">
            <!-- 헤더 -->
            <div class="text-center mb-6">
                <div class="text-5xl mb-3 animate-bounce-slow">🎁</div>
                <h1 class="text-xl font-bold text-gray-800 mb-1">
                    ${getNameWithSuffix(student.name)}, 안녕!
                </h1>
                <p class="text-gray-600 text-sm">나와 함께할 펫을 골라줘!</p>
                <p class="text-xs text-gray-400 mt-1">한 번 선택하면 바꿀 수 없어요</p>
            </div>

            <!-- 펫 선택 그리드 (4x4) -->
            <div class="max-w-lg mx-auto">
                <div class="grid grid-cols-4 gap-2 mb-6" id="petSelectionGrid">
                    ${Object.entries(PET_TYPES).map(([type, pet]) => `
                        <button class="pet-option-btn group relative p-3 bg-white rounded-2xl border-2 border-gray-200 hover:border-primary transition-all duration-300 shadow-sm hover:shadow-md"
                                data-pet-type="${type}">
                            <!-- 선택 체크 표시 -->
                            <div class="pet-check absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white items-center justify-center hidden text-xs">
                                <span>✓</span>
                            </div>

                            <!-- 펫 이미지와 이름 -->
                            <div class="text-center">
                                <div class="mb-1 group-hover:scale-110 transition-transform flex justify-center">
                                    ${getPetStageImageHTML(type, 'baby', 'md')}
                                </div>
                                <p class="font-bold text-gray-800 text-sm">${pet.name}</p>
                            </div>
                        </button>
                    `).join('')}
                </div>

                <!-- 선택 확인 버튼 -->
                <button id="confirmPetBtn" class="w-full liquid-btn-student text-lg" disabled>
                    펫을 선택해주세요
                </button>

                <!-- 안내 문구 -->
                <p class="text-center text-xs text-gray-400 mt-4">
                    선택한 펫은 칭찬을 받거나 대화할수록 성장해요! 🌟
                </p>
            </div>
        </div>

        <!-- 이름 짓기 모달 -->
        <div id="namePetModal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl text-center">
                <h3 class="text-lg font-bold text-gray-800 mb-1">
                    <span id="namePetTypeName">강아지</span>의 이름을 지어주세요!
                </h3>

                <!-- 4단계 성장 미리보기 -->
                <div id="petGrowthPreview" class="flex items-center justify-center gap-3 my-4 py-4 bg-gray-50 rounded-xl">
                </div>
                <p class="text-xs text-gray-400 mb-3">칭찬을 받거나 펫과 대화하면 이렇게 성장해요!</p>

                <!-- 이름 입력 -->
                <div class="mb-4">
                    <input
                        type="text"
                        id="petNameInput"
                        class="w-full px-4 py-3 text-center text-lg border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                        placeholder="이름 입력 (1~10자)"
                        maxlength="10"
                    >
                    <p id="nameInputError" class="text-xs text-red-500 mt-2 hidden">이름을 입력해주세요!</p>
                </div>

                <div class="modal-buttons">
                    <button id="cancelNameBtn" class="liquid-btn-student-secondary">
                        다시 고를래
                    </button>
                    <button id="confirmNameBtn" class="liquid-btn-student">
                        이 이름으로!
                    </button>
                </div>
            </div>
        </div>

        <!-- 최종 확인 모달 -->
        <div id="confirmPetModal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center">
                <div id="confirmPetEmoji" class="text-6xl mb-3">🐕</div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">
                    "<span id="confirmPetName">초코</span>"를
                </h3>
                <p class="text-gray-600 mb-1">내 펫으로 선택할까요?</p>
                <p class="text-sm text-red-500 mb-5">
                    ⚠️ 한 번 선택하면 바꿀 수 없어요!
                </p>
                <div class="modal-buttons">
                    <button id="cancelPetBtn" class="liquid-btn-student-secondary">
                        다시 고를래
                    </button>
                    <button id="finalConfirmPetBtn" class="liquid-btn-student">
                        선택할래!
                    </button>
                </div>
            </div>
        </div>

        <!-- 환영 애니메이션 모달 -->
        <div id="welcomePetModal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-8 w-full max-w-xs shadow-2xl text-center">
                <div id="welcomePetEmoji" class="text-7xl mb-4 animate-bounce">🐕</div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">
                    만나서 반가워!
                </h3>
                <p class="text-gray-600 mb-2">
                    나는 <span id="welcomePetName" class="font-bold text-primary">초코</span><span id="welcomePetSuffix">야</span>!
                </p>
                <p class="text-sm text-gray-500 mb-6">
                    앞으로 같이 성장하자! 🌟
                </p>
                <button id="startJourneyBtn" class="w-full liquid-btn-student-gold">
                    시작하기 🎉
                </button>
            </div>
        </div>
    `;
}

/**
 * 펫 선택 처리
 */
function selectPet(petType) {
    selectedPetType = petType;
    const pet = PET_TYPES[petType];

    // 모든 버튼 선택 해제
    document.querySelectorAll('.pet-option-btn').forEach(btn => {
        btn.classList.remove('border-primary', 'bg-primary/5', 'scale-105');
        btn.querySelector('.pet-check')?.classList.add('hidden');
        btn.querySelector('.pet-check')?.classList.remove('flex');
    });

    // 선택된 버튼 강조
    const selectedBtn = document.querySelector(`[data-pet-type="${petType}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('border-primary', 'bg-primary/5', 'scale-105');
        const check = selectedBtn.querySelector('.pet-check');
        if (check) {
            check.classList.remove('hidden');
            check.classList.add('flex');
        }
    }

    // 확인 버튼 활성화
    const confirmBtn = document.getElementById('confirmPetBtn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `${getPetStageImageHTML(selectedPetType, 'baby', 'xs')} ${pet.name} 선택하기`;
    }
}

/**
 * 이름 짓기 모달 열기
 */
function openNameModal() {
    if (!selectedPetType) return;

    const pet = PET_TYPES[selectedPetType];
    const modal = document.getElementById('namePetModal');

    document.getElementById('namePetTypeName').textContent = pet.name;

    // 4단계 성장 미리보기
    const stages = ['baby', 'child', 'teen', 'adult'];
    const preview = document.getElementById('petGrowthPreview');
    if (preview) {
        preview.innerHTML = stages.map((stage, i) => `
            <div class="flex flex-col items-center">
                ${getPetStageImageHTML(selectedPetType, stage, 'xl')}
            </div>
            ${i < stages.length - 1 ? '<span class="text-2xl text-gray-400 mx-1">→</span>' : ''}
        `).join('');
    }

    // 입력 초기화
    const input = document.getElementById('petNameInput');
    input.value = '';
    inputPetName = '';
    document.getElementById('nameInputError').classList.add('hidden');

    modal.classList.remove('hidden');

    // 입력 필드에 포커스
    setTimeout(() => input.focus(), 100);
}

/**
 * 이름 짓기 모달 닫기
 */
function closeNameModal() {
    document.getElementById('namePetModal').classList.add('hidden');
}

/**
 * 최종 확인 모달 열기
 */
function openConfirmModal() {
    if (!selectedPetType || !inputPetName.trim()) return;

    const pet = PET_TYPES[selectedPetType];
    const modal = document.getElementById('confirmPetModal');

    document.getElementById('confirmPetEmoji').innerHTML = getPetStageImageHTML(selectedPetType, 'baby', 'xl');
    document.getElementById('confirmPetName').textContent = inputPetName.trim();

    closeNameModal();
    modal.classList.remove('hidden');
}

/**
 * 확인 모달 닫기
 */
function closeConfirmModal() {
    document.getElementById('confirmPetModal').classList.add('hidden');
}

/**
 * 환영 모달 열기
 */
function openWelcomeModal() {
    const pet = PET_TYPES[selectedPetType];
    const modal = document.getElementById('welcomePetModal');

    document.getElementById('welcomePetEmoji').innerHTML = getPetStageImageHTML(selectedPetType, 'child', '2xl');
    const petName = inputPetName.trim();
    document.getElementById('welcomePetName').textContent = petName;
    // 받침 있으면 '이야', 없으면 '야' (예: 멍멍이야 / 테스트멍이야)
    document.getElementById('welcomePetSuffix').textContent = hasFinalConsonant(petName) ? '이야' : '야';

    modal.classList.remove('hidden');
}

/**
 * 최종 펫 선택 확정
 */
async function confirmPetSelection() {
    const session = store.getStudentSession();
    if (!session || !selectedPetType) return;

    // 펫 저장 (이름 포함) - Firebase에도 동기화
    const result = await store.selectPet(session.studentId, selectedPetType, inputPetName.trim());

    if (result) {
        closeConfirmModal();
        openWelcomeModal();
    }
}

/**
 * 이름 입력 유효성 검사
 */
function validatePetName(name) {
    const trimmed = name.trim();
    return trimmed.length >= 1 && trimmed.length <= 10;
}

/**
 * 렌더 후 이벤트 바인딩
 */
export function afterRender() {
    const grid = document.getElementById('petSelectionGrid');
    if (!grid) return;

    // 펫 선택 버튼 클릭
    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.pet-option-btn');
        if (!btn) return;

        const petType = btn.dataset.petType;
        selectPet(petType);
    });

    // 선택하기 버튼 → 이름 짓기 모달 열기
    const confirmBtn = document.getElementById('confirmPetBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (selectedPetType) {
                openNameModal();
            }
        });
    }

    // 이름 입력 필드
    const petNameInput = document.getElementById('petNameInput');
    if (petNameInput) {
        petNameInput.addEventListener('input', (e) => {
            inputPetName = e.target.value;
            document.getElementById('nameInputError').classList.add('hidden');
        });

        petNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('confirmNameBtn').click();
            }
        });
    }

    // 이름 짓기 모달 - 취소 버튼
    const cancelNameBtn = document.getElementById('cancelNameBtn');
    if (cancelNameBtn) {
        cancelNameBtn.addEventListener('click', closeNameModal);
    }

    // 이름 짓기 모달 - 확인 버튼
    const confirmNameBtn = document.getElementById('confirmNameBtn');
    if (confirmNameBtn) {
        confirmNameBtn.addEventListener('click', () => {
            if (!validatePetName(inputPetName)) {
                document.getElementById('nameInputError').classList.remove('hidden');
                document.getElementById('petNameInput').focus();
                return;
            }
            openConfirmModal();
        });
    }

    // 최종 확인 모달 - 취소 버튼
    const cancelPetBtn = document.getElementById('cancelPetBtn');
    if (cancelPetBtn) {
        cancelPetBtn.addEventListener('click', () => {
            closeConfirmModal();
            openNameModal();
        });
    }

    // 최종 확인 모달 - 확인 버튼
    const finalConfirmBtn = document.getElementById('finalConfirmPetBtn');
    if (finalConfirmBtn) {
        finalConfirmBtn.addEventListener('click', confirmPetSelection);
    }

    // 시작하기 버튼
    const startBtn = document.getElementById('startJourneyBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            router.navigate('student-main');
        });
    }

    // 이름 짓기 모달 배경 클릭 시 닫기
    const nameModal = document.getElementById('namePetModal');
    if (nameModal) {
        nameModal.addEventListener('click', (e) => {
            if (e.target === nameModal) {
                closeNameModal();
            }
        });
    }

    // 최종 확인 모달 배경 클릭 시 닫기
    const confirmModal = document.getElementById('confirmPetModal');
    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                closeConfirmModal();
                openNameModal();
            }
        });
    }
}
