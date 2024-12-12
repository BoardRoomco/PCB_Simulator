import { BaseData } from '../../../circuit/models';
import transforms from '../render/transforms';

import { get2PointBoundingBox } from '../boundingBox.js';

import { getDragFunctionFor } from '../Utils.js';
import { GRID_SIZE, LINE_WIDTH } from '../Constants.js';

const MIN_LENGTH = GRID_SIZE;

const BaseWireModel = BaseData.Wire;

const NUM_OF_CONNECTORS = 2;
const WIRE_COLOR = '#000000';

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
      voltages
    } = props;

    console.log('tConnectors:', tConnectors);
    console.log('colors:', colors);
    console.log('voltages:', voltages);
  
    if (!tConnectors || !voltages || !colors) {
      console.error('Missing required props for render');
      return;  // Early return if props are missing
    }

    // Format voltages to two decimal places
  const formattedVoltages = voltages.map(voltage => voltage.toFixed(2));
  
    ctx.strokeStyle = WIRE_COLOR;

    const [c1, c2] = tConnectors;
    ctx.beginPath();
    ctx.moveTo(c1.x, 0);
    ctx.lineTo(c2.x, 0);
    ctx.stroke();

    ctx.fillStyle = 'black';  // Set color for the text (can be customized)
    ctx.font = '12px Arial';  // Set font for the text
    
    ctx.fillText(`${formattedVoltages[0]} V`, c1.x, 15);
    ctx.fillText(`${formattedVoltages[1]} V`, c2.x, 15);
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
