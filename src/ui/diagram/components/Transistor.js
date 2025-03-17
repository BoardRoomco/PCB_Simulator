import { BaseData } from '../../../circuit/models';
import { get2PointBoundingBox } from '../boundingBox.js';
import transforms from '../render/transforms';
import { getDragFunctionFor } from '../Utils.js';
import {
  BOUNDING_BOX_PADDING,
  TRANSISTOR,
  GRID_SIZE
} from '../Constants.js';

const TRANSISTOR_LENGTH = GRID_SIZE * 2;
const BOUNDING_BOX_WIDTH = TRANSISTOR.WIDTH + BOUNDING_BOX_PADDING * 2;
const MIN_LENGTH = TRANSISTOR_LENGTH + GRID_SIZE;

const BaseTransistorModel = BaseData.Transistor;
const NUM_OF_CONNECTORS = 3;
const WIRE_COLOR = '#90EE90';

const transistorImage = new Image();
transistorImage.src = 'icons/mosfet.png';

export default {
  typeID: BaseTransistorModel.typeID,

  numOfVoltages: 3,
  numOfCurrentPaths: 2,
  numOfConnectors: NUM_OF_CONNECTORS,

  width: BOUNDING_BOX_WIDTH,
  editablesSchema: {
    type: {
      type: 'type-select',
      options: {
        NMOS: [],
        PMOS: []
      }
    },
    reflection: {
      type: 'type-select',
      options: {
        'Normal': [],
        'Flipped': []
      }
    },
    W: {
      type: 'number',
      unit: 'μm'
    },
    L: {
      type: 'number',
      unit: 'μm'
    }
  },
  defaultEditables: {
    type: {
      value: 'NMOS'
    },
    reflection: {
      value: 'Normal'
    },
    W: {
      value: 10
    },
    L: {
      value: 1
    }
  },
  labelWith: 'type',

  dragPoint: getDragFunctionFor(MIN_LENGTH),
  transform: transforms["3-mosfet"],

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

    const [drain, gate, source] = tConnectors;
    const baseSize = GRID_SIZE * 4;

    // Draw transistor symbol
    if (transistorImage.complete) {
      const scale = 0.8;
      const imageWidth = baseSize * 1.4;
      const imageHeight = baseSize * 1.8;

      ctx.drawImage(
        transistorImage,
        -imageWidth / 2,
        -imageHeight / 2,
        imageWidth,
        imageHeight
      );
    }

    // Draw connecting wires
    ctx.beginPath();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;

    // Drain connection (left top pin)
    ctx.moveTo(-baseSize/3, -8);
    ctx.lineTo(drain.x, drain.y);
    ctx.stroke();

    // Gate connection (middle pin)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(gate.x, gate.y);
    ctx.stroke();

    // Source connection (left bottom pin)
    ctx.beginPath();
    ctx.moveTo(-baseSize/3, 8);
    ctx.lineTo(source.x, source.y);
    ctx.stroke();
  },

  getCurrents: (props, state) => {
    const {
      voltages: [vd, vg, vs] = [0, 0, 0],
      currents = [0, 0]
    } = state;

    return currents;
  },

  renderCurrent: (props, state, renderBetween) => {
    const {
      tConnectors: [drain, gate, source],
      currentOffsets: [drainOffset, gateOffset]
    } = props;
    
    // Render drain-source current
    renderBetween(drain, source, drainOffset);
    // Render gate current
    renderBetween(gate, source, gateOffset);
  }
}; 