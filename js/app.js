/**
 * 클래스펫 메인 앱 (브릿지)
 * 실제 구현은 ./app/ 폴더의 모듈들에 있음
 * 하위 호환성을 위해 기존 경로 유지
 */

// init.js가 DOMContentLoaded 이벤트에 initApp을 바인딩하므로
// 이 파일을 import하기만 하면 앱이 시작됨
import './app/init.js';
