import { getSupabaseBrowserClient } from './client';

export interface UploadResult {
  success: boolean;
  storagePath?: string;
  error?: string;
}

/**
 * Uploads custom CAD file (STL, OBJ, STEP, 3MF) using Cloudflare R2 direct pre-signed upload
 * with zero egress fees, falling back to Supabase Storage or deterministic preview mode.
 */
export async function uploadCadModelFile(file: File): Promise<UploadResult> {
  // 1. Prioritize Cloudflare R2 direct browser-to-edge upload
  try {
    const presignedRes = await fetch('/api/storage/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileSizeBytes: file.size,
        contentType: file.type || 'application/octet-stream',
        bucketType: 'cad',
      }),
    });

    if (presignedRes.ok) {
      const data = await presignedRes.json();
      if (data.uploadUrl) {
        // Direct upload to Cloudflare R2
        const uploadRes = await fetch(data.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
        });

        if (uploadRes.ok) {
          return {
            success: true,
            storagePath: `r2://${data.storageKey}`,
          };
        }
      } else if (data.isSimulated) {
        return {
          success: true,
          storagePath: `r2://${data.storageKey}`,
        };
      }
    }
  } catch (err) {
    console.warn('Cloudflare R2 pre-signed upload fallback to Supabase:', err);
  }

  // 2. Supabase Storage fallback
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    // Graceful offline preview mode
    const fakePath = `preview-uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    return {
      success: true,
      storagePath: fakePath,
    };
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `quotes/${Date.now()}_${cleanName}`;

  try {
    const { error } = await supabase.storage
      .from('cad-models')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, storagePath: filePath };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown storage upload error';
    return { success: false, error: errorMsg };
  }
}



