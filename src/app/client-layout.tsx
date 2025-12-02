'use client';

import { SessionProvider } from "next-auth/react";
import BackOfficeLayout from "@/components/layout/BackOfficeLayout";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <BackOfficeLayout>
        {children}
      </BackOfficeLayout>
    </SessionProvider>
  );
}
