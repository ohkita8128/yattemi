/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 SWCによる高速ミニファイ
  swcMinify: true,
  
  // 🚀 画像最適化
  images: {
    // 最新フォーマット優先（WebP, AVIF）
    formats: ['image/avif', 'image/webp'],
    
    // デバイスごとの画像サイズ
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // 既存の設定を保持 + Supabaseの設定を改善
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  
  // 🚀 フォント最適化
  optimizeFonts: true,
  
  // 🚀 コンパイラ最適化
  compiler: {
    // 本番環境でconsole.logを削除（error/warnは残す）
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // 🚀 実験的機能（パッケージインポートの最適化）
  experimental: {
    optimizePackageImports: [
      'lucide-react',          // アイコンライブラリ
      'date-fns',             // 日付ライブラリ
      '@radix-ui/react-icons', // Radix UIアイコン
      'sonner',               // トースト通知
    ],
  },
  
  // その他の設定
  reactStrictMode: true,
  
  // 🚀 本番環境でのソースマップ無効化（軽量化）
  productionBrowserSourceMaps: false,
  
  // 🚀 Webpack最適化（バンドルサイズ削減）
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // クライアントサイドのバンドルサイズを削減
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            
            // 外部ライブラリを分離（vendor bundle）
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            
            // 共通コンポーネントを分離（common bundle）
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            
            // Reactを独立したバンドルに
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;