import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';

// Pre-load notification sound asset
const MESSAGE_SOUND_ASSET = require('../../assets/sounds/message_received.wav');

let isAudioConfigured = false;
let lastPlayedAt = 0;

/**
 * Initializes global audio session to allow concurrent playback and respect silent mode.
 */
export async function initAudioSettings(): Promise<void> {
  if (isAudioConfigured || Platform.OS === 'web') return;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
    isAudioConfigured = true;
  } catch (err) {
    console.warn('[SoundService] Failed to set audio mode:', err);
  }
}

/**
 * Plays an audible notification chime and triggers haptic feedback on the receiving device.
 * Includes a 400ms throttle to prevent overlapping chimes on rapid bursts.
 */
export async function playMessageReceivedSound(): Promise<void> {
  const now = Date.now();
  if (now - lastPlayedAt < 400) {
    return;
  }
  lastPlayedAt = now;

  // 1. Tactile notification on device
  try {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  } catch {}

  // 2. Audible chime playback
  try {
    await initAudioSettings();

    if (Platform.OS !== 'web') {
      const player = createAudioPlayer(MESSAGE_SOUND_ASSET);
      player.play();

      player.addListener('playbackStatusUpdate', (status: any) => {
        if (status.didJustFinish) {
          try {
            player.release();
          } catch {}
        }
      });
    }
  } catch (err) {
    console.warn('[SoundService] Could not play message received sound:', err);
  }
}
