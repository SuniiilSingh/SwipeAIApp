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

let ringtoneInterval: any = null;
let ringtoneAudioContext: any = null;

/**
 * Plays an authentic incoming ringtone loop with rhythmic vibrations until answered or declined.
 */
export async function playIncomingRingtone(): Promise<void> {
  stopIncomingRingtone();

  if (Platform.OS === 'web') {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        ringtoneAudioContext = new AudioCtx();
        const playChimeBurst = () => {
          if (!ringtoneAudioContext || ringtoneAudioContext.state === 'closed') return;
          const osc1 = ringtoneAudioContext.createOscillator();
          const osc2 = ringtoneAudioContext.createOscillator();
          const gain = ringtoneAudioContext.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(440, ringtoneAudioContext.currentTime); // A4
          osc1.frequency.exponentialRampToValueAtTime(880, ringtoneAudioContext.currentTime + 0.4);

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(554.37, ringtoneAudioContext.currentTime); // C#5
          osc2.frequency.exponentialRampToValueAtTime(1108.73, ringtoneAudioContext.currentTime + 0.4);

          gain.gain.setValueAtTime(0.18, ringtoneAudioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ringtoneAudioContext.currentTime + 0.8);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ringtoneAudioContext.destination);

          osc1.start();
          osc2.start();
          osc1.stop(ringtoneAudioContext.currentTime + 0.8);
          osc2.stop(ringtoneAudioContext.currentTime + 0.8);
        };

        playChimeBurst();
        ringtoneInterval = setInterval(playChimeBurst, 1800);
      }
    } catch {}
  } else {
    try {
      await initAudioSettings();
      const playNativeRingtone = () => {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          const player = createAudioPlayer(MESSAGE_SOUND_ASSET);
          player.play();
          player.addListener('playbackStatusUpdate', (status: any) => {
            if (status.didJustFinish) {
              try { player.release(); } catch {}
            }
          });
        } catch {}
      };

      playNativeRingtone();
      ringtoneInterval = setInterval(playNativeRingtone, 2000);
    } catch {}
  }
}

/**
 * Stops any active incoming call ringtone.
 */
export function stopIncomingRingtone(): void {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
  if (ringtoneAudioContext) {
    try {
      ringtoneAudioContext.close();
    } catch {}
    ringtoneAudioContext = null;
  }
}
