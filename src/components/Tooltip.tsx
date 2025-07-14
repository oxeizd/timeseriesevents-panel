import React from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import type { TooltipState } from './types';

interface TooltipProps {
  tooltip: TooltipState;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const Tooltip: React.FC<TooltipProps> = ({ tooltip, onMouseEnter, onMouseLeave }) => {
  const theme = useTheme2();

  if (!tooltip.visible) {
    return null;
  }

  return (
    <div
      className={css`
        position: absolute;
        left: ${tooltip.x}px;
        top: ${tooltip.y}px;
        background: ${theme.colors.background.primary};
        border: 1px solid ${theme.colors.border.medium};
        border-radius: ${theme.shape.radius.default};
        padding: ${theme.spacing(1)};
        color: ${theme.colors.text.primary};
        font-size: ${theme.typography.bodySmall.fontSize};
        box-shadow: ${theme.shadows.z3};
        pointer-events: auto;
        z-index: 100;
        max-width: 300px;
        transform: translate(10px, 10px);
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {tooltip.content}
    </div>
  );
};
