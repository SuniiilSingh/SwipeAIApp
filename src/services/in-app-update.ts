import { NativeModules, NativeEventEmitter, Platform, Linking } from 'react-native';
import { api } from '@/services/api';
import Constants from 'expo-constants';

const { InAppUpdateModule } = NativeModules;

export interface AppVersionInfo {
  latestVersionName: string;
  latestVersionCode: number;
  minSupportedVersionCode: number;
  updateType: 'FLEXIBLE' | 'IMMEDIATE';
  title: string;
  message: string;
  apkDownloadUrl: string;
  playStoreUrl: string;
}

export interface InAppUpdateState {
  status: 'IDLE' | 'AVAILABLE' | 'DOWNLOADING' | 'DOWNLOADED' | 'DISMISSED' | 'FAILED';
  progressPercent: number;
  bytesDownloaded: number;
  totalBytes: number;
  versionName?: string;
  versionCode?: number;
  isGooglePlay: boolean;
  apkDownloadUrl?: string;
  playStoreUrl?: string;
  title?: string;
  message?: string;
}

type UpdateListener = (state: InAppUpdateState) => void;

class InAppUpdateService {
  private listeners: Set<UpdateListener> = new Set();
  private eventEmitter: NativeEventEmitter | null = null;
  private currentState: InAppUpdateState = {
    status: 'IDLE',
    progressPercent: 0,
    bytesDownloaded: 0,
    totalBytes: 0,
    isGooglePlay: false,
  };
  private initialized = false;

  constructor() {
    if (Platform.OS === 'android' && InAppUpdateModule) {
      this.eventEmitter = new NativeEventEmitter(InAppUpdateModule);
      this.setupNativeListeners();
    }
  }

  private setupNativeListeners() {
    if (!this.eventEmitter) return;

    this.eventEmitter.addListener('onUpdateDownloading', (data: any) => {
      const bytes = data.bytesDownloaded || 0;
      const total = data.totalBytesToDownload || 1;
      const percent = Math.min(100, Math.round((bytes / total) * 100));

      this.updateState({
        status: 'DOWNLOADING',
        bytesDownloaded: bytes,
        totalBytes: total,
        progressPercent: percent,
      });
    });

    this.eventEmitter.addListener('onUpdateDownloaded', () => {
      this.updateState({
        status: 'DOWNLOADED',
        progressPercent: 100,
      });
    });

    this.eventEmitter.addListener('onUpdateFailed', () => {
      this.updateState({ status: 'FAILED' });
    });

    this.eventEmitter.addListener('onUpdateCanceled', () => {
      this.updateState({ status: 'IDLE' });
    });
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<InAppUpdateState>) {
    this.currentState = { ...this.currentState, ...partial };
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentState);
      } catch (e) {
        console.warn('Update listener error', e);
      }
    });
  }

  public getState(): InAppUpdateState {
    return this.currentState;
  }

  /**
   * Check for update on Google Play (native) with fallback to backend version check.
   */
  public async checkForUpdate(): Promise<InAppUpdateState> {
    if (this.initialized && this.currentState.status !== 'IDLE') {
      return this.currentState;
    }
    this.initialized = true;

    // 1. First check if an update was already downloaded in a previous session
    if (Platform.OS === 'android' && InAppUpdateModule?.checkDownloadedStatus) {
      try {
        const isDownloaded = await InAppUpdateModule.checkDownloadedStatus();
        if (isDownloaded) {
          this.updateState({
            status: 'DOWNLOADED',
            isGooglePlay: true,
            progressPercent: 100,
          });
          return this.currentState;
        }
      } catch (e) {}
    }

    // 2. Query Native Google Play Core In-App Updates
    if (Platform.OS === 'android' && InAppUpdateModule?.checkForUpdate) {
      try {
        const result = await InAppUpdateModule.checkForUpdate();
        if (result && result.isAvailable && result.isFlexibleAllowed) {
          this.updateState({
            status: 'AVAILABLE',
            isGooglePlay: true,
            versionCode: result.availableVersionCode,
            title: 'Update Available ✨',
            message: 'A newer version of BlunderR is ready on Google Play.',
          });
          return this.currentState;
        }
      } catch (e) {
        console.log('[InAppUpdate] Google Play native check skipped/failed:', e);
      }
    }

    // 3. Fallback to Backend Version Handshake API (/v1/system/app-version)
    try {
      const remoteInfo = await api.getAppVersion();
      if (remoteInfo) {
        const currentVersionCode =
          Constants.expoConfig?.android?.versionCode ??
          Constants.manifest2?.extra?.expoClient?.android?.versionCode ??
          9;

        if (remoteInfo.latestVersionCode > currentVersionCode) {
          this.updateState({
            status: 'AVAILABLE',
            isGooglePlay: false,
            versionName: remoteInfo.latestVersionName,
            versionCode: remoteInfo.latestVersionCode,
            title: remoteInfo.title || 'New Update Available ✨',
            message: remoteInfo.message || 'BlunderR has a fresh update with new features.',
            apkDownloadUrl: remoteInfo.apkDownloadUrl,
            playStoreUrl: remoteInfo.playStoreUrl,
          });
        }
      }
    } catch (e) {
      // Backend check is non-fatal
    }

    return this.currentState;
  }

  /**
   * Start Flexible background update:
   * - On Google Play: Launches native background download flow.
   * - Fallback: Opens download URL or Play Store page.
   */
  public async startFlexibleUpdate(): Promise<void> {
    if (this.currentState.isGooglePlay && InAppUpdateModule?.startFlexibleUpdate) {
      try {
        this.updateState({ status: 'DOWNLOADING', progressPercent: 0 });
        await InAppUpdateModule.startFlexibleUpdate();
      } catch (e: any) {
        console.warn('[InAppUpdate] startFlexibleUpdate error:', e);
        this.updateState({ status: 'FAILED' });
      }
    } else if (this.currentState.apkDownloadUrl || this.currentState.playStoreUrl) {
      const targetUrl =
        Platform.OS === 'android' && this.currentState.playStoreUrl
          ? this.currentState.playStoreUrl
          : this.currentState.apkDownloadUrl;
      if (targetUrl) {
        Linking.openURL(targetUrl).catch(() => {});
        this.updateState({ status: 'DISMISSED' });
      }
    }
  }

  /**
   * Complete update by restarting into the downloaded APK bundle.
   */
  public async completeUpdate(): Promise<void> {
    if (Platform.OS === 'android' && InAppUpdateModule?.completeUpdate) {
      try {
        await InAppUpdateModule.completeUpdate();
      } catch (e) {
        console.warn('[InAppUpdate] completeUpdate error:', e);
      }
    }
  }

  public dismiss(): void {
    this.updateState({ status: 'DISMISSED' });
  }
}

export const inAppUpdateService = new InAppUpdateService();
