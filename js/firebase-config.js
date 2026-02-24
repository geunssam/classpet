/**
 * Firebase 설정 및 초기화 - 브릿지 파일
 * 실제 구현은 ./firebase/ 폴더에 분리되어 있음
 * 기존 import 호환성을 위해 모든 함수를 re-export
 *
 * 계층 구조: /teachers/{uid}/classes/{classId}/students/{studentId}/emotions|praises|pets/...
 */

export * from './shared/firebase/index.js';

// 자동 초기화
import { initializeFirebase } from './shared/firebase/index.js';
initializeFirebase();
