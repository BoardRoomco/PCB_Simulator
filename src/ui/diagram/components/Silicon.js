import { BaseData } from '../../../circuit/models';
import transforms from '../render/transforms';
import { get2PointBoundingBox } from '../boundingBox.js';
import { getDragFunctionFor } from '../Utils.js';
import { GRID_SIZE } from '../Constants.js';

const MIN_LENGTH = GRID_SIZE * 3;
const MAX_LENGTH = MIN_LENGTH;
const NUM_OF_CONNECTORS = 1;

const BaseModel = BaseData.Silicon;
const SILICON_COLOR = '#006633';

export default {
  typeID: BaseModel.typeID,
  renderOrder: -1,

  numOfVoltages: 2,
  numOfCurrentPaths: 1,
  numOfConnectors: NUM_OF_CONNECTORS,

  width: GRID_SIZE * 2,
  editablesSchema: {
    voltage: {
      type: 'number',
      unit: 'V'
    }
  },
  defaultEditables: {
    voltage: {
      value: 0
    }
  },
  labelWith: 'voltage',

  dragPoint: getDragFunctionFor(MIN_LENGTH, MAX_LENGTH),
  transform: transforms[NUM_OF_CONNECTORS],
  
  getBoundingBox: get2PointBoundingBox(GRID_SIZE * 2),

  render: (ctx, props) => {
    ctx.globalCompositeOperation = 'destination-over';
    
    ctx.fillStyle = SILICON_COLOR;
    ctx.fillRect(
      -GRID_SIZE,
      -GRID_SIZE,
      GRID_SIZE * 10,
      GRID_SIZE * 10
    );

    ctx.globalCompositeOperation = 'source-over';
    
    const { tConnectors: [c1], colors } = props;
    ctx.beginPath();
    ctx.strokeStyle = colors[0];
    ctx.moveTo(c1.x, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();
  },

  getCurrents: (props, state) => {
    const {
      editables: {
        voltage: {
          value: voltage = 0
        }
      }
    } = props;

    const {
      voltages: [v0] = [0]
    } = state;

    return [voltage - v0];
  },

  renderCurrent: (props, state, renderBetween) => {
    const {
      tConnectors: [c],
      currentOffsets: [offset]
    } = props;

    renderBetween({x: 0, y: 0}, c, offset);
  }
};
  