'use client';

import { useState } from 'react';
import styles from '../../styles/css/login.module.css';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        id: formData.userId,
        password: formData.password,
        redirect: false
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      // 저장된 경로가 있으면 해당 경로로, 없으면 홈으로 이동
      const returnPath = sessionStorage.getItem('returnPath') || '/';
      sessionStorage.removeItem('returnPath'); // 사용 후 삭제
      router.push(returnPath);
      router.refresh(); // 헤더 상태 업데이트를 위해 새로고침

    } catch (error: any) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.logoSection}>
          <Image
            src="/logo.svg"
            alt="MoneyMate Logo"
            width={48}
            height={48}
            priority
          />
        </div>

        <h1 className={styles.title}>MoneyMate에 오신 것을 환영합니다</h1>
        <p className={styles.subtitle}>똑똑한 자산 관리의 시작, MoneyMate와 함께하세요</p>

        <div className={styles.snsSection}>
          <h2 className={styles.sectionTitle}>SNS 로그인</h2>
          <div className={styles.snsButtons}>
            <button className={`${styles.snsButton} ${styles.github}`} disabled>
              <Image src="/github.svg" alt="GitHub" width={24} height={24} />
            </button>
            <button className={`${styles.snsButton} ${styles.google}`} disabled>
              <Image src="/google.svg" alt="Google" width={24} height={24} />
            </button>
            <button className={`${styles.snsButton} ${styles.facebook}`} disabled>
              <Image src="/facebook.svg" alt="Facebook" width={24} height={24} />
            </button>
            <button className={`${styles.snsButton} ${styles.naver}`} disabled>
              <Image src="/naver.svg" alt="Naver" width={24} height={24} />
            </button>
            <button className={`${styles.snsButton} ${styles.kakao}`} disabled>
              <Image src="/kakao.svg" alt="Kakao" width={24} height={24} />
            </button>
          </div>
        </div>

        <div className={styles.divider}>
          <span>MoneyMate 아이디로 로그인</span>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="userId">아이디</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              required
              disabled={isLoading}
            />
            <div className={styles.forgotPassword}>
              <a href="/reset-password">비밀번호 재설정</a>
            </div>
          </div>

          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className={styles.signupPrompt}>
          <span>아직 회원이 아니신가요? </span>
          <a href="/signup">회원가입</a>
        </div>
      </div>
    </div>
  );
}