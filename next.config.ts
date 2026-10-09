import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.trycloudflare.com' },
      { protocol: 'https', hostname: 'api.meeteam.alom-sejong.com' },
      { protocol: 'https', hostname: 'test.meeteam.alom-sejong.com' },
    ],
  },
  turbopack: { rules: { '*.svg': { loaders: ['@svgr/webpack'], as: '*.js' } } },
  webpack(config) {
    const imageRule = config.module.rules.find((rule: { test?: RegExp }) =>
      rule?.test?.test?.('icon.svg'),
    );
    if (imageRule) imageRule.exclude = /\.svg$/i;
    config.module.rules.push({ test: /\.svg$/i, issuer: /\.[jt]sx?$/, use: ['@svgr/webpack'] });
    return config;
  },
};

export default nextConfig;
