import axios from 'axios';

// 기본 Axios 인스턴스 생성
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 로컬 스토리지 등에 저장된 JWT 토큰을 Header에 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    
    // admin 경로 요청일 경우 토큰 삽입
    if (token && config.url?.startsWith('/admin')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 핸들링 (401 Unauthorized 시 자동 로그아웃)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 401 에러 발생 시 토큰 만료 또는 권한 없음 -> 로그인 페이지 이동 처리
      localStorage.removeItem('access_token');
      // window.location.href = '/admin/login' 같은 하드 리다이렉트나 커스텀 이벤트 처리 가능
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);
