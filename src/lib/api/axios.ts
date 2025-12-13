/**
 * 공통 Axios 인스턴스
 * 
 * API 호출 시 사용하는 공통 axios 인스턴스입니다.
 * 기본 설정 및 인터셉터가 포함되어 있습니다.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Axios 인스턴스 생성
// 환경 변수에서 API base URL을 가져오거나 기본값으로 '/api' 사용
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL, // Next.js App Router에서는 /api 경로가 자동으로 라우팅됨
  timeout: 30000, // 30초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // 요청 전 처리 (인증 토큰 추가 등)
    // 예: const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error: AxiosError) => {
    // 요청 에러 처리
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 응답 성공 처리
    // API 응답이 { data: ... } 형태로 래핑되어 있으면 data를 반환
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  (error: AxiosError) => {
    // 응답 에러 처리
    if (error.response) {
      // 서버에서 응답이 왔지만 에러 상태 코드
      const status = error.response.status;
      const message = (error.response.data as any)?.message || `HTTP ${status} 에러가 발생했습니다.`;

      console.error('API Error:', {
        status,
        message,
        url: error.config?.url,
        method: error.config?.method,
        fullUrl: error.config?.baseURL + error.config?.url,
      });

      // 401 Unauthorized 처리 예시
      if (status === 401) {
        // 로그인 페이지로 리다이렉트 등 처리
        // window.location.href = '/login';
      }
    } else if (error.request) {
      // 요청이 전송되었지만 응답을 받지 못함 (네트워크 에러, 타임아웃 등)
      const errorMessage = error.code === 'ECONNABORTED' 
        ? '요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.'
        : error.message || '네트워크 오류가 발생했습니다. 서버에 연결할 수 없습니다.';
      
      console.error('Network Error:', {
        message: errorMessage,
        code: error.code,
        url: error.config?.url,
        method: error.config?.method,
        fullUrl: error.config?.baseURL + error.config?.url,
      });

      // 네트워크 에러를 더 명확하게 전달하기 위해 에러 객체 수정
      const networkError = new Error(errorMessage) as any;
      networkError.isNetworkError = true;
      networkError.code = error.code;
      networkError.config = error.config;
      return Promise.reject(networkError);
    } else {
      // 요청 설정 중 에러 발생
      console.error('Request Setup Error:', {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * API 응답 타입
 */
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}

/**
 * API 에러 타입
 */
export interface ApiError {
  message: string;
  status: number;
  data?: any;
}

