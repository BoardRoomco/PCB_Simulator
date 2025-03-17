import { BaseData } from '../../../circuit/models';
import { get2PointBoundingBox } from '../boundingBox.js';

import transforms from '../render/transforms';
import { getDragFunctionFor } from '../Utils.js';
import {
  BOUNDING_BOX_PADDING,
  RESISTOR,
  GRID_SIZE
} from '../Constants.js';

const BOUNDING_BOX_WIDTH = RESISTOR.WIDTH + BOUNDING_BOX_PADDING * 2;
const MIN_LENGTH = RESISTOR.LENGTH + GRID_SIZE;

const BaseResistorModel = BaseData.Resistor;
const DEFAULT_RESISTANCE = 1e3;
const NUM_OF_CONNECTORS = 2;
const WIRE_COLOR = '#90EE90';

const resistorImage = new Image();
resistorImage.src = 'icons/resistor.png';

export default {
  typeID: BaseResistorModel.typeID,

  numOfVoltages: 2,
  numOfCurrentPaths: 1,
  numOfConnectors: NUM_OF_CONNECTORS,

  width: BOUNDING_BOX_WIDTH,
  editablesSchema: {
    resistance: {
      type: 'number',
      unit: 'Ω'
    },
    faulty: {
      type: 'type-select',
      options: {
        'Normal': [],
        'Short': []
      }
    }
  },
  defaultEditables: {
    resistance: {
      value: DEFAULT_RESISTANCE
    },
    faulty: {
      value: 'Normal'
    }
  },
  labelWith: 'resistance',

  dragPoint: getDragFunctionFor(MIN_LENGTH),
  transform: transforms[NUM_OF_CONNECTORS],

  getBoundingBox: get2PointBoundingBox(BOUNDING_BOX_WIDTH),

  render: (ctx, props) => {
    const {
      tConnectors,
      colors
    } = props;

    if (!tConnectors || !colors) {
      console.error('Missing required props for render');
      return;
    }

    const [c1, c2] = tConnectors;

    ctx.beginPath();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;
    ctx.moveTo(c1.x, 0);
    ctx.lineTo(-RESISTOR.LENGTH / 2, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;
    ctx.moveTo(c2.x, 0);
    ctx.lineTo(RESISTOR.LENGTH / 2, 0);
    ctx.stroke();

    const stretchFactor = 5;

    if (resistorImage.complete) {
      ctx.drawImage(
        resistorImage,
        -RESISTOR.LENGTH / 2,
        -RESISTOR.WIDTH / 2 - 25,
        RESISTOR.LENGTH,
        RESISTOR.WIDTH * stretchFactor
      );
    }
  },

  getCurrents: (props, state) => {
    const {
      editables: {
        resistance: {
          value: resistance = DEFAULT_RESISTANCE
        }
      }
    } = props;

    const {
      voltages: [v0, v1] = [0, 0]
    } = state;

    return [(v0 - v1) / resistance];
  },

  renderCurrent: (props, state, renderBetween) => {
    const {
      tConnectors: [c1, c2],
      currentOffsets: [offset]
    } = props;

    renderBetween(c1, c2, offset);
  }
};
