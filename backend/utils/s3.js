const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, BUCKET, getPublicUrl } = require('../config/aws');
const crypto = require('crypto');
const path = require('path');

/**
 * Upload a buffer directly to S3
 */
exports.uploadToS3 = async ({ buffer, originalName, mimeType, folder = 'uploads' }) => {
  const ext = path.extname(originalName);
  const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    Metadata: { originalName },
  });

  await s3Client.send(command);

  return {
    key,
    url: getPublicUrl(key),
    size: buffer.length,
    originalName,
  };
};

/**
 * Generate a time-limited signed URL for private downloads
 * Defaults to 30 days
 */
exports.getSignedDownloadUrl = async (key, expiresInSeconds = 30 * 24 * 60 * 60) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${path.basename(key)}"`,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
};

/**
 * Delete an object from S3
 */
exports.deleteFromS3 = async (key) => {
  if (!key) return;
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  return s3Client.send(command);
};

/**
 * Parse multer memory-storage upload and push to S3
 */
exports.handleMulterUpload = async (file, folder) => {
  return exports.uploadToS3({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
    folder,
  });
};
