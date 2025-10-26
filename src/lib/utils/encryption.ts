import crypto from 'crypto';

/**
 * Encryption Utilities for AutoPost VN
 * 
 * Uses AES-256-GCM (Galois/Counter Mode) for authenticated encryption
 * Provides confidentiality, integrity, and authenticity
 * 
 * Security features:
 * - AES-256-GCM encryption algorithm
 * - Random IV (Initialization Vector) per encryption
 * - Authentication tag for integrity verification
 * - Secure key derivation from environment variable
 * 
 * @module encryption
 */

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment with validation
 * @throws {Error} If ENCRYPTION_KEY is not set or invalid
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  
  // Support both hex (64 chars) and raw string (32 chars)
  if (key.length === 64) {
    // Hex encoded key
    return Buffer.from(key, 'hex');
  } else if (key.length === 32) {
    // Raw string key
    return Buffer.from(key, 'utf-8');
  } else {
    throw new Error(
      `ENCRYPTION_KEY must be 32 characters or 64 hex characters (got ${key.length}). ` +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
}

/**
 * Encrypt a string using AES-256-GCM
 * 
 * Format: iv:authTag:encryptedData (all hex encoded)
 * 
 * @param text - Plain text to encrypt
 * @returns Encrypted text in format: iv:authTag:encryptedData
 * @throws {Error} If encryption fails
 * 
 * @example
 * const encrypted = encrypt('my-access-token');
 * // Returns: "a1b2c3d4e5f6....:f1e2d3c4b5a6....:9a8b7c6d5e4f...."
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Return iv:authTag:encryptedData (all hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('❌ Encryption error:', error);
    throw new Error('Failed to encrypt data. Please check ENCRYPTION_KEY configuration.');
  }
}

/**
 * Decrypt a string using AES-256-GCM
 * 
 * @param encryptedText - Encrypted text in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 * @throws {Error} If decryption fails or authentication fails
 * 
 * @example
 * const decrypted = decrypt('a1b2c3d4e5f6....:f1e2d3c4b5a6....:9a8b7c6d5e4f....');
 * // Returns: "my-access-token"
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      // Try legacy format (iv:encryptedData) for backward compatibility
      return decryptLegacy(encryptedText);
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedData = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption error:', error);
    throw new Error('Failed to decrypt data. Token may be corrupted or invalid.');
  }
}

/**
 * Decrypt legacy AES-256-CBC encrypted tokens
 * For backward compatibility with old tokens
 * 
 * @param encryptedText - Encrypted text in old format: iv:encryptedData
 * @returns Decrypted plain text
 * @deprecated Use new AES-256-GCM format
 */
function decryptLegacy(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    // Use CBC for legacy tokens
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.warn('⚠️  Decrypted legacy token. Consider re-encrypting with new format.');
    return decrypted;
  } catch (error) {
    console.error('❌ Legacy decryption error:', error);
    throw new Error('Failed to decrypt legacy token. Please reconnect your account.');
  }
}

/**
 * Hash a string using SHA-256
 * @param text - Text to hash
 * @returns Hashed text in hex format
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a cryptographically secure random token
 * @param length - Length of token in bytes (default: 32)
 * @returns Random hex token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Verify if a text matches a hash
 * @param text - Plain text
 * @param hashedText - Hashed text to compare
 * @returns True if match
 */
export function verifyHash(text: string, hashedText: string): boolean {
  return hash(text) === hashedText;
}

/**
 * Generate encryption key (for setup only)
 * Run: node -e "console.log(require('./src/lib/utils/encryption').generateEncryptionKey())"
 * @returns 256-bit encryption key in hex format
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
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
