
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Wasabi Configuration from provided credentials
// Optimized for browser-based fetch to Wasabi S3 endpoints
const wasabiConfig = {
  region: "us-central-1",
  endpoint: "https://s3.us-central-1.wasabisys.com",
  credentials: {
    accessKeyId: "LDM3SMLRYGZ2P69408J0",
    secretAccessKey: "8VUw8TSi4HWsZBt5Net8tkZZgyaRVlncEYWE41lE",
  },
  // Path style is often more reliable for Wasabi in browser environments to avoid nested subdomain CORS issues
  forcePathStyle: true,
};

// Primary production bucket for all media
const BUCKET_NAME = "kyroma-prod-media";

// Initialize the client
const s3Client = new S3Client(wasabiConfig);

/**
 * Utility to extract a clean object key from a full URL or a raw key.
 */
const extractKey = (urlOrKey: string): string => {
  if (!urlOrKey) return "";
  if (urlOrKey.startsWith('http')) {
    try {
      const url = new URL(urlOrKey);
      let path = url.pathname;
      if (path.startsWith(`/${BUCKET_NAME}/`)) {
        return path.substring(BUCKET_NAME.length + 2);
      }
      return path.startsWith('/') ? path.substring(1) : path;
    } catch (e) {
      console.warn("Key extraction failed, using raw value:", urlOrKey);
    }
  }
  return urlOrKey;
};

/**
 * Generates a time-bound GET URL for a private object
 */
export const getPresignedUrl = async (keyOrUrl: string, expiresIn: number = 3600, downloadName?: string): Promise<string> => {
  const key = extractKey(keyOrUrl);
  if (!key) return keyOrUrl;

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: downloadName ? `attachment; filename="${downloadName.replace(/"/g, '')}"` : undefined,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Presign generation failed for key:", key, error);
    return keyOrUrl;
  }
};

/**
 * Uploads a file to Wasabi
 * @returns The key of the uploaded object
 */
export const uploadToWasabi = async (
  file: File | Blob, 
  eventId: string, 
  photographerId: string, 
  batchId: string
): Promise<string> => {
  // Construct a safe filename if it's a raw Blob
  const name = (file as File).name || 'upload.jpg';
  const fileExt = name.split('.').pop() || 'jpg';
  const photoId = Math.random().toString(36).substring(2, 15) + '_' + Date.now();
  
  const key = `events/${eventId}/photographers/${photographerId}/uploads/${batchId}/original/${photoId}.${fileExt}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      // Explicitly setting ContentType to avoid "Failed to fetch" on some browser/proxy configurations
      ContentType: file.type || 'image/jpeg',
    });

    await s3Client.send(command);
    return key;
  } catch (error: any) {
    // Log detailed error for debugging Wasabi CORS/Network issues
    console.error("Detailed Wasabi Upload Error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      key
    });
    
    // Check if it's a likely CORS error (Failed to fetch often maps to TypeError in catch)
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      throw new Error("Wasabi connection blocked. This is likely a CORS configuration issue or an ad-blocker interference.");
    }
    
    throw error;
  }
};
