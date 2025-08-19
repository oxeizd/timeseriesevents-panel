import React from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { formatTime } from 'components/utils/utils';

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
  timeLabelsCount,
  labelWidth,
  width,
  height,
  showMetricLabels = true,
}) => {
  const theme = useTheme2();

  return (
    <div
      className={css`
        position: relative;
        height: 32px;
        width: 100%;
        border-top: 1px solid ${theme.colors.border.weak};
        display: flex;
      `}
    >
      {showMetricLabels && (
        <div
          className={css`
            width: ${labelWidth}px;
            flex-shrink: 0;
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
        `}
      >
        {[...Array(timeLabelsCount)].map((_, i) => {
          const time = timeStart + (i / (timeLabelsCount - 1)) * timeSpan;
          return (
            <div
              key={i}
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
                `}
              >
                {formatTime(time, timeSpan)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
