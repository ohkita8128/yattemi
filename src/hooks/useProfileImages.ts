'use client';

import { useState, useRef, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';

export type ProfileImage = {
  id: string;
  user_id: string;
  image_url: string;
  sort_order: number;
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
        .order('sort_order', { ascending: true });

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
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // バケットがなければavatarsを使う
        const { error: fallbackError } = await supabase.storage
          .from('avatars')
          .upload(`profiles/${fileName}`, file);
        
        if (fallbackError) {
          throw fallbackError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(`profiles/${fileName}`);

        // DBに保存
        const nextOrder = images.length;
        const { data, error } = await (supabase as any)
          .from('profile_images')
          .insert({
            user_id: userId,
            image_url: publicUrl,
            sort_order: nextOrder,
          })
          .select()
          .single();

        if (error) throw error;

        setImages(prev => [...prev, data]);
        return data;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // DBに保存
      const nextOrder = images.length;
      const { data, error } = await (supabase as any)
        .from('profile_images')
        .insert({
          user_id: userId,
          image_url: publicUrl,
          sort_order: nextOrder,
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
        image_url: img.image_url,
        sort_order: index,
      }));

      for (const update of updates) {
        await (supabase as any)
          .from('profile_images')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      setImages(newOrder.map((img, index) => ({ ...img, sort_order: index })));
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
