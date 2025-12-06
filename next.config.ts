import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    output: "standalone",
    eslint: { ignoreDuringBuilds: true },     // 빌드 때 ESLint 에러 무시
    typescript: { ignoreBuildErrors: true },  // 빌드 때 TS 에러 무시
    reactStrictMode: true,
    // 필요 시 basePath/assetPrefix 등 추가
};

export default nextConfig;
