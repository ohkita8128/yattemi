'use client';

import { useRef, useState } from 'react';
import { useProfileImages } from '@/hooks/useProfileImages';
import { Plus, X, GripVertical, Loader2 } from 'lucide-react';

type Props = {
  userId: string;
  maxImages?: number;
};

export function ProfileImageGallery({ userId, maxImages = 9 }: Props) {
  const { images, loading, uploading, uploadImage, deleteImage, reorderImages } = useProfileImages(userId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadImage(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (imageId: string) => {
    if (confirm('この写真を削除しますか？')) {
      await deleteImage(imageId);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    if (!draggedItem) return;
    
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    reorderImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          ギャラリー（最大{maxImages}枚）
        </label>
        <span className="text-sm text-gray-500">
          {images.length} / {maxImages}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {images.map((image, index) => (
          <div
            key={image.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-move group ${
              draggedIndex === index ? 'border-orange-500 opacity-50' : 'border-gray-200'
            }`}
          >
            <img
              src={image.url}
              alt={`ギャラリー ${index + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* オーバーレイ */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <GripVertical className="h-6 w-6 text-white" />
            </div>

            {/* 削除ボタン */}
            <button
              onClick={() => handleDelete(image.id)}
              className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* 追加ボタン */}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition flex flex-col items-center justify-center text-gray-400 hover:text-orange-500"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <Plus className="h-8 w-8" />
                <span className="text-xs mt-1">追加</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-gray-500">
        💡 ドラッグして並び替えできます
      </p>
    </div>
  );
}
