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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function getCommonCodes(groupCode: string, useYn: 'Y' | 'N' = 'Y'): Promise<CommonCode[]> {
  const data = await fetchJson<{ data: CommonCode[] }>(`/api/common-codes?grp_cd=${encodeURIComponent(groupCode)}&use_yn=${useYn}`);
  return data.data || [];
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