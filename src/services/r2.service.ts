import crypto from 'crypto';
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let s3Client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (s3Client) return s3Client;

  const { accountId, accessKeyId, secretAccessKey, endpoint } = config.r2;

  if (!accessKeyId || !secretAccessKey) {
    logger.warn('⚠️ Cloudflare R2 credentials not fully set; R2 operations will fail unless configured.');
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: endpoint || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined),
    credentials: {
      accessKeyId: accessKeyId || '',
      secretAccessKey: secretAccessKey || '',
    },
  });

  return s3Client;
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

export async function uploadBufferToR2(params: {
  buffer: Buffer;
  contentType: string;
  extension: string;
  folder?: string;
  originalName?: string;
}): Promise<UploadResult> {
  const { buffer, contentType, extension, folder = 'uploads' } = params;
  const { bucketName, publicUrl } = config.r2;
  const client = getR2Client();

  const randomHash = crypto.randomBytes(8).toString('hex');
  const key = `${folder}/${Date.now()}-${randomHash}.${extension}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  const url = publicUrl ? `${publicUrl}/${key}` : `/uploads/${key}`;

  return { key, url, bucket: bucketName };
}

export async function generatePresignedUploadUrl(params: {
  contentType: string;
  extension: string;
  folder?: string;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const { contentType, extension, folder = 'uploads', expiresInSeconds = 300 } = params;
  const { bucketName, publicUrl } = config.r2;
  const client = getR2Client();

  const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  const finalPublicUrl = publicUrl ? `${publicUrl}/${key}` : `/${key}`;

  return { uploadUrl, key, publicUrl: finalPublicUrl };
}

export async function deleteObjectFromR2(key: string): Promise<boolean> {
  try {
    const { bucketName } = config.r2;
    const client = getR2Client();

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    return true;
  } catch (error: any) {
    logger.error(`Error deleting object from R2 (key: ${key}): ${error.message}`);
    return false;
  }
}
