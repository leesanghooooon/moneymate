'use client';

import HeaderWrapper from "../components/HeaderWrapper";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "../components/Toast";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ToastProvider>
        <HeaderWrapper />
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}
