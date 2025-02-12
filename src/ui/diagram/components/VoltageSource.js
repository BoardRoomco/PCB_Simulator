import { BaseData } from '../../../circuit/models';
import transforms from '../render/transforms';
import { LINE_WIDTH } from '../Constants';

import { get2PointBoundingBox } from '../boundingBox.js';

import { getDragFunctionFor } from '../Utils.js';
import {
  BOUNDING_BOX_PADDING,
  VOLTAGE_SOURCE,
  GRID_SIZE
} from '../Constants.js';

const PLUS_LENGTH = LINE_WIDTH * 2;
const { RADIUS } = VOLTAGE_SOURCE;
const BOUNDING_BOX_WIDTH = VOLTAGE_SOURCE.RADIUS * 2 + BOUNDING_BOX_PADDING * 2;
const MIN_LENGTH = GRID_SIZE * 3;

const BaseVoltageSourceModel = BaseData.VoltageSource;

const DEFAULT_VOLTAGE = 5;
const NUM_OF_CONNECTORS = 2;
const WIRE_COLOR = '#90EE90';

const voltageSourceImage = new Image();
voltageSourceImage.src = '/icons/voltage_source.png';

export default {
  typeID: BaseVoltageSourceModel.typeID,

  numOfVoltages: 2,
  numOfCurrentPaths: 1,
  numOfConnectors: NUM_OF_CONNECTORS,

  width: BOUNDING_BOX_WIDTH,
  editablesSchema: {
    type: {
      type: 'type-select',
      options: { // map from possible enum values to list of editables for that type
        DC: ['voltage'],
        Sine: ['voltage', 'frequency']
      }
    },
    voltage: {
      type: 'number',
      unit: 'V'
    },
    frequency: {
      type: 'number',
      unit: 'Hz'
    }
  },
  defaultEditables: {
    type: {
      value: 'DC'
    },
    voltage: {
      value: DEFAULT_VOLTAGE
    },
    frequency: {
      value: 500,
      zeroTime: 0
    }
  },
  labelWith: 'voltage',

  dragPoint: getDragFunctionFor(MIN_LENGTH),
  transform: transforms["2-voltage"],

  getBoundingBox: get2PointBoundingBox(BOUNDING_BOX_WIDTH),

  render: (ctx, props) => {
    const {
      tConnectors,
      colors,
      voltages = [],
      connectorIndex
    } = props;

    if (!tConnectors || !colors) {
      console.error('Missing required props for render');
      return;
    }

    const [c1, c2] = tConnectors;

    if (voltageSourceImage.complete) {
      const scale = 0.8;
      const imageWidth = RADIUS * 8 * scale;
      const imageHeight = imageWidth * 1.2;

      // Draw connecting wires first
      ctx.beginPath();
      ctx.strokeStyle = WIRE_COLOR;
      ctx.lineWidth = 0.1;
      ctx.moveTo(c1.x, c1.y);
      ctx.lineTo(imageWidth / 2, c1.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = WIRE_COLOR;
      ctx.lineWidth = 0.1;
      ctx.moveTo(c2.x, c2.y);
      ctx.lineTo(imageWidth / 2, c2.y);
      ctx.stroke();

      ctx.drawImage(
        voltageSourceImage,
        -imageWidth / 2,
        -imageHeight / 2,
        imageWidth,
        imageHeight
      );
    } else {
      // Draw voltage source symbol (fallback if image not loaded)
      ctx.beginPath();
      ctx.strokeStyle = colors[0];
      ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
      ctx.stroke();

      // Draw plus and minus symbols
      ctx.beginPath();
      ctx.moveTo(-RADIUS / 2, 0);
      ctx.lineTo(RADIUS / 2, 0);
      ctx.moveTo(0, -RADIUS / 2);
      ctx.lineTo(0, RADIUS / 2);
      ctx.stroke();
    }
  },

  getCurrents: (state) => {
    if (!state || !state.currents) {
      return Array(2).fill(0);  // Return default currents if state is undefined
    }
    return state.currents;
  },

  renderCurrent: (props, state, renderBetween) => {
    const {
      tConnectors: [c1, c2],
      currentOffsets: [offset]
    } = props;

    renderBetween(c1, c2, offset);
  }
};
