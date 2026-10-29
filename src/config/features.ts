/**
 * BlunderR Application Feature Flags
 * Controls feature rollouts across production and development builds.
 */
export const FEATURE_FLAGS = {
  /**
   * DigiLocker Government ID verification.
   * Disabled for current deployment build.
   */
  ENABLE_DIGILOCKER: false,

  /**
   * WhatsApp Authentication & OTP Verification.
   * Disabled for current release build; will be pushed in next release.
   */
  ENABLE_WHATSAPP_AUTH: false,

  /**
   * 3D Biometric Liveness Verification (Active with Camera Movement Recording).
   */
  ENABLE_LIVENESS: true,

  /**
   * Async 3D Liveness Multi-Touch Recovery Loop.
   * Locks messaging and match interactions until user completes 3D liveness check.
   */
  ENABLE_ASYNC_LIVENESS_RECOVERY: true,

  /**
   * Shadow Shield Relative & Boss Privacy Hashing.
   */
  ENABLE_SHADOW_SHIELD: true,

  /**
   * UPI Micro-Sachet Store & Instant Orders.
   * Disabled for 100% Free Play Store V1.0 launch review.
   */
  ENABLE_UPI_PAYMENTS: false,

  /**
   * VibeStore Tab & Payment Paywalls.
   * Disabled for 100% Free Play Store V1.0 launch review.
   * Set to true once Google Play Billing is connected in V1.1.
   */
  ENABLE_STORE: false,

  /**
   * Virtual Chai Audio/Video Masked Calling.
   * Set to false for V1.0 launch; will be enabled in V1.1 feature update.
   */
  ENABLE_CALLING: false,

  /**
   * Light Mode Theme Support.
   * Disabled as of now; app is locked to Obsidian Dark mode.
   * Toggle to true to re-enable Warm Ivory Light mode.
   */
  ENABLE_LIGHT_MODE: false,

  /**
   * Test Mode / Mock OTP:
   * When true, accepts OTP 123456 and auto-populates it for instant onboarding advancement.
   * Primary authentication uses Firebase Phone Auth (10,000 free OTPs/mo).
   */
  USE_MOCK_OTP: true,
};
