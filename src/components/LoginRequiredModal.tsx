'use client';

import styles from '../styles/css/LoginRequiredModal.module.css';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';

export default function LoginRequiredModal() {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (path: string) => {
    // 현재 경로를 세션 스토리지에 저장
    if (pathname !== '/login' && pathname !== '/signup') {
      sessionStorage.setItem('returnPath', pathname);
    }
    router.push(path);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.logoSection}>
          <Image
            src="/logo.svg"
            alt="MoneyMate Logo"
            width={48}
            height={48}
            priority
          />
        </div>
        <h2 className={styles.title}>로그인이 필요한 서비스입니다</h2>
        <p className={styles.description}>
          MoneyMate의 서비스를 이용하기 위해서는<br />
          로그인이 필요합니다.
        </p>
        <div className={styles.buttonGroup}>
          <button
            className={styles.loginButton}
            onClick={() => handleNavigation('/login')}
          >
            로그인
          </button>
          <button
            className={styles.signupButton}
            onClick={() => handleNavigation('/signup')}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}