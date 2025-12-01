'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import styles from '@/styles/css/error.module.css';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className={styles.errorContainer}>
      <ExclamationCircleIcon className={styles.icon} />
      <div className={styles.errorCode}>500</div>
      <h1 className={styles.errorTitle}>서버 오류가 발생했습니다</h1>
      <p className={styles.errorMessage}>
        요청을 처리하는 중 예상치 못한 오류가 발생했습니다.
        <br />
        잠시 후 다시 시도해 주시기 바랍니다.
      </p>
      {error.digest && (
        <p className={styles.errorMessage} style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '-1rem' }}>
          오류 ID: {error.digest}
        </p>
      )}
      <div className={styles.buttonGroup}>
        <button onClick={reset} className={styles.primaryButton}>
          다시 시도
        </button>
        <Link href="/" className={styles.secondaryButton}>
          홈으로 이동
        </Link>
      </div>
    </div>
  );
}
