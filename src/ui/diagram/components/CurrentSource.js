import { BaseData } from '../../../circuit/models';
import { get2PointBoundingBox } from '../boundingBox.js';
import transforms from '../render/transforms';
import { getDragFunctionFor } from '../Utils.js';
import {
  BOUNDING_BOX_PADDING,
  CURRENT_SOURCE,
  GRID_SIZE
} from '../Constants.js';

const BOUNDING_BOX_WIDTH = CURRENT_SOURCE.WIDTH + BOUNDING_BOX_PADDING * 2;
const MIN_LENGTH = CURRENT_SOURCE.LENGTH + GRID_SIZE;

const BaseCurrentSourceModel = BaseData.CurrentSource;

const DEFAULT_CURRENT = 1e-3;
const NUM_OF_CONNECTORS = 2;
const WIRE_COLOR = '#90EE90';

export default {
  typeID: BaseCurrentSourceModel.typeID,

  numOfVoltages: 2,
  numOfCurrentPaths: 1,
  numOfConnectors: NUM_OF_CONNECTORS,

  width: BOUNDING_BOX_WIDTH,
  editablesSchema: {
    current: {
      type: 'number',
      unit: 'A'
    }
  },
  defaultEditables: {
    current: {
      value: DEFAULT_CURRENT
    }
  },
  labelWith: 'current',

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
    const width = CURRENT_SOURCE.WIDTH || GRID_SIZE;
    const length = CURRENT_SOURCE.LENGTH || GRID_SIZE;

    // Draw connecting lines
    ctx.beginPath();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;
    ctx.moveTo(c1.x, 0);
    ctx.lineTo(-length / 2, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;
    ctx.moveTo(c2.x, 0);
    ctx.lineTo(length / 2, 0);
    ctx.stroke();

    // Draw circle with solid color instead of gradient if dimensions are invalid
    ctx.beginPath();
    if (isFinite(width) && width > 0) {
      const x1 = -width / 2;
      const x2 = width / 2;
      if (isFinite(x1) && isFinite(x2)) {
        const gradient = ctx.createLinearGradient(x1, 0, x2, 0);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = colors[0]; // Fallback to solid color
      }
    } else {
      ctx.strokeStyle = colors[0]; // Fallback to solid color
    }
    ctx.arc(0, 0, width / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw arrow
    ctx.beginPath();
    ctx.strokeStyle = colors[1];
    const arrowWidth = width / 4;
    const arrowHead = width / 8;
    ctx.moveTo(-arrowWidth, 0);
    ctx.lineTo(arrowWidth, 0);
    ctx.moveTo(arrowWidth - arrowHead, -arrowHead);
    ctx.lineTo(arrowWidth, 0);
    ctx.lineTo(arrowWidth - arrowHead, arrowHead);
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
      editables: {
        current: {
          value: current = DEFAULT_CURRENT
        }
      }
    } = props;

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
