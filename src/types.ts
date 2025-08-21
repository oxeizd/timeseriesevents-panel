import type { PanelProps } from '@grafana/data';

export interface TimelineEvent {
  id: string; // Уникальный идентификатор события
  metricId: string; // ID связанной метрики
  displayTime: string; // Дата для отображения (берётся из labels)
  sortTime: number; // Время для сортировки (timestamp)
  metric: string; // Название метрики
  displayName: string; // Имя для отображения
  color: string; // Цвет точки
}

export interface MetricConfig {
  id: string; // Уникальный идентификатор метрики
  name?: string;
  refId: string;
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

export interface Props extends PanelProps<SimpleOptions> {}
