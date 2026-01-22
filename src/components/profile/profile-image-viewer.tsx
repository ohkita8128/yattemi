'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { ProfileImage } from '@/hooks/useProfileImages';

type Props = {
  images: ProfileImage[];
  avatarUrl?: string | null;
  displayName?: string | null;
};

export function ProfileImageViewer({ images, avatarUrl, displayName }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 画像がない場合はアバターを表示
  const allImages = images.length > 0 
    ? images.map(img => img.image_url)
    : avatarUrl 
      ? [avatarUrl]
      : [];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  // 画像がない場合
  if (allImages.length === 0) {
    return (
      <div className="aspect-[4/5] bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <User className="h-20 w-20 mx-auto mb-2" />
          <p className="text-sm">{displayName || 'ユーザー'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden group">
      {/* メイン画像 */}
      <img
        src={allImages[currentIndex]}
        alt={`${displayName || 'ユーザー'}の写真 ${currentIndex + 1}`}
        className="w-full h-full object-cover"
      />

      {/* 画像が複数ある場合のナビゲーション */}
      {allImages.length > 1 && (
        <>
          {/* 左矢印 */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* 右矢印 */}
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* ドットインジケーター */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition ${
                  index === currentIndex
                    ? 'bg-white'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* 上部のプログレスバー（タップエリア分割） */}
          <div className="absolute top-3 left-3 right-3 flex gap-1">
            {allImages.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* タップエリア（左半分で前へ、右半分で次へ） */}
          <div className="absolute inset-0 flex">
            <div
              className="w-1/2 h-full cursor-pointer"
              onClick={goToPrevious}
            />
            <div
              className="w-1/2 h-full cursor-pointer"
              onClick={goToNext}
            />
          </div>
        </>
      )}
    </div>
  );
}
