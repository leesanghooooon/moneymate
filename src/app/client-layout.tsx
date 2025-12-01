'use client';

import { SessionProvider } from "next-auth/react";
import BackOfficeLayout from "@/components/layout/BackOfficeLayout";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <BackOfficeLayout>
        {children}
      </BackOfficeLayout>
    </SessionProvider>
  );
}
