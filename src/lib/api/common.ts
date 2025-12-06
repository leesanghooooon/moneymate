/**
 * 공통 API 호출 유틸리티 함수
 * 
 * GET, POST, PUT, PATCH, DELETE 등의 HTTP 메서드를 지원합니다.
 */

// API 기본 URL 설정 (변경 가능하도록 변수로 선언)
// Next.js App Router에서는 /api 경로가 자동으로 라우팅되므로 빈 문자열로 설정
let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// 에러 타입 정의
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 요청 옵션 타입
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
}

// 응답 래퍼 타입
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}

/**
 * 쿼리 파라미터를 URL에 추가
 */
function buildQueryString(params: Record<string, string | number | boolean>): string {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      queryParams.append(key, String(value));
    }
  });
  return queryParams.toString();
}

/**
 * 기본 헤더 생성
 */
function getDefaultHeaders(customHeaders?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  return headers;
}

/**
 * 응답 처리 및 에러 핸들링
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  let data: any;
  try {
    data = isJson ? await response.json() : await response.text();
  } catch (error) {
    throw new ApiError(
      '응답을 파싱할 수 없습니다.',
      response.status
    );
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || `HTTP ${response.status} 에러가 발생했습니다.`;
    throw new ApiError(
      errorMessage,
      response.status,
      data
    );
  }

  // 응답이 { data: ... } 형태로 래핑되어 있으면 data를 반환
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}

/**
 * GET 요청
 * 
 * @param url - API 엔드포인트 (기본 URL 제외)
 * @param options - 요청 옵션
 * @returns Promise<T>
 * 
 * @example
 * const users = await get<User[]>('/users', { params: { page: 1, limit: 10 } });
 */
export async function get<T = any>(
  url: string,
  options?: RequestOptions
): Promise<T> {
  try {
    // URL이 이미 /api로 시작하는지 확인하여 중복 방지
    let baseUrl = API_BASE_URL;
    if (url.startsWith('/api')) {
      baseUrl = '';
    }
    let fullUrl = `${baseUrl}${url}`;

    // 쿼리 파라미터 추가
    if (options?.params) {
      const queryString = buildQueryString(options.params);
      fullUrl += `?${queryString}`;
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: getDefaultHeaders(options?.headers),
      signal: options?.signal,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
      0
    );
  }
}

/**
 * POST 요청
 * 
 * @param url - API 엔드포인트
 * @param data - 요청 본문 데이터
 * @param options - 요청 옵션
 * @returns Promise<T>
 * 
 * @example
 * const newUser = await post<User>('/users', { name: 'John', email: 'john@example.com' });
 */
export async function post<T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  try {
    // URL이 이미 /api로 시작하는지 확인하여 중복 방지
    let baseUrl = API_BASE_URL;
    if (url.startsWith('/api')) {
      baseUrl = '';
    }
    const fullUrl = `${baseUrl}${url}`;

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: getDefaultHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      signal: options?.signal,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
      0
    );
  }
}

/**
 * PUT 요청
 * 
 * @param url - API 엔드포인트
 * @param data - 요청 본문 데이터
 * @param options - 요청 옵션
 * @returns Promise<T>
 * 
 * @example
 * const updatedUser = await put<User>('/users/1', { name: 'Jane' });
 */
export async function put<T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  try {
    // URL이 이미 /api로 시작하는지 확인하여 중복 방지
    let baseUrl = API_BASE_URL;
    if (url.startsWith('/api')) {
      baseUrl = '';
    }
    const fullUrl = `${baseUrl}${url}`;

    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers: getDefaultHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      signal: options?.signal,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
      0
    );
  }
}

/**
 * PATCH 요청
 * 
 * @param url - API 엔드포인트
 * @param data - 요청 본문 데이터
 * @param options - 요청 옵션
 * @returns Promise<T>
 * 
 * @example
 * const patchedUser = await patch<User>('/users/1', { name: 'Jane' });
 */
export async function patch<T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  try {
    // URL이 이미 /api로 시작하는지 확인하여 중복 방지
    let baseUrl = API_BASE_URL;
    if (url.startsWith('/api')) {
      baseUrl = '';
    }
    const fullUrl = `${baseUrl}${url}`;

    const response = await fetch(fullUrl, {
      method: 'PATCH',
      headers: getDefaultHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      signal: options?.signal,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
      0
    );
  }
}

/**
 * DELETE 요청
 * 
 * @param url - API 엔드포인트
 * @param options - 요청 옵션
 * @returns Promise<T>
 * 
 * @example
 * await del('/users/1');
 */
export async function del<T = any>(
  url: string,
  options?: RequestOptions
): Promise<T> {
  try {
    // URL이 이미 /api로 시작하는지 확인하여 중복 방지
    let baseUrl = API_BASE_URL;
    if (url.startsWith('/api')) {
      baseUrl = '';
    }
    const fullUrl = `${baseUrl}${url}`;

    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers: getDefaultHeaders(options?.headers),
      signal: options?.signal,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
      0
    );
  }
}

/**
 * 파일 업로드 요청 (multipart/form-data)
 * 
 * @param url - API 엔드포인트
 * @param formData - FormData 객체
 * @param options - 요청 옵션
 * @returns Promise<T>
 * 
 * @example
 * const formData = new FormData();
 * formData.append('file', file);
 * const result = await upload<{ url: string }>('/upload', formData);
 */
export async function upload<T = any>(
  url: string,
  formData: FormData,
  options?: Omit<RequestOptions, 'headers'>
): Promise<T> {
  try {
    // URL이 이미 /api로 시작하는지 확인하여 중복 방지
    let baseUrl = API_BASE_URL;
    if (url.startsWith('/api')) {
      baseUrl = '';
    }
    const fullUrl = `${baseUrl}${url}`;

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: options?.headers,
      body: formData,
      signal: options?.signal,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
      0
    );
  }
}

/**
 * API 기본 URL 설정 (필요시 동적으로 변경)
 */
export function setApiBaseUrl(url: string): void {
  API_BASE_URL = url;
}

/**
 * API 기본 URL 가져오기
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

