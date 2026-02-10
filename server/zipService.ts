/**
 * KYROMA SERVER-SIDE ZIP GENERATOR
 * Implementation for Node.js using archiver and @aws-sdk/lib-storage.
 * 
 * Requirement: Eliminate browser CORS limitations by bundling images on the server.
 */

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import archiver from 'archiver';
import { PassThrough } from 'stream';

// Initialize Wasabi Client (Path Style is critical for signature matching)
const s3Client = new S3Client({
  region: "us-central-1",
  endpoint: "https://s3.us-central-1.wasabisys.com",
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID!,
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = "kyroma-prod-media";

/**
 * Generates a ZIP of specified object keys and uploads it back to Wasabi.
 * @param eventId The event identifier
 * @param objects Array of { key, filename } to include in the ZIP
 */
export const generateEventZip = async (eventId: string, objects: { key: string, filename: string }[]) => {
  const timestamp = Date.now();
  const zipKey = `events/${eventId}/deliveries/zip/event_${eventId}_${timestamp}.zip`;
  
  // Create a PassThrough stream to act as the bridge between Archiver and S3 Upload
  const stream = new PassThrough();

  // Initialize Archiver
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(stream);

  // Initialize S3 Multipart Upload
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: zipKey,
      Body: stream,
      ContentType: 'application/zip',
    },
  });

  // Fetch each object from S3 and append to the archive
  // Using sequential processing to maintain stream stability
  for (const obj of objects) {
    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: obj.key,
      });
      const response = await s3Client.send(getObjectCommand);
      
      if (response.Body) {
        // Stream the S3 object directly into the archive
        archive.append(response.Body as any, { name: obj.filename });
      }
    } catch (err) {
      console.error(`Failed to append ${obj.key} to archive:`, err);
    }
  }

  // Finalize the archive (this triggers the end of the stream)
  archive.finalize();

  // Wait for the upload to complete
  await upload.done();

  // Generate a presigned GET URL for the final ZIP (valid for 30 mins)
  const downloadCommand = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: zipKey,
  });
  
  const url = await getSignedUrl(s3Client, downloadCommand, { expiresIn: 1800 });

  return {
    url,
    zip_object_key: zipKey,
    expires_in_seconds: 1800
  };
};

/**
 * EXPRESS ROUTE HANDLER (Conceptual)
 * 
 * router.post('/api/events/:eventId/zip', async (req, res) => {
 *   const { eventId } = req.params;
 *   const { photoIds } = req.body;
 *   
 *   // 1. Fetch photo records from Database
 *   // 2. Filter by photoIds if provided
 *   // 3. Map to { key: sub.object_key, filename: `photo-${sub.id}.jpg` }
 *   // 4. Call generateEventZip
 *   // 5. Return JSON result
 * });
 */
