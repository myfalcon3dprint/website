import { getSupabaseAdminClient } from './server';

/**
 * Generates temporary signed URL for staff to securely download customer CAD files.
 * Supports Cloudflare R2 keys ('r2://...') and Supabase storage paths.
 * TTL defaults to 900 seconds (15 minutes).
 * Strictly server-side: uses service role admin client.
 */
export async function getCadModelSignedUrl(storagePath: string, expiresInSeconds = 900): Promise<string | null> {
  // If stored in Cloudflare R2
  if (storagePath.startsWith('r2://')) {
    const key = storagePath.replace('r2://', '');
    try {
      const { getR2DownloadPresignedUrl } = await import('@/lib/cloudflare/r2');
      const r2Url = await getR2DownloadPresignedUrl({ key, expiresInSeconds });
      if (r2Url) return r2Url;
    } catch (err) {
      console.warn('Failed to get Cloudflare R2 signed download URL:', err);
    }
  }

  // Supabase fallback
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return null;
  }

  try {
    const cleanPath = storagePath.replace('r2://', '');
    const { data, error } = await adminClient.storage
      .from('cad-models')
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
}
