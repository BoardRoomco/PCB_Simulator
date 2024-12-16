import { BaseData } from '../../../circuit/models';
import transforms from '../render/transforms';
import { get2PointBoundingBox } from '../boundingBox.js';
import { getDragFunctionFor } from '../Utils.js';
import { GRID_SIZE, LINE_WIDTH } from '../Constants.js';
import { distance } from '../../utils/DrawingUtils';

const MIN_LENGTH = GRID_SIZE;
const HOVER_RADIUS = 10; // Radius around connector for hover detection

const BaseWireModel = BaseData.Wire;

const NUM_OF_CONNECTORS = 2;
const WIRE_COLOR = '#90EE90';

export default {
  typeID: BaseWireModel.typeID,

  numOfVoltages: 2,
  numOfCurrentPaths: 1,
  numOfConnectors: NUM_OF_CONNECTORS,

  dragPoint: getDragFunctionFor(MIN_LENGTH),
  transform: transforms[NUM_OF_CONNECTORS],

  getBoundingBox: get2PointBoundingBox(LINE_WIDTH * 2),

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

    // Draw the wire
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;

    const [c1, c2] = tConnectors;
    ctx.beginPath();
    ctx.moveTo(c1.x, 0);
    ctx.lineTo(c2.x, 0);
    ctx.stroke();
  
    // Only show voltage for hovered connector
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
      currents = [0]
    } = state;
    return currents;
  },

  renderCurrent: (props, state, renderBetween) => {
    const {
      tConnectors: [c1, c2],
      currentOffsets: [offset]
    } = props;
    renderBetween(c1, c2, offset);
  }
};
