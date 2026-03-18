const { S3Client } = require('@aws-sdk/client-s3');

const BUCKET = process.env.R2_BUCKET || process.env.AWS_S3_BUCKET;
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;

// Use Cloudflare R2 if R2_ACCOUNT_ID is set, otherwise fall back to AWS S3
const isR2 = Boolean(ACCOUNT_ID);

const s3Client = new S3Client(
  isR2
    ? {
        region: 'auto',
        endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      }
    : {
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
);

// Public URL — set R2_PUBLIC_URL if you have a custom domain or public bucket enabled
const getPublicUrl = (key) =>
  isR2
    ? `${process.env.R2_PUBLIC_URL}/${key}`
    : `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

module.exports = { s3Client, BUCKET, getPublicUrl };
