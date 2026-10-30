/**
 * Resilient Multi-Provider Phone Authentication Service
 * 
 * Flow:
 * 1. Primary: Firebase Phone Auth (10,000 Free OTPs/month)
 * 2. If Firebase Limit / Quota Exceeded:
 *    - Checks if secondary provider (2Factor / Fast2SMS) is configured
 *    - If yes -> Failover to secondary provider automatically
 *    - If no  -> Stays on Firebase Phone Auth
 * 3. Supports Mock OTP (123456) for instant developer testing
 */

import { api } from '@/services/api';
import { FIREBASE_CONFIG, isFirebaseConfigured } from '@/config/firebase';
import { FEATURE_FLAGS } from '@/config/features';

export interface PhoneAuthSession {
  phoneE164: string;
  provider: 'firebase' | 'secondary' | 'mock';
  sessionInfo?: string; // Firebase verification session ID
  secondaryChannel?: 'sms' | 'whatsapp';
  message?: string;
  isMock?: boolean;
}

class PhoneAuthService {
  private activeSession: PhoneAuthSession | null = null;

  /**
   * Dispatches OTP using Firebase Phone Auth as primary, with automatic
   * fallback to secondary provider if quota is exceeded.
   */
  async sendOtp(
    phoneE164: string,
    channel: 'sms' | 'whatsapp' = 'sms'
  ): Promise<PhoneAuthSession> {
    const normalizedPhone = api.normalizePhone(phoneE164);

    // Primary: Attempt Firebase Phone Auth for real SMS delivery
    if (isFirebaseConfigured()) {
      try {
        const sessionInfo = await this.sendFirebaseSms(normalizedPhone);
        const session: PhoneAuthSession = {
          phoneE164: normalizedPhone,
          provider: 'firebase',
          sessionInfo,
          message: 'OTP sent via SMS',
        };
        this.activeSession = session;
        return session;
      } catch (fbErr: any) {
        console.warn('[PhoneAuth] Firebase OTP error, falling back to backend:', fbErr?.message || fbErr);

        // Graceful fallback to backend OTP dispatch so users are never blocked by Google app verification
        try {
          const backendResult = await api.sendOtp(normalizedPhone, channel);
          const session: PhoneAuthSession = {
            phoneE164: normalizedPhone,
            provider: 'secondary',
            secondaryChannel: channel,
            message: backendResult.message || 'OTP sent via SMS',
            isMock: false,
          };
          this.activeSession = session;
          return session;
        } catch (backendErr: any) {
          console.warn('[PhoneAuth] Backend dispatch fallback error:', backendErr?.message || backendErr);
          throw fbErr;
        }
      }
    }

    // Fallback to configured backend provider
    const backendResult = await api.sendOtp(normalizedPhone, channel);
    const session: PhoneAuthSession = {
      phoneE164: normalizedPhone,
      provider: 'secondary',
      secondaryChannel: channel,
      message: backendResult.message || 'OTP sent successfully',
      isMock: false,
    };
    this.activeSession = session;
    return session;
  }

  /**
   * Verifies the OTP code and creates or logs in the user session.
   */
  async verifyOtp(
    phoneE164: string,
    otpCode: string,
    extraData?: {
      channel?: 'sms' | 'whatsapp';
      gender?: any;
      intent?: any;
      birthDate?: string;
      latitude?: number;
      longitude?: number;
      city?: string;
      location?: string;
    }
  ): Promise<any> {
    const normalizedPhone = api.normalizePhone(phoneE164);
    const cleanOtp = otpCode.trim();

    // 1. Firebase verification (Real SMS OTP or Firebase Whitelisted Test Numbers)
    if (this.activeSession?.provider === 'firebase' && this.activeSession.sessionInfo) {
      try {
        const idToken = await this.verifyFirebaseSms(this.activeSession.sessionInfo, cleanOtp);
        try {
          return await api.firebaseLogin(idToken, normalizedPhone, extraData);
        } catch (fbLoginErr: any) {
          console.log('[PhoneAuth] Fallback to standard verify endpoint:', fbLoginErr?.message);
          return await api.verifyOtp(
            normalizedPhone,
            cleanOtp,
            extraData?.channel || 'sms',
            extraData?.latitude,
            extraData?.longitude,
            extraData?.city,
            extraData?.location
          );
        }
      } catch (fbVerifyErr: any) {
        console.log('[PhoneAuth] Firebase verify failed, trying standard verify endpoint:', fbVerifyErr?.message);
        return await api.verifyOtp(
          normalizedPhone,
          cleanOtp,
          extraData?.channel || 'sms',
          extraData?.latitude,
          extraData?.longitude,
          extraData?.city,
          extraData?.location
        );
      }
    }

    // 2. Secondary provider verification
    return api.verifyOtp(
      normalizedPhone,
      cleanOtp,
      extraData?.channel || 'sms',
      extraData?.latitude,
      extraData?.longitude,
      extraData?.city,
      extraData?.location
    );
  }

  /**
   * Google Identity Toolkit REST API: sendVerificationCode
   */
  private async sendFirebaseSms(phoneNumber: string): Promise<string> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${FIREBASE_CONFIG.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = data?.error?.message || 'Failed to send SMS via Firebase';
      if (errMsg.includes('MISSING_CLIENT_IDENTIFIER')) {
        throw new Error(
          'Firebase App Verification: Google requires Play Integrity or reCAPTCHA to send live SMS to unlisted numbers. To test, please add your number under Firebase Console ➔ Authentication ➔ Sign-in method ➔ Phone ➔ Phone numbers for testing.'
        );
      }
      throw new Error(errMsg);
    }

    return data.sessionInfo;
  }

  /**
   * Google Identity Toolkit REST API: signInWithPhoneNumber
   */
  private async verifyFirebaseSms(sessionInfo: string, code: string): Promise<string> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${FIREBASE_CONFIG.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionInfo,
        code,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = data?.error?.message || 'Invalid or expired Firebase verification code';
      throw new Error(errMsg);
    }

    return data.idToken;
  }
}

export const phoneAuthService = new PhoneAuthService();
