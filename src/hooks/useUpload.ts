import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(async (file: File, folder: string = 'uploads'): Promise<{ url: string; path: string } | null> => {
    setUploading(true);
    setProgress(0);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      setProgress(30);
      const { error } = await supabase.storage.from('media').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      setProgress(70);
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
      setProgress(100);
      return { url: urlData.publicUrl, path: fileName };
    } catch (err) {
      setProgress(0);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploading, progress, uploadFile };
}
