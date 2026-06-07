import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
const repo = 'aeons-end-randomizer';
const basePath = isProd ? `/${repo}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  assetPrefix: isProd ? `/${repo}/` : '',
  images: { unoptimized: true },
  trailingSlash: true,
  // クライアント側で basePath を読みたいケース (共有 URL 組立など) のため公開。
  // usePathname() は basePath を含まないので、共有 URL を作る側で前置する必要がある。
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
