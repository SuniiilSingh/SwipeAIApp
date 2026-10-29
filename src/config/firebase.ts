/**
 * Firebase Configuration for BlunderR Phone Authentication
 * 
 * Paste your Firebase web config credentials from the Firebase Console here:
 * Project settings (⚙️) -> General -> Your apps -> Web app (</>)
 */

export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "", // e.g. "AIzaSy..."
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "blunderr-e702b.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "blunderr-e702b",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "blunderr-e702b.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

/**
 * Checks whether live Firebase configuration keys have been populated.
 */
export const isFirebaseConfigured = (): boolean => {
  return (
    typeof FIREBASE_CONFIG.apiKey === 'string' &&
    FIREBASE_CONFIG.apiKey.trim().length > 10 &&
    !FIREBASE_CONFIG.apiKey.includes('placeholder')
  );
};
