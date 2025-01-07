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
const DEFAULT_CAPACITANCE = 1e-6;
const NUM_OF_CONNECTORS = 2;
const WIRE_COLOR = '#90EE90';

const transistorImage = new Image();
transistorImage.src = '/icons/transistor.png';

export default {
  typeID: BaseTransistorModel.typeID,

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
      colors,
      voltages = [],
      dragPointIndex
    } = props;

    if (!tConnectors || !colors) {
      console.error('Missing required props for render');
      return;
    }

    const [c1, c2] = tConnectors;

    if (transistorImage.complete) {
      const scale = 0.4;
      const imageWidth = TRANSISTOR_LENGTH * 4 * scale;
      const imageHeight = imageWidth * 1.2;

      // Draw the image first
      ctx.drawImage(
        transistorImage,
        -imageWidth / 2,
        -imageHeight / 2,
        imageWidth,
        imageHeight
      );

      // Draw connecting wires
      ctx.beginPath();
      ctx.strokeStyle = WIRE_COLOR;
      ctx.lineWidth = 0.1;
      ctx.moveTo(c1.x, 0);
      ctx.lineTo(-imageWidth / 2, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = WIRE_COLOR;
      ctx.lineWidth = 0.1;
      ctx.moveTo(c2.x, 0);
      ctx.lineTo(imageWidth / 2, 0);
      ctx.stroke();
    } else {
      // Draw transistor symbol (fallback if image not loaded)
      ctx.beginPath();
      ctx.strokeStyle = colors[0];
      
      // Draw vertical line (base)
      ctx.moveTo(-TRANSISTOR_LENGTH/2, -TRANSISTOR.WIDTH/2);
      ctx.lineTo(-TRANSISTOR_LENGTH/2, TRANSISTOR.WIDTH/2);
      ctx.stroke();

      // Draw emitter and collector lines
      ctx.beginPath();
      ctx.moveTo(-TRANSISTOR_LENGTH/4, -TRANSISTOR.WIDTH/2);
      ctx.lineTo(TRANSISTOR_LENGTH/2, -TRANSISTOR.WIDTH/4);
      ctx.moveTo(-TRANSISTOR_LENGTH/4, TRANSISTOR.WIDTH/2);
      ctx.lineTo(TRANSISTOR_LENGTH/2, TRANSISTOR.WIDTH/4);
      ctx.stroke();

      // Draw arrow
      ctx.beginPath();
      const arrowSize = TRANSISTOR.WIDTH/4;
      ctx.moveTo(TRANSISTOR_LENGTH/4, 0);
      ctx.lineTo(TRANSISTOR_LENGTH/4 - arrowSize, arrowSize);
      ctx.lineTo(TRANSISTOR_LENGTH/4 - arrowSize, -arrowSize);
      ctx.closePath();
      ctx.fill();
    }

    if (dragPointIndex !== undefined && dragPointIndex !== false && voltages[dragPointIndex] !== undefined) {
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      const voltage = voltages[dragPointIndex];
      const connector = tConnectors[dragPointIndex];
      ctx.fillText(`${voltage.toFixed(2)}V`, connector.x, 15);
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