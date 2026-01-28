// postcss.config.js（プロジェクトルートに配置）
// 未使用CSSを削除してファイルサイズを削減

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    
    // 🚀 本番環境のみPurgeCSSを有効化
    ...(process.env.NODE_ENV === 'production' && {
      '@fullhuman/postcss-purgecss': {
        // スキャン対象のファイル
        content: [
          './src/app/**/*.{js,ts,jsx,tsx}',
          './src/components/**/*.{js,ts,jsx,tsx}',
          './src/hooks/**/*.{js,ts,jsx,tsx}',
        ],
        
        // クラス名の抽出方法
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        
        // 削除してはいけないクラス（セーフリスト）
        safelist: [
          'html',
          'body',
          // 動的に生成されるクラス
          /^bg-/,
          /^text-/,
          /^border-/,
          /^hover:/,
          /^focus:/,
          /^active:/,
          /^lg:/,
          /^md:/,
          /^sm:/,
          // 特定のクラス
          'whitespace-pre-line', // PostCardで使用
          'break-keep',          // 日本語改行防止
          // Toaster（sonner）のクラス
          /^toast/,
          /^sonner/,
          // shadcn/uiのクラス
          /^dialog/,
          /^alert/,
          /^card/,
          /^button/,
          /^input/,
          /^label/,
          /^select/,
          /^textarea/,
        ],
        
        // 動的に生成されるクラスのパターン
        dynamicAttributes: [
          'class',
          'className',
          'tw',
        ],
      },
      
      // 🚀 CSSをさらに圧縮
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true, // コメントを全削除
          },
          normalizeWhitespace: true,
          colormin: true,
          minifyFontValues: true,
          minifyGradients: true,
        }],
      },
    }),
  },
};