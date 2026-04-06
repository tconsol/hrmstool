const sharp = require('sharp');

const MAX_SIZE_BYTES = 500 * 1024; // 500KB threshold
const TARGET_WIDTH = 400;
const TARGET_HEIGHT = 400;

/**
 * Compress a base64-encoded image if it exceeds MAX_SIZE_BYTES.
 * Returns the (possibly compressed) base64 data URL.
 * @param {string} base64DataUrl - e.g. "data:image/png;base64,..."
 * @returns {Promise<string>} compressed base64 data URL
 */
async function compressImage(base64DataUrl) {
  if (!base64DataUrl || !base64DataUrl.startsWith('data:image')) return base64DataUrl;

  const matches = base64DataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) return base64DataUrl;

  const rawBase64 = matches[2];
  const buffer = Buffer.from(rawBase64, 'base64');

  // If under threshold, return as-is
  if (buffer.length <= MAX_SIZE_BYTES) return base64DataUrl;

  const compressed = await sharp(buffer)
    .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  return `data:image/jpeg;base64,${compressed.toString('base64')}`;
}

module.exports = { compressImage };
