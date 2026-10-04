/**
 * Height utilities and human biological range validation for Blunderr Dating.
 * Real-world adult human heights range from ~100 cm (3'3") to ~240 cm (7'10").
 */

export const MIN_HUMAN_HEIGHT_CM = 100; // ~3 ft 3 in
export const MAX_HUMAN_HEIGHT_CM = 240; // ~7 ft 10 in

/**
 * Converts height in cm to formatted string with both cm and feet/inches
 * e.g. 175 -> "175 cm (5'9")"
 */
export const formatHeight = (heightCm?: number | null): string => {
  if (!heightCm || heightCm <= 0) return '';
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${heightCm} cm (${feet}'${inches}")`;
};

/**
 * Returns imperial feet & inches representation for cm
 * e.g. 175 -> "5'9""
 */
export const cmToFeetInches = (heightCm: number): string => {
  if (!heightCm || heightCm <= 0) return '';
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
};

/**
 * Validates whether the given height in cm is within realistic human limits.
 */
export const isValidHumanHeight = (heightCm?: number | null): boolean => {
  if (heightCm == null || isNaN(heightCm)) return false;
  return heightCm >= MIN_HUMAN_HEIGHT_CM && heightCm <= MAX_HUMAN_HEIGHT_CM;
};

/**
 * Returns a human-friendly error message if height is outside bounds, or null if valid.
 */
export const getHeightValidationError = (heightStr?: string | null): string | null => {
  if (!heightStr || !heightStr.trim()) return null;
  const num = parseInt(heightStr.trim(), 10);
  if (isNaN(num)) return 'Please enter numbers only';
  if (num > MAX_HUMAN_HEIGHT_CM) {
    return `Max height is ${MAX_HUMAN_HEIGHT_CM} cm (${cmToFeetInches(MAX_HUMAN_HEIGHT_CM)})`;
  }
  if (num < MIN_HUMAN_HEIGHT_CM && heightStr.trim().length >= 3) {
    return `Min height is ${MIN_HUMAN_HEIGHT_CM} cm (${cmToFeetInches(MIN_HUMAN_HEIGHT_CM)})`;
  }
  return null;
};
