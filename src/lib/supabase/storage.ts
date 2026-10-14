import { getSupabaseBrowserClient } from './client';
import { getSupabaseAdminClient } from './server';

export interface UploadResult {
  success: boolean;
  storagePath?: string;
  error?: string;
}

/**
 * Uploads custom CAD file (STL, OBJ, STEP, 3MF) to the private 'cad-models' Supabase Storage bucket.
 * Falls back gracefully when Supabase credentials are not populated.
 */
export async function uploadCadModelFile(file: File): Promise<UploadResult> {
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

/**
 * Generates temporary signed URL for staff to download customer CAD files.
 * TTL defaults to 900 seconds (15 minutes).
 */
export async function getCadModelSignedUrl(storagePath: string, expiresInSeconds = 900): Promise<string | null> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return null;
  }

  try {
    const { data, error } = await adminClient.storage
      .from('cad-models')
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
}
