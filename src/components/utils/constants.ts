export const CONSTANTS = {
  // Временные пороги
  LONG_RANGE_THRESHOLD: 7 * 24 * 60 * 60 * 1000, // 7 дней
  YEAR_THRESHOLD: 365 * 24 * 60 * 60 * 1000, // 1 год

  // Размеры лейблов
  MIN_LABEL_WIDTH: 15,
  MAX_LABEL_WIDTH: 350,
  BASE_LABEL_WIDTH: 90,
  CHAR_WIDTH_MULTIPLIER: 8,

  // Размеры точек
  MIN_POINT_SIZE: 7,
  MAX_POINT_SIZE: 12,

  // Высоты элементов
  TIME_LABELS_HEIGHT: 32,
  MIN_TRACK_HEIGHT: 32,
  MAX_TRACK_HEIGHT: 90,
  LINE_HEIGHT: 16,

  // Настройки временных меток
  MIN_TIME_LABELS: 2,
  TIME_LABEL_SPACING: {
    low: 200,
    medium: 120,
    high: 80,
  },
} as const;
