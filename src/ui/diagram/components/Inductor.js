import { BaseData } from '../../../circuit/models';
import { get2PointBoundingBox } from '../boundingBox.js';

import transforms from '../render/transforms';
import { getDragFunctionFor } from '../Utils.js';
import {
  BOUNDING_BOX_PADDING,
  INDUCTOR,
  GRID_SIZE
} from '../Constants.js';

const BOUNDING_BOX_WIDTH = INDUCTOR.WIDTH + BOUNDING_BOX_PADDING * 2;
const MIN_LENGTH = (INDUCTOR.RADIUS * 6) + GRID_SIZE;

const BaseInductorModel = BaseData.Inductor;

const DEFAULT_INDUCTANCE = 1;
const NUM_OF_CONNECTORS = 2;
const WIRE_COLOR = '#90EE90';

const inductorImage = new Image();
inductorImage.src = '/icons/inductor.png';

export default {
  typeID: BaseInductorModel.typeID,

  numOfVoltages: 2,
  numOfCurrentPaths: 1,
  numOfConnectors: NUM_OF_CONNECTORS,

  width: BOUNDING_BOX_WIDTH, // for label positioning
  editablesSchema: {
    inductance: {
      type: 'number',
      unit: 'H'
    }
  },
  defaultEditables: {
    inductance: {
      value: DEFAULT_INDUCTANCE
    }
  },
  labelWith: 'inductance',

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

    ctx.beginPath();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;
    ctx.moveTo(c1.x, 0);
    ctx.lineTo(-INDUCTOR.RADIUS * 3, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;
    ctx.moveTo(c2.x, 0);
    ctx.lineTo(INDUCTOR.RADIUS * 3, 0);
    ctx.stroke();

    if (inductorImage.complete) {
      const scale = 0.8;
      const imageWidth = INDUCTOR.RADIUS * 16 * scale;
      const imageHeight = imageWidth * 1.2;

      ctx.drawImage(
        inductorImage,
        -imageWidth / 2,
        -imageHeight / 2,
        imageWidth,
        imageHeight
      );
    } else {
      // semi-circles (fallback if image not loaded)
      ctx.beginPath();
      const gradient = ctx.createLinearGradient(-INDUCTOR.RADIUS * 3, 0, INDUCTOR.RADIUS * 3, 0);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
      ctx.strokeStyle = gradient;
      ctx.arc(-INDUCTOR.RADIUS * 2, 0, INDUCTOR.RADIUS, Math.PI, 0);
      ctx.arc(0, 0, INDUCTOR.RADIUS, Math.PI, 0);
      ctx.arc(INDUCTOR.RADIUS * 2, 0, INDUCTOR.RADIUS, Math.PI, 0);
      ctx.stroke();
    }

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
