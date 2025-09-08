export type CommonCode = {
  grp_cd: string;
  cd: string;
  cd_nm: string;
  cd_desc?: string | null;
  sort_order?: number;
  use_yn?: 'Y' | 'N';
  created_at?: string;
  updated_at?: string;
};

import { get } from './common';

export async function getCommonCodes(groupCode: string, useYn: 'Y' | 'N' = 'Y'): Promise<CommonCode[]> {
  const response = await get<{ data: CommonCode[] }>('/common-codes', {
    params: {
      grp_cd: groupCode,
      use_yn: useYn
    }
  });
  return response.data.data || [];
}

export async function getCategories(): Promise<CommonCode[]> {
  return getCommonCodes('CATEGORY');
}

export async function getPayMethods(): Promise<CommonCode[]> {
  return getCommonCodes('PAY_METHOD');
}

export async function getBanks(): Promise<CommonCode[]> {
  return getCommonCodes('BANK');
}

export interface Wallet {
  wlt_id: string;
  wlt_name: string;
  wlt_type: string;
  bank_cd: string | null;
  is_default: string;
}

export async function getWallets(usr_id: string, wlt_type?: string): Promise<Wallet[]> {
  const params: Record<string, string> = { usr_id };
  if (wlt_type) {
    params.wlt_type = wlt_type;
  }
  const response = await get<{ data: Wallet[] }>('/wallets', { params });
  return response.data.data;
}

/**
 * 카드사 정보를 조회하는 API
 * @returns Promise<CommonCode[]> 카드사 코드 목록
 */
export async function getCards(): Promise<CommonCode[]> {
  return getCommonCodes('CARD');
} 