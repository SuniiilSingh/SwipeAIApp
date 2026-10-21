import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  FIRST_SWIPE_DATE: '@blunderr_first_swipe_date',
  DAILY_SWIPES: '@blunderr_daily_swipes',
  LAST_INTERSTITIAL_DATE: '@blunderr_interstitial_last_shown_date',
};

const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export interface EngagementStatus {
  isEligibleForPrompt: boolean;
  dayNumber: number;
  swipesToday: number;
  firstSwipeDate: string;
}

/**
 * Checks whether the user is eligible to be shown in-feed interstitial cards
 * (e.g. 1-Tap Vibe Quiz or 6-Photo Booster).
 * 
 * Rules:
 * - Day 1: User must have swiped MORE THAN 20 profiles (swipesToday > 20).
 * - Day 2+: User must have swiped MORE THAN 5 profiles (swipesToday > 5).
 * - Only asks ONCE per calendar day.
 */
export const getEngagementStatus = async (): Promise<EngagementStatus> => {
  try {
    const today = getTodayString();
    const [storedFirstDate, storedDailyRaw, storedLastShown] = await Promise.all([
      AsyncStorage.getItem(KEYS.FIRST_SWIPE_DATE),
      AsyncStorage.getItem(KEYS.DAILY_SWIPES),
      AsyncStorage.getItem(KEYS.LAST_INTERSTITIAL_DATE),
    ]);

    let firstDate = storedFirstDate;
    if (!firstDate) {
      firstDate = today;
      await AsyncStorage.setItem(KEYS.FIRST_SWIPE_DATE, today);
    }

    let dailyCount = 0;
    if (storedDailyRaw) {
      try {
        const parsed = JSON.parse(storedDailyRaw);
        if (parsed.date === today && typeof parsed.count === 'number') {
          dailyCount = parsed.count;
        }
      } catch (e) {}
    }

    // Calculate day number (1-indexed)
    const firstTime = new Date(firstDate).getTime();
    const todayTime = new Date(today).getTime();
    const diffDays = Math.max(0, Math.floor((todayTime - firstTime) / (1000 * 60 * 60 * 24)));
    const dayNumber = diffDays + 1;

    // Check if already shown today
    const alreadyShownToday = storedLastShown === today;

    // Engagement thresholds
    const isDayOne = dayNumber <= 1;
    const meetsThreshold = isDayOne ? dailyCount > 20 : dailyCount > 5;
    const isEligible = !alreadyShownToday && meetsThreshold;

    return {
      isEligibleForPrompt: isEligible,
      dayNumber,
      swipesToday: dailyCount,
      firstSwipeDate: firstDate,
    };
  } catch (err) {
    console.warn('[engagement-cadence] Error reading status:', err);
    return {
      isEligibleForPrompt: false,
      dayNumber: 1,
      swipesToday: 0,
      firstSwipeDate: getTodayString(),
    };
  }
};

/**
 * Records a swipe event, incrementing today's swipe counter in AsyncStorage.
 * Returns the updated engagement eligibility.
 */
export const recordSwipeEvent = async (): Promise<EngagementStatus> => {
  try {
    const today = getTodayString();
    let storedFirstDate = await AsyncStorage.getItem(KEYS.FIRST_SWIPE_DATE);
    if (!storedFirstDate) {
      storedFirstDate = today;
      await AsyncStorage.setItem(KEYS.FIRST_SWIPE_DATE, today);
    }

    const storedDailyRaw = await AsyncStorage.getItem(KEYS.DAILY_SWIPES);
    let count = 0;
    if (storedDailyRaw) {
      try {
        const parsed = JSON.parse(storedDailyRaw);
        if (parsed.date === today && typeof parsed.count === 'number') {
          count = parsed.count;
        }
      } catch (e) {}
    }

    count += 1;
    await AsyncStorage.setItem(KEYS.DAILY_SWIPES, JSON.stringify({ date: today, count }));

    const storedLastShown = await AsyncStorage.getItem(KEYS.LAST_INTERSTITIAL_DATE);
    const alreadyShownToday = storedLastShown === today;

    const firstTime = new Date(storedFirstDate).getTime();
    const todayTime = new Date(today).getTime();
    const diffDays = Math.max(0, Math.floor((todayTime - firstTime) / (1000 * 60 * 60 * 24)));
    const dayNumber = diffDays + 1;

    const isDayOne = dayNumber <= 1;
    const meetsThreshold = isDayOne ? count > 20 : count > 5;
    const isEligible = !alreadyShownToday && meetsThreshold;

    return {
      isEligibleForPrompt: isEligible,
      dayNumber,
      swipesToday: count,
      firstSwipeDate: storedFirstDate,
    };
  } catch (err) {
    console.warn('[engagement-cadence] Error recording swipe:', err);
    return {
      isEligibleForPrompt: false,
      dayNumber: 1,
      swipesToday: 0,
      firstSwipeDate: getTodayString(),
    };
  }
};

/**
 * Marks that the interstitial card (vibe quiz or booster) was answered,
 * skipped, or displayed today so the user is not prompted again until the next day.
 */
export const markInterstitialShownToday = async (): Promise<void> => {
  try {
    const today = getTodayString();
    await AsyncStorage.setItem(KEYS.LAST_INTERSTITIAL_DATE, today);
  } catch (err) {
    console.warn('[engagement-cadence] Error marking shown today:', err);
  }
};
