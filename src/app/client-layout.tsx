'use client';

import { SessionProvider } from "next-auth/react";
import BackOfficeLayout from "@/components/layout/BackOfficeLayout";
import { CommonCodeProvider } from "@/contexts/CommonCodeContext";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider 
      refetchInterval={0} 
      refetchOnWindowFocus={false}
    >
      <CommonCodeProvider>
        <BackOfficeLayout>
          {children}
        </BackOfficeLayout>
      </CommonCodeProvider>
    </SessionProvider>
  );
}
