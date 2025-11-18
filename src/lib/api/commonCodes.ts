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

export async function getIncome(): Promise<CommonCode[]> {
  return getCommonCodes('INCOME');
}

export interface Wallet {
  wlt_id: string;
  wlt_name: string;
  wlt_type: string;
  bank_cd: string | null;
  is_default: string;
  share_yn?: string;
  usr_id?: string;
  role?: 'OWNER' | 'PARTNER'; // include_shared=true일 때 포함
}

/**
 * 지갑 목록을 조회하는 API
 * @param usr_id 사용자 ID
 * @param wlt_type 지갑 유형 (CASH, CHECK_CARD, CREDIT_CARD) - 선택사항
 * @param include_shared 공유 지갑 포함 여부 (true/Y: 포함, false/N: 미포함) - 선택사항
 * @returns Promise<Wallet[]> 지갑 목록
 */
export async function getWallets(
  usr_id: string,
  wlt_type?: string,
  include_shared?: boolean | string
): Promise<Wallet[]> {
  const params: Record<string, string> = { usr_id };
  if (wlt_type) {
    params.wlt_type = wlt_type;
  }
  if (include_shared !== undefined) {
    params.include_shared = typeof include_shared === 'boolean' 
      ? (include_shared ? 'true' : 'false')
      : include_shared;
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

/**
 * 지출 주기 코드 정보를 조회하는 API
 * @returns Promise<CommonCode[]> 카드사 코드 목록
 */
export async function getSavCycle(): Promise<CommonCode[]> {
  return getCommonCodes('SAV_CYCLE');
}

/**
 * 저축 목표 코드 정보를 조회하는 API
 * @returns Promise<CommonCode[]> 카드사 코드 목록
 */
export async function getGoalType(): Promise<CommonCode[]> {
  return getCommonCodes('GOAL_TYPE');
}

/**
 * 저축 목적 코드 정보를 조회하는 API
 * @returns Promise<CommonCode[]> 카드사 코드 목록
 */
export async function getTrxType(): Promise<CommonCode[]> {
  return getCommonCodes('TRX_TYPE');
}
/**
 * 저축 목표 타입 코드의 한글명을 조회하는 API
 * @param code 저축 목표 타입 코드 (예: 'SAVINGS', 'INVESTMENT' 등)
 * @returns Promise<string> 해당 코드의 한글명, 찾지 못하면 코드 자체를 반환
 */
export async function getGoalTypeName(code: string): Promise<string> {
  try {
    const goalTypes = await getGoalType();
    const foundType = goalTypes.find(type => type.cd === code);
    return foundType ? foundType.cd_nm : code;
  } catch (error) {
    console.error('목표 타입명 조회 오류:', error);
    return code; // 오류 발생 시 코드 자체를 반환
  }
}
