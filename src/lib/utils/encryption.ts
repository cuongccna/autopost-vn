import crypto from 'crypto';

/**
 * Encryption Utilities
 * Used to encrypt/decrypt sensitive data like access tokens
 * Requires ENCRYPTION_KEY environment variable (32 characters)
 */

const ALGORITHM = 'aes-256-cbc' as const;
const IV_LENGTH = 16;

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
  }
  
  return key;
}

/**
 * Encrypt a string
 * @param text - Plain text to encrypt
 * @returns Encrypted text in format: iv:encryptedData
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    // @ts-ignore - Node.js crypto types issue
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'utf-8'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return iv and encrypted data separated by ':'
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string
 * @param encryptedText - Encrypted text in format: iv:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    // @ts-ignore - Node.js crypto types issue
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key, 'utf-8'), iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash a string using SHA-256
 * @param text - Text to hash
 * @returns Hashed text
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a random token
 * @param length - Length of token (default: 32)
 * @returns Random hex token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Verify if encryption key is properly configured
 * @returns true if encryption key is valid
 */
export function verifyEncryptionKey(): boolean {
  try {
    const key = process.env.ENCRYPTION_KEY;
    return !!(key && key.length === 32);
  } catch {
    return false;
  }
}
