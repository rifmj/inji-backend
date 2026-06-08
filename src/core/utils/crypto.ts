import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

// AES-256-GCM with random 96-bit IV. Format: "gcm1:<base64(iv ‖ tag ‖ ct)>".
// IV is 12 bytes, tag is 16 bytes, ciphertext is variable length.

const VERSION = 'gcm1';
const IV_LEN = 12;
const TAG_LEN = 16;

function resolveKey(hexKey: string): Buffer {
  if (!hexKey) {
    throw new Error('secrets.encryptionKey is not configured');
  }
  const key = Buffer.from(hexKey, 'hex');
  if (key.length !== 32) {
    throw new Error(
      `secrets.encryptionKey must be 32 bytes (64 hex chars), got ${key.length}`,
    );
  }
  return key;
}

export function encryptSecret(plaintext: string, hexKey: string): string {
  const key = resolveKey(hexKey);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${Buffer.concat([iv, tag, ct]).toString('base64')}`;
}

export function decryptSecret(payload: string, hexKey: string): string {
  const key = resolveKey(hexKey);
  const [version, b64] = payload.split(':');
  if (version !== VERSION || !b64) {
    throw new Error(`Unsupported secret payload version: ${version}`);
  }
  const buf = Buffer.from(b64, 'base64');
  if (buf.length < IV_LEN + TAG_LEN) {
    throw new Error('Secret payload truncated');
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString(
    'utf8',
  );
}

export function generateSaleorPassword(): string {
  // 32 url-safe bytes → 43 chars after base64url. Plenty of entropy.
  return randomBytes(32).toString('base64url');
}
