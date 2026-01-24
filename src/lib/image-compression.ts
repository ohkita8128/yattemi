import imageCompression from 'browser-image-compression';

export interface CompressOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

const defaultOptions: CompressOptions = {
  maxSizeMB: 0.5,          // 最大500KB
  maxWidthOrHeight: 1200,  // 最大1200px
};

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: mergedOptions.maxSizeMB,
      maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
      useWebWorker: true,
      fileType: 'image/jpeg',
    });
    
    // ファイル名を.jpgに変更
    const newFileName = file.name.replace(/\.[^/.]+$/, '.jpg');
    return new File([compressedFile], newFileName, { type: 'image/jpeg' });
  } catch (error) {
    console.error('Image compression error:', error);
    return file; // 圧縮失敗時は元ファイルを返す
  }
}

// アバター用（小さめ）
export async function compressAvatar(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.2,          // 最大200KB
    maxWidthOrHeight: 400,   // 最大400px
  });
}

// 投稿画像用
export async function compressPostImage(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.5,          // 最大500KB
    maxWidthOrHeight: 1200,  // 最大1200px
  });
}

// ギャラリー用
export async function compressGalleryImage(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.5,          // 最大500KB
    maxWidthOrHeight: 1200,  // 最大1200px
  });
}