import { BaseData } from '../../../circuit/models';
import transforms from '../render/transforms';
import { get2PointBoundingBox } from '../boundingBox.js';
import { getDragFunctionFor } from '../Utils.js';
import { GRID_SIZE } from '../Constants.js';

const MIN_LENGTH = GRID_SIZE * 3;
const MAX_LENGTH = MIN_LENGTH;
const NUM_OF_CONNECTORS = 1;

const BaseModel = BaseData.Silicon;
const WIRE_COLOR = '#90EE90';

const siliconImage = new Image();
siliconImage.src = '/icons/silicon.png';

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
    
    const { tConnectors: [c1], colors } = props;

    if (siliconImage.complete) {
      const scale = 0.8;
      const baseSize = GRID_SIZE * 14;
      const imageWidth = baseSize * 1.4;
      const imageHeight = baseSize * 1.8;

      ctx.drawImage(
        siliconImage,
        -imageWidth / 2,
        -imageHeight / 2,
        imageWidth,
        imageHeight
      );
    } else {
      // Fallback if image not loaded
      ctx.fillStyle = '#006633';
      ctx.fillRect(
        -GRID_SIZE * 1.4,
        -GRID_SIZE * 1.8,
        GRID_SIZE * 14,
        GRID_SIZE * 18
      );
    }

    ctx.globalCompositeOperation = 'source-over';
    
    // Draw connecting wire
    ctx.beginPath();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;
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
  