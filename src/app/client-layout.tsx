'use client';

import HeaderWrapper from "../components/HeaderWrapper";
import { SessionProvider } from "next-auth/react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <HeaderWrapper />
      {children}
    </SessionProvider>
  );
}
