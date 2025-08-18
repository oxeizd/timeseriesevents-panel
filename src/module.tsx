import { PanelPlugin } from '@grafana/data';
import { SimplePanel } from './components/SimplePanel';
import { MetricsEditor } from './components/MetricsEditor';
import { CONSTANTS } from './components/constants';
import type { SimpleOptions } from './components/types';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  return builder
    .addCustomEditor({
      id: 'metrics',
      path: 'metrics',
      name: 'Metrics Configuration',
      description: 'Configure metrics to display on timeline',
      editor: MetricsEditor,
      defaultValue: [],
    })
    .addBooleanSwitch({
      path: 'showMetricLabels',
      name: 'Show metric labels',
      description: 'Display metric names on the left side',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showPointGlow',
      name: 'Show point glow effect',
      description: 'Enable/disable the glow effect around points',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showTimeLabels',
      name: 'Show time labels',
      description: 'Display time labels at the bottom of the timeline',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showLegend',
      name: 'Show legend',
      description: 'Display legend with metric names and colors',
      defaultValue: false,
    })
    .addBooleanSwitch({
      path: 'allowLineWrapping',
      name: 'Allow line wrapping',
      description: 'Enable text wrapping for long metric names',
      defaultValue: false,
    })
    .addBooleanSwitch({
      path: 'showBottomBorder',
      name: 'Show bottom border',
      defaultValue: false,
    })
    .addSelect({
      path: 'timeLabelDensity',
      name: 'Time label density',
      description: 'Control how many time labels are shown',
      defaultValue: 'medium',
      settings: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
    })
    .addNumberInput({
      path: 'maxLabelWidth',
      name: 'Label width',
      description: 'Width for metric labels (pixels)',
      defaultValue: CONSTANTS.BASE_LABEL_WIDTH,
      settings: {
        min: CONSTANTS.MIN_LABEL_WIDTH,
        max: CONSTANTS.MAX_LABEL_WIDTH,
        step: 5,
      },
    })
    .addNumberInput({
      path: 'minTrackHeight',
      name: 'Minimum track height',
      description: 'Minimum height for each timeline track (pixels)',
      defaultValue: CONSTANTS.MIN_TRACK_HEIGHT,
      settings: {
        min: CONSTANTS.MIN_TRACK_HEIGHT,
        max: CONSTANTS.MAX_TRACK_HEIGHT,
        step: 1,
      },
    });
});
