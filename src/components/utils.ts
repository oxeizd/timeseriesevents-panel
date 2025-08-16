import type { TimelineEvent, MetricConfig } from './types';
import type { DataFrame, Field, TimeRange } from '@grafana/data';
import { CONSTANTS } from './constants';
import { calculateOptimalLabelWidth } from './config';

export const processTimelineData = (
  data: DataFrame[],
  metrics: MetricConfig[],
  timeRange: TimeRange
): TimelineEvent[] => {
  if (!metrics?.length) {
    return [];
  }

  const allEvents: TimelineEvent[] = [];

  metrics.forEach((metric) => {
    if (!metric.refId || !metric.dateField) {
      return;
    }

    data
      .filter((f) => f.refId === metric.refId)
      .forEach((frame) => {
        const dateField = frame.fields.find((f) => f.name === metric.dateField);
        if (!dateField) {
          return;
        }

        const dateValues = Array.isArray(dateField.values) ? dateField.values : Array.from(dateField.values);

        // Получаем displayName из первой не временной колонки
        const valueField = frame.fields.find((f) => f.name !== metric.dateField);
        const displayName = valueField ? resolveDisplayName(valueField) : metric.refId;

        dateValues.forEach((dateValue) => {
          let timestamp: number;

          if (typeof dateValue === 'string') {
            timestamp = new Date(dateValue).getTime();
          } else if (typeof dateValue === 'number') {
            timestamp = dateValue;
          } else if (dateValue instanceof Date) {
            timestamp = dateValue.getTime();
          } else {
            return;
          }

          if (!isNaN(timestamp) && timestamp >= timeRange.from.valueOf() && timestamp <= timeRange.to.valueOf()) {
            allEvents.push({
              time: timestamp,
              metric: metric.name || metric.refId,
              displayName, // <-- сохраняем здесь
              color: metric.pointColor || '#FF6B6B',
            });
          }
        });
      });
  });
  return allEvents;
};

export const resolveDisplayName = (field: Field): string => {
  if (field.config?.displayNameFromDS) {
    return field.config.displayNameFromDS;
  }

  if (field.labels && Object.keys(field.labels).length > 0) {
    const labels = Object.entries(field.labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(', ');
    return `{${labels}}`;
  }

  return field.name || 'unnamed';
};

export const groupEventsByMetric = (events: TimelineEvent[]): Map<string, TimelineEvent[]> => {
  const map = new Map<string, TimelineEvent[]>();

  events.forEach((event) => {
    if (!map.has(event.metric)) {
      map.set(event.metric, []);
    }
    map.get(event.metric)?.push(event);
  });

  return map;
};

export const formatTime = (timestamp: number, timeSpan: number): string => {
  const date = new Date(timestamp);
  const currentYear = new Date().getFullYear();
  const eventYear = date.getFullYear();

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  const isLongRange = timeSpan > CONSTANTS.LONG_RANGE_THRESHOLD;
  const shouldShowYear = timeSpan > CONSTANTS.YEAR_THRESHOLD || eventYear !== currentYear;

  if (isLongRange) {
    return shouldShowYear ? `${day}/${month}/${eventYear}` : `${day}/${month}`;
  } else {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const yearPart = shouldShowYear ? `/${eventYear}` : '';
    return `${day}/${month}${yearPart} ${hours}:${minutes}`;
  }
};

export const formatTooltipTime = (timestamp: number, timeSpan: number): string => {
  const date = new Date(timestamp);
  const currentYear = new Date().getFullYear();
  const eventYear = date.getFullYear();

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  const isLongRange = timeSpan > CONSTANTS.LONG_RANGE_THRESHOLD;
  const shouldShowYear = timeSpan > CONSTANTS.YEAR_THRESHOLD || eventYear !== currentYear;

  if (isLongRange) {
    return shouldShowYear ? `${day}/${month}/${eventYear}` : `${day}/${month}`;
  } else {
    const yearPart = shouldShowYear ? `/${eventYear}` : '';
    return `${day}/${month}${yearPart} ${hours}:${minutes}:${seconds}`;
  }
};

export const calculateDimensions = (
  width: number,
  height: number,
  metricsCount: number,
  options: {
    metrics?: MetricConfig[];
    maxLabelWidth?: number;
    showMetricLabels?: boolean;
    allowLineWrapping?: boolean;
    timeLabelDensity?: 'low' | 'medium' | 'high';
    minTrackHeight?: number;
  } = {}
) => {
  const {
    showMetricLabels = true,
    allowLineWrapping = false,
    timeLabelDensity = 'medium',
    minTrackHeight = CONSTANTS.MIN_TRACK_HEIGHT,
  } = options;

  // Рассчитываем оптимальную ширину лейбла
  const labelWidth = calculateOptimalLabelWidth(options.maxLabelWidth || CONSTANTS.BASE_LABEL_WIDTH, showMetricLabels);

  // Размер точек
  const pointSize = Math.max(
    CONSTANTS.MIN_POINT_SIZE,
    Math.min(CONSTANTS.MAX_POINT_SIZE, Math.min(width, height) / 50)
  );

  // Высота трека
  let trackHeight = Math.max(
    minTrackHeight, // Используем значение из настроек
    (height - CONSTANTS.TIME_LABELS_HEIGHT) / (metricsCount || 1)
  );

  if (allowLineWrapping && showMetricLabels) {
    trackHeight = Math.max(trackHeight, CONSTANTS.LINE_HEIGHT * 2 + 16);
  }

  // Количество временных меток
  const spacing = CONSTANTS.TIME_LABEL_SPACING[timeLabelDensity];
  const timeLabelsCount = Math.max(CONSTANTS.MIN_TIME_LABELS, Math.floor(width / spacing));

  return {
    labelWidth,
    pointSize,
    trackHeight,
    timeLabelsCount,
  };
};
