// AutoPost VN - Encryption Service
// Simplified encryption for Next.js environment

export class EncryptionService {
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  // Simple base64 encoding for development
  // In production, use proper encryption libraries
  encrypt(text: string): string {
    try {
      const encoded = Buffer.from(text, 'utf8').toString('base64');
      return `enc_${encoded}`;
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  decrypt(encryptedText: string): string {
    try {
      if (!encryptedText.startsWith('enc_')) {
        throw new Error('Invalid encrypted text format');
      }
      
      const encoded = encryptedText.replace('enc_', '');
      return Buffer.from(encoded, 'base64').toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Hash function for API keys (simple implementation)
  hash(text: string): string {
    // Simple hash implementation
    let hash = 0;
    if (text.length === 0) return hash.toString();
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  // Generate random tokens
  generateToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Verify hash
  verifyHash(text: string, hash: string): boolean {
    return this.hash(text) === hash;
  }

  // Encode/decode for safe storage
  encodeForStorage(data: any): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  decodeFromStorage(encoded: string): any {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  }
}
