import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../../config/supabase';
import { validateImageSize, compressAndWebp } from '../../../../utils/images';
import { toast as toastFn } from '../../../Toast';

const toast = {
  success: (msg) => toastFn(msg, { type: 'success' }),
  error: (msg) => toastFn(msg, { type: 'error' }),
};

export function useProductImageUpload({ imageUrl, planId, onImageUploaded }) {
  const [isUploading, setIsUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);
  const [liveImageSize, setLiveImageSize] = useState(null);
  const fileInputRef = useRef(null);

  // Reset image error state when url changes
  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  // Auto-detect image size (in KB) for live validation even if uploaded previously
  useEffect(() => {
    if (!imageUrl || imgError) {
      setLiveImageSize(null);
      return;
    }
    let isCancelled = false;
    fetch(imageUrl, { method: 'HEAD' })
      .then((res) => {
        const len = res.headers.get('content-length');
        if (len && !isCancelled) {
          const kb = (parseInt(len, 10) / 1024).toFixed(1);
          setLiveImageSize(kb);
        } else if (!isCancelled) {
          fetch(imageUrl)
            .then((r) => r.blob())
            .then((b) => {
              if (!isCancelled) setLiveImageSize((b.size / 1024).toFixed(1));
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        fetch(imageUrl)
          .then((r) => r.blob())
          .then((b) => {
            if (!isCancelled) setLiveImageSize((b.size / 1024).toFixed(1));
          })
          .catch(() => {});
      });
    return () => {
      isCancelled = true;
    };
  }, [imageUrl, imgError]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateImageSize(file, toast, planId)) return;

    try {
      setIsUploading(true);
      setUploadStats(null);
      const originalSize = file.size;
      const compressedFile = await compressAndWebp(file, planId);
      const finalSize = compressedFile.size;

      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.webp`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, compressedFile, {
          cacheControl: '31536000',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      const newImageUrl = data.publicUrl;

      // Clean up previous image if it was hosted in our bucket
      if (imageUrl && imageUrl.includes('supabase.co')) {
        try {
          const parts = imageUrl.split('/');
          const oldFileName = parts[parts.length - 1];
          if (oldFileName) {
            await supabase.storage.from('products').remove([oldFileName]);
          }
        } catch (cleanupError) {
          console.warn('Error limpiando imagen antigua:', cleanupError);
        }
      }

      onImageUploaded(newImageUrl);
      setUploadStats({
        original: (originalSize / 1024).toFixed(1),
        final: (finalSize / 1024).toFixed(1),
        reduction: (((originalSize - finalSize) / originalSize) * 100).toFixed(0)
      });
      setLiveImageSize((finalSize / 1024).toFixed(1));

      toast.success('Imagen optimizada a WebP y subida con éxito');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error subiendo imagen. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return {
    isUploading,
    imgError,
    setImgError,
    uploadStats,
    liveImageSize,
    fileInputRef,
    handleImageUpload
  };
}
