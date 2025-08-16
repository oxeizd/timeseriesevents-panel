import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { Button, Combobox, ColorPicker, Input, useTheme2 } from '@grafana/ui';
import type { MetricConfig } from './types';
import { getRandomColor } from './config';

interface MetricsEditorProps {
  value?: MetricConfig[];
  onChange: (value: MetricConfig[]) => void;
  context: any;
}

export const MetricsEditor: React.FC<MetricsEditorProps> = ({ value = [], onChange, context }) => {
  const theme = useTheme2();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const prevMetricsCount = useRef(value.length);
  const [localMetrics, setLocalMetrics] = useState<MetricConfig[]>(value || []);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Sync with external changes
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(localMetrics)) {
      setLocalMetrics(value || []);
    }
  }, [value, localMetrics]);

  const availableRefIds = useMemo(() => {
    if (!context.data) {
      return [];
    }
    return Array.from(
      new Set(context.data.map((frame: { refId?: string }) => frame.refId).filter(Boolean) as string[])
    );
  }, [context.data]);

  const getAvailableFields = useCallback(
    (refId: string) => {
      if (!context.data || !refId) {
        return [];
      }
      const frames = context.data.filter((f: { refId?: string }) => f.refId === refId);
      const allFields = new Set<string>();

      frames.forEach((frame: { fields?: Array<{ name?: string }> }) => {
        frame.fields?.forEach((field) => {
          if (field.name) {
            allFields.add(field.name);
          }
        });
      });

      return Array.from(allFields);
    },
    [context.data]
  );

  const safeUpdate = useCallback(
    (updater: (prev: MetricConfig[]) => MetricConfig[]) => {
      setLocalMetrics((prev) => {
        const updated = updater(prev);

        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
          onChange(updated);
        }, 0);

        return updated;
      });
    },
    [onChange]
  );

  const addMetric = useCallback(() => {
    if (availableRefIds.length === 0) {
      return;
    }

    safeUpdate((prev) => {
      const fieldsForRef = getAvailableFields(availableRefIds[0]);
      const newMetric: MetricConfig = {
        refId: availableRefIds[0],
        dateField: fieldsForRef.includes('time') ? 'time' : fieldsForRef[0] || '',
        pointColor: getRandomColor(),
        name: `Metric ${prev.length + 1}`,
      };
      return [...prev, newMetric];
    });
  }, [availableRefIds, getAvailableFields, safeUpdate]);

  const updateMetric = useCallback(
    <K extends keyof MetricConfig>(index: number, field: K, newValue: MetricConfig[K]) => {
      safeUpdate((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          [field]: newValue,
        };

        if (field === 'refId') {
          const fieldsForNewRef = getAvailableFields(newValue as string);
          updated[index].dateField = fieldsForNewRef.includes('time') ? 'time' : fieldsForNewRef[0] || '';
        }

        return updated;
      });
    },
    [getAvailableFields, safeUpdate]
  );

  const removeMetric = useCallback(
    (index: number) => {
      safeUpdate((prev) => prev.filter((_, i) => i !== index));
    },
    [safeUpdate]
  );

  // Safe focus handling with delay
  useEffect(() => {
    if (localMetrics.length > prevMetricsCount.current) {
      const timer = setTimeout(() => {
        const lastIndex = localMetrics.length - 1;
        inputRefs.current[lastIndex]?.focus();
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    }
    prevMetricsCount.current = localMetrics.length;
    return undefined;
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
              value={metric.name}
              onChange={(e) => updateMetric(index, 'name', e.currentTarget.value)}
              placeholder="Name"
              aria-label="Metric name"
            />

            <Combobox<string>
              options={availableRefIds.map((id) => ({ label: id, value: id }))}
              value={metric.refId}
              onChange={(option) => option?.value && updateMetric(index, 'refId', option.value)}
              placeholder="Select source"
              disabled={availableRefIds.length === 0}
            />

            <Combobox<string>
              options={getAvailableFields(metric.refId).map((f) => ({ label: f, value: f }))}
              value={metric.dateField}
              onChange={(option) => option?.value && updateMetric(index, 'dateField', option.value)}
              placeholder="Select date field"
              disabled={!metric.refId}
            />

            <ColorPicker
              color={metric.pointColor || getRandomColor()}
              onChange={(color) => updateMetric(index, 'pointColor', color)}
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
