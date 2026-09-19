import * as Crypto from 'expo-crypto';
import { AESEncryptionKey, AESSealedData, aesEncryptAsync, aesDecryptAsync } from 'expo-crypto';

// In-memory key cache keyed by matchId
const keyCache = new Map<string, AESEncryptionKey>();

export const E2EE_PREFIX = 'E2EE:v1:';

/**
 * Derives a deterministic 256-bit AES-GCM encryption key for a match lounge
 * using SHA-256 over the match secret and match ID.
 */
export async function getOrDeriveMatchKey(
  matchId: string,
  e2eeSecret?: string
): Promise<AESEncryptionKey | null> {
  if (!matchId) return null;
  const seed = `${e2eeSecret || 'blunderr_secure_lounge_2026'}:${matchId}`;
  const cacheKey = `${matchId}:${e2eeSecret || 'seed'}`;

  if (keyCache.has(cacheKey)) {
    return keyCache.get(cacheKey)!;
  }

  try {
    const keyHex = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, seed);
    const key = await AESEncryptionKey.import(keyHex, 'hex');
    keyCache.set(cacheKey, key);
    return key;
  } catch (err) {
    console.warn('[E2EE] Failed to derive AES encryption key:', err);
    return null;
  }
}

/**
 * Encrypts a plaintext message string into an authenticated AES-256-GCM ciphertext payload.
 * Returns: E2EE:v1:<base64-combined-sealed-data>
 */
export async function encryptMessage(
  plainText: string,
  aesKey: AESEncryptionKey | null
): Promise<string> {
  if (!plainText || !aesKey) {
    return plainText;
  }

  try {
    const inputBytes = new TextEncoder().encode(plainText);
    const sealedData = await aesEncryptAsync(inputBytes, aesKey);
    const combinedB64 = await sealedData.combined('base64');
    return `${E2EE_PREFIX}${combinedB64}`;
  } catch (err) {
    console.warn('[E2EE] Encryption failed, sending plaintext:', err);
    return plainText;
  }
}

/**
 * Decrypts an authenticated AES-256-GCM ciphertext payload back into readable plaintext.
 * If the message is not prefixed with E2EE:v1:, returns it as-is for backward compatibility.
 */
export async function decryptMessage(
  cipherText: string,
  aesKey: AESEncryptionKey | null
): Promise<string> {
  if (!cipherText || !cipherText.startsWith(E2EE_PREFIX)) {
    return cipherText;
  }

  if (!aesKey) {
    return '🔒 Encrypted message';
  }

  try {
    const payload = cipherText.substring(E2EE_PREFIX.length);
    const sealedData = AESSealedData.fromCombined(payload);
    const decryptedBytes = await aesDecryptAsync(sealedData, aesKey, { output: 'bytes' });
    return new TextDecoder().decode(decryptedBytes);
  } catch (err) {
    console.warn('[E2EE] Decryption failed:', err);
    return '🔒 [Encrypted message - Key mismatch]';
  }
}
