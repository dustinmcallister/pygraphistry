import { constructFieldString, SplunkPivot } from './SplunkPivot.js';
import logger from '../../logger.js';
import _ from 'underscore';
import stringhash from 'string-hash';

const log = logger.createLogger('pivot-app', __filename);

const SPLUNK_INDICES = {
    EVENT_GEN: 'index=event_gen',
    PAN: 'index=event_gen | search vendor="Palo Alto Networks"'
};

const PAN_NODE_COLORS = { 'EventID': 7, 'user': 1, 'dest': 3, 'threat_name': 5 };

const PAN_NODE_SIZES = { 'EventID': 0.1, 'dest': 1.1, 'user': 5, 'threat_name': 10 };

const PAN_ENCODINGS = {
    point: {
        pointColor: function(node) {
            node.pointColor = PAN_NODE_COLORS[node.type];
            if (node.pointColor === undefined) {
                node.pointColor = stringhash(node.type) % 12;
            }
        },
        pointSizes: function(node) {
            node.pointSize = PAN_NODE_SIZES[node.type];
        }
    }
};

const PAN_SHAPES = {
    userToThreat: {
        connections: [ 'user', 'threat_name'],
        attributes: ['vendor_action', 'category', 'time', 'url', 'severity', 'action']
    },
    userToDest: {
        connections: [ 'dest', 'user' ],
        attributes: [ 'action', 'time']
    },
};

export const PAN_SEARCH = new SplunkPivot({
    name: 'PAN - Search',
    id: 'pan-search',
    pivotParameterKeys: ['query', 'nodes'],
    pivotParametersUI: {
        query: {
            inputType: 'text',
            label: 'Search',
            placeholder: 'severity="critical"'
        },
        nodes: {
            inputType: 'text',
            label: 'Nodes',
            placeholder: 'user, dest'
        }
    },
    connections: ['user', 'dest'],
    attributes: PAN_SHAPES.userToDest.attributes,
    encodings: PAN_ENCODINGS,
    toSplunk: function(pivotParameters) {
        this.connections = pivotParameters.nodes.split(',').map((field) => field.trim());
        return `search ${SPLUNK_INDICES.PAN} ${pivotParameters.query}
                ${constructFieldString(this)}
                | head 100`;
    }
});

const contextFilter = '(severity="critical" OR severity="medium" OR severity="low")';

export const PAN_EXPAND = new SplunkPivot({
    name: 'PAN - Expand',
    id: 'pan-expand',
    pivotParameterKeys: ['source', 'sourceAttribute', 'query', 'nodes'],
    pivotParametersUI: {
        source: {
            inputType: 'pivotCombo',
            label: 'Expand on',
        },
        sourceAttribute: {
            inputType: 'text',
            label: 'Expand on',
            placeholder: 'user'
        },
        query: {
            inputType: 'text',
            label: 'Subsearch',
            placeholder: contextFilter
        },
        nodes: {
            inputType: 'text',
            label: 'Nodes',
            placeholder: 'user, dest'
        }
    },
    attributes: PAN_SHAPES.userToDest.attributes,
    encodings: PAN_ENCODINGS,
    toSplunk: function(pivotParameters, pivotCache) {
        this.connections = pivotParameters.nodes.split(',').map((field) => field.trim());
        const sourceAttribute = pivotParameters.sourceAttribute;
        const filter = pivotParameters.query;
        const subSearchId = pivotParameters.source;
        const isGlobalSearch = (subSearchId === '*');
        var subsearch = '';
        if (isGlobalSearch) {
            const list  = _.map(
                Object.keys(pivotCache), (pivotId) =>
                    (`[| loadjob "${pivotCache[pivotId].splunkSearchId}"
                          | fields ${sourceAttribute} | dedup ${source}]`));
            subsearch = list.join(' | append ');
        } else {
            subsearch = `[| loadjob "${pivotCache[subSearchId].splunkSearchId}" |  fields ${sourceAttribute} | dedup ${sourceAttribute}]`;
        }

        return `search ${SPLUNK_INDICES.PAN}
                    | search ${filter} ${subsearch} ${constructFieldString(this)}`;

    },
});
