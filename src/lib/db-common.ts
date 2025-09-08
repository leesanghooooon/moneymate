export interface Database {
  MMT_WLT_MST: WalletTable;
  MMT_CMM_CD_MST: CommonCodeTable;
}

export interface WalletTable {
  wlt_id: number;
  usr_id: string;
  wlt_type: string;
  wlt_name: string;
  bank_cd: string | null;
  is_default: string;
  use_yn: string;
  created_at: Date;
  updated_at: Date;
}

export interface CommonCodeTable {
  grp_cd: string;
  cd: string;
  cd_nm: string;
  cd_desc: string | null;
  sort_order: number;
  use_yn: string;
  created_at: Date;
  updated_at: Date;
}

export interface Database {
  MMT_WLT_MST: WalletTable;
  MMT_CMM_CD_MST: CommonCodeTable;
}

export interface WalletTable {
  wlt_id: number;
  usr_id: string;
  wlt_type: string;
  wlt_name: string;
  bank_cd: string | null;
  is_default: string;
  use_yn: string;
  created_at: Date;
  updated_at: Date;
}

export interface CommonCodeTable {
  grp_cd: string;
  cd: string;
  cd_nm: string;
  cd_desc: string | null;
  sort_order: number;
  use_yn: string;
  created_at: Date;
  updated_at: Date;
}