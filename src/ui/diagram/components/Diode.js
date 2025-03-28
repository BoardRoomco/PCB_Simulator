import { BaseData } from '../../../circuit/models';
import { get2PointBoundingBox } from '../boundingBox.js';
import transforms from '../render/transforms';
import { getDragFunctionFor } from '../Utils.js';
import {
  BOUNDING_BOX_PADDING,
  DIODE,
  GRID_SIZE
} from '../Constants.js';

const DIODE_LENGTH = GRID_SIZE * 2;
const BOUNDING_BOX_WIDTH = DIODE.WIDTH + BOUNDING_BOX_PADDING * 2;
const MIN_LENGTH = DIODE_LENGTH + GRID_SIZE;

const BaseDiodeModel = BaseData.Diode;
const DEFAULT_CAPACITANCE = 1e-6;
const NUM_OF_CONNECTORS = 2;
const WIRE_COLOR = '#90EE90';

const diodeImage = new Image();
diodeImage.src = 'icons/diode.png';

export default {
  typeID: BaseDiodeModel.typeID,

  numOfVoltages: 2,
  numOfCurrentPaths: 1,
  numOfConnectors: NUM_OF_CONNECTORS,

  width: BOUNDING_BOX_WIDTH,
  editablesSchema: {
    capacitance: {
      type: 'number',
      unit: 'F'
    }
  },
  defaultEditables: {
    capacitance: {
      value: DEFAULT_CAPACITANCE
    }
  },
  labelWith: 'capacitance',

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

    // Draw connecting wires
    ctx.beginPath();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;
    ctx.moveTo(c1.x, 0);
    ctx.lineTo(-DIODE_LENGTH / 2, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;
    ctx.moveTo(c2.x, 0);
    ctx.lineTo(DIODE_LENGTH / 2, 0);
    ctx.stroke();

    // Draw diode symbol
    if (diodeImage.complete) {
      const scale = 0.4;
      const imageWidth = DIODE_LENGTH * 4 * scale;
      const imageHeight = imageWidth * 1.2;

      ctx.drawImage(
        diodeImage,
        -imageWidth / 2,
        -imageHeight / 2,
        imageWidth,
        imageHeight
      );
    } else {
      // Draw diode symbol (fallback if image not loaded)
      ctx.beginPath();
      ctx.strokeStyle = colors[0];
      
      // Draw triangle
      ctx.moveTo(-DIODE_LENGTH/2, -DIODE.WIDTH/2);
      ctx.lineTo(-DIODE_LENGTH/2, DIODE.WIDTH/2);
      ctx.lineTo(DIODE_LENGTH/2, 0);
      ctx.closePath();
      ctx.stroke();

      // Draw vertical line
      ctx.beginPath();
      ctx.moveTo(DIODE_LENGTH/2, -DIODE.WIDTH/2);
      ctx.lineTo(DIODE_LENGTH/2, DIODE.WIDTH/2);
      ctx.stroke();
    }
  },

  getCurrents: (props, state) => {
    const {
      editables: {
        capacitance: {
          value: capacitance = DEFAULT_CAPACITANCE
        }
      }
    } = props;

    const {
      voltages: [v0, v1] = [0, 0],
      current = 0
    } = state;

    return [current];
  },

  renderCurrent: (props, state, renderBetween) => {
    const {
      tConnectors: [c1, c2],
      currentOffsets: [offset]
    } = props;
    renderBetween(c1, c2, offset);
  }
}; 