type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

// interface ApiError {
//   message: string;
//   status?: number;
//   data?: any;
// }

interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

const API_BASE_URL = '/api'; // Next.js API 라우트 기본 경로

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * API 호출을 위한 공통 함수
 * @param endpoint API 엔드포인트 (예: '/users', '/expenses')
 * @param options API 호출 옵션
 * @returns Promise<ApiResponse<T>>
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    params,
    body,
    requiresAuth = false,
  } = options;

  // URL 파라미터 처리
  const queryString = params
    ? `?${new URLSearchParams(params).toString()}`
    : '';

  // 기본 헤더 설정
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // 인증이 필요한 경우 credentials 옵션 추가
  const fetchOptions: RequestInit = {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : undefined,
    credentials: requiresAuth ? 'include' : 'same-origin'
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}${queryString}`, fetchOptions);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new ApiError(
        data?.message || '서버 오류가 발생했습니다.',
        response.status,
        data
      );
    }

    return {
      data,
      status: response.status,
      headers: response.headers,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
      500
    );
  }
}

/**
 * GET 요청 헬퍼 함수
 */
export function get<T = any>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) {
  return fetchApi<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST 요청 헬퍼 함수
 */
export function post<T = any>(endpoint: string, body?: any, options?: Omit<ApiOptions, 'method'>) {
  return fetchApi<T>(endpoint, { ...options, method: 'POST', body });
}

/**
 * PUT 요청 헬퍼 함수
 */
export function put<T = any>(endpoint: string, body?: any, options?: Omit<ApiOptions, 'method'>) {
  return fetchApi<T>(endpoint, { ...options, method: 'PUT', body });
}

/**
 * DELETE 요청 헬퍼 함수
 */
export function del<T = any>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) {
  return fetchApi<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * PATCH 요청 헬퍼 함수
 */
export function patch<T = any>(endpoint: string, body?: any, options?: Omit<ApiOptions, 'method'>) {
  return fetchApi<T>(endpoint, { ...options, method: 'PATCH', body });
}
