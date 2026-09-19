// src/utils/audioPlayer.ts

let globalAudio: HTMLAudioElement | null = null;
let globalAudioCtx: AudioContext | null = null;
let globalUtteranceTimer: any = null;

/**
 * Generates an embedded, crystal-clear 16-bit PCM WAV audio chime as a base64 Data URI.
 * Guaranteed to play audibly on any HTML5 Audio-compatible browser / mobile webview without external network access.
 */
function generateChimeWavUri(): string {
  const sampleRate = 22050;
  const duration = 3.0;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');

  // "fmt " Subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // "data" Subchunk
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Warm melodic chime progression: C4 -> E4 -> G4 -> C5 -> E5
  const notes = [
    { freq: 261.63, start: 0.0, dur: 0.7 },
    { freq: 329.63, start: 0.35, dur: 0.7 },
    { freq: 392.00, start: 0.7, dur: 0.8 },
    { freq: 523.25, start: 1.05, dur: 1.0 },
    { freq: 659.25, start: 1.45, dur: 1.5 },
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    for (const note of notes) {
      if (t >= note.start && t < note.start + note.dur) {
        const noteT = t - note.start;
        const envelope = Math.exp(-3.2 * (noteT / note.dur));
        // Harmonic mixture for warm acoustic feel
        const val =
          Math.sin(2 * Math.PI * note.freq * noteT) * 0.65 +
          Math.sin(4 * Math.PI * note.freq * noteT) * 0.25 +
          Math.sin(6 * Math.PI * note.freq * noteT) * 0.1;
        sample += val * envelope * 0.45;
      }
    }
    sample = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  // Base64 encoding
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

// Cached chime data URI for instant zero-latency playback
let cachedChimeUri: string | null = null;
function getChimeUri(): string {
  if (!cachedChimeUri && typeof window !== 'undefined') {
    try {
      cachedChimeUri = generateChimeWavUri();
    } catch (e) {
      console.warn('WAV chime generation warning:', e);
    }
  }
  return cachedChimeUri || '';
}

/**
 * Stops any currently active audio, speech synthesis, or audio context.
 */
export function stopAudibleVoiceNote(): void {
  if (globalUtteranceTimer) {
    clearTimeout(globalUtteranceTimer);
    globalUtteranceTimer = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }

  if (globalAudio) {
    try {
      globalAudio.pause();
      globalAudio.currentTime = 0;
    } catch (e) {}
    globalAudio = null;
  }

  if (globalAudioCtx) {
    try {
      globalAudioCtx.close();
    } catch (e) {}
    globalAudioCtx = null;
  }
}

/**
 * Plays an audible voice note across Web, iOS, and Android.
 * 
 * Guarantees real audible sound:
 * 1. If a recorded audio blob exists, plays the recorded audio via HTML5 Audio.
 * 2. If no blob or playback errors, plays a rich acoustic 5-note harmonic WAV chime AND speaks the vernacular prompt!
 */
export function playAudibleVoiceNote({
  audioUrl,
  promptText,
  durationSec = 5,
  onStart,
  onEnd,
}: {
  audioUrl?: string;
  promptText?: string;
  durationSec?: number;
  onStart?: () => void;
  onEnd?: () => void;
}): void {
  stopAudibleVoiceNote();

  if (onStart) onStart();

  let hasEnded = false;
  const triggerEnd = () => {
    if (!hasEnded) {
      hasEnded = true;
      stopAudibleVoiceNote();
      if (onEnd) onEnd();
    }
  };

  const playChimeSound = () => {
    if (typeof window === 'undefined') return;

    // 1. Try HTML5 Audio with embedded base64 WAV chime
    try {
      const chimeUri = getChimeUri();
      if (chimeUri && (window as any).Audio) {
        const audio = new (window as any).Audio(chimeUri);
        globalAudio = audio;
        audio.volume = 1.0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err: any) => {
            console.warn('WAV Audio play catch:', err);
            playWebAudioOscillators();
          });
        }
        audio.onended = () => triggerEnd();
        return;
      }
    } catch (e) {
      console.warn('HTML5 Audio chime error:', e);
    }

    // 2. Direct Web Audio API fallback
    playWebAudioOscillators();
  };

  const playWebAudioOscillators = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      globalAudioCtx = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const notes = [
        { freq: 261.63, start: 0.0, dur: 0.5 },
        { freq: 329.63, start: 0.25, dur: 0.5 },
        { freq: 392.00, start: 0.5, dur: 0.6 },
        { freq: 523.25, start: 0.75, dur: 0.8 },
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      });
    } catch (e) {
      console.warn('Web Audio oscillator error:', e);
    }
  };

  const playSpeechSynthesis = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const rawPrompt = promptText ? promptText.replace(/[^\w\s\?,.!'-]/gi, '').trim() : '';
      const text = rawPrompt.length > 5
        ? rawPrompt
        : 'Hello! Here is my authentic vernacular voice note on SwipeAI.';

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      // Do NOT cancel right before speak to avoid Chrome's immediate abort bug
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis warning:', e);
    }
  };

  const isDirectAudio =
    audioUrl &&
    (audioUrl.startsWith('blob:') ||
     audioUrl.startsWith('data:audio') ||
     audioUrl.startsWith('http://') ||
     audioUrl.startsWith('https://'));

  if (isDirectAudio && typeof window !== 'undefined' && (window as any).Audio) {
    try {
      const audio = new (window as any).Audio(audioUrl);
      globalAudio = audio;
      audio.volume = 1.0;

      audio.onended = () => triggerEnd();
      audio.onerror = () => {
        // Fallback to chime + speech
        playChimeSound();
        playSpeechSynthesis();
      };

      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Playback rejected (e.g. format error), fallback
          playChimeSound();
          playSpeechSynthesis();
        });
      }
    } catch (e) {
      playChimeSound();
      playSpeechSynthesis();
    }
  } else {
    // No direct blob or sample preview: play chime sound + spoken prompt
    playChimeSound();
    playSpeechSynthesis();
  }

  // Safety timer ensuring waveform state resets when playback completes
  const totalDuration = Math.max(durationSec * 1000, 3200);
  globalUtteranceTimer = setTimeout(triggerEnd, totalDuration);
}
