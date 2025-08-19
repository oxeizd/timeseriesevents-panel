import type { TimelineEvent, MetricConfig } from 'types';
import { DataFrame, TimeRange } from '@grafana/data';
import { CONSTANTS } from './constants';
import { calculateOptimalLabelWidth, generateId } from './config';

/**
 * Processes raw data into timeline events
 */
export const processTimelineData = (
  data: DataFrame[],
  metrics: MetricConfig[],
  timeRange: TimeRange
): TimelineEvent[] => {
  if (!metrics?.length) {
    return [];
  }

  const allEvents: TimelineEvent[] = [];

  const parseDate = (dateStr: string): number => {
    const cleanedStr = dateStr.trim().replace(/^['"]|['"]$/g, '');

    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/i,
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/i,
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/i,
      /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/i,
      /^(\d{4})-(\d{2})-(\d{2})$/i,
      /^(\d{2})\/(\d{2})\/(\d{4})$/i,
      /^(\d{2})\/(\d{2})\/(\d{4})$/i,
    ];

    for (const pattern of formats) {
      const match = cleanedStr.match(pattern);
      if (match) {
        let year,
          month,
          day,
          hours = 0,
          minutes = 0,
          seconds = 0;

        if (pattern.source.includes('T') || pattern.source.includes(' ')) {
          [, year, month, day, hours, minutes, seconds] = match.map(Number);
        } else {
          [, year, month, day] = match.map(Number);
        }

        if (pattern.source.startsWith('^(\\d{2})\\/(\\d{2})')) {
          if (pattern.source.includes('^\\d{2}\\/\\d{2}\\/\\d{4}$')) {
            [, day, month, year] = match.map(Number);
          } else {
            [, month, day, year] = match.map(Number);
          }
        }

        const utcDate = Date.UTC(year, month - 1, day, hours, minutes, seconds);

        if (!isNaN(utcDate)) {
          return utcDate;
        }
      }
    }

    const fallbackDate = new Date(cleanedStr);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate.getTime();
    }

    console.error(`Unsupported date format: ${dateStr}`);
    return NaN;
  };

  metrics.forEach((metric) => {
    if (!metric.refId || !metric.dateField) {
      console.warn(`Skipping metric - missing refId or dateField`, metric);
      return;
    }

    data
      .filter((f) => f.refId === metric.refId)
      .forEach((frame) => {
        const labelField = frame.fields.find((f) => f.labels?.[metric.dateField!]);
        if (!labelField?.labels) {
          console.warn(`No labels found for frame`, frame);
          return;
        }

        const eventDateStr = labelField.labels[metric.dateField];
        if (!eventDateStr) {
          console.warn(`No date value found for field ${metric.dateField}`);
          return;
        }

        const timestamp = parseDate(eventDateStr);
        if (isNaN(timestamp)) {
          console.error(`Invalid date: ${eventDateStr}`);
          return;
        }

        const from = timeRange.from.valueOf();
        const to = timeRange.to.valueOf();
        if (timestamp >= from && timestamp <= to) {
          let displayName = metric.name || metric.refId;
          if (labelField.config?.displayNameFromDS) {
            displayName = labelField.config.displayNameFromDS;
          } else if (Object.keys(labelField.labels).length > 0) {
            displayName = Object.entries(labelField.labels)
              .map(([k, v]) => `${k}=${v}`)
              .join(', ');
          }

          allEvents.push({
            id: generateId(),
            metricId: metric.id,
            displayTime: eventDateStr,
            sortTime: timestamp,
            metric: metric.name || metric.refId,
            displayName,
            color: metric.pointColor || '#FF6B6B',
          });
        }
      });
  });

  return allEvents.sort((a, b) => a.sortTime - b.sortTime);
};

/**
 * Groups events by metric name
 */
export const groupEventsByMetric = (events: TimelineEvent[]): Map<string, TimelineEvent[]> => {
  const map = new Map<string, TimelineEvent[]>();
  events.forEach((event) => {
    const metricEvents = map.get(event.metric) || [];
    metricEvents.push(event);
    map.set(event.metric, metricEvents);
  });
  return map;
};

/**
 * Formats timestamp for axis labels
 */
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

/**
 * Calculates dimensions for the timeline visualization
 */
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

  const labelWidth = calculateOptimalLabelWidth(options.maxLabelWidth || CONSTANTS.BASE_LABEL_WIDTH, showMetricLabels);

  const pointSize = Math.max(
    CONSTANTS.MIN_POINT_SIZE,
    Math.min(CONSTANTS.MAX_POINT_SIZE, Math.min(width, height) / 50)
  );

  let trackHeight = Math.max(minTrackHeight, (height - CONSTANTS.TIME_LABELS_HEIGHT) / (metricsCount || 1));

  if (allowLineWrapping && showMetricLabels) {
    trackHeight = Math.max(trackHeight, CONSTANTS.LINE_HEIGHT * 2 + 16);
  }

  const spacing = CONSTANTS.TIME_LABEL_SPACING[timeLabelDensity];
  const timeLabelsCount = Math.max(CONSTANTS.MIN_TIME_LABELS, Math.floor(width / spacing));

  return {
    labelWidth,
    pointSize,
    trackHeight,
    timeLabelsCount,
  };
};
