import { BaseData } from '../../../circuit/models';
import { get2PointBoundingBox } from '../boundingBox.js';
import transforms from '../render/transforms';
import { getDragFunctionFor } from '../Utils.js';
import {
  BOUNDING_BOX_PADDING,
  GRID_SIZE
} from '../Constants.js';

const OPAMP_WIDTH = GRID_SIZE * 3;
const OPAMP_HEIGHT = GRID_SIZE * 4;
const BOUNDING_BOX_WIDTH = OPAMP_WIDTH + BOUNDING_BOX_PADDING * 2;
const MIN_LENGTH = OPAMP_WIDTH + GRID_SIZE;

const BaseOpAmpModel = BaseData.OpAmp;
const NUM_OF_CONNECTORS = 3; // V+, V-, Vout

export default {
  typeID: BaseOpAmpModel.typeID,

  numOfVoltages: 3,
  numOfCurrentPaths: 2,
  numOfConnectors: NUM_OF_CONNECTORS,

  width: BOUNDING_BOX_WIDTH,
  
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

    const [vPlus, vMinus, vOut] = tConnectors;

    // Draw connecting wires
    ctx.beginPath();
    ctx.strokeStyle = colors[0];
    ctx.moveTo(vPlus.x, vPlus.y);
    ctx.lineTo(-OPAMP_WIDTH/2, -OPAMP_HEIGHT/4);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = colors[1];
    ctx.moveTo(vMinus.x, vMinus.y);
    ctx.lineTo(-OPAMP_WIDTH/2, OPAMP_HEIGHT/4);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = colors[2];
    ctx.moveTo(vOut.x, vOut.y);
    ctx.lineTo(OPAMP_WIDTH/2, 0);
    ctx.stroke();

    // Draw op-amp triangle symbol
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.moveTo(-OPAMP_WIDTH/2, -OPAMP_HEIGHT/2);  // Top left
    ctx.lineTo(-OPAMP_WIDTH/2, OPAMP_HEIGHT/2);   // Bottom left
    ctx.lineTo(OPAMP_WIDTH/2, 0);                 // Right point
    ctx.closePath();
    ctx.stroke();

    // Draw + and - symbols
    ctx.fillStyle = 'black';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('+', -OPAMP_WIDTH/2 - 5, -OPAMP_HEIGHT/4 + 5);
    ctx.fillText('-', -OPAMP_WIDTH/2 - 5, OPAMP_HEIGHT/4 + 5);

    // Draw voltage values if being dragged
    if (dragPointIndex !== undefined && dragPointIndex !== false && voltages[dragPointIndex] !== undefined) {
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      const voltage = voltages[dragPointIndex];
      const connector = tConnectors[dragPointIndex];
      ctx.fillText(`${voltage.toFixed(2)}V`, connector.x, connector.y - 10);
    }
  }
}; 