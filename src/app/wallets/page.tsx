'use client';

import { useEffect, useState } from 'react';
import layoutStyles from '../../styles/css/page.module.css';
import styles from '../../styles/css/wallets.module.css';
import { getPayMethods, getBanks, getCards, getWallets, CommonCode, Wallet } from '../../lib/api/commonCodes';
import { post, put, del, ApiError } from '../../lib/api/common';
import { useSession } from 'next-auth/react';
import LoginRequiredModal from '@/components/LoginRequiredModal';

export default function WalletsPage() {
  const { data: session, status } = useSession();
  const [payMethods, setPayMethods] = useState<CommonCode[]>([]);
  const [banks, setBanks] = useState<CommonCode[]>([]);
  const [cards, setCards] = useState<CommonCode[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openWalletModal, setOpenWalletModal] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [walletForm, setWalletForm] = useState({
    usr_id: session?.user?.id || '',
    wlt_type: '',
    wlt_name: '',
    bank_cd: '',
    is_default: 'N',
  });

  const getWalletCardType = (() => {
    const v = walletForm.wlt_type;
    if (v === 'CHECK_CARD') return 'check';
    if (v === 'CREDIT_CARD') return 'credit';
    return null;
  })();

  const isWalletCardSelected = getWalletCardType !== null;

  useEffect(() => {
    // 비로그인 상태나 로딩 중에는 데이터를 불러오지 않음
    if (status === 'unauthenticated' || status === 'loading') {
      return;
    }

    let mounted = true;
    setLoading(true);

    // 공통 코드와 지갑 목록을 함께 조회
    Promise.all([
      getPayMethods(),
      getBanks(),
      getCards(),
      getWallets(session?.user?.id || '')
    ])
      .then(([pays, bks, crds, wlts]) => {
        if (!mounted) return;
        setPayMethods(pays);
        setBanks(bks);
        setCards(crds);
        setWallets(wlts);
        setLoading(false);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || '데이터 조회 실패');
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!isWalletCardSelected && walletForm.bank_cd) {
      setWalletForm({ ...walletForm, bank_cd: '' });
    }
  }, [isWalletCardSelected, walletForm.bank_cd]);

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setWalletForm({
      usr_id: session?.user?.id || '',
      wlt_type: wallet.wlt_type,
      wlt_name: wallet.wlt_name,
      bank_cd: wallet.bank_cd || '',
      is_default: wallet.is_default,
    });
    setOpenWalletModal(true);
  };

  const handleDeleteWallet = async (walletId: string) => {
    if (!confirm('정말 이 지갑을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await del(`/wallets/${walletId}`, { requiresAuth: true });

      // 지갑 목록 다시 조회
      const updatedWallets = await getWallets(session?.user?.id || '');
      setWallets(updatedWallets);
      alert('지갑이 삭제되었습니다.');
    } catch (error) {
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert('지갑 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleSubmitWallet = async () => {
    try {
      setSavingWallet(true);
      const data = {
        usr_id: walletForm.usr_id,
        wlt_type: walletForm.wlt_type,
        wlt_name: walletForm.wlt_name,
        bank_cd: walletForm.bank_cd || null,
        is_default: walletForm.is_default || 'N',
      };

      if (editingWallet) {
        await put(`/wallets/${editingWallet.wlt_id}`, data, { requiresAuth: true });
      } else {
        await post('/wallets', data, { requiresAuth: true });
      }

      setOpenWalletModal(false);
      setEditingWallet(null);
      setWalletForm({
        usr_id: session?.user?.id || '',
        wlt_type: '',
        wlt_name: '',
        bank_cd: '',
        is_default: 'N'
      });

      // 지갑 목록 다시 조회
      const updatedWallets = await getWallets(session?.user?.id || '');
      setWallets(updatedWallets);
      alert(editingWallet ? '지갑이 수정되었습니다.' : '지갑이 등록되었습니다.');
    } catch (error) {
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert('지갑 저장 중 오류가 발생했습니다.');
      }
    } finally {
      setSavingWallet(false);
    }
  };

  const getWalletTypeName = (type: string) => {
    const method = payMethods.find(m => m.cd === type);
    return method?.cd_nm || type;
  };

  const getBankName = (code: string | null, wlt_type: string | null) => {
    if (!code) return '';
    const bank = banks.find(b => b.cd === code);
    const card = cards.find(c => c.cd === code);
    return wlt_type === 'CHECK_CARD' ? bank?.cd_nm : wlt_type === 'CREDIT_CARD' ? card?.cd_nm : code;
  };

  // 비로그인 상태에서는 데이터 로딩하지 않음
  if (status === 'unauthenticated') {
    return <LoginRequiredModal />;
  }

  // 로딩 중에는 아무것도 표시하지 않음
  if (status === 'loading') {
    return null;
  }

  return (
    <div className={layoutStyles.dashboard}>
      <main className={layoutStyles.dashboardBody}>
        <div className={styles.walletsPage}>
          <div className="container">
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.headerLeft}>
                  <h1 className={styles.title}>지갑 관리</h1>
                  <p className={styles.subtitle}>지갑을 등록하고 관리하세요.</p>
                </div>
                <div className={styles.headerRight}>
                  <button 
                    className={styles.buttonPrimary} 
                    onClick={() => {
                      setEditingWallet(null);
                      setWalletForm({
                        usr_id: session?.user?.id || '',
                        wlt_type: '',
                        wlt_name: '',
                        bank_cd: '',
                        is_default: 'N'
                      });
                      setOpenWalletModal(true);
                    }}
                  >
                    + 새 지갑 등록
                  </button>
                </div>
              </div>
            </header>

            <section className={styles.walletsSection}>
              {error && <div className={styles.error}>{error}</div>}
              
              {loading ? (
                <div className={styles.loading}>지갑 정보를 불러오는 중...</div>
              ) : wallets.length === 0 ? (
                <div className={styles.empty}>
                  <p>등록된 지갑이 없습니다.</p>
                  <button 
                    className={styles.buttonSecondary}
                    onClick={() => {
                      setEditingWallet(null);
                      setOpenWalletModal(true);
                    }}
                  >
                    지갑 등록하기
                  </button>
                </div>
              ) : (
                <div className={styles.walletGrid}>
                  {wallets.map((wallet) => (
                    <div key={wallet.wlt_id} className={styles.walletCard}>
                      <div className={styles.walletHeader}>
                        <h3 className={styles.walletName}>{wallet.wlt_name}</h3>
                        {wallet.is_default === 'Y' && (
                          <span className={styles.defaultBadge}>기본</span>
                        )}
                      </div>
                      <div className={styles.walletBody}>
                        <div className={styles.walletInfo}>
                          <span className={styles.walletLabel}>유형</span>
                          <span className={styles.walletValue}>{getWalletTypeName(wallet.wlt_type)}</span>
                        </div>
                        {wallet.bank_cd && (
                          <div className={styles.walletInfo}>
                            <span className={styles.walletLabel}>
                              {wallet.wlt_type === 'CHECK_CARD' ? '은행' : 
                               wallet.wlt_type === 'CREDIT_CARD' ? '카드사' : 
                               '은행/카드사'}
                            </span>
                            <span className={styles.walletValue}>
                              {getBankName(wallet.bank_cd, wallet.wlt_type)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={styles.walletActions}>
                        <button 
                          className={styles.buttonGhost}
                          onClick={() => handleEditWallet(wallet)}
                        >
                          수정
                        </button>
                        <button 
                          className={styles.buttonDanger}
                          onClick={() => handleDeleteWallet(wallet.wlt_id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {openWalletModal && (
              <div className={styles.modalOverlay} role="dialog" aria-modal="true">
                <div className={styles.modalPanel}>
                  <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>
                      {editingWallet ? '지갑 수정' : '새 지갑 등록'}
                    </div>
                    <button 
                      className={styles.modalClose} 
                      onClick={() => {
                        setOpenWalletModal(false);
                        setEditingWallet(null);
                      }}
                    >
                      ✕
                    </button>
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
                          <label className={styles.label}>
                            {getWalletCardType === 'check' ? '은행 코드' : 
                             getWalletCardType === 'credit' ? '카드사 코드' : 
                             '은행/카드사 코드'}
                          </label>
                          <select
                            className={styles.select}
                            value={walletForm.bank_cd}
                            disabled={loading || !isWalletCardSelected}
                            onChange={(e) => setWalletForm({ ...walletForm, bank_cd: e.target.value })}
                          >
                            <option value="">선택 없음</option>
                            {getWalletCardType === 'check' && banks.map((b) => (
                              <option key={b.cd} value={b.cd}>{b.cd_nm}</option>
                            ))}
                            {getWalletCardType === 'credit' && cards.map((c) => (
                              <option key={c.cd} value={c.cd}>{c.cd_nm}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>기본 지갑</label>
                          <select
                            className={styles.select}
                            value={walletForm.is_default}
                            onChange={(e) => setWalletForm({ ...walletForm, is_default: e.target.value })}
                          >
                            <option value="N">아니오</option>
                            <option value="Y">예</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.modalActions}>
                    <button 
                      className={styles.buttonGhost} 
                      onClick={() => {
                        setOpenWalletModal(false);
                        setEditingWallet(null);
                      }}
                    >
                      취소
                    </button>
                    <button 
                      className={styles.buttonPrimary} 
                      onClick={handleSubmitWallet} 
                      disabled={savingWallet}
                    >
                      {savingWallet ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}