import React, { useState, useMemo, useCallback } from 'react';
import { Button, Combobox, ColorPicker, Input, useTheme2 } from '@grafana/ui';
import { StandardEditorProps } from '@grafana/data';
import type { SimpleOptions, MetricConfig } from './types';
import { getRandomColor } from './config';

interface ExtendedProps extends StandardEditorProps<MetricConfig[], SimpleOptions> {
  // Дополнительные пропсы если нужны
}

export const MetricsEditor: React.FC<ExtendedProps> = ({ value = [], onChange, context }) => {
  const theme = useTheme2();
  const [metrics, setMetrics] = useState<MetricConfig[]>(value);

  // Мемоизируем данные из контекста
  const timelineData = useMemo(() => context.data || [], [context.data]);

  // Доступные refIds
  const availableRefIds = useMemo(() => {
    if (timelineData instanceof Map) {
      return Array.from(timelineData.keys());
    }
    return Array.from(new Set(timelineData.map((f: any) => f.refId).filter(Boolean)));
  }, [timelineData]);

  // Доступные лейблы для выбранного refId
  const getAvailableLabels = useCallback(
    (refId: string) => {
      if (!refId) {
        return [];
      }

      if (timelineData instanceof Map) {
        const metricsForRef = timelineData.get(refId) || [];
        const labels = new Set<string>();
        metricsForRef.forEach((metric: { labels: {} }) => {
          Object.keys(metric.labels).forEach((label) => labels.add(label));
        });
        return Array.from(labels);
      }

      // Для исходных DataFrame
      const frames = timelineData.filter((f: any) => f.refId === refId);
      const labels = new Set<string>();
      frames.forEach((frame: any) => {
        frame.fields?.forEach((field: any) => {
          if (field.labels) {
            Object.keys(field.labels).forEach((label) => labels.add(label));
          }
        });
      });
      return Array.from(labels);
    },
    [timelineData]
  );

  // Добавление новой метрики
  const addMetric = useCallback(() => {
    if (availableRefIds.length === 0) {
      return;
    }

    const newMetric: MetricConfig = {
      refId: availableRefIds[0],
      dateField: '',
      name: `Metric ${metrics.length + 1}`,
      pointColor: getRandomColor(),
    };

    const updated = [...metrics, newMetric];
    setMetrics(updated);
    onChange(updated);
  }, [metrics, availableRefIds, onChange]);

  // Обновление метрики
  const updateMetric = useCallback(
    <K extends keyof MetricConfig>(index: number, field: K, value: MetricConfig[K]) => {
      const updated = [...metrics];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      // Если изменился refId, сбрасываем dateField
      if (field === 'refId') {
        updated[index].dateField = '';
      }

      setMetrics(updated);
      onChange(updated);
    },
    [metrics, onChange]
  );

  // Удаление метрики
  const removeMetric = useCallback(
    (index: number) => {
      const updated = metrics.filter((_, i) => i !== index);
      setMetrics(updated);
      onChange(updated);
    },
    [metrics, onChange]
  );

  return (
    <div>
      <Button icon="plus" variant="secondary" onClick={addMetric} disabled={availableRefIds.length === 0} size="sm">
        Add metric
      </Button>

      {availableRefIds.length === 0 && (
        <div
          style={{
            color: theme.colors.text.secondary,
            marginTop: theme.spacing(1),
            fontSize: theme.typography.bodySmall.fontSize,
          }}
        >
          No data sources available. Add queries to your dashboard first.
        </div>
      )}

      <div
        style={{
          marginTop: theme.spacing(2),
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing(1),
        }}
      >
        {metrics.map((metric, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '3fr 3fr 3fr 2fr 1fr',
              alignItems: 'center',
              padding: theme.spacing(1),
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: theme.shape.radius.default,
              backgroundColor: theme.colors.background.primary,
              gap: theme.spacing(1),
            }}
          >
            <Input
              value={metric.name}
              onChange={(e) => updateMetric(index, 'name', e.currentTarget.value)}
              placeholder="Metric name"
              aria-label="Metric name"
            />

            <Combobox
              options={availableRefIds.map((id) => ({ label: id, value: id }))}
              value={metric.refId}
              onChange={(option) => option?.value && updateMetric(index, 'refId', option.value)}
              placeholder="Select source"
              disabled={availableRefIds.length === 0}
            />

            <Combobox
              options={getAvailableLabels(metric.refId).map((label) => ({ label, value: label }))}
              value={metric.dateField}
              onChange={(option) => option?.value && updateMetric(index, 'dateField', option.value)}
              placeholder="Select date field"
              disabled={!metric.refId}
            />

            <ColorPicker
              color={metric.pointColor || getRandomColor()}
              onChange={(color) => updateMetric(index, 'pointColor', color)}
              enableNamedColors={false}
            />

            <Button
              icon="trash-alt"
              variant="destructive"
              size="sm"
              onClick={() => removeMetric(index)}
              tooltip="Remove metric"
              aria-label="Remove metric"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
