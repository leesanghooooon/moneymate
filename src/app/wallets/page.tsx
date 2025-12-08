'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/api/axios';

// 지갑 타입 정의
interface Wallet {
  wlt_id: string;
  usr_id: string;
  wlt_type: 'CARD' | 'CASH' | 'ACCOUNT' | 'SIMPLE_PAY';
  wlt_name: string;
  bank_cd: string | null;
  card_number: string | null;
  is_default: 'Y' | 'N';
  use_yn: 'Y' | 'N';
  share_yn: 'Y' | 'N';
  created_at: string;
  updated_at: string;
}

// 지갑 유형 한글 변환
const getWltTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    CARD: '카드',
    CASH: '현금',
    ACCOUNT: '계좌',
    SIMPLE_PAY: '간편결제',
  };
  return typeMap[type] || type;
};

export default function WalletsPage() {
  const { data: session, status } = useSession();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useYn, setUseYn] = useState<'Y' | 'N'>('Y');
  
  // 이미 로드된지 확인하기 위한 ref (중복 호출 방지)
  const loadedRef = useRef<string>('');

  // 지갑 목록 조회
  const fetchWallets = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<Wallet[]>('/wallets', {
        params: {
          usr_id: session.user.id,
          use_yn: useYn,
        },
      });

      setWallets(response.data || []);
    } catch (err: any) {
      console.error('지갑 목록 조회 오류:', err);
      setError(err.response?.data?.message || '지갑 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [status, session?.user?.id, useYn]);

  useEffect(() => {
    // 현재 키 생성 (중복 호출 방지)
    const currentKey = `${status}-${session?.user?.id}-${useYn}`;
    
    // 같은 키로 이미 로드했다면 스킵 (React Strict Mode 대응)
    if (loadedRef.current === currentKey) {
      return;
    }
    
    if (status === 'authenticated' && session?.user?.id) {
      loadedRef.current = currentKey;
      fetchWallets();
    }
  }, [status, session?.user?.id, useYn, fetchWallets]);

  // 로딩 중
  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>지갑 목록을 불러오는 중...</p>
      </div>
    );
  }

  // 인증되지 않음
  if (status === 'unauthenticated') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          지갑 관리
        </h1>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          사용자의 지갑 목록을 조회하고 관리할 수 있습니다.
        </p>

        {/* 필터 */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>사용 여부:</span>
            <select
              value={useYn}
              onChange={(e) => setUseYn(e.target.value as 'Y' | 'N')}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem',
              }}
            >
              <option value="Y">사용 중</option>
              <option value="N">미사용</option>
            </select>
          </label>
          <button
            onClick={fetchWallets}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* 지갑 목록 테이블 */}
      {wallets.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          등록된 지갑이 없습니다.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>
                  지갑 이름
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>
                  유형
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>
                  은행/카드사
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>
                  기본 지갑
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>
                  공유 여부
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>
                  등록일
                </th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet) => (
                <tr
                  key={wallet.wlt_id}
                  style={{
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={{ padding: '0.75rem' }}>{wallet.wlt_name}</td>
                  <td style={{ padding: '0.75rem' }}>{getWltTypeName(wallet.wlt_type)}</td>
                  <td style={{ padding: '0.75rem' }}>{wallet.bank_cd || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {wallet.is_default === 'Y' ? (
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                        }}
                      >
                        기본
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {wallet.share_yn === 'Y' ? (
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#28a745',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                        }}
                      >
                        공유
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#666' }}>
                    {new Date(wallet.created_at).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 통계 정보 */}
      {wallets.length > 0 && (
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            총 <strong>{wallets.length}개</strong>의 지갑이 등록되어 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

