/**
 * Supabase Storage Utilities
 * Handles file uploads, downloads, and signed URL generation
 */

import { supabase } from './supabase';

const PLAYER_PHOTOS_BUCKET = 'player-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File must be JPEG, PNG, or WebP format',
    };
  }

  return { valid: true };
}

/**
 * Generate storage path for player photo
 */
export function generatePlayerPhotoPath(playerId: string, fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  return `${playerId}/profile_${timestamp}.${ext}`;
}

/**
 * Upload player photo to Supabase Storage
 */
export async function uploadPlayerPhoto(
  playerId: string,
  file: File
): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Generate storage path
    const storagePath = generatePlayerPhotoPath(playerId, file.name);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(PLAYER_PHOTOS_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite, use unique timestamp
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload photo',
      };
    }

    // Get signed URL
    const signedUrl = await getPlayerPhotoSignedUrl(storagePath);

    return {
      success: true,
      path: data.path,
      url: signedUrl || undefined,
    };
  } catch (err) {
    console.error('Upload exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete player photo from storage
 */
export async function deletePlayerPhoto(storagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(PLAYER_PHOTOS_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Delete exception:', err);
    return false;
  }
}

/**
 * Get signed URL for player photo
 * Returns URL valid for 1 hour
 */
export async function getPlayerPhotoSignedUrl(
  storagePath: string
): Promise<string | null> {
  try {
    if (!storagePath) {
      return null;
    }

    const { data, error } = await supabase.storage
      .from(PLAYER_PHOTOS_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);

    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Signed URL exception:', err);
    return null;
  }
}

/**
 * Get public URL for player photo (if bucket is public)
 * Note: Currently using signed URLs since bucket is private
 */
export function getPlayerPhotoPublicUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(PLAYER_PHOTOS_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Compress and optimize image before upload (client-side)
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Update player photo in database
 */
export async function updatePlayerPhotoInDB(
  playerId: string,
  storagePath: string | null,
  photoUrl: string | null = null
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('players')
      .update({
        photo_storage_path: storagePath,
        photo_url: photoUrl, // Keep backward compatibility
        photo_updated_at: new Date().toISOString(),
      })
      .eq('id', playerId);

    if (error) {
      console.error('Database update error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Database update exception:', err);
    return false;
  }
}

/**
 * Complete workflow: Upload photo and update database
 */
export async function uploadAndSavePlayerPhoto(
  playerId: string,
  file: File,
  oldStoragePath?: string | null
): Promise<UploadResult> {
  try {
    // Optionally compress image
    const compressedFile = await compressImage(file);

    // Upload new photo
    const uploadResult = await uploadPlayerPhoto(playerId, compressedFile);

    if (!uploadResult.success) {
      return uploadResult;
    }

    // Update database
    const dbSuccess = await updatePlayerPhotoInDB(
      playerId,
      uploadResult.path!,
      uploadResult.url
    );

    if (!dbSuccess) {
      // Rollback: delete uploaded file
      if (uploadResult.path) {
        await deletePlayerPhoto(uploadResult.path);
      }
      return {
        success: false,
        error: 'Failed to update database',
      };
    }

    // Delete old photo if exists
    if (oldStoragePath) {
      await deletePlayerPhoto(oldStoragePath);
    }

    return uploadResult;
  } catch (err) {
    console.error('Upload and save exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}
