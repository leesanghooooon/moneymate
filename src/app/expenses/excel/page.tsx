'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import { getWallets, Wallet } from '../../../lib/api/commonCodes';
import layoutStyles from '../../../styles/css/page.module.css';
import styles from '../../../styles/css/expenses.module.css';

export default function ExcelRegistrationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // 세션이 있을 때 모든 지갑 목록 조회
  useEffect(() => {
    if (!session?.user?.id) return;

    getWallets(session.user.id)
      .then(walletList => {
        setWallets(walletList);
        setLoading(false);
      })
      .catch(error => {
        console.error('지갑 목록 조회 실패:', error);
        setWallets([]);
        setLoading(false);
      });
  }, [session?.user?.id]);

  // 비로그인 상태에서는 데이터 로딩하지 않음
  if (status === 'unauthenticated') {
    return <LoginRequiredModal />;
  }

  // 로딩 중에는 아무것도 표시하지 않음
  if (status === 'loading') {
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedWallet) {
      alert('파일과 지갑을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('usr_id', session?.user?.id || '');
      formData.append('wlt_id', selectedWallet);

      const response = await fetch('/api/expenses/bulk', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(result.message);
        router.push('/expenses');
      } else {
        alert(result.message || '업로드 실패');
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={layoutStyles.dashboard}>
      <main className={layoutStyles.dashboardBody}>
        <div className={styles.expensesPage}>
          <div className="container">
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.headerLeft}>
                  <h1 className={styles.title}>엑셀간편등록</h1>
                  <p className={styles.subtitle}>엑셀 파일을 업로드하여 여러 거래를 한번에 등록하세요.</p>
                </div>
                <div className={styles.headerRight}>
                  <button className={styles.buttonSecondary} onClick={() => router.back()}>뒤로가기</button>
                </div>
              </div>
            </header>

            <section className={styles.formSection}>
              {/* 1단계: 템플릿 다운로드 */}
              <div className={styles.stepSection}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNumber}>1</span>
                  <h3 className={styles.stepTitle}>템플릿 다운로드</h3>
                </div>
                <div className={styles.stepContent}>
                  <p className={styles.stepDescription}>
                    거래 등록에 필요한 엑셀 템플릿을 다운로드하세요.
                  </p>
                  <button 
                    className={styles.buttonPrimary}
                    onClick={() => window.open('/api/expenses/template', '_blank')}
                  >
                    템플릿 다운로드
                  </button>
                </div>
              </div>

              {/* 2단계: 지갑 선택 */}
              <div className={styles.stepSection}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNumber}>2</span>
                  <h3 className={styles.stepTitle}>지갑 선택</h3>
                </div>
                <div className={styles.stepContent}>
                  <p className={styles.stepDescription}>
                    거래를 등록할 지갑을 선택하세요.
                  </p>
                  
                  {/* 지갑 바로가기 버튼 */}
                  <div className={styles.walletButtons}>
                    {wallets.map((wallet) => (
                      <button
                        key={wallet.wlt_id}
                        className={`${styles.walletButton} ${selectedWallet === wallet.wlt_id ? styles.active : ''}`}
                        onClick={() => setSelectedWallet(wallet.wlt_id)}
                        type="button"
                      >
                        <span className={styles.walletIcon}>
                          {wallet.wlt_type === 'CASH' ? '💵' :
                           wallet.wlt_type === 'CHECK_CARD' ? '💳' :
                           wallet.wlt_type === 'CREDIT_CARD' ? '💳' : '💰'}
                        </span>
                        <span className={styles.walletName}>{wallet.wlt_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3단계: 파일 업로드 */}
              <div className={styles.stepSection}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNumber}>3</span>
                  <h3 className={styles.stepTitle}>엑셀 파일 업로드</h3>
                </div>
                <div className={styles.stepContent}>
                  <p className={styles.stepDescription}>
                    작성한 엑셀 파일을 업로드하세요.
                  </p>
                  
                  <div className={styles.fileUploadArea}>
                    <input 
                      type="file" 
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className={styles.fileInput}
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className={styles.fileUploadLabel}>
                      <div className={styles.fileUploadIcon}>📁</div>
                      <div className={styles.fileUploadText}>
                        {selectedFile ? selectedFile.name : '엑셀 파일을 선택하세요'}
                      </div>
                      <div className={styles.fileUploadSubtext}>
                        .xlsx, .xls 파일만 지원됩니다
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* 업로드 버튼 */}
              <div className={styles.actions}>
                <button 
                  className={styles.buttonPrimary}
                  onClick={handleUpload}
                  disabled={!selectedFile || !selectedWallet || isUploading}
                >
                  {isUploading ? '업로드 중...' : '업로드 시작'}
                </button>
                <button 
                  className={styles.buttonGhost}
                  onClick={() => router.back()}
                >
                  취소
                </button>
              </div>
            </section>

            {/* 사용 방법 및 주의사항 */}
            <section className={styles.infoSection}>
              <div className={styles.infoCard}>
                <h4 className={styles.infoTitle}>사용 방법</h4>
                <ol className={styles.infoList}>
                  <li>템플릿을 다운로드합니다.</li>
                  <li>템플릿에 거래 정보를 입력합니다.</li>
                  <li>지갑을 선택합니다.</li>
                  <li>엑셀 파일을 업로드합니다.</li>
                </ol>
              </div>
              
              <div className={styles.infoCard}>
                <h4 className={styles.infoTitle}>주의사항</h4>
                <ul className={styles.infoList}>
                  <li>파일 형식은 .xlsx 또는 .xls만 지원됩니다.</li>
                  <li>거래유형은 "수입" 또는 "지출"로 입력해주세요.</li>
                  <li>날짜는 YYYY-MM-DD 형식으로 입력해주세요.</li>
                  <li>금액은 숫자만 입력해주세요.</li>
                  <li>카테고리는 템플릿의 드롭다운에서 선택해주세요.</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
