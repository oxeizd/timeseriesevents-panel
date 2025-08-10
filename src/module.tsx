import { PanelPlugin } from '@grafana/data';
import { SimpleOptions, MetricConfig } from './components/types';
import { SimplePanel } from './components/SimplePanel';
import { Button, Combobox, ColorPicker, Input, useTheme2 } from '@grafana/ui';
import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { CONSTANTS } from './components/constants';
import { getRandomColor } from './components/config';

const MetricsEditor: React.FC<{
  value?: MetricConfig[];
  onChange: (value: MetricConfig[]) => void;
  context: any;
}> = ({ value = [], onChange, context }) => {
  const theme = useTheme2();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const prevMetricsCount = useRef(value.length);

  // Используем ref для хранения строкового представления последнего обработанного пропса 'value'.
  // Это позволяет выполнять глубокое сравнение и предотвращать бесконечные ререндеры.
  const lastProcessedValueString = useRef(JSON.stringify(value));
  const [localMetrics, setLocalMetrics] = useState<MetricConfig[]>(value);

  useEffect(() => {
    const currentValueString = JSON.stringify(value);
    // Обновляем локальное состояние только если входящий пропс 'value' действительно отличается
    // (глубокое сравнение через stringify) от последнего обработанного значения.
    // Это предотвращает бесконечные ререндеры, если Grafana всегда передает новую ссылку на массив.
    if (currentValueString !== lastProcessedValueString.current) {
      setLocalMetrics(value);
      lastProcessedValueString.current = currentValueString;
    }
  }, [value]); // Зависимость только от 'value'

  const availableRefIds = useMemo(() => {
    if (!context.data) {
      return [];
    }
    return Array.from(new Set(context.data.map((frame: any) => frame.refId).filter(Boolean) as string[]));
  }, [context.data]);

  const getAvailableFields = useCallback(
    (refId: string) => {
      if (!context.data) {
        return [];
      }
      const frames = context.data.filter((f: any) => f.refId === refId);
      const allFields = new Set<string>();

      for (const frame of frames) {
        for (const field of frame.fields || []) {
          if (field.name) {
            allFields.add(field.name);
          }
        }
      }

      return Array.from(allFields);
    },
    [context.data]
  );

  const addMetric = useCallback(() => {
    const newMetric: MetricConfig = {
      refId: availableRefIds[0] || 'A',
      dateField: '',
      pointColor: getRandomColor(),
      name: `Metric ${localMetrics.length + 1}`, // Используем localMetrics.length для нового имени
    };
    const updatedMetrics = [...localMetrics, newMetric];
    setLocalMetrics(updatedMetrics);
    onChange(updatedMetrics);
  }, [localMetrics, onChange, availableRefIds]);

  const updateMetric = useCallback(
    <K extends keyof MetricConfig>(index: number, field: K, newValue: MetricConfig[K], immediate = false) => {
      const updated = [...localMetrics];
      updated[index] = {
        ...updated[index],
        [field]: newValue,
      };
      setLocalMetrics(updated);

      if (immediate) {
        onChange(updated);
      }
    },
    [localMetrics, onChange]
  );

  const handleBlur = useCallback(() => {
    onChange(localMetrics);
  }, [localMetrics, onChange]);

  const removeMetric = useCallback(
    (index: number) => {
      const updated = localMetrics.filter((_, i) => i !== index);
      setLocalMetrics(updated);
      onChange(updated);
    },
    [localMetrics, onChange]
  );

  useEffect(() => {
    if (localMetrics.length > prevMetricsCount.current) {
      const lastIndex = localMetrics.length - 1;
      inputRefs.current[lastIndex]?.focus();
    }
    prevMetricsCount.current = localMetrics.length;
  }, [localMetrics.length]);

  return (
    <div>
      <Button icon="plus" variant="secondary" onClick={addMetric} disabled={!availableRefIds.length} size="sm">
        Add metric
      </Button>

      {!availableRefIds.length && (
        <p
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.bodySmall.fontSize,
            marginTop: theme.spacing(1),
          }}
        >
          No data sources available. Please add queries to your dashboard.
        </p>
      )}

      <div
        style={{
          marginTop: theme.spacing(2),
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing(1),
        }}
      >
        {localMetrics.map((metric, index) => (
          <div
            key={`metric-${index}`}
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
              ref={(el) => (inputRefs.current[index] = el)}
              value={metric.name || ''}
              onChange={(e) => updateMetric(index, 'name', e.currentTarget.value)}
              onBlur={handleBlur}
              placeholder="Name"
              aria-label="Metric name"
            />

            <Combobox<string>
              options={availableRefIds.map((id: any) => ({ label: id, value: id }))}
              value={metric.refId}
              onChange={(option) => {
                updateMetric(index, 'refId', option?.value ?? '', true);
                updateMetric(index, 'dateField', '', true);
              }}
              placeholder="Source"
              disabled={availableRefIds.length === 0}
            />

            <Combobox<string>
              options={getAvailableFields(metric.refId).map((f) => ({ label: f, value: f }))}
              value={metric.dateField}
              onChange={(option) => updateMetric(index, 'dateField', option?.value ?? '', true)}
              placeholder="Date field"
              disabled={!metric.refId}
            />

            <ColorPicker
              color={metric.pointColor || getRandomColor()}
              onChange={(color) => updateMetric(index, 'pointColor', color, true)}
            />

            <Button
              icon="trash-alt"
              variant="destructive"
              size="sm"
              onClick={() => removeMetric(index)}
              tooltip="Remove metric"
              aria-label="Remove metric"
              style={{ alignSelf: 'center', justifySelf: 'center', margin: 0 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  return builder
    .addCustomEditor({
      id: 'metrics',
      path: 'metrics',
      name: 'Metrics Configuration',
      description: 'Configure metrics to display on timeline',
      editor: (props) => <MetricsEditor {...props} />,
    })
    .addBooleanSwitch({
      path: 'showMetricLabels',
      name: 'Show metric labels',
      description: 'Display metric names on the left side',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showPointGlow',
      name: 'Show point glow effect',
      description: 'Enable/disable the glow effect around points',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showTimeLabels',
      name: 'Show time labels',
      description: 'Display time labels at the bottom of the timeline',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showLegend',
      name: 'Show legend',
      description: 'Display legend with metric names and colors',
      defaultValue: false,
    })
    .addBooleanSwitch({
      path: 'allowLineWrapping',
      name: 'Allow line wrapping',
      description: 'Enable text wrapping for long metric names',
      defaultValue: false,
    })
    .addBooleanSwitch({
      path: 'showBottomBorder',
      name: 'Show bottom border',
      defaultValue: false,
    })
    .addSelect({
      path: 'timeLabelDensity',
      name: 'Time label density',
      description: 'Control how many time labels are shown',
      defaultValue: 'medium',
      settings: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
    })
    .addNumberInput({
      path: 'maxLabelWidth',
      name: 'Label width',
      description: 'Width for metric labels (pixels)',
      defaultValue: CONSTANTS.BASE_LABEL_WIDTH,
      settings: {
        min: CONSTANTS.MIN_LABEL_WIDTH,
        max: CONSTANTS.MAX_LABEL_WIDTH,
        step: 5,
      },
    })
    .addNumberInput({
      path: 'minTrackHeight',
      name: 'Minimum track height',
      description: 'Minimum height for each timeline track (pixels)',
      defaultValue: CONSTANTS.MIN_TRACK_HEIGHT,
      settings: {
        min: CONSTANTS.MIN_TRACK_HEIGHT,
        max: CONSTANTS.MAX_TRACK_HEIGHT,
        step: 1,
      },
    });
});
