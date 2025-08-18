import type { PanelProps } from '@grafana/data';

export type TimelineMetric = {
  time: number[]; // Массив временных меток (timestamp в ms)
  values: number[]; // Массив значений метрики
  displayName: string;
  labels: Record<string, string>;
};

export type TimelineData = Map<string, TimelineMetric[]>;

export interface MetricConfig {
  refId: string;
  dateField: string;
  name: string;
  pointColor?: string;
}

export interface TimelineEvent {
  time: number; // timestamp в ms
  displayName: string; // название метрики
  metricValue: number; // значение метрики
  labels: Record<string, string>; // все лейблы
  color?: string; // цвет точки
  timeFormatted?: string; // добавляем новое необязательное свойство
}

export interface TimelineTrackData {
  metricName: string;
  events: TimelineEvent[];
  color?: string;
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
  showPointGlow?: boolean;
  LineHeight?: number;
  minTrackHeight?: number;
}

export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
}

export interface Props extends PanelProps<SimpleOptions> {}
