import React from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import type { TimelineEvent, TimelineTrackData } from './types';
import { CONSTANTS } from './constants';

interface TimelineTrackProps {
  track: TimelineTrackData;
  timeRange: {
    start: number;
    end: number;
  };
  width: number;
  onPointHover: (event: React.MouseEvent, timelineEvent: TimelineEvent) => void;
  showMetricLabels?: boolean;
  labelWidth?: number;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  track,
  timeRange,
  width,
  onPointHover,
  showMetricLabels = true,
  labelWidth = 200,
}) => {
  const theme = useTheme2();
  const { start, end } = timeRange;
  const timeSpan = end - start;

  return (
    <div
      className={css`
        display: flex;
        height: ${CONSTANTS.MIN_TRACK_HEIGHT}px;
        align-items: center;
        width: 100%;
        border-bottom: 1px solid ${theme.colors.border.weak};
      `}
    >
      {showMetricLabels && (
        <div
          className={css`
            width: ${labelWidth}px;
            padding: 0 ${theme.spacing(2)};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: ${theme.colors.text.primary};
            font-size: ${theme.typography.bodySmall.fontSize};
          `}
          title={track.metricName}
        >
          {track.metricName}
        </div>
      )}

      <div
        className={css`
          position: relative;
          flex: 1;
          height: 2px;
          background: ${theme.colors.border.medium};
          margin-right: ${theme.spacing(2)};
        `}
      >
        {track.events
          .filter((event) => event.time >= start && event.time <= end)
          .map((event) => {
            const position = ((event.time - start) / timeSpan) * 100;

            return (
              <div
                key={`${track.metricName}-${event.time}`}
                className={css`
                  position: absolute;
                  left: ${position}%;
                  top: 50%;
                  transform: translate(-50%, -50%);
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
                  background: ${event.color || theme.colors.primary.main};
                  cursor: pointer;
                  transition: transform 0.2s ease;
                  z-index: 1;

                  &:hover {
                    transform: translate(-50%, -50%) scale(1.5);
                    z-index: 2;
                  }
                `}
                onMouseEnter={(e) => onPointHover(e, event)}
              />
            );
          })}
      </div>
    </div>
  );
};
