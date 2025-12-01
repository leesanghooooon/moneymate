'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import styles from '@/styles/css/error.module.css';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className={styles.errorContainer}>
      <ExclamationTriangleIcon className={styles.icon} />
      <div className={styles.errorCode}>404</div>
      <h1 className={styles.errorTitle}>페이지를 찾을 수 없습니다</h1>
      <p className={styles.errorMessage}>
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        <br />
        URL을 확인하시거나 홈으로 돌아가시기 바랍니다.
      </p>
      <div className={styles.buttonGroup}>
        <Link href="/" className={styles.primaryButton}>
          홈으로 이동
        </Link>
        <button
          onClick={() => router.back()}
          className={styles.secondaryButton}
        >
          이전 페이지로
        </button>
      </div>
    </div>
  );
}
