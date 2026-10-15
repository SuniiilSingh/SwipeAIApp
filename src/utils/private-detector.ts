import AsyncStorage from '@react-native-async-storage/async-storage';

const REVEALED_IMAGES_KEY = '@blunderr_revealed_images_v1';
const REPORTED_MEDIA_KEY = '@blunderr_reported_media_v1';

class PrivateDetectorService {
  private revealedSet: Set<string> = new Set();
  private isLoaded: boolean = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(REVEALED_IMAGES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.revealedSet = new Set(parsed);
        }
      }
    } catch {}
    this.isLoaded = true;
  }

  /**
   * Determine if an image should be blurred on-device.
   * Incoming media from matches is auto-protected by default unless already unblurred.
   */
  public shouldBlurImage(messageId: string, isFromMe?: boolean, serverBlurred?: boolean): boolean {
    // Never blur user's own sent images
    if (isFromMe) {
      return false;
    }

    // If user already revealed this photo on this device, do not blur
    if (this.revealedSet.has(messageId)) {
      return false;
    }

    // Server-side explicit detection flag takes precedence
    if (serverBlurred) {
      return true;
    }

    // Client-side Private Detector: Auto-blur incoming unrevealed media
    return true;
  }

  /**
   * Reveal an image and persist preference locally.
   */
  public async revealImage(messageId: string): Promise<void> {
    this.revealedSet.add(messageId);
    try {
      await AsyncStorage.setItem(
        REVEALED_IMAGES_KEY,
        JSON.stringify(Array.from(this.revealedSet))
      );
    } catch {}
  }

  /**
   * Keep an image blurred (remove from revealed set if present).
   */
  public async hideImage(messageId: string): Promise<void> {
    this.revealedSet.delete(messageId);
    try {
      await AsyncStorage.setItem(
        REVEALED_IMAGES_KEY,
        JSON.stringify(Array.from(this.revealedSet))
      );
    } catch {}
  }

  /**
   * Report and record inappropriate unsolicited media.
   */
  public async reportMedia(messageId: string, reason: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(REPORTED_MEDIA_KEY);
      const list = stored ? JSON.parse(stored) : [];
      list.push({ messageId, reason, timestamp: new Date().toISOString() });
      await AsyncStorage.setItem(REPORTED_MEDIA_KEY, JSON.stringify(list));
    } catch {}
  }
}

export const privateDetector = new PrivateDetectorService();
