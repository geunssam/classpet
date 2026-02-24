/**
 * PetService - Firebase 펫 구독 중앙 관리
 * 학생이 펫을 선택/레벨업하면 교사 대시보드에 실시간 반영
 */

import { store } from '../store.js';

let unsubscribes = [];
let refreshTimer = null;

/** Firebase 펫 구독 시작 (학급 전환 시에도 호출) */
export function startPetSubscription() {
    stopPetSubscription();
    if (!store.isTeacherLoggedIn() || !store.isFirebaseEnabled()) return;

    const students = store.getStudents() || [];
    students.forEach(student => {
        const unsub = store.subscribeToStudentPets(student.id, (pets) => {
            const activePet = pets.find(p => p.status === 'active');
            const currentStudent = store.getStudent(student.id);
            if (!currentStudent) return;

            // 변경 여부 체크 (이중 업데이트 방지)
            const newPetType = activePet?.petType ?? null;
            const newExp = activePet?.exp ?? 0;
            const newLevel = activePet?.level ?? 1;
            const newPetName = activePet?.petName ?? null;

            if (
                currentStudent.petType === newPetType &&
                currentStudent.exp === newExp &&
                currentStudent.level === newLevel &&
                currentStudent.petName === newPetName
            ) return;

            // saveStudents()로 업데이트 (updateStudent 사용 금지 — Firebase 재동기화 방지)
            const allStudents = store.getStudents() || [];
            const idx = allStudents.findIndex(s => s.id === student.id);
            if (idx === -1) return;

            allStudents[idx] = {
                ...allStudents[idx],
                petType: newPetType,
                petName: newPetName,
                exp: newExp,
                level: newLevel
            };
            store.saveStudents(allStudents);

            // debounce된 화면 갱신 (연속 발화 방지)
            scheduleRefresh();
        });
        if (unsub) unsubscribes.push(unsub);
    });

    if (unsubscribes.length > 0) {
        console.log(`PetService: ${unsubscribes.length}명 펫 구독 시작`);
    }
}

/** 구독 해제 */
export function stopPetSubscription() {
    unsubscribes.forEach(fn => fn());
    unsubscribes = [];
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
}

/** 300ms debounce로 연속 발화를 하나로 합침 */
function scheduleRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
        refreshTimer = null;
        store.notify('petUpdate');
    }, 300);
}
