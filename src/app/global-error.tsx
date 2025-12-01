'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import styles from '@/styles/css/error.module.css';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div className={styles.errorContainer}>
          <ExclamationCircleIcon className={styles.icon} />
          <div className={styles.errorCode}>500</div>
          <h1 className={styles.errorTitle}>심각한 오류가 발생했습니다</h1>
          <p className={styles.errorMessage}>
            애플리케이션에서 심각한 오류가 발생했습니다.
            <br />
            페이지를 새로고침하거나 잠시 후 다시 시도해 주시기 바랍니다.
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
      </body>
    </html>
  );
}
