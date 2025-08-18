import React from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CONSTANTS } from './constants';
import { format } from 'date-fns';

interface TimeLabelsProps {
  timeStart: number;
  timeSpan: number;
  timeLabelsCount: number;
  labelWidth: number;
  width: number;
  height: number;
  showMetricLabels?: boolean;
}

export const TimeLabels: React.FC<TimeLabelsProps> = ({
  timeStart,
  timeSpan,
  timeLabelsCount = CONSTANTS.MIN_TIME_LABELS,
  labelWidth = CONSTANTS.BASE_LABEL_WIDTH,
  width,
  height = CONSTANTS.TIME_LABELS_HEIGHT,
  showMetricLabels = true,
}) => {
  const theme = useTheme2();

  const formatLabel = (timestamp: number) => {
    if (timeSpan > CONSTANTS.DAY_IN_MS * 7) {
      // Более недели
      return format(timestamp, 'dd MMM yyyy');
    }
    if (timeSpan > CONSTANTS.DAY_IN_MS) {
      // Более 24 часов
      return format(timestamp, 'dd/MM HH:mm');
    }
    return format(timestamp, 'HH:mm:ss');
  };

  return (
    <div
      className={css`
        position: relative;
        height: ${height}px;
        width: 100%;
        border-top: 1px solid ${theme.colors.border.weak};
        display: flex;
        background: ${theme.colors.background.primary};
      `}
    >
      {showMetricLabels && (
        <div
          className={css`
            width: ${labelWidth}px;
            flex-shrink: 0;
            background: ${theme.colors.background.primary};
          `}
        />
      )}

      <div
        className={css`
          flex: 1;
          position: relative;
          margin: 0 ${theme.spacing(1)};
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-top: ${theme.spacing(0.5)};
          background: transparent;
        `}
      >
        {Array.from({ length: timeLabelsCount }).map((_, i) => {
          const time = timeStart + (i / (timeLabelsCount - 1)) * timeSpan;
          return (
            <div
              key={`time-label-${i}`}
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
                flex-shrink: 0;
                position: relative;
              `}
            >
              <div
                className={css`
                  width: 1px;
                  height: 5px;
                  background: ${theme.colors.border.medium};
                  margin-bottom: ${theme.spacing(0.5)};
                `}
              />
              <div
                className={css`
                  font-size: ${theme.typography.bodySmall.fontSize};
                  font-weight: ${theme.typography.fontWeightRegular};
                  white-space: nowrap;
                  text-align: center;
                  padding: 0 ${theme.spacing(0.5)};
                  border-radius: ${theme.shape.radius.default};
                  background: ${theme.colors.background.primary};
                  color: ${theme.colors.text.primary};
                `}
              >
                {formatLabel(time)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
