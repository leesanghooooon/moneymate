'use client';

import layoutStyles from '../../styles/css/page.module.css';
import styles from '../../styles/css/expenses.module.css';
import { useEffect, useState } from 'react';
import { getCategories, getPayMethods, getBanks, CommonCode } from '../../lib/api/commonCodes';

export default function ExpensesPage() {
  const [categories, setCategories] = useState<CommonCode[]>([]);
  const [payMethods, setPayMethods] = useState<CommonCode[]>([]);
  const [banks, setBanks] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPayMethod, setSelectedPayMethod] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('');

  const [openWalletModal, setOpenWalletModal] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletForm, setWalletForm] = useState({
    usr_id: '', // TODO: 로그인 연동 시 채우기
    wlt_type: '',
    wlt_name: '',
    bank_cd: '',
    card_number: '',
    is_default: 'N',
  });

  const isCardSelected = (() => {
    const v = (selectedPayMethod || '').toLowerCase();
    return v === 'card' || v === '카드';
  })();

  const isWalletCardSelected = (() => {
    const v = (walletForm.wlt_type || '').toLowerCase();
    return v === 'card' || v === '카드';
  })();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([getCategories(), getPayMethods(), getBanks()])
      .then(([cats, pays, bks]) => {
        if (!mounted) return;
        setCategories(cats);
        setPayMethods(pays);
        setBanks(bks);
        setLoading(false);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || '공통코드 조회 실패');
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!isCardSelected && selectedBank) {
      setSelectedBank('');
    }
  }, [isCardSelected, selectedBank]);

  useEffect(() => {
    if (!isWalletCardSelected && walletForm.bank_cd) {
      setWalletForm({ ...walletForm, bank_cd: '' });
    }
  }, [isWalletCardSelected, walletForm.bank_cd]);

  async function submitWallet() {
    try {
      setSavingWallet(true);
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usr_id: walletForm.usr_id || 'demo-user',
          wlt_type: walletForm.wlt_type,
          wlt_name: walletForm.wlt_name,
          bank_cd: walletForm.bank_cd || null,
          card_number: walletForm.card_number || null,
          is_default: walletForm.is_default || 'N',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOpenWalletModal(false);
      setWalletForm({ usr_id: '', wlt_type: '', wlt_name: '', bank_cd: '', card_number: '', is_default: 'N' });
      alert('지갑이 등록되었습니다.');
    } catch (e: any) {
      alert(e?.message || '지갑 등록 실패');
    } finally {
      setSavingWallet(false);
    }
  }

  return (
    <div className={layoutStyles.dashboard}>
      <main className={layoutStyles.dashboardBody}>
        <div className={styles.expensesPage}>
          <div className="container">
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.headerLeft}>
                  <h1 className={styles.title}>지출 등록</h1>
                  <p className={styles.subtitle}>가계부 스타일로 지출을 빠르게 기록하세요.</p>
                </div>
                <div className={styles.headerRight}>
                  <button className={styles.buttonSecondary} onClick={() => setOpenWalletModal(true)}>+ 지갑 등록</button>
                </div>
              </div>
            </header>

            <section className={styles.formSection}>
              {error && <div style={{ color: '#ef4444', marginBottom: 8 }}>{error}</div>}
              <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>날짜</label>
                    <input type="date" className={styles.input} defaultValue={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>결제수단</label>
                    <select
                      className={styles.select}
                      value={selectedPayMethod}
                      disabled={loading}
                      onChange={(e) => setSelectedPayMethod(e.target.value)}
                    >
                      <option value="" disabled>선택하세요</option>
                      {payMethods.map((m) => (
                        <option key={m.cd} value={m.cd}>{m.cd_nm}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>카드사</label>
                    <select
                      className={styles.select}
                      value={selectedBank}
                      disabled={loading || !isCardSelected}
                      onChange={(e) => setSelectedBank(e.target.value)}
                    >
                      <option value="" disabled>선택하세요</option>
                      {banks.map((b) => (
                        <option key={b.cd} value={b.cd}>{b.cd_nm}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>카테고리</label>
                    <select className={styles.select} defaultValue="" disabled={loading}>
                      <option value="" disabled>선택하세요</option>
                      {categories.map((c) => (
                        <option key={c.cd} value={c.cd}>{c.cd_nm}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>금액</label>
                    <input type="number" className={styles.input} min={0} step={100} placeholder="0" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>가맹점/메모</label>
                    <input type="text" className={styles.input} placeholder="예: 스타벅스, 점심" />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>지출 형태</label>
                    <div className={styles.segmented}>
                      <label className={styles.segmentedItem}>
                        <input type="radio" name="spendingType" defaultChecked />
                        <span>일시불</span>
                      </label>
                      <label className={styles.segmentedItem}>
                        <input type="radio" name="spendingType" />
                        <span>구독</span>
                      </label>
                      <label className={styles.segmentedItem}>
                        <input type="radio" name="spendingType" />
                        <span>할부</span>
                      </label>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>할부 개월수</label>
                    <input type="number" className={styles.input} min={0} max={60} placeholder="0" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>첨부</label>
                    <input type="file" className={styles.input} />
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.buttonPrimary} type="submit" disabled={loading}>등록</button>
                  <button className={styles.buttonGhost} type="reset">초기화</button>
                </div>
              </form>
            </section>

            {openWalletModal && (
              <div className={styles.modalOverlay} role="dialog" aria-modal="true">
                <div className={styles.modalPanel}>
                  <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>지갑 등록</div>
                    <button className={styles.modalClose} onClick={() => setOpenWalletModal(false)}>✕</button>
                  </div>
                  <div className={styles.modalBody}>
                    <div className={styles.modalForm}>
                      <div className={styles.modalRow}>
                        <div className={styles.field}>
                          <label className={styles.label}>지갑 이름</label>
                          <input
                            className={styles.input}
                            value={walletForm.wlt_name}
                            onChange={(e) => setWalletForm({ ...walletForm, wlt_name: e.target.value })}
                            placeholder="예: 국민은행 통장, 현대카드"
                          />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>지갑 유형</label>
                          <select
                            className={styles.select}
                            value={walletForm.wlt_type}
                            disabled={loading}
                            onChange={(e) => setWalletForm({ ...walletForm, wlt_type: e.target.value })}
                          >
                            <option value="" disabled>선택</option>
                            {payMethods.map((m) => (
                              <option key={m.cd} value={m.cd}>{m.cd_nm}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>은행(카드사) 코드</label>
                          <select
                            className={styles.select}
                            value={walletForm.bank_cd}
                            disabled={loading || !isWalletCardSelected}
                            onChange={(e) => setWalletForm({ ...walletForm, bank_cd: e.target.value })}
                          >
                            <option value="">선택 없음</option>
                            {banks.map((b) => (
                              <option key={b.cd} value={b.cd}>{b.cd_nm}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className={styles.modalRow}>
                        <div className={styles.field}>
                          <label className={styles.label}>카드번호</label>
                          <input
                            className={styles.input}
                            value={walletForm.card_number}
                            onChange={(e) => setWalletForm({ ...walletForm, card_number: e.target.value })}
                            placeholder="선택적으로 입력"
                          />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>기본 지갑</label>
                          <select
                            className={styles.select}
                            value={walletForm.is_default}
                            onChange={(e) => setWalletForm({ ...walletForm, is_default: e.target.value })}
                          >
                            <option value="N">N</option>
                            <option value="Y">Y</option>
                          </select>
                        </div>
                        <div className={styles.field}>
                          {/* 빈 공간을 위한 placeholder */}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.modalActions}>
                    <button className={styles.buttonGhost} onClick={() => setOpenWalletModal(false)}>취소</button>
                    <button className={styles.buttonPrimary} onClick={submitWallet} disabled={savingWallet}>
                      {savingWallet ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <section className={styles.listSection}>
              <h2 className={styles.sectionTitle}>오늘의 지출</h2>
              <div className={styles.ledgerList}>
                {[1,2,3].map((i) => (
                  <div key={i} className={styles.ledgerItem}>
                    <div className={styles.ledgerLeft}>
                      <div className={styles.ledgerDate}>2024-09-0{i}</div>
                      <div className={styles.ledgerMerchant}>스타벅스</div>
                    </div>
                    <div className={styles.ledgerRight}>
                      <span className={styles.ledgerCategory}>식비</span>
                      <span className={styles.ledgerAmount}>-5,200원</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
