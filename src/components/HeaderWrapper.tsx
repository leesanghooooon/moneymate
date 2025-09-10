'use client';

import { usePathname } from 'next/navigation';
import Header from '../fragments/Header';

export default function HeaderWrapper() {
  const pathname = usePathname();
  
  // 로그인, 회원가입 등 인증 관련 페이지에서는 헤더를 숨김
  const authPages = ['/login', '/signup', '/reset-password'];
  const shouldShowHeader = !authPages.some(page => pathname.startsWith(page));

  if (!shouldShowHeader) {
    return null;
  }

  return <Header />;
}
