// src/lib/image-compression.ts

// ❌ 削除: import imageCompression from 'browser-image-compression';

export interface CompressOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

const defaultOptions: CompressOptions = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
};

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    // ✅ 動的import（使う時だけ読み込む）
    const imageCompression = (await import('browser-image-compression')).default;
    
    const compressedFile = await imageCompression(file, {
      maxSizeMB: mergedOptions.maxSizeMB,
      maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
      useWebWorker: true,
      fileType: 'image/jpeg',
    });
    
    const newFileName = file.name.replace(/\.[^/.]+$/, '.jpg');
    return new File([compressedFile], newFileName, { type: 'image/jpeg' });
  } catch (error) {
    console.error('Image compression error:', error);
    return file;
  }
}

// アバター用（小さめ）
export async function compressAvatar(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 400,
  });
}

// 投稿画像用
export async function compressPostImage(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
  });
}

// ギャラリー用
export async function compressGalleryImage(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
  });
}