/**
 * 이용약관 / 개인정보처리방침 공유 모듈
 * Settings.js와 LoginSelect.js에서 동일한 내용을 사용하기 위해 분리
 */

/**
 * 이용약관 HTML
 */
export function getTermsHTML() {
    return `
        <div>
            <p class="font-semibold text-gray-700 mb-1">제1조 (목적)</p>
            <p class="text-xs text-gray-500">이 약관은 클래스펫(이하 "서비스")의 이용과 관련하여 서비스 제공자와 이용자 간의 권리, 의무 및 책임사항을 규정합니다.</p>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제2조 (서비스 내용)</p>
            <p class="text-xs text-gray-500">서비스는 학급 경영 지원을 위한 펫 성장 시스템, 감정 기록, 칭찬 관리 등의 기능을 제공합니다. 교육 목적으로만 사용되어야 합니다.</p>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제3조 (이용자의 의무)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>교사는 학생 정보의 적절한 관리 책임이 있습니다</li>
                <li>서비스를 교육 목적 외 용도로 사용할 수 없습니다</li>
                <li>타인의 계정을 무단으로 사용할 수 없습니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제4조 (서비스 변경 및 중단)</p>
            <p class="text-xs text-gray-500">서비스 제공자는 운영상 필요한 경우 서비스의 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다.</p>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제5조 (면책)</p>
            <p class="text-xs text-gray-500">서비스는 무료로 제공되며, 서비스 이용으로 발생하는 데이터 손실 등에 대해 제공자는 책임을 지지 않습니다. 중요한 데이터는 별도로 백업하시기 바랍니다.</p>
        </div>
    `;
}

/**
 * 개인정보처리방침 HTML
 */
export function getPrivacyPolicyHTML() {
    return `
        <div>
            <p class="font-semibold text-gray-700 mb-1">1. 수집하는 정보</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>교사: Google 계정 정보 (이름, 이메일)</li>
                <li>학생: 이름, 번호, PIN</li>
                <li>학급 활동: 감정 기록, 칭찬 내역, 펫 성장 데이터</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">2. 정보의 저장</p>
            <p class="text-xs text-gray-500">Google Firebase(클라우드)와 기기 내 로컬 저장소에 보관됩니다. 모든 데이터는 학급 단위로 분리되어 다른 학급에서 접근할 수 없습니다.</p>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">3. 정보의 이용</p>
            <p class="text-xs text-gray-500">수집된 정보는 학급 경영 지원 목적으로만 사용되며, 제3자에게 제공되지 않습니다.</p>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">4. 정보의 삭제</p>
            <p class="text-xs text-gray-500">교사는 설정에서 학생 정보 및 학급 데이터를 직접 삭제할 수 있습니다. 학급 삭제 시 관련 모든 데이터가 영구 삭제됩니다.</p>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">5. 보안</p>
            <p class="text-xs text-gray-500">Google OAuth 인증을 통해 교사 계정을 보호하며, 학생은 PIN 입력을 통해 본인 확인 후 접속합니다.</p>
        </div>
    `;
}
