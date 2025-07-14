import { CONSTANTS } from './constants';

export const CONFIG = {
  // Размеры и отступы
  SPACING: {
    TRACK_PADDING: 8,
    POINT_HOVER_SCALE: 1.4,
    POINT_GLOW_SIZE: 8,
    POINT_HOVER_GLOW_SIZE: 16,
  },

  // Цвета по умолчанию для новых метрик
  DEFAULT_COLORS: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],

  // Настройки анимации
  ANIMATION: {
    TRANSITION: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    HOVER_TRANSITION: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Настройки тултипа
  TOOLTIP: {
    OFFSET_X: 10,
    OFFSET_Y: -10,
    MAX_WIDTH: 300,
    ARROW_SIZE: 6,
    ARROW_OFFSET: 20,
  },
} as const;

// Функция для получения случайного цвета
export const getRandomColor = (): string => {
  return CONFIG.DEFAULT_COLORS[Math.floor(Math.random() * CONFIG.DEFAULT_COLORS.length)];
};

// Функция для расчета оптимальной ширины лейбла
export const calculateOptimalLabelWidth = (
  labelWidth: number, // просто берем значение, которое задал пользователь
  showMetricLabels = true
): number => {
  if (!showMetricLabels) {
    return 0;
  }

  // Просто ограничиваем значение минимальным и максимальным
  return Math.max(CONSTANTS.MIN_LABEL_WIDTH, Math.min(labelWidth, CONSTANTS.MAX_LABEL_WIDTH));
};
