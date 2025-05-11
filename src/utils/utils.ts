/* Package System */
import * as QRCode from 'qrcode';
import crypto from 'crypto';

const algorithm = process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
const iv = Buffer.from(process.env.ENCRYPTION_IV!, 'hex');

/**
 * decrypt ciphertext base64 form to string.
 * @param encryptedText ciphertext dạng base64
 * @returns decrypted string
 */
export function decrypt(encryptedText: string): any {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);;
}