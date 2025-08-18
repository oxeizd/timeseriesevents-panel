import { DataFrame, FieldType } from '@grafana/data';
import type { TimelineData, TimelineMetric } from './types';
import { format } from 'date-fns';

export const dataExtractor = (data: DataFrame[]): TimelineData => {
  const result: TimelineData = new Map();

  if (!data?.length) {
    return result;
  }

  data.forEach((frame) => {
    const refId = frame.refId || 'unknown';

    const timeField = frame.fields.find((f) => f.type === FieldType.time);
    const metricFields = frame.fields.filter((f) => f.type === FieldType.number);

    if (!timeField || !metricFields.length) {
      return;
    }

    const timeValues = timeField.values;

    metricFields.forEach((field) => {
      const metric: TimelineMetric = {
        time: timeValues,
        values: field.values,
        displayName: field.config?.displayNameFromDS || field.name || 'unnamed',
        labels: field.labels || {},
      };

      if (!result.has(refId)) {
        result.set(refId, []);
      }
      result.get(refId)!.push(metric);
    });
  });

  return result;
};

export const formatTimelineDate = (timestamp: number, timeSpan: number) => {
  // Если диапазон больше 24 часов
  if (timeSpan > 24 * 60 * 60 * 1000) {
    return format(timestamp, 'dd/MM HH:mm');
  }
  // Для диапазонов меньше 24 часов показываем только время
  return format(timestamp, 'HH:mm:ss');
};
