/**
 * Blunderr Dating Application Feature Flags
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
   * Shadow Shield Relative & Boss Privacy Hashing.
   */
  ENABLE_SHADOW_SHIELD: true,

  /**
   * UPI Micro-Sachet Store & Instant Orders.
   */
  ENABLE_UPI_PAYMENTS: true,

  /**
   * Virtual Chai Audio/Video Masked Calling.
   * Set to false for V1.0 launch; will be enabled in V1.1 feature update.
   */
  ENABLE_CALLING: false,

  /**
   * Twilio Test Mode / Mock OTP:
   * When true, bypasses real Twilio SMS/WhatsApp dispatch, accepts OTP 123456,
   * and auto-populates it for instant onboarding advancement.
   * Toggle to false when deploying to the next environment with live Twilio.
   */
  USE_MOCK_OTP: true,
};
