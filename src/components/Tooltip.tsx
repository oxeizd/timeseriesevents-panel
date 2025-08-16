import React, { useEffect, useRef } from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import type { TooltipState } from './types';

interface TooltipProps {
  tooltip: TooltipState;
}

export const Tooltip: React.FC<TooltipProps> = ({ tooltip }) => {
  const theme = useTheme2();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const fadeTimeoutRef = useRef<NodeJS.Timeout>();

  // Очистка всех таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  // Автоматическое скрытие при отсутствии активности
  useEffect(() => {
    if (!tooltip.visible) {
      return;
    }

    // Сброс предыдущих таймеров
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }

    // Плавное исчезновение через 3 секунды
    hideTimeoutRef.current = setTimeout(() => {
      if (tooltipRef.current) {
        tooltipRef.current.style.opacity = '0';

        // Полное удаление из DOM после анимации
        fadeTimeoutRef.current = setTimeout(() => {
          if (tooltipRef.current) {
            tooltipRef.current.style.display = 'none';
          }
        }, 200); // Должно совпадать с длительностью transition
      }
    }, 3000);

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [tooltip.visible, tooltip.x, tooltip.y]);

  // Скрытие при клике в любом месте документа
  useEffect(() => {
    const handleDocumentClick = () => {
      if (tooltip.visible && tooltipRef.current) {
        tooltipRef.current.style.opacity = '0';
        setTimeout(() => {
          if (tooltipRef.current) {
            tooltipRef.current.style.display = 'none';
          }
        }, 200);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [tooltip.visible]);

  if (!tooltip.visible) {
    return null;
  }

  // Рассчитываем позицию с учетом границ экрана
  const calculatePosition = () => {
    if (!tooltipRef.current) {
      return { x: tooltip.x, y: tooltip.y };
    }

    const rect = tooltipRef.current.getBoundingClientRect();
    let x = tooltip.x + 10;
    let y = tooltip.y + 10;

    // Корректировка позиции, если тултип выходит за границы окна
    if (x + rect.width > window.innerWidth) {
      x = window.innerWidth - rect.width - 5;
    }
    if (y + rect.height > window.innerHeight) {
      y = window.innerHeight - rect.height - 5;
    }

    return { x: Math.max(5, x), y: Math.max(5, y) };
  };

  const position = calculatePosition();

  return (
    <div
      ref={tooltipRef}
      className={css`
        position: fixed;
        left: ${position.x}px;
        top: ${position.y}px;
        background: ${theme.colors.background.primary};
        border: 1px solid ${theme.colors.border.medium};
        border-radius: ${theme.shape.radius.default};
        padding: ${theme.spacing(1)};
        color: ${theme.colors.text.primary};
        font-size: ${theme.typography.bodySmall.fontSize};
        box-shadow: ${theme.shadows.z3};
        pointer-events: none;
        z-index: 99999;
        max-width: 300px;
        transition: opacity 0.2s ease-out;
        opacity: 1;
        display: block; // Сбрасываем возможный display: none
      `}
    >
      {tooltip.content}
    </div>
  );
};
