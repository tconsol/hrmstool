const { Storage } = require('@google-cloud/storage');
const path = require('path');
const crypto = require('crypto');
const { Readable } = require('stream');

// Allowed MIME types for security
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Normalize the GCP private key for Node.js 22 / OpenSSL 3 compatibility.
 *
 * Common issue: the key is copied from a service account JSON file with
 * surrounding JSON punctuation (leading `"` and trailing `",`) accidentally
 * included in the .env value. We strip those and then re-normalise the PEM
 * through Node.js native crypto so OpenSSL 3 can always decode it.
 */
function normalizePrivateKey(rawKey) {
  if (!rawKey) throw new Error('GCP_PRIVATE_KEY is not set');

  // Handle both dotenv formats: real newlines (double-quoted) or literal \n sequences
  let pem = rawKey.includes('\n') ? rawKey : rawKey.replace(/\\n/g, '\n');
  // Strip Windows carriage returns
  pem = pem.replace(/\r/g, '');
  // Strip JSON artifact characters that get pasted from service account JSON files:
  // leading `"` and trailing `",` or `"`
  pem = pem.replace(/^"+/, '').replace(/[",]+$/, '').trim();

  if (!pem.includes('-----BEGIN') || !pem.includes('-----END')) {
    throw new Error('GCP_PRIVATE_KEY is malformed — missing PEM header/footer. Make sure you copied only the key value, without surrounding JSON quotes or commas.');
  }

  // Re-parse + re-export through Node.js crypto.
  // Normalises line lengths, whitespace, and DER encoding for OpenSSL 3.
  const keyObj = crypto.createPrivateKey({ key: pem, format: 'pem' });
  return keyObj.export({ type: 'pkcs8', format: 'pem' }).toString();
}

let storage;
let bucket;
let gcpError = null;

try {
  const missing = ['GCP_PROJECT_ID', 'GCP_PRIVATE_KEY', 'GCP_CLIENT_EMAIL', 'GCP_BUCKET_NAME']
    .filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing GCP env vars: ${missing.join(', ')}`);
  }

  const normalizedKey = normalizePrivateKey(process.env.GCP_PRIVATE_KEY);

  storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
      type: 'service_account',
      project_id: process.env.GCP_PROJECT_ID,
      private_key_id: process.env.GCP_PRIVATE_KEY_ID,
      private_key: normalizedKey,
      client_email: process.env.GCP_CLIENT_EMAIL,
      client_id: process.env.GCP_CLIENT_ID,
    },
  });

  bucket = storage.bucket(process.env.GCP_BUCKET_NAME);

  console.log('\n☁️  GCP Cloud Storage Initialized Successfully!');
  console.log(`   📦 Bucket: ${process.env.GCP_BUCKET_NAME}`);
  console.log(`   🔑 Project: ${process.env.GCP_PROJECT_ID}`);
  console.log(`   📧 Service Account: ${process.env.GCP_CLIENT_EMAIL}\n`);
} catch (err) {
  gcpError = err.message;
  console.warn('\n⚠️  GCP Cloud Storage Not Configured');
  console.warn(`   📝 Error: ${err.message}`);
  console.warn('   ⚠️  File uploads and downloads will not work\n');
}

/**
 * Sanitize a string for use in GCS object paths.
 */
function sanitizePath(str) {
  return str
    .replace(/[^a-zA-Z0-9_\-. ]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

/**
 * Build the GCS object path for a document.
 * Structure: {orgSlug}/{employeeId}_{employeeName}/{docKey}_{uniqueId}.{ext}
 */
function buildObjectPath(orgSlug, employeeId, employeeName, docKey, originalFileName) {
  const safeName = sanitizePath(employeeName);
  const safeOrgSlug = sanitizePath(orgSlug);
  const ext = path.extname(originalFileName).toLowerCase() || '.pdf';
  const uniqueId = crypto.randomBytes(8).toString('hex');
  return `${safeOrgSlug}/${employeeId}_${safeName}/${docKey}_${uniqueId}${ext}`;
}

/**
 * Validate file content by checking magic bytes (file signatures).
 * Prevents MIME type spoofing attacks.
 */
function validateMagicBytes(buffer, mimeType) {
  if (buffer.length < 4) return false;

  const signatures = {
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/webp': null,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B]],
  };

  if (mimeType === 'image/webp') {
    return buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  }

  const sigs = signatures[mimeType];
  if (!sigs) return false;
  return sigs.some(sig => sig.every((byte, i) => buffer[i] === byte));
}

/**
 * Upload a file buffer to GCP Cloud Storage.
 * Returns the GCS object path (NOT a public URL).
 */
async function uploadFile(filePath, buffer, mimeType) {
  if (!bucket) throw new Error(`GCP Storage not configured: ${gcpError || 'unknown error'}`);

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`File type ${mimeType} is not allowed`);
  }
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit');
  }
  if (!validateMagicBytes(buffer, mimeType)) {
    throw new Error('File content does not match the declared file type');
  }

  const file = bucket.file(filePath);
  await new Promise((resolve, reject) => {
    const writeStream = file.createWriteStream({
      metadata: { contentType: mimeType, cacheControl: 'private, max-age=3600' },
      resumable: false,
    });
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);
    Readable.from(buffer).pipe(writeStream);
  });

  return filePath;
}

/**
 * Generate a signed URL for reading a file. Expires in 1 hour by default.
 */
async function getSignedUrl(filePath, expiresInMinutes = 60) {
  if (!bucket || !filePath) return null;

  const file = bucket.file(filePath);
  const [exists] = await file.exists();
  if (!exists) return null;

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });
  return url;
}

/**
 * Delete a single file from GCP Cloud Storage.
 */
async function deleteFile(filePath) {
  if (!bucket || !filePath) return;
  const file = bucket.file(filePath);
  const [exists] = await file.exists();
  if (exists) await file.delete();
}

/**
 * Delete all files under a path prefix (entire employee folder).
 */
async function deleteFolder(prefix) {
  if (!bucket || !prefix) return;
  await bucket.deleteFiles({ prefix, force: true });
}

module.exports = {
  uploadFile,
  getSignedUrl,
  deleteFile,
  deleteFolder,
  buildObjectPath,
  sanitizePath,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};
