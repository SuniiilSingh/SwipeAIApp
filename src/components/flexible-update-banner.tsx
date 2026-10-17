import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { inAppUpdateService, InAppUpdateState } from '@/services/in-app-update';

export const FlexibleUpdateBanner: React.FC = () => {
  const [updateState, setUpdateState] = useState<InAppUpdateState>(
    inAppUpdateService.getState()
  );
  const [slideAnim] = useState(new Animated.Value(100));

  useEffect(() => {
    // 1. Subscribe to update state changes
    const unsubscribe = inAppUpdateService.subscribe((state) => {
      setUpdateState(state);
      if (['AVAILABLE', 'DOWNLOADING', 'DOWNLOADED'].includes(state.status)) {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 9,
        }).start();
      } else {
        Animated.timing(slideAnim, {
          toValue: 120,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    });

    // 2. Check for update on mount
    inAppUpdateService.checkForUpdate().catch(() => {});

    return () => {
      unsubscribe();
    };
  }, []);

  if (
    updateState.status === 'IDLE' ||
    updateState.status === 'DISMISSED' ||
    updateState.status === 'FAILED'
  ) {
    return null;
  }

  const isDownloading = updateState.status === 'DOWNLOADING';
  const isDownloaded = updateState.status === 'DOWNLOADED';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}>
      <View
        style={[
          styles.card,
          isDownloaded ? styles.cardDownloaded : isDownloading ? styles.cardDownloading : styles.cardAvailable,
        ]}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>
              {isDownloaded ? '🥂' : isDownloading ? '⚡' : '🚀'}
            </Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.titleText}>
              {isDownloaded
                ? 'Update Ready to Install!'
                : isDownloading
                ? `Downloading Update (${updateState.progressPercent}%)`
                : updateState.title || 'New Update Available'}
            </Text>
            <Text style={styles.subtitleText} numberOfLines={2}>
              {isDownloaded
                ? 'Restart now to apply the latest BlunderR release with zero data loss.'
                : isDownloading
                ? 'Downloading quietly in background. Keep swiping and chatting!'
                : updateState.message || 'Enjoy smoother chats and discovery voice notes with zero disruption.'}
            </Text>
          </View>
        </View>

        {/* Progress Bar during download */}
        {isDownloading && (
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.max(5, updateState.progressPercent)}%` },
              ]}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {isDownloaded ? (
            <>
              <TouchableOpacity
                style={styles.primaryBtnEmerald}
                onPress={() => inAppUpdateService.completeUpdate()}
                activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Restart Now ⚡</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => inAppUpdateService.dismiss()}
                activeOpacity={0.8}>
                <Text style={styles.dismissBtnText}>Later</Text>
              </TouchableOpacity>
            </>
          ) : isDownloading ? (
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={() => inAppUpdateService.dismiss()}
              activeOpacity={0.8}>
              <Text style={styles.dismissBtnText}>Hide</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.primaryBtnCoral}
                onPress={() => inAppUpdateService.startFlexibleUpdate()}
                activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Update in Background ⬇️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => inAppUpdateService.dismiss()}
                activeOpacity={0.8}>
                <Text style={styles.dismissBtnText}>Not Now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 72,
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#12141F',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  cardAvailable: {
    borderColor: 'rgba(255, 56, 92, 0.35)',
  },
  cardDownloading: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  cardDownloaded: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    backgroundColor: '#0F1E19',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  subtitleText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  primaryBtnCoral: {
    backgroundColor: '#FF385C',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
  },
  primaryBtnEmerald: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  dismissBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  dismissBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
});
