/**
 * 이용약관 / 개인정보처리방침 공유 모듈
 * Settings.js와 LoginSelect.js에서 동일한 내용을 사용하기 위해 분리
 */

export const TERMS_VERSION = '2.0';
export const PRIVACY_VERSION = '2.0';
export const TERMS_EFFECTIVE_DATE = '2026-03-02';

/**
 * 이용약관 HTML (10조)
 */
export function getTermsHTML() {
    return `
        <div>
            <p class="font-semibold text-gray-700 mb-1">제1조 (목적)</p>
            <p class="text-xs text-gray-500">이 약관은 클래스펫(이하 "서비스")의 이용과 관련하여 서비스 운영자(이하 "운영자")와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제2조 (용어 정의)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>"서비스"란 클래스펫이 제공하는 학급 경영 지원 웹 애플리케이션을 말합니다</li>
                <li>"교사(이용자)"란 Google 계정으로 가입하여 학급을 운영하는 사용자를 말합니다</li>
                <li>"학생"이란 교사가 생성한 학급에 소속되어 서비스를 이용하는 14세 미만의 아동을 말합니다</li>
                <li>"학급"이란 교사가 생성하고 학생이 소속되는 서비스 내 단위를 말합니다</li>
                <li>"가명정보"란 실명 대신 사용하는 별명, 닉네임 등을 말합니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제3조 (서비스 내용)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>펫 성장 시스템을 통한 학급 경영 지원</li>
                <li>학생 감정 기록 및 확인</li>
                <li>칭찬 관리 시스템</li>
                <li>시간표 관리 및 알림장 기능</li>
                <li>서비스는 교육 목적으로만 사용되어야 하며, 상업적 목적의 사용은 금지됩니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제4조 (이용 계약)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>교사가 본 약관 및 개인정보처리방침에 동의하고 Google 계정으로 로그인함으로써 이용 계약이 성립됩니다</li>
                <li>학생은 별도의 계정 가입 절차 없이, 교사가 생성한 학급코드와 PIN을 통해 서비스에 접속합니다</li>
                <li>14세 미만 아동(학생)은 직접 서비스에 가입할 수 없으며, 교사의 관리 하에서만 이용합니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제5조 (계정 등록 및 보안)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>교사 계정은 Google OAuth 인증을 통해 생성되며, 타인과 계정을 공유해서는 안 됩니다</li>
                <li>학생 계정(개인코드)은 교사가 생성 및 관리하며, 학생의 실명 대신 가명(별명) 사용을 권장합니다</li>
                <li>교사는 학생 정보에 주민등록번호, 전화번호, 주소 등 민감한 개인정보를 입력해서는 안 됩니다</li>
                <li>계정의 보안 관리 책임은 해당 이용자에게 있습니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제6조 (사용자 의무)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>교사는 서비스를 교육 목적으로만 사용하여야 합니다</li>
                <li>학생 등록 시 가명정보(별명, 닉네임) 사용을 원칙으로 합니다</li>
                <li>학기 또는 학년 종료 시 학급 데이터를 초기화(삭제)하여야 합니다</li>
                <li>학생의 서비스 이용에 대해 학부모(보호자)에게 안내할 의무가 있습니다</li>
                <li>타인의 계정을 무단으로 사용하거나, 서비스를 부정한 목적으로 이용할 수 없습니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제7조 (지적 재산권)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>서비스의 UI, 디자인, 코드 등 지적 재산권은 운영자에게 귀속됩니다</li>
                <li>교사는 비상업적 교육 목적 범위 내에서 서비스를 자유롭게 이용할 수 있습니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제8조 (서비스 변경 및 중단)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>서비스는 무료로 제공되며, 운영자는 운영상 필요한 경우 서비스의 내용을 변경하거나 중단할 수 있습니다</li>
                <li>서비스 변경 또는 중단 시 사전에 공지하기 위해 노력합니다</li>
                <li>긴급한 시스템 점검, 장애 대응 등 불가피한 경우에는 사후 공지할 수 있습니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제9조 (면책 및 책임 제한)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>서비스는 무료로 제공되며, 서비스 이용으로 발생하는 데이터 손실 등에 대해 운영자는 고의 또는 중과실이 없는 한 책임을 지지 않습니다</li>
                <li>중요한 데이터는 별도로 백업하시기 바랍니다</li>
                <li>교사가 입력한 학생 정보의 적절성 및 관리에 대한 책임은 해당 교사에게 있습니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제10조 (약관 변경 및 문의)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>본 약관을 변경할 경우, 시행일 7일 전 서비스 내에서 공지합니다</li>
                <li>변경된 약관에 동의하지 않을 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다</li>
                <li>약관 변경 후 서비스를 계속 이용하면 변경된 약관에 동의한 것으로 봅니다</li>
                <li>문의: classpet_help@gmail.com</li>
                <li>시행일: ${TERMS_EFFECTIVE_DATE}</li>
            </ul>
        </div>
    `;
}

/**
 * 개인정보처리방침 HTML (12조)
 */
export function getPrivacyPolicyHTML() {
    return `
        <div>
            <p class="font-semibold text-gray-700 mb-1">제1조 (총칙)</p>
            <p class="text-xs text-gray-500">클래스펫(이하 "서비스")은 「개인정보 보호법」에 따라 이용자의 개인정보를 보호하고, 관련 고충을 신속히 처리하기 위해 본 개인정보처리방침을 수립·공개합니다.</p>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제2조 (14세 미만 아동 보호)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>본 서비스의 학생 이용자는 14세 미만 아동(초등학생)이며, 아동은 직접 서비스에 가입하지 않습니다</li>
                <li>학생 계정은 교사가 학급코드와 PIN을 통해 간접적으로 생성·관리하며, 별도의 회원가입 절차가 없습니다</li>
                <li>학생 정보는 가명정보(별명, 닉네임) 사용을 원칙으로 하며, 실명 입력 여부는 교사의 판단에 따릅니다</li>
                <li>교사는 학생의 서비스 이용에 대해 학부모(법정대리인)에게 안내할 의무가 있습니다</li>
                <li>본 조항은 「초·중등교육법」 제29조의2(학교정보의 공시)의 취지를 준수합니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제3조 (수집 항목 및 이용 목적)</p>
            <p class="text-xs text-gray-500 mb-1"><strong>가. 교사 정보</strong></p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500 mb-2">
                <li>수집 항목: Google 계정 정보(이름, 이메일, 프로필 사진)</li>
                <li>이용 목적: 로그인 인증, 학급 생성 및 관리</li>
            </ul>
            <p class="text-xs text-gray-500 mb-1"><strong>나. 학생 정보</strong></p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500 mb-2">
                <li>수집 항목: 이름(가명 권장), 번호, 개인코드</li>
                <li>이용 목적: 학급 내 본인 확인, 학습 활동 기록</li>
            </ul>
            <p class="text-xs text-gray-500 mb-1"><strong>다. 학급 활동 데이터</strong></p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500 mb-2">
                <li>수집 항목: 감정 기록, 칭찬 내역, 펫 성장 데이터, 시간표, 알림장</li>
                <li>이용 목적: 학급 경영 지원, 교육 활동 기록</li>
            </ul>
            <p class="text-xs text-gray-500 mb-1"><strong>라. 자동 수집 정보</strong></p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500 mb-2">
                <li>접속 로그, localStorage 데이터 (기기 내 저장)</li>
            </ul>
            <p class="text-xs text-gray-500"><strong>수집하지 않는 정보:</strong> 실명(가명 사용 시), 주민등록번호, 전화번호, 주소 등 민감 개인정보</p>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제4조 (보유 및 이용 기간)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>교사 탈퇴(계정 삭제) 시 교사 정보를 즉시 파기합니다</li>
                <li>학급 삭제 시 해당 학급의 학생 데이터를 즉시 파기합니다</li>
                <li>교사는 학기 또는 학년 종료 시 학급 데이터를 초기화(삭제)하여야 합니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제5조 (제3자 제공 및 처리 위탁)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>이용자의 개인정보를 제3자에게 제공하지 않습니다</li>
                <li>데이터 저장 및 인증: Google LLC (Firebase Firestore, Firebase Authentication) — 미국 소재, 데이터 암호화 저장</li>
                <li>웹 호스팅: Netlify Inc. — 정적 파일 호스팅, 개인정보 미보관</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제6조 (정보주체의 권리)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>교사: 설정 화면에서 본인 정보를 직접 열람, 수정, 삭제할 수 있습니다</li>
                <li>학생/학부모: 교사를 통해 학생 정보의 열람, 수정, 삭제를 요청할 수 있습니다</li>
                <li>정보주체의 요청은 지체 없이 처리합니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제7조 (파기 절차 및 방법)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다</li>
                <li>파기 방법: Firebase Firestore 문서 삭제를 통해 전자적으로 파기하며, 복구가 불가능한 기술적 조치를 취합니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제8조 (안전성 확보 조치)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>HTTPS 암호화 통신을 통해 데이터를 안전하게 전송합니다</li>
                <li>Google OAuth 2.0 인증을 통해 교사 계정을 보호합니다</li>
                <li>Firebase Security Rules를 적용하여 데이터 접근을 제한합니다</li>
                <li>모든 데이터는 학급 단위로 분리되어 다른 학급에서 접근할 수 없습니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제9조 (개인정보 보호책임자)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>연락처: classpet_help@gmail.com</li>
                <li>개인정보 관련 문의, 불만, 권리 행사는 위 이메일로 연락해 주시면 지체 없이 처리하겠습니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제10조 (가명정보 처리)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>학생 이름은 가명(별명, 닉네임) 사용을 권장합니다</li>
                <li>실명을 입력할 경우 이에 대한 판단과 관리 책임은 해당 교사에게 있습니다</li>
                <li>서비스는 가명정보만으로도 모든 기능을 정상적으로 이용할 수 있도록 설계되어 있습니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제11조 (사용자 의무 및 책임)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>교사는 학생 등록 시 가명정보 사용을 원칙으로 합니다</li>
                <li>주민등록번호, 전화번호, 주소 등 민감한 개인정보를 서비스에 입력해서는 안 됩니다</li>
                <li>학기 또는 학년 종료 시 학급 데이터를 초기화(삭제)하여야 합니다</li>
                <li>계정의 보안을 적절히 관리하여야 합니다</li>
                <li>학생의 서비스 이용에 대해 학부모(법정대리인)에게 안내하여야 합니다</li>
                <li>위 의무를 위반하여 발생하는 문제에 대한 책임은 해당 교사에게 있습니다</li>
            </ul>
        </div>
        <div>
            <p class="font-semibold text-gray-700 mb-1">제12조 (변경 고지 및 기타)</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>본 방침을 변경할 경우, 시행일 7일 전 서비스 내에서 공지합니다</li>
                <li>개인정보 침해 관련 외부 구제기관: 개인정보침해신고센터 (전화 118, privacy.kisa.or.kr), 개인정보분쟁조정위원회 (kopico.go.kr)</li>
                <li>시행일: ${TERMS_EFFECTIVE_DATE}</li>
            </ul>
        </div>
    `;
}
