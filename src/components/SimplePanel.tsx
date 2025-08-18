import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import type { Props, TimelineEvent, TimelineTrackData, TooltipState } from './types';
import { dataExtractor } from './utils';
import { TimelineTrack } from './TimelineTrack';
import { TimeLabels } from './TimeLabels';
import { EmptyState } from './EmptyState';
import { CONSTANTS } from './constants';

export const SimplePanel: React.FC<Props> = ({ options, data, width, height, timeRange }) => {
  const theme = useTheme2();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Получаем временной диапазон из панели Grafana
  const panelTimeRange = useMemo(
    () => ({
      start: timeRange.from.valueOf(),
      end: timeRange.to.valueOf(),
    }),
    [timeRange.from, timeRange.to]
  );

  // Обработка данных с учетом полного диапазона панели
  const { tracks } = useMemo(() => {
    const timelineData = dataExtractor(data.series);
    const allEvents: TimelineEvent[] = [];

    options.metrics?.forEach((config) => {
      const metrics = timelineData.get(config.refId) || [];

      metrics.forEach((metric) => {
        const dateValue = metric.labels[config.dateField];
        if (!dateValue) {
          return;
        }

        const eventTime = new Date(dateValue).getTime();
        if (isNaN(eventTime)) {
          return;
        }

        // Добавляем все события, фильтрация будет при отображении
        allEvents.push({
          time: eventTime,
          displayName: config.name || metric.displayName,
          metricValue: metric.values[0],
          labels: metric.labels,
          color: config.pointColor,
        });
      });
    });

    // Группируем события по метрикам
    const groupedTracks: TimelineTrackData[] =
      options.metrics?.map((config) => ({
        metricName: config.name || config.refId || '',
        events: allEvents.filter((e) => e.displayName === (config.name || '')),
        color: config.pointColor,
      })) || [];

    return {
      tracks: groupedTracks,
    };
  }, [data.series, options.metrics]);

  // Рассчитываем количество временных меток
  const timeLabelsCount = useMemo(() => {
    const spacing =
      options.timeLabelDensity === 'high'
        ? CONSTANTS.TIME_LABEL_SPACING.high
        : options.timeLabelDensity === 'low'
        ? CONSTANTS.TIME_LABEL_SPACING.low
        : CONSTANTS.TIME_LABEL_SPACING.medium;

    return Math.max(CONSTANTS.MIN_TIME_LABELS, Math.floor(width / spacing));
  }, [width, options.timeLabelDensity]);

  const handlePointHover = useCallback(
    (event: React.MouseEvent, timelineEvent: TimelineEvent) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      setTooltip({
        visible: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        content: `
        <strong>${timelineEvent.displayName}</strong><br/>
        Time: ${new Date(timelineEvent.time).toLocaleString()}<br/>
        Value: ${timelineEvent.metricValue}<br/>
        ${Object.entries(timelineEvent.labels)
          .filter(([key]) => key !== options.metrics?.[0]?.dateField)
          .map(([k, v]) => `${k}: ${v}`)
          .join('<br/>')}
      `,
      });
    },
    [options.metrics]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  useEffect(() => {
    const timer = tooltip?.visible
      ? setTimeout(() => {
          setTooltip(null);
        }, 3000)
      : undefined;

    return () => timer && clearTimeout(timer);
  }, [tooltip?.visible]);

  if (!options.metrics?.length) {
    return <EmptyState width={width} message="Please configure metrics in panel options" />;
  }

  if (!tracks.length || tracks.every((track) => track.events.length === 0)) {
    return <EmptyState width={width} message="No data available for selected time range" />;
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
        background: ${theme.colors.background.primary};
        border-radius: ${theme.shape.radius.default};
        overflow: hidden;
      `}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={css`
          flex: 1;
          overflow-y: auto;
          padding: ${theme.spacing(1)} 0;
        `}
      >
        {tracks.map(
          (track, index) =>
            track.events.length > 0 && (
              <TimelineTrack
                key={`${track.metricName}-${index}`}
                track={track}
                timeRange={panelTimeRange}
                width={width}
                onPointHover={handlePointHover}
                showMetricLabels={options.showMetricLabels !== false}
                labelWidth={options.maxLabelWidth || CONSTANTS.BASE_LABEL_WIDTH}
              />
            )
        )}
      </div>

      {options.showTimeLabels !== false && (
        <TimeLabels
          timeStart={panelTimeRange.start}
          timeSpan={panelTimeRange.end - panelTimeRange.start}
          timeLabelsCount={timeLabelsCount}
          labelWidth={options.maxLabelWidth || CONSTANTS.BASE_LABEL_WIDTH}
          width={width}
          height={CONSTANTS.TIME_LABELS_HEIGHT}
          showMetricLabels={options.showMetricLabels !== false}
        />
      )}

      {options.showLegend && (
        <div
          className={css`
            display: flex;
            flex-wrap: wrap;
            gap: ${theme.spacing(1)};
            padding: ${theme.spacing(1)};
            border-top: 1px solid ${theme.colors.border.weak};
          `}
        >
          {tracks.map((track) => (
            <div
              key={track.metricName}
              className={css`
                display: flex;
                align-items: center;
                gap: ${theme.spacing(0.5)};
                font-size: ${theme.typography.bodySmall.fontSize};
              `}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: track.color || theme.colors.primary.main,
                }}
              />
              <span>{track.metricName}</span>
            </div>
          ))}
        </div>
      )}

      {tooltip?.visible && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: theme.colors.background.primary,
            border: `1px solid ${theme.colors.border.medium}`,
            borderRadius: theme.shape.radius.default,
            padding: theme.spacing(1),
            zIndex: theme.zIndex.tooltip,
            boxShadow: theme.shadows.z2,
            maxWidth: 300,
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
};
