import React, { useMemo } from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import type { TimelineEvent, MetricConfig } from '../types';

interface TooltipProps {
  visible: boolean;
  timelineEvent: TimelineEvent | null;
  containerRef: React.RefObject<HTMLDivElement>;
  timeStart: number;
  timeSpan: number;
  width: number;
  metrics: MetricConfig[];
  dimensions: {
    labelWidth: number;
    trackHeight: number;
  };
  setVisible: (visible: boolean) => void;
}

export const Tooltip: React.FC<TooltipProps> = ({
  visible,
  timelineEvent,
  containerRef,
  timeStart,
  timeSpan,
  width,
  metrics,
  dimensions,
  setVisible,
}) => {
  const theme = useTheme2();

  const position = useMemo(() => {
    if (!visible || !timelineEvent || !containerRef.current) {
      return { x: 0, y: 0 };
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const xPos = ((timelineEvent.sortTime - timeStart) / timeSpan) * (width - dimensions.labelWidth);
    const trackIndex = metrics.findIndex((m) => m.name === timelineEvent.metric);
    const yPos = trackIndex * dimensions.trackHeight + dimensions.trackHeight / 2;
    const adjustedY = Math.max(yPos + 35, 0);

    return {
      x: containerRect.left + dimensions.labelWidth + xPos,
      y: adjustedY,
    };
  }, [visible, timelineEvent, containerRef, timeStart, timeSpan, width, metrics, dimensions]);

  if (!visible || !timelineEvent) {
    return null;
  }

  return (
    <div
      className={css`
        position: fixed;
        left: ${position.x}px;
        top: ${position.y}px;
        transform: translateX(-50%);
        background: ${theme.colors.background.primary};
        border: 1px solid ${theme.colors.border.medium};
        border-radius: ${theme.shape.radius.default};
        padding: ${theme.spacing(1)};
        color: ${theme.colors.text.primary};
        font-size: ${theme.typography.bodySmall.fontSize};
        box-shadow: ${theme.shadows.z2};
        pointer-events: none;
        z-index: 1000;
        max-width: 280px;
        white-space: normal;
        overflow-wrap: break-word;
      `}
    >
      {timelineEvent.displayName}
    </div>
  );
};
