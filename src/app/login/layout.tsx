export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 로그인 페이지는 레이아웃 없이 렌더링
  return <>{children}</>;
}

