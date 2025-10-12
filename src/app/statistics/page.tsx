'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getWallets, Wallet } from '@/lib/api/wallets';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import WalletTransactionModal from '@/components/WalletTransactionModal';
import WalletStatsCard from '../components/WalletStatsCard';
import { ChevronRightIcon, EyeIcon } from '@heroicons/react/24/outline';
import styles from '../../styles/css/statistics.module.css';

export default function Statistics() {
  const { data: session, status } = useSession();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {

    // 비로그인 상태나 로딩 중에는 데이터를 불러오지 않음
    if (status === 'unauthenticated' || status === 'loading') {
      return;
    }

    const fetchWallets = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        const walletData = await getWallets(session.user.id);
        setWallets(walletData);
      } catch (err) {
        console.error('지갑 조회 실패:', err);
        setError('지갑 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchWallets();
  }, [session?.user?.id]);

  // 비로그인 상태에서는 로그인 유도 모달 표시
  if (status === 'unauthenticated') {
    return <LoginRequiredModal />;
  }
  // 로딩 중에는 아무것도 표시하지 않음
  if (status === 'loading') {
    return null;
  }

  const getWalletTypeLabel = (type: string) => {
    switch (type) {
      case 'CASH':
        return '현금';
      case 'BANK':
        return '은행';
      case 'CARD':
        return '카드';
      case 'INVESTMENT':
        return '투자';
      default:
        return type;
    }
  };

  const getWalletTypeColor = (type: string) => {
    switch (type) {
      case 'CASH':
        return '#10B981'; // green
      case 'BANK':
        return '#3B82F6'; // blue
      case 'CARD':
        return '#F59E0B'; // yellow
      case 'INVESTMENT':
        return '#8B5CF6'; // purple
      default:
        return '#6B7280'; // gray
    }
  };

  const handleWalletClick = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedWallet(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>지갑 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>통계</h1>
        <p className={styles.subtitle}>등록한 지출과 수익을 한눈에 확인하세요</p>
      </div>

      <div className={styles.walletSection}>
        <h2 className={styles.sectionTitle}>내 지갑</h2>
        <div className={styles.walletGrid}>
          {wallets.length > 0 ? (
            wallets.map((wallet) => (
              <div 
                key={wallet.wlt_id} 
                className={styles.walletCard}
                onClick={() => handleWalletClick(wallet)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.walletHeader}>
                  <div 
                    className={styles.walletTypeBadge}
                    style={{ backgroundColor: getWalletTypeColor(wallet.wlt_type) }}
                  >
                    {getWalletTypeLabel(wallet.wlt_type)}
                  </div>
                  {wallet.is_default === 'Y' && (
                    <span className={styles.defaultBadge}>기본</span>
                  )}
                </div>
                <div className={styles.walletInfo}>
                  <h3 className={styles.walletName}>{wallet.wlt_name}</h3>
                  <div className={styles.walletBadges}>
                    {wallet.share_yn === 'Y' && (
                      <span className={styles.shareBadge}>공유</span>
                    )}
                    <div className={styles.clickIndicator}>
                      <EyeIcon className={styles.viewIcon} />
                      <ChevronRightIcon className={styles.chevronIcon} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>등록된 지갑이 없습니다.</p>
              <p>지갑을 먼저 등록해주세요.</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.statsSection}>
        <WalletStatsCard />
      </div>

      {/* 지갑 거래 내역 모달 */}
      <WalletTransactionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        wallet={selectedWallet}
        userId={session?.user?.id || ''}
      />
    </div>
  );
}
