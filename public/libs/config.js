// 배포 환경에 따라 API_BASE_URL 자동 설정
const isLocal = window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.startsWith('192.168.');

// Render 배포 도메인
const PRODUCTION_URL = 'https://aibe4-project1-codetour.onrender.com';

const API_BASE_URL = isLocal
  ? 'http://localhost:3000'
  : PRODUCTION_URL;

console.log('[Config] API_BASE_URL:', API_BASE_URL, '| hostname:', window.location.hostname);
