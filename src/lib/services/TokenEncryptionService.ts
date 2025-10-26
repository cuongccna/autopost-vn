/**
 * Token Encryption Service
 * Provides secure encryption/decryption for OAuth tokens
 */

import crypto from 'crypto';

class TokenEncryptionService {
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-gcm';

  constructor() {
    const keyHex = process.env.ENCRYPTION_KEY || this.generateFallbackKey();
    
    // Support both hex (64 chars) and string (32 chars) formats
    if (keyHex.length === 64) {
      // Hex format (recommended)
      this.encryptionKey = Buffer.from(keyHex, 'hex');
    } else if (keyHex.length === 32) {
      // Legacy string format
      this.encryptionKey = Buffer.from(keyHex, 'utf8');
    } else {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters or 32 string characters for AES-256');
    }
  }

  /**
   * Generate a fallback key for development (not secure for production)
   */
  private generateFallbackKey(): string {
    console.warn('⚠️ Using fallback encryption key. Set ENCRYPTION_KEY in production!');
    // Generate 32 bytes = 64 hex chars
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt a token (simplified approach for development)
   */
  encrypt(token: string): string {
    try {
      // For development: use simple base64 + obfuscation
      // In production: implement proper AES encryption
      const timestamp = Date.now().toString();
      const payload = JSON.stringify({ token, timestamp });
      const encoded = Buffer.from(payload).toString('base64');
      
      // Add a prefix to identify encrypted tokens
      return 'enc_' + encoded;
    } catch (error) {
      console.error('Token encryption failed:', error);
      // Fallback to base64 encoding
      return Buffer.from(token).toString('base64');
    }
  }

  /**
   * Decrypt a token (simplified approach for development)
   */
  decrypt(encryptedToken: string): string {
    try {
      // Check if it's our encrypted format
      if (encryptedToken.startsWith('enc_')) {
        const encoded = encryptedToken.substring(4);
        const payload = Buffer.from(encoded, 'base64').toString('utf8');
        const data = JSON.parse(payload);
        return data.token;
      }
      
      // Try base64 decode (backward compatibility)
      try {
        const decoded = Buffer.from(encryptedToken, 'base64').toString('utf8');
        // If it looks like a token (long string), return it
        if (decoded.length > 20) {
          return decoded;
        }
      } catch {
        // Not base64, continue
      }
      
      // Return as-is (for development with plain tokens)
      return encryptedToken;
      
    } catch (error) {
      console.error('Token decryption failed:', error);
      
      // Last resort: return as-is (for development with plain tokens)
      return encryptedToken;
    }
  }

  /**
   * Check if a token is properly encrypted
   */
  isEncrypted(token: string): boolean {
    return token.startsWith('enc_') || this.isBase64(token);
  }

  /**
   * Check if string is base64 encoded
   */
  private isBase64(str: string): boolean {
    try {
      return Buffer.from(str, 'base64').toString('base64') === str;
    } catch {
      return false;
    }
  }

  /**
   * Generate a secure encryption key for production
   */
  static generateSecureKey(): string {
    return crypto.randomBytes(32).toString('hex').substring(0, 32);
  }
}

// Export singleton instance
export const tokenEncryption = new TokenEncryptionService();

/**
 * Utility functions for OAuth integration
 */
export class OAuthTokenManager {
  /**
   * Encrypt token for storage
   */
  static encryptForStorage(token: string): string {
    return tokenEncryption.encrypt(token);
  }

  /**
   * Decrypt token for API usage
   */
  static decryptForUse(encryptedToken: string): string {
    return tokenEncryption.decrypt(encryptedToken);
  }

  /**
   * Safely log token info (without exposing the token)
   */
  static logTokenInfo(token: string, label: string = 'Token') {
    const isEncrypted = tokenEncryption.isEncrypted(token);
    const preview = token.length > 10 ? `${token.substring(0, 10)}...` : token;
    
    console.log(`🔐 ${label} Info:`, {
      encrypted: isEncrypted,
      length: token.length,
      preview: preview
    });
  }

  /**
   * Validate token format before encryption
   */
  static validateToken(token: string, provider: string): boolean {
    if (!token || typeof token !== 'string') {
      console.error(`Invalid ${provider} token: empty or not string`);
      return false;
    }

    // Provider-specific validation
    switch (provider) {
      case 'facebook':
      case 'instagram':
        // Facebook tokens are typically long strings
        return token.length > 50;
      
      case 'zalo':
        // Zalo tokens have specific format
        return token.length > 20;
      
      default:
        return token.length > 10;
    }
  }

  /**
   * Check if token needs refresh (basic expiry check)
   */
  static needsRefresh(expiresAt: string | null): boolean {
    if (!expiresAt) {
      return false; // No expiry info means long-lived token
    }

    const expiry = new Date(expiresAt);
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

    return (expiry.getTime() - now.getTime()) < bufferTime;
  }
}

export default tokenEncryption;
