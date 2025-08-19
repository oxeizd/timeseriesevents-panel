import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { Tooltip } from './Tooltip';
import { useTheme2 } from '@grafana/ui';
import { EmptyState } from './tsx/EmptyState';
import { TimeLabels } from './tsx/TimeLabels';
import { TimelineTrack } from './tsx/TimelineTrack';
import type { Props, TimelineEvent } from 'types';
import { processTimelineData, groupEventsByMetric, calculateDimensions } from './utils/utils';

export const SimplePanel: React.FC<Props> = ({ options, data, width, height, timeRange }) => {
  const theme = useTheme2();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipEvent, setTooltipEvent] = useState<TimelineEvent | null>(null);
  const [tooltipTimer, setTooltipTimer] = useState<NodeJS.Timeout | null>(null);

  const metrics = useMemo(() => options.metrics || [], [options.metrics]);
  const timeStart = useMemo(() => timeRange.from.valueOf(), [timeRange.from]);
  const timeEnd = useMemo(() => timeRange.to.valueOf(), [timeRange.to]);
  const timeSpan = useMemo(() => timeEnd - timeStart, [timeEnd, timeStart]);

  const processedData = useMemo(() => {
    try {
      return processTimelineData(data.series, metrics, timeRange);
    } catch (error) {
      console.error('Error processing timeline data:', error);
      return [];
    }
  }, [data.series, metrics, timeRange]);

  const eventsByMetric = useMemo(() => groupEventsByMetric(processedData), [processedData]);

  const dimensions = useMemo(() => {
    try {
      return calculateDimensions(width, height, metrics.length, {
        metrics,
        maxLabelWidth: options.maxLabelWidth,
        showMetricLabels: options.showMetricLabels,
        allowLineWrapping: options.allowLineWrapping,
        timeLabelDensity: options.timeLabelDensity,
        minTrackHeight: options.minTrackHeight,
      });
    } catch (error) {
      console.error('Error calculating dimensions:', error);
      return calculateDimensions(width, height, metrics.length, {});
    }
  }, [width, height, metrics, options]);

  const onPointHover = useCallback(
    (event: TimelineEvent | null) => {
      if (event) {
        setTooltipEvent(event);
        setTooltipVisible(true);

        if (tooltipTimer) {
          clearTimeout(tooltipTimer);
        }

        const timer = setTimeout(() => {
          setTooltipVisible(false);
          setTooltipEvent(null);
        }, 3000);

        setTooltipTimer(timer);
      } else {
        setTooltipVisible(false);
        setTooltipEvent(null);
        if (tooltipTimer) {
          clearTimeout(tooltipTimer);
          setTooltipTimer(null);
        }
      }
    },
    [tooltipTimer]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltipVisible(false);
    setTooltipEvent(null);
    if (tooltipTimer) {
      clearTimeout(tooltipTimer);
      setTooltipTimer(null);
    }
  }, [tooltipTimer]);

  useEffect(() => {
    return () => {
      if (tooltipTimer) {
        clearTimeout(tooltipTimer);
      }
    };
  }, [tooltipTimer]);

  if (!metrics.length) {
    return <EmptyState width={width} message="Please add metrics in panel options" />;
  }

  if (!processedData.length) {
    return <EmptyState width={width} message="No data found for configured metrics" />;
  }

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
        background: ${theme.colors.background.primary};
      `}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={css`
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow-y: auto;
          padding: ${theme.spacing(1)};
        `}
      >
        {metrics.map((metric, index) => {
          const metricName = metric.name || metric.refId || '';
          const events = eventsByMetric.get(metricName) || [];
          const isLast = index === metrics.length - 1;

          return (
            <TimelineTrack
              key={metric.id}
              metricName={metricName}
              events={events}
              trackHeight={dimensions.trackHeight}
              labelWidth={dimensions.labelWidth}
              pointSize={dimensions.pointSize}
              width={width}
              timeStart={timeStart}
              timeSpan={timeSpan}
              onPointHover={onPointHover}
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
            background: ${theme.colors.background.secondary};
            border-top: 1px solid ${theme.colors.border.weak};
          `}
        >
          {metrics.map((metric) => (
            <div
              key={metric.id}
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

      <Tooltip
        visible={tooltipVisible}
        timelineEvent={tooltipEvent}
        containerRef={containerRef}
        timeStart={timeStart}
        timeSpan={timeSpan}
        width={width}
        metrics={metrics}
        dimensions={dimensions}
        setVisible={setTooltipVisible}
      />
    </div>
  );
};
