/**
 * 모달 관리
 * 학생 추가/편집/삭제, 메모 추가/삭제 모달
 */

import { store, PET_TYPES } from '../store.js';
import { router } from '../router.js';
import {
    showToast,
    setModalContent,
    openModal,
    closeModal
} from '../shared/utils/animations.js';
import { refreshCurrentView } from './globalFunctions.js';

/**
 * 학생 추가 모달
 */
export function showAddStudent() {
    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">🐣 새 학생 추가</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <input type="number" id="studentNumber" class="w-full" placeholder="번호" min="1">
                <input type="text" id="studentName" class="w-full" placeholder="이름">
            </div>

            <button id="modalAddStudentBtn" class="btn btn-primary w-full">
                추가하기
            </button>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    document.getElementById('modalAddStudentBtn').addEventListener('click', () => {
        const name = document.getElementById('studentName').value.trim();
        const number = parseInt(document.getElementById('studentNumber').value);
        if (!name) {
            showToast('이름을 입력해주세요', 'warning');
            return;
        }
        if (!number || number < 1) {
            showToast('번호를 입력해주세요', 'warning');
            return;
        }

        // 중복 번호 체크
        const existing = (store.getStudents() || []).find(s => s.number === number);
        if (existing) {
            showToast(`${number}번은 이미 있어요 (${existing.name})`, 'warning');
            return;
        }

        store.addStudent({ name, number });

        showToast(`${name} 학생이 추가되었어요!`, 'success');
        closeModal();
        refreshCurrentView();
    });
}

/**
 * 학생 편집 모달
 */
export function showEditStudent(studentId) {
    const student = store.getStudent(studentId);
    if (!student) return;

    const petTypes = Object.entries(PET_TYPES).map(([key, pet]) => ({
        key,
        name: pet.name,
        emoji: pet.stages.baby
    }));

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">✏️ 학생 정보 수정</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">이름</label>
                <input type="text" id="editStudentName" value="${student.name}" class="w-full">
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">번호</label>
                <input type="number" id="editStudentNumber" value="${student.number}" class="w-full" min="1">
            </div>

            <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">펫 타입</label>
                <div class="grid grid-cols-5 gap-2" id="editPetTypeGrid">
                    ${petTypes.map(pet => `
                        <button class="edit-pet-type-btn p-3 rounded-xl border-2 ${student.petType === pet.key ? 'border-primary bg-primary/10' : 'border-transparent'} hover:border-primary/50 transition-all"
                                data-pet="${pet.key}">
                            <span class="text-2xl">${pet.emoji}</span>
                            <div class="text-xs mt-1">${pet.name}</div>
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="flex gap-2">
                <button id="deleteStudentBtn" class="btn btn-danger flex-1">
                    삭제
                </button>
                <button id="saveStudentBtn" class="btn btn-primary flex-1">
                    저장
                </button>
            </div>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    // 이벤트 바인딩
    let selectedPetType = student.petType;

    document.querySelectorAll('.edit-pet-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.edit-pet-type-btn').forEach(b => {
                b.classList.remove('border-primary', 'bg-primary/10');
                b.classList.add('border-transparent');
            });
            btn.classList.remove('border-transparent');
            btn.classList.add('border-primary', 'bg-primary/10');
            selectedPetType = btn.dataset.pet;
        });
    });

    document.getElementById('saveStudentBtn').addEventListener('click', () => {
        const name = document.getElementById('editStudentName').value.trim();
        const number = parseInt(document.getElementById('editStudentNumber').value);

        if (!name) {
            showToast('이름을 입력해주세요', 'warning');
            return;
        }

        store.updateStudent(studentId, {
            name,
            number,
            petType: selectedPetType
        });

        showToast('수정되었습니다', 'success');
        closeModal();
        refreshCurrentView();
    });

    document.getElementById('deleteStudentBtn').addEventListener('click', () => {
        if (confirm(`정말 ${student.name}을(를) 삭제하시겠습니까?`)) {
            store.deleteStudent(studentId);
            showToast('삭제되었습니다', 'info');
            closeModal();
            router.navigate('petfarm');
        }
    });
}

/**
 * 학생 삭제
 */
export function deleteStudent(studentId) {
    const student = store.getStudent(studentId);
    if (!student) return;

    if (confirm(`정말 ${student.name}을(를) 삭제하시겠습니까?`)) {
        store.deleteStudent(studentId);
        showToast('삭제되었습니다', 'info');
        refreshCurrentView();
    }
}

/**
 * 메모 추가 모달
 */
export function showAddNote(studentId) {
    const student = store.getStudent(studentId);
    if (!student) return;

    const modalContent = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">📝 메모 추가</h3>
                <button onclick="window.classpet.closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="text-center text-sm text-gray-500">
                ${student.name}에 대한 메모
            </div>

            <div>
                <textarea id="noteContent" class="w-full p-3 border rounded-xl resize-none" rows="4"
                          placeholder="메모 내용을 입력하세요..."></textarea>
            </div>

            <button id="saveNoteBtn" class="btn btn-primary w-full">
                저장하기
            </button>
        </div>
    `;

    setModalContent(modalContent);
    openModal();

    document.getElementById('saveNoteBtn').addEventListener('click', () => {
        const content = document.getElementById('noteContent').value.trim();
        if (!content) {
            showToast('내용을 입력해주세요', 'warning');
            return;
        }

        store.addNote({
            studentId,
            content
        });

        showToast('메모가 저장되었습니다', 'success');
        closeModal();
        refreshCurrentView();
    });
}

/**
 * 메모 삭제
 */
export function deleteNote(noteId) {
    if (confirm('이 메모를 삭제하시겠습니까?')) {
        store.deleteNote(noteId);
        showToast('삭제되었습니다', 'info');
        refreshCurrentView();
    }
}
