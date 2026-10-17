import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { FEATURE_FLAGS } from '@/config/features';

type LivenessStatusListener = (needsRetry: boolean) => void;

class LivenessRecoveryManager {
  private listeners: Set<LivenessStatusListener> = new Set();
  private localOverride: boolean | null = null;

  subscribe(listener: LivenessStatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(needsRetry: boolean) {
    this.localOverride = needsRetry;
    this.listeners.forEach((listener) => {
      try {
        listener(needsRetry);
      } catch (err) {
        console.warn('LivenessRecoveryManager listener error:', err);
      }
    });
  }

  isRetryNeeded(): boolean {
    if (!FEATURE_FLAGS.ENABLE_ASYNC_LIVENESS_RECOVERY) {
      return false;
    }

    if (this.localOverride !== null) {
      return this.localOverride;
    }

    const cached = api.getCachedProfile();
    if (!cached) return false;

    // A single source of truth driven by backend user state
    return Boolean(
      cached.needsLivenessRetry ||
      cached.verificationStatus === 'RETRY_NEEDED' ||
      cached.verificationStatus === 'REJECTED'
    );
  }

  setRetryNeeded(val: boolean) {
    const cached = api.getCachedProfile();
    if (cached) {
      cached.needsLivenessRetry = val;
      if (val) {
        cached.verificationStatus = 'RETRY_NEEDED';
        cached.faceVerified = false;
      }
    }
    this.notify(val);
  }

  markResolved() {
    const cached = api.getCachedProfile();
    if (cached) {
      cached.needsLivenessRetry = false;
      cached.verificationStatus = 'VERIFIED';
      cached.faceVerified = true;
      if (cached.livenessScore < 0.85) {
        cached.livenessScore = 0.98;
      }
    }
    this.notify(false);
  }
}

export const livenessRecovery = new LivenessRecoveryManager();

export function useLivenessRecovery() {
  const [needsRetry, setNeedsRetry] = useState<boolean>(() => livenessRecovery.isRetryNeeded());

  useEffect(() => {
    // Initial sync
    setNeedsRetry(livenessRecovery.isRetryNeeded());

    // Subscribe to real-time single-flag state changes
    const unsubscribe = livenessRecovery.subscribe((val) => {
      setNeedsRetry(val);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    needsRetry: FEATURE_FLAGS.ENABLE_ASYNC_LIVENESS_RECOVERY && needsRetry,
    setRetryNeeded: (val: boolean) => livenessRecovery.setRetryNeeded(val),
    markResolved: () => livenessRecovery.markResolved(),
    isEnabled: FEATURE_FLAGS.ENABLE_ASYNC_LIVENESS_RECOVERY,
  };
}
