import * as Crypto from 'expo-crypto';
import { AESEncryptionKey, AESSealedData, aesEncryptAsync, aesDecryptAsync } from 'expo-crypto';

// In-memory key cache keyed by matchId
const keyCache = new Map<string, AESEncryptionKey>();

export const E2EE_PREFIX = 'E2EE:v1:';

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

export function safeAtob(input: string): string {
  if (typeof atob === 'function') {
    return atob(input);
  }
  const str = input.replace(/=+$/, '');
  let output = '';
  let bc = 0;
  let bs = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i);
    const index = B64_CHARS.indexOf(char);
    if (index === -1) continue;
    bs = bc % 4 ? bs * 64 + index : index;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
}

export function safeBtoa(input: string): string {
  if (typeof btoa === 'function') {
    return btoa(input);
  }
  let output = '';
  let i = 0;
  while (i < input.length) {
    const c1 = input.charCodeAt(i++);
    const c2 = input.charCodeAt(i++);
    const c3 = input.charCodeAt(i++);

    const e1 = c1 >> 2;
    const e2 = ((c1 & 3) << 4) | (c2 >> 4);
    let e3 = ((c2 & 15) << 2) | (c3 >> 6);
    let e4 = c3 & 63;

    if (isNaN(c2)) {
      e3 = 64;
      e4 = 64;
    } else if (isNaN(c3)) {
      e4 = 64;
    }

    output +=
      B64_CHARS.charAt(e1) +
      B64_CHARS.charAt(e2) +
      (e3 === 64 ? '=' : B64_CHARS.charAt(e3)) +
      (e4 === 64 ? '=' : B64_CHARS.charAt(e4));
  }
  return output;
}

export function base64ToUint8Array(b64: string): Uint8Array {
  const binary = safeAtob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return safeBtoa(binary);
}

export function utf8ToBytes(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return new Uint8Array(utf8);
}

export function bytesToUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(bytes);
  }
  let out = '';
  let i = 0;
  const len = bytes.length;
  while (i < len) {
    const c = bytes[i++];
    switch (c >> 4) {
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        out += String.fromCharCode(c);
        break;
      case 12: case 13: {
        const char2 = bytes[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      }
      case 14: {
        const char2 = bytes[i++];
        const char3 = bytes[i++];
        out += String.fromCharCode(((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | (char3 & 0x3f));
        break;
      }
      case 15: {
        const char2 = bytes[i++];
        const char3 = bytes[i++];
        const char4 = bytes[i++];
        const codepoint =
          (((c & 0x07) << 18) | ((char2 & 0x3f) << 12) | ((char3 & 0x3f) << 6) | (char4 & 0x3f)) - 0x10000;
        out += String.fromCharCode((codepoint >> 10) + 0xd800, (codepoint & 0x3ff) + 0xdc00);
        break;
      }
    }
  }
  return out;
}

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
    const inputBytes = utf8ToBytes(plainText);
    const sealedData = await aesEncryptAsync(inputBytes, aesKey);
    const combinedResult = await sealedData.combined('bytes');
    let combinedB64: string;
    if (combinedResult instanceof Uint8Array) {
      combinedB64 = uint8ArrayToBase64(combinedResult);
    } else if (typeof combinedResult === 'string') {
      combinedB64 = combinedResult;
    } else {
      const b64 = await sealedData.combined('base64');
      combinedB64 = typeof b64 === 'string' ? b64 : uint8ArrayToBase64(b64 as unknown as Uint8Array);
    }
    return `${E2EE_PREFIX}${combinedB64}`;
  } catch (err) {
    console.warn('[E2EE] Encryption failed, sending plaintext:', err);
    return plainText;
  }
}

/**
 * Decrypts an authenticated AES-256-GCM ciphertext payload back into readable plaintext.
 * Handles cross-platform conversion: Android requires Uint8Array rather than raw base64 string
 * for SealedData reconstruction.
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
    const payload = cipherText.substring(E2EE_PREFIX.length).trim();
    if (!payload) {
      return cipherText;
    }

    // Convert base64 payload to Uint8Array so it maps to Kotlin ByteArray on Android and Data on iOS
    const combinedBytes = base64ToUint8Array(payload);
    if (combinedBytes.length < 28) {
      // 12 bytes IV + 16 bytes tag minimum
      return cipherText;
    }

    let sealedData: AESSealedData;
    try {
      // Pass Uint8Array directly - avoids Android Kotlin ArgumentCastException
      sealedData = AESSealedData.fromCombined(combinedBytes);
    } catch {
      // Robust fallback: reconstruct SealedData via fromParts (IV: 12 bytes, ciphertext, Tag: 16 bytes)
      const iv = combinedBytes.subarray(0, 12);
      const ciphertext = combinedBytes.subarray(12, combinedBytes.length - 16);
      const tag = combinedBytes.subarray(combinedBytes.length - 16);
      sealedData = AESSealedData.fromParts(iv, ciphertext, tag);
    }

    try {
      const decryptedBytes = await aesDecryptAsync(sealedData, aesKey, { output: 'bytes' });
      if (decryptedBytes instanceof Uint8Array) {
        return bytesToUtf8(decryptedBytes);
      }
      return String(decryptedBytes);
    } catch {
      // Fallback with base64 output
      const decryptedB64 = await aesDecryptAsync(sealedData, aesKey, { output: 'base64' });
      if (typeof decryptedB64 === 'string') {
        const bytes = base64ToUint8Array(decryptedB64);
        return bytesToUtf8(bytes);
      }
      return bytesToUtf8(decryptedB64 as unknown as Uint8Array);
    }
  } catch (err) {
    console.warn('[E2EE] Decryption failed:', err);
    return '🔒 [Encrypted message - Key mismatch]';
  }
}
