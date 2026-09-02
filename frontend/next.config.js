/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /casing/,
      /case-semantic/,
      /differ in casing/,
    ];
    return config;
  },
};

module.exports = nextConfig;
