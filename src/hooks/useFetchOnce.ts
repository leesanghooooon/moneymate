import { useEffect, useRef, useState, useCallback } from 'react';

interface UseFetchOnceOptions {
  /**
   * 의존성 배열 - 이 값들이 변경되면 새로운 API 호출을 시도합니다.
   */
  dependencies: Array<string | number | boolean | null | undefined>;
  
  /**
   * API 호출 함수 - Promise를 반환하는 함수
   */
  fetchFn: () => Promise<void>;
  
  /**
   * 호출이 필요한지 여부를 판단하는 조건 (기본: true)
   */
  enabled?: boolean;
  
  /**
   * 중복 호출 방지 시간 (ms, 기본: 1000)
   */
  debounceMs?: number;
  
  /**
   * 로딩 상태를 관리할지 여부 (기본: false)
   */
  manageLoading?: boolean;
  
  /**
   * 디버그 로그를 출력할지 여부 (기본: false)
   */
  debug?: boolean;
}

/**
 * API 호출 중복 방지 커스텀 훅
 * 
 * @example
 * ```tsx
 * const { loading } = useFetchOnce({
 *   dependencies: [userId, year, month],
 *   fetchFn: async () => {
 *     const data = await fetchData();
 *     setData(data);
 *   },
 *   manageLoading: true,
 *   debug: true
 * });
 * ```
 */
export function useFetchOnce({
  dependencies,
  fetchFn,
  enabled = true,
  debounceMs = 1000,
  manageLoading = false,
  debug = false,
}: UseFetchOnceOptions) {
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const lastFetchKeyRef = useRef<string>('');
  const completedKeysRef = useRef<Set<string>>(new Set());
  const fetchFnRef = useRef(fetchFn);
  const [loading, setLoading] = useState(false);
  
  // 항상 최신 fetchFn을 참조하도록 업데이트
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  // 의존성 배열로부터 고유 키 생성
  const dependencyKey = dependencies
    .map((dep) => {
      if (dep === null || dep === undefined) return 'null';
      if (typeof dep === 'boolean') return dep ? 'true' : 'false';
      return String(dep);
    })
    .join('-');

  const log = useCallback(
    (message: string, ...args: any[]) => {
      if (debug) {
        console.log(`[useFetchOnce] ${message}`, ...args);
      }
    },
    [debug]
  );

  useEffect(() => {
    if (!enabled) {
      log('호출 비활성화됨');
      return;
    }

    // 이미 호출 중이거나 최근에 완료된 키면 스킵
    if (isFetchingRef.current && lastFetchKeyRef.current === dependencyKey) {
      log('중복 호출 방지 (호출 중):', dependencyKey);
      return;
    }

    // 최근에 완료된 키면 스킵 (StrictMode 대응)
    if (completedKeysRef.current.has(dependencyKey)) {
      log('중복 호출 방지 (최근 완료):', dependencyKey);
      // 짧은 시간 후 완료된 키 목록에서 제거 (StrictMode 재마운트 대응)
      const timeoutId = setTimeout(() => {
        completedKeysRef.current.delete(dependencyKey);
      }, 100);
      return () => clearTimeout(timeoutId);
    }

    isMountedRef.current = true;
    lastFetchKeyRef.current = dependencyKey;
    isFetchingRef.current = true;

    if (manageLoading) {
      setLoading(true);
    }

    log('API 호출 시작:', dependencyKey);

    // API 호출 실행 (항상 최신 함수 사용)
    fetchFnRef.current()
      .then(() => {
        isFetchingRef.current = false;
        // 완료된 키로 표시
        completedKeysRef.current.add(dependencyKey);

        if (manageLoading && isMountedRef.current) {
          setLoading(false);
        }

        log('API 호출 완료:', dependencyKey);

        // 지정된 시간 후 완료된 키 목록에서 제거 (메모리 누수 방지)
        setTimeout(() => {
          completedKeysRef.current.delete(dependencyKey);
        }, debounceMs);
      })
      .catch((error) => {
        isFetchingRef.current = false;
        if (manageLoading && isMountedRef.current) {
          setLoading(false);
        }
        log('API 호출 실패:', dependencyKey, error);
        // 실패한 경우에도 키 제거 (재시도 가능하도록)
        setTimeout(() => {
          completedKeysRef.current.delete(dependencyKey);
        }, debounceMs);
      });

    return () => {
      // cleanup 시에는 상태 유지 (StrictMode 재마운트 대응)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencyKey, enabled, manageLoading, debounceMs, debug]);

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    loading: manageLoading ? loading : false,
    isFetching: isFetchingRef.current,
  };
}

