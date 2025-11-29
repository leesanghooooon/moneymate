'use client';

import HeaderWrapper from "../components/HeaderWrapper";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "../components/Toast";
import { CommonCodesProvider } from "../contexts/CommonCodesContext";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <CommonCodesProvider>
        <ToastProvider>
          <HeaderWrapper />
          {children}
        </ToastProvider>
      </CommonCodesProvider>
    </SessionProvider>
  );
}
