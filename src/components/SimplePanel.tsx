import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import type { Props, TooltipState, TimelineEvent } from './types';
import { processTimelineData, groupEventsByMetric, calculateDimensions } from './utils';
import { EmptyState } from './EmptyState';
import { TimelineTrack } from './TimelineTrack';
import { TimeLabels } from './TimeLabels';
import { Tooltip } from './Tooltip';

export const SimplePanel: React.FC<Props> = ({ options, data, width, height, timeRange }) => {
  const theme = useTheme2();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  });
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  // Memoized derived data
  const metrics = useMemo(() => options.metrics || [], [options.metrics]);
  const timeStart = useMemo(() => timeRange.from.valueOf(), [timeRange.from]);
  const timeEnd = useMemo(() => timeRange.to.valueOf(), [timeRange.to]);
  const timeSpan = useMemo(() => timeEnd - timeStart, [timeEnd, timeStart]);

  const processedData = useMemo(
    () => processTimelineData(data.series, metrics, timeRange),
    [data.series, metrics, timeRange]
  );

  const eventsByMetric = useMemo(() => groupEventsByMetric(processedData), [processedData]);

  const dimensions = useMemo(
    () =>
      calculateDimensions(width, height, metrics.length, {
        metrics,
        maxLabelWidth: options.maxLabelWidth,
        showMetricLabels: options.showMetricLabels,
        allowLineWrapping: options.allowLineWrapping,
        timeLabelDensity: options.timeLabelDensity,
        minTrackHeight: options.minTrackHeight,
      }),
    [width, height, metrics, options]
  );

  // Event handlers
  const handlePointHover = useCallback((event: React.MouseEvent, timelineEvent: TimelineEvent) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      content: timelineEvent.displayName,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setTooltip((prev) => ({ ...prev, visible: false }));
    }, 300);
  }, []);

  const handleTooltipMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  }, []);

  const handleTooltipMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Empty states
  if (!metrics.length) {
    return <EmptyState width={width} message="Please add metrics in panel options" />;
  }

  if (!processedData.length) {
    return <EmptyState width={width} message="No data found for configured metrics" />;
  }

  // Main render
  return (
    <div
      ref={containerRef}
      className={css`
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        border-radius: ${theme.shape.radius.default};
        overflow: hidden;
      `}
    >
      <div
        className={css`
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow-y: auto;
        `}
        onMouseLeave={handleMouseLeave}
      >
        {metrics.map((metric, index) => {
          const metricName = metric.name || metric.refId || '';
          const events = eventsByMetric.get(metricName) || [];
          const isLast = index === metrics.length - 1;

          return (
            <TimelineTrack
              key={metric.refId || index}
              metricName={metricName}
              events={events}
              trackHeight={dimensions.trackHeight}
              labelWidth={dimensions.labelWidth}
              pointSize={dimensions.pointSize}
              width={width}
              timeStart={timeStart}
              timeSpan={timeSpan}
              onPointHover={handlePointHover}
              allowLineWrapping={options.allowLineWrapping}
              showMetricLabels={options.showMetricLabels}
              showBottomBorder={options.showBottomBorder !== false && !isLast}
              showPointGlow={options.showPointGlow}
            />
          );
        })}
      </div>

      {options.showTimeLabels !== false && (
        <TimeLabels
          timeStart={timeStart}
          timeSpan={timeSpan}
          timeLabelsCount={dimensions.timeLabelsCount}
          labelWidth={dimensions.labelWidth}
          width={width}
          height={height}
          showMetricLabels={options.showMetricLabels}
        />
      )}

      {options.showLegend && metrics.length > 0 && (
        <div
          className={css`
            padding: ${theme.spacing(1)};
            display: flex;
            flex-wrap: wrap;
            gap: ${theme.spacing(1)};
          `}
        >
          {metrics.map((metric) => (
            <div
              key={metric.refId || metric.name}
              className={css`
                display: flex;
                align-items: center;
                gap: ${theme.spacing(0.5)};
                font-size: ${theme.typography.bodySmall.fontSize};
                color: ${theme.colors.text.primary};
              `}
            >
              <div
                className={css`
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background: ${metric.pointColor || '#FF6B6B'};
                `}
              />
              <span>{metric.name || metric.refId}</span>
            </div>
          ))}
        </div>
      )}

      <Tooltip tooltip={tooltip} onMouseEnter={handleTooltipMouseEnter} onMouseLeave={handleTooltipMouseLeave} />
    </div>
  );
};
