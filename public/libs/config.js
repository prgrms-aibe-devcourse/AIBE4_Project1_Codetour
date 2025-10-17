// 배포 환경에 따라 API_BASE_URL 자동 설정
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : window.location.origin; // 배포 시 현재 도메인 사용
