'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import ExcelUploadModal from '@/components/ExcelUploadModal';
import { getWallets, Wallet } from '../../../lib/api/commonCodes';
import layoutStyles from '../../../styles/css/page.module.css';
import styles from '../../../styles/css/expenses.module.css';

export default function ExcelRegistrationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

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

  const handleDrop = (e: React.DragEvent<HTMLLabelElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const dt = e.dataTransfer;
    if (!dt) return;

    const file = dt.files && dt.files[0] ? dt.files[0] : null;
    if (!file) return;

    const name = file.name.toLowerCase();
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
    if (!isExcel) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleUploadStart = () => {
    if (!selectedFile || !selectedWallet) {
      alert('파일과 지갑을 선택해주세요.');
      return;
    }
    setShowUploadModal(true);
  };

  const handleUploadComplete = (result: { success: number; failed: number; errors: any[] }) => {
    setShowUploadModal(false);
    
    if (result.failed === 0) {
      alert(`모든 거래가 성공적으로 등록되었습니다! (총 ${result.success}건)`);
    } else {
      alert(`처리 완료: 성공 ${result.success}건, 실패 ${result.failed}건`);
    }
    
    // 거래등록 페이지로 이동
    // router.push('/expenses');
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
                    작성한 엑셀 파일을 업로드하세요. 파일을 선택하거나, 아래 영역에 드래그 앤 드롭 하세요.
                  </p>
                  
                  <div className={styles.fileUploadArea}>
                    <input 
                      type="file" 
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className={styles.fileInput}
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`${styles.fileUploadLabel} ${isDragActive ? styles.dragActive : ''}`}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className={styles.fileUploadIcon}>📁</div>
                      <div className={styles.fileUploadText}>
                        {selectedFile ? selectedFile.name : '엑셀 파일을 선택하거나 드래그 앤 드롭 하세요'}
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
                  onClick={handleUploadStart}
                  disabled={!selectedFile || !selectedWallet}
                >
                  업로드 시작
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

      {/* 엑셀 업로드 모달 */}
      {showUploadModal && selectedFile && (
        <ExcelUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          file={selectedFile}
          usr_id={session?.user?.id || ''}
          wlt_id={selectedWallet}
          onComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}
