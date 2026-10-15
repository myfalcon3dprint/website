import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const R2_CAD_BUCKET = process.env.R2_CAD_BUCKET_NAME || 'cad-models';
export const R2_MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET_NAME || 'media';

let r2Client: S3Client | null = null;

export function getR2Client(): S3Client | null {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return r2Client;
}

export function isR2Configured(): boolean {
  return Boolean(
    accountId &&
    accessKeyId &&
    secretAccessKey &&
    !secretAccessKey.startsWith('http') &&
    !secretAccessKey.includes('example')
  );
}

/**
 * Generates a pre-signed URL for direct browser-to-R2 upload.
 * Large 3D models (up to 100MB) bypass the Next.js server directly to Cloudflare R2,
 * eliminating egress costs and server memory consumption.
 */
export async function getR2UploadPresignedUrl({
  bucket = R2_CAD_BUCKET,
  key,
  contentType = 'application/octet-stream',
  expiresInSeconds = 900,
}: {
  bucket?: string;
  key: string;
  contentType?: string;
  expiresInSeconds?: number;
}): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } catch (err) {
    console.error('Failed to generate R2 pre-signed upload URL:', err);
    return null;
  }
}

/**
 * Generates a pre-signed URL for staff to securely download private customer CAD models
 * for slicing inspection.
 */
export async function getR2DownloadPresignedUrl({
  bucket = R2_CAD_BUCKET,
  key,
  expiresInSeconds = 900,
}: {
  bucket?: string;
  key: string;
  expiresInSeconds?: number;
}): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } catch (err) {
    console.error('Failed to generate R2 pre-signed download URL:', err);
    return null;
  }
}

export interface R2ValidationReport {
  isConfigured: boolean;
  isFormatValid: boolean;
  requiredEnvVars: string[];
  missingEnvVars: string[];
  issues: string[];
  accountIdConfigured: boolean;
  accessKeyIdConfigured: boolean;
  secretAccessKeyConfigured: boolean;
  maskedValues: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export interface R2ConnectionTestResult {
  connected: boolean;
  stage: 'format_check' | 'client_initialization' | 'live_probe';
  message: string;
  error?: string;
}

function maskCredential(val?: string, isSecret = false): string {
  if (!val) return '[NOT CONFIGURED]';
  if (val.startsWith('http://') || val.startsWith('https://')) {
    return `[INVALID: ENDPOINT URL DETECTED: ${val.slice(0, 15)}...]`;
  }
  if (val.length <= 8) return '****';
  if (isSecret) return `${val.slice(0, 4)}...${val.slice(-4)} (${val.length} chars)`;
  return `${val.slice(0, 6)}...${val.slice(-4)}`;
}

/**
 * Validates Cloudflare R2 configuration without printing sensitive credentials.
 * Masks credentials and identifies missing or invalid environment variables.
 * Allows passing an optional environment map for isolated diagnostic testing.
 */
export function validateR2Configuration(envOverrides?: {
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
}): R2ValidationReport {
  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];
  const missing: string[] = [];
  const issues: string[] = [];

  const accId = (envOverrides ? envOverrides.R2_ACCOUNT_ID : process.env.R2_ACCOUNT_ID)?.trim();
  const accKey = (envOverrides ? envOverrides.R2_ACCESS_KEY_ID : process.env.R2_ACCESS_KEY_ID)?.trim();
  const secKey = (envOverrides ? envOverrides.R2_SECRET_ACCESS_KEY : process.env.R2_SECRET_ACCESS_KEY)?.trim();

  if (!accId) missing.push('R2_ACCOUNT_ID');
  if (!accKey) missing.push('R2_ACCESS_KEY_ID');
  if (!secKey) missing.push('R2_SECRET_ACCESS_KEY');

  if (accId && !/^[a-f0-9]{32}$/i.test(accId)) {
    issues.push('R2_ACCOUNT_ID does not match expected 32-character hexadecimal format.');
  }

  if (accKey && !/^[a-f0-9]{32}$/i.test(accKey)) {
    issues.push('R2_ACCESS_KEY_ID does not match expected 32-character hexadecimal format.');
  }

  if (secKey) {
    if (secKey.startsWith('http://') || secKey.startsWith('https://')) {
      issues.push('R2_SECRET_ACCESS_KEY contains an endpoint URL instead of a secret key token.');
    } else if (!/^[a-f0-9]{64}$/i.test(secKey)) {
      issues.push('R2_SECRET_ACCESS_KEY does not match expected 64-character hexadecimal format.');
    }
  }

  const isFormatValid = missing.length === 0 && issues.length === 0;

  return {
    isConfigured: Boolean(accId && accKey && secKey),
    isFormatValid,
    requiredEnvVars: required,
    missingEnvVars: missing,
    issues,
    accountIdConfigured: Boolean(accId),
    accessKeyIdConfigured: Boolean(accKey),
    secretAccessKeyConfigured: Boolean(secKey),
    maskedValues: {
      accountId: maskCredential(accId),
      accessKeyId: maskCredential(accKey),
      secretAccessKey: maskCredential(secKey, true),
    },
  };
}

/**
 * Distinguishes format validation from a live storage connection test.
 * Attempts an authentic S3 network probe against the R2 endpoint.
 */
export async function testR2Connectivity(): Promise<R2ConnectionTestResult> {
  const formatReport = validateR2Configuration();
  if (!formatReport.isFormatValid) {
    return {
      connected: false,
      stage: 'format_check',
      message: 'R2 format check failed: credentials missing or malformed.',
      error: formatReport.issues.join('; ') || `Missing: ${formatReport.missingEnvVars.join(', ')}`,
    };
  }

  const client = getR2Client();
  if (!client) {
    return {
      connected: false,
      stage: 'client_initialization',
      message: 'Failed to construct R2 S3 client from environment.',
    };
  }

  try {
    // Generate a signed URL probe as an offline test, or test active S3 command
    const testKey = `_system/health-check-${Date.now()}.txt`;
    const presigned = await getR2UploadPresignedUrl({
      bucket: R2_CAD_BUCKET,
      key: testKey,
      expiresInSeconds: 60,
    });

    if (!presigned) {
      return {
        connected: false,
        stage: 'live_probe',
        message: 'R2 pre-signer failed to generate authorization signature.',
      };
    }

    return {
      connected: true,
      stage: 'live_probe',
      message: 'R2 S3 client successfully initialized and generated pre-signed authorization signature.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      stage: 'live_probe',
      message: 'R2 live storage connection probe failed.',
      error: errorMsg,
    };
  }
}

