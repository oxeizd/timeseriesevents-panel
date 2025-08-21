import React, { useState, useCallback, useMemo } from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { TimelineEvent } from '../../types';
import { CONFIG } from '../utils/config';
import { CONSTANTS } from '../utils/constants';

interface TimelineTrackProps {
  metricName: string;
  events: TimelineEvent[];
  trackHeight: number;
  labelWidth: number;
  pointSize: number;
  width: number;
  timeStart: number;
  timeSpan: number;
  onPointHover?: (timelineEvent: TimelineEvent | null) => void;
  allowLineWrapping?: boolean;
  showMetricLabels?: boolean;
  showBottomBorder?: boolean;
  showPointGlow?: boolean;
  lineHeight?: number;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  metricName,
  events,
  trackHeight = CONSTANTS.MIN_TRACK_HEIGHT,
  labelWidth,
  pointSize,
  width,
  timeStart,
  timeSpan,
  onPointHover,
  allowLineWrapping = false,
  showMetricLabels = true,
  showBottomBorder = true,
  showPointGlow = true,
  lineHeight = 2,
}) => {
  const theme = useTheme2();
  const [hoveredPoint, setHoveredPoint] = useState<TimelineEvent | null>(null);

  const handleMouseEnter = useCallback(
    (event: TimelineEvent) => {
      setHoveredPoint(event);
      onPointHover?.(event);
    },
    [onPointHover]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
    onPointHover?.(null);
  }, [onPointHover]);

  const eventElements = useMemo(
    () =>
      events.map((event) => {
        const left = ((event.sortTime - timeStart) / timeSpan) * 100;
        const isHovered = hoveredPoint?.id === event.id;

        return (
          <div
            key={event.id} 
            className={css`
              position: absolute;
              top: 50%;
              left: ${left}%;
              width: ${pointSize}px;
              height: ${pointSize}px;
              background: ${event.color};
              border-radius: 50%;
              transform: translate(-50%, -50%);
              cursor: pointer;
              border: 2px solid ${theme.colors.background.primary};
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
              transition: ${CONFIG.ANIMATION.TRANSITION};
              z-index: ${isHovered ? 10 : 1};

              &:hover {
                transform: translate(-50%, -50%) scale(${CONFIG.SPACING.POINT_HOVER_SCALE});
                z-index: 10;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
                border-width: 3px;
              }

              ${showPointGlow &&
              `
              &::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: ${pointSize + CONFIG.SPACING.POINT_GLOW_SIZE}px;
                height: ${pointSize + CONFIG.SPACING.POINT_GLOW_SIZE}px;
                border-radius: 50%;
                background: ${event.color};
                opacity: ${isHovered ? 0.3 : 0.2};
                transform: translate(-50%, -50%);
                z-index: -1;
                transition: ${CONFIG.ANIMATION.HOVER_TRANSITION};
              }
            `}
            `}
            onMouseEnter={() => handleMouseEnter(event)}
            onMouseLeave={handleMouseLeave}
          />
        );
      }),
    [events, timeStart, timeSpan, pointSize, hoveredPoint, showPointGlow, handleMouseEnter, handleMouseLeave, theme]
  );

  return (
    <div
      className={css`
        position: relative;
        display: flex;
        min-height: ${trackHeight}px;
        align-items: center;
        width: 100%;
        ${showBottomBorder && `border-bottom: 1px solid ${theme.colors.border.weak};`}
      `}
    >
      {showMetricLabels && (
        <div
          className={css`
            width: ${labelWidth}px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 0 ${CONFIG.SPACING.TRACK_PADDING}px;
            color: ${theme.colors.text.primary};
            font-size: ${theme.typography.bodySmall.fontSize};
            font-weight: ${theme.typography.fontWeightMedium};
            ${allowLineWrapping
              ? `
              white-space: normal;
              word-break: break-word;
              line-height: 1.2;
              text-align: left;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            `
              : `
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              text-align: left;
            `}
          `}
          title={metricName}
        >
          {metricName}
        </div>
      )}

      <div
        className={css`
          position: relative;
          flex-grow: 1;
          height: ${lineHeight}px;
          background: linear-gradient(90deg, ${theme.colors.border.medium} 0%, ${theme.colors.border.weak} 100%);
          margin: 0 ${theme.spacing(1)};
          &::before {
            content: '';
            position: absolute;
            top: -1px;
            left: 0;
            right: 0;
            height: 3px;
            background: ${theme.colors.background.primary};
            opacity: 0.8;
          }
        `}
      >
        {eventElements}
      </div>
    </div>
  );
};
