import { BaseData } from '../../../circuit/models';
import transforms from '../render/transforms';
import { get2PointBoundingBox } from '../boundingBox.js';
import { getDragFunctionFor } from '../Utils.js';
import { GRID_SIZE } from '../Constants.js';

const DOT_RADIUS = 4; // Size of the ground dot
const MIN_LENGTH = GRID_SIZE; // Minimum distance for drag detection
const NUM_OF_CONNECTORS = 1;

const Model = BaseData.Ground;

export default {
  typeID: Model.typeID,

  numOfVoltages: 2,
  numOfCurrentPaths: 1,
  numOfConnectors: NUM_OF_CONNECTORS,

  dragPoint: getDragFunctionFor(MIN_LENGTH),
  transform: transforms[NUM_OF_CONNECTORS],
  getBoundingBox: get2PointBoundingBox(DOT_RADIUS * 2),

  render: (ctx, {colors, tConnectors}) => {
    const [c] = tConnectors;
    
    // Draw the ground dot at the connector position
    ctx.beginPath();
    ctx.fillStyle = colors[0];
    ctx.arc(c.x, 0, DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  },

  getCurrents: (props, state) => {
    const {
      currents = [0]
    } = state;

    return currents;
  },

  renderCurrent: (props, state, renderBetween) => {
    const {
      tConnectors: [c],
      currentOffsets: [offset]
    } = props;

    // No need to render current for a single point
    // renderBetween(c, c, offset);
  }
};
