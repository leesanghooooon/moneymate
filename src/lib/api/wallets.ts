import { get, put } from './common';

export interface Wallet {
  wlt_id: string;
  wlt_name: string;
  wlt_type: string;
  bank_cd: string | null;
  is_default: string;
  share_yn: string;
}

export interface WalletUpdateRequest {
  usr_id: string;
  wlt_type: string;
  wlt_name: string;
  bank_cd?: string | null;
  is_default?: string;
  share_yn?: string;
}

/**
 * 사용자의 지갑 목록 조회
 * @param usr_id 사용자 ID
 * @param wlt_type 지갑 유형 (선택사항)
 * @returns Promise<Wallet[]>
 */
export async function getWallets(usr_id: string, wlt_type?: string): Promise<Wallet[]> {
  const params: Record<string, string> = { usr_id };
  if (wlt_type) {
    params.wlt_type = wlt_type;
  }
  
  const response = await get<{ data: Wallet[] }>('/wallets', { params });
  return response.data.data || [];
}

/**
 * 지갑 정보 수정
 * @param wlt_id 지갑 ID
 * @param data 수정할 지갑 데이터
 * @returns Promise<void>
 */
export async function updateWallet(wlt_id: string, data: WalletUpdateRequest): Promise<void> {
  await put<{ message: string }>(`/wallets/${wlt_id}`, data);
} 