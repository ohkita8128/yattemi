'use client';

import { useState, useRef, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';
import { compressGalleryImage } from '@/lib/image-compression';

export type ProfileImage = {
  id: string;
  user_id: string;
  url: string;
  position: number;
  created_at: string;
};

export function useProfileImages(userId: string | null) {
  const supabaseRef = useRef(getClient());
  const hasFetched = useRef(false);
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!userId || hasFetched.current) return;

    const fetchImages = async () => {
      const supabase = supabaseRef.current;
      const { data, error } = await (supabase as any)
        .from('profile_images')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (!error && data) {
        setImages(data);
      }
      setLoading(false);
      hasFetched.current = true;
    };

    fetchImages();
  }, [userId]);

  const uploadImage = async (file: File): Promise<ProfileImage | null> => {
    if (!userId) return null;
    setUploading(true);

    const supabase = supabaseRef.current;

    try {
      // ファイルをStorageにアップロード
      const compressedFile = await compressGalleryImage(file);
      const fileName = `${userId}/${Date.now()}.jpg`;

      // profile-images バケットにアップロード試行
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, compressedFile);

      let publicUrl: string;

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // バケットがなければ avatars を使う
        const { error: fallbackError } = await supabase.storage
          .from('avatars')
          .upload(`profiles/${fileName}`, file);

        if (fallbackError) {
          throw fallbackError;
        }

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(`profiles/${fileName}`);

        publicUrl = urlData.publicUrl;
      } else {
        const { data: urlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName);

        publicUrl = urlData.publicUrl;
      }

      // DBに保存
      const nextPosition = images.length;
      const { data, error } = await (supabase as any)
        .from('profile_images')
        .insert({
          user_id: userId,
          url: publicUrl,
          position: nextPosition,
        })
        .select()
        .single();

      if (error) throw error;

      setImages(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId: string): Promise<boolean> => {
    const supabase = supabaseRef.current;

    try {
      const { error } = await (supabase as any)
        .from('profile_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.id !== imageId));
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  const reorderImages = async (newOrder: ProfileImage[]): Promise<boolean> => {
    const supabase = supabaseRef.current;

    try {
      // 順番を更新
      const updates = newOrder.map((img, index) => ({
        id: img.id,
        user_id: img.user_id,
        url: img.url,
        position: index,
      }));

      for (const update of updates) {
        await (supabase as any)
          .from('profile_images')
          .update({ position: update.position })
          .eq('id', update.id);
      }

      setImages(newOrder.map((img, index) => ({ ...img, position: index })));
      return true;
    } catch (error) {
      console.error('Error reordering images:', error);
      return false;
    }
  };

  return {
    images,
    loading,
    uploading,
    uploadImage,
    deleteImage,
    reorderImages,
    refetch: () => {
      hasFetched.current = false;
      setLoading(true);
    },
  };
}
