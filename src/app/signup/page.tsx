'use client';

import { useState } from 'react';
import styles from '../../styles/css/login.module.css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface SignupForm {
  id: string;
  email: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupForm>({
    id: '',
    email: '',
    nickname: '',
    password: '',
    passwordConfirm: ''
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null); // 입력 시 에러 메시지 초기화
  };

  const validateForm = (): boolean => {
    // ID 검증
    if (!/^[a-zA-Z0-9]{4,20}$/.test(formData.id)) {
      setError('ID는 영문과 숫자만 사용하여 4~20자로 입력해주세요.');
      return false;
    }

    // 이메일 검증
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('유효한 이메일 주소를 입력해주세요.');
      return false;
    }

    // 닉네임 검증
    if (formData.nickname.length < 2 || formData.nickname.length > 50) {
      setError('닉네임은 2자 이상 50자 이하여야 합니다.');
      return false;
    }

    // 비밀번호 검증
    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return false;
    }

    // 비밀번호 확인 검증
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: formData.id,
          email: formData.email,
          nickname: formData.nickname,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '회원가입 중 오류가 발생했습니다.');
      }

      // 회원가입 성공
      alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      // 원래 경로는 유지한 채 로그인 페이지로 이동
      router.push('/login');

    } catch (error: any) {
      setError(error.message || '회원가입 중 오류가 발생했습니다.');
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

        <h1 className={styles.title}>MoneyMate 회원가입</h1>
        <p className={styles.subtitle}>똑똑한 자산 관리의 시작, MoneyMate와 함께하세요</p>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="id">아이디</label>
            <input
              type="text"
              id="id"
              name="id"
              value={formData.id}
              onChange={handleChange}
              placeholder="영문, 숫자 4-20자"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="nickname">닉네임</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="2-50자 사이로 입력"
              required
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
              placeholder="8자 이상 입력"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="passwordConfirm">비밀번호 확인</label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              placeholder="비밀번호를 한번 더 입력"
              required
            />
          </div>

          <button type="submit" className={styles.loginButton}>
            회원가입
          </button>
        </form>

        <div className={styles.signupPrompt}>
          <span>이미 계정이 있으신가요? </span>
          <a href="/login">로그인</a>
        </div>
      </div>
    </div>
  );
}
