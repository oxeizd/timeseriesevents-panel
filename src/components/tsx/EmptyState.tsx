import React from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface EmptyStateProps {
  width: number;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ width, message }) => {
  const theme = useTheme2();

  return (
    <div
      className={css`
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
        color: ${theme.colors.text.secondary};
        font-size: ${Math.max(12, Math.min(16, width / 40))}px;
      `}
    >
      {message}
    </div>
  );
};
