import url from 'url';
import _ from 'underscore';
import { views } from '../views';
import { scenes } from '../scene';
import { simpleflake } from 'simpleflakes';
import { ref as $ref, atom as $atom, pathValue as $value } from '@graphistry/falcor-json-graph';

export * from './migrateWorkbook';
export const latestWorkbookVersion = 3;

export function workbook(dataset, workbookId = simpleflake().toJSON()) {
  const workbook = `workbooksById['${workbookId}']`;
  return {
    version: latestWorkbookVersion,
    id: workbookId,
    title: '',
    contentName: '',
    fullscreen: false,
    datasets: { 0: dataset, length: 1 },

    ...views(workbookId),

    controls: [
      {
        selected: false,
        workbook: $ref(`${workbook}`),
        id: 'open-workbook',
        name: 'Open in new window'
      },
      {
        selected: false,
        workbook: $ref(`${workbook}`),
        id: 'fullscreen-workbook',
        name: 'Toggle fullscreen'
      },
      {
        selected: false,
        workbook: $ref(`${workbook}`),
        id: 'fork-workbook',
        name: 'Copy workbook'
      },
      {
        selected: false,
        workbook: $ref(`${workbook}`),
        id: 'save-workbook',
        name: 'Save workbook'
      },
      {
        selected: false,
        workbook: $ref(`${workbook}`),
        id: 'embed-workbook',
        name: 'Share workbook'
      }
    ]
  };
}

export function serializeWorkbook(workbook) {
  const wbFields = ['id', 'title', 'version', 'contentName', 'fullscreen', 'views', 'controls'];
  const whiteListed = _.pick(workbook, wbFields);

  whiteListed.viewsById = _.mapObject(workbook.viewsById, view => {
    const serialiedView = _.omit(
      view,
      'nBody',
      'session',
      'columns',
      'labelsByType',
      'componentsByType'
    );
    const { histograms } = serialiedView;
    for (let i = -1, n = histograms.length; ++i < n; ) {
      histograms[i] = undefined;
    }
    serialiedView.histogramsById = {};
    serialiedView.histograms.length = 0;
    serialiedView.selection.histogramsById = {};
    serialiedView.scene.renderer.edges.elements = 0;
    serialiedView.scene.renderer.points.elements = 0;
    return serialiedView;
  });

  return whiteListed;
}

export function dataset(options, datasetId = simpleflake().toJSON()) {
  options = {
    type: 'default',
    scene: 'default',
    mapper: 'default',
    device: 'default',
    vendor: 'default',
    controls: 'default',
    id: datasetId,
    ...options
  };

  if (!(options.scene in scenes)) {
    options.scene = 'default';
  }

  options.name = options.name || options.dataset;
  options.url = options.dataset || options.url || options.id;

  return options;
}
