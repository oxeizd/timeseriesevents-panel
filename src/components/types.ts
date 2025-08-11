import type { PanelProps } from '@grafana/data';

export type TimelineEvent = {
  time: number;
  endTime?: number; // Новое поле - необязательное
  metric: string;
  displayName: string;
  color: string;
};

export interface MetricConfig {
  refId: string;
  name?: string;
  dateField: string;
  pointColor?: string;
}

export interface SimpleOptions {
  metrics?: MetricConfig[];
  allowLineWrapping?: boolean;
  timeLabelDensity?: 'low' | 'medium' | 'high';
  maxLabelWidth?: number;
  showTimeLabels?: boolean;
  showLegend?: boolean;
  showMetricLabels?: boolean;
  showBottomBorder?: boolean;
  showPointGlow?: boolean; // Новая настройка
  LineHeight?: string;
  minTrackHeight?: number;
}

export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
}

export interface Props extends PanelProps<SimpleOptions> {}
