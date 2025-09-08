export interface Database {
  MMT_WLT_MST: WalletTable;
  MMT_CMM_CD_MST: CommonCodeTable;
  MMT_TRX_TRN: TransactionTable;
}

export interface TransactionTable {
  trx_id: string;
  usr_id: string;
  wlt_id: string;
  trx_type: string;
  trx_date: Date;
  amount: number;
  category_cd: string;
  memo: string | null;
  is_fixed: string;
  is_installment: string;
  installment_months: number | null;
  installment_seq: number | null;
  installment_group_id: string | null;
  use_yn: string;
  created_at: Date;
  updated_at: Date;
}

export interface WalletTable {
  wlt_id: string;
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