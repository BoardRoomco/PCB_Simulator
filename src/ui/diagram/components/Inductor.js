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
inductorImage.src = 'icons/inductor.png';

export default {
  typeID: BaseInductorModel.typeID,

  numOfVoltages: 2,
  numOfCurrentPaths: 1,
  numOfConnectors: NUM_OF_CONNECTORS,

  width: BOUNDING_BOX_WIDTH,
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

    // Draw connecting wires
    ctx.beginPath();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;
    ctx.moveTo(c1.x, 0);
    ctx.lineTo(-INDUCTOR.RADIUS * 1.5, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;
    ctx.moveTo(c2.x, 0);
    ctx.lineTo(INDUCTOR.RADIUS * 1.5, 0);
    ctx.stroke();

    if (inductorImage.complete) {
      const scale = 0.8;
      const baseSize = INDUCTOR.RADIUS * 12;
      const width = baseSize * scale;
      const height = baseSize * scale * 1.2;

      ctx.drawImage(
        inductorImage,
        -width / 2,
        -height / 2,
        width,
        height
      );
    } else {
      // Draw inductor symbol
      ctx.beginPath();
      ctx.strokeStyle = colors[0];
      ctx.moveTo(-INDUCTOR.RADIUS * 1.5, 0);
      ctx.lineTo(-INDUCTOR.RADIUS * 0.75, 0);
      
      // Draw the coils
      ctx.arc(-INDUCTOR.RADIUS * 0.25, 0, INDUCTOR.RADIUS * 0.25, Math.PI, 0, false);
      ctx.arc(INDUCTOR.RADIUS * 0.25, 0, INDUCTOR.RADIUS * 0.25, Math.PI, 0, false);
      ctx.arc(INDUCTOR.RADIUS * 0.75, 0, INDUCTOR.RADIUS * 0.25, Math.PI, 0, false);
      
      ctx.moveTo(INDUCTOR.RADIUS * 1.5, 0);
      ctx.lineTo(INDUCTOR.RADIUS * 0.75, 0);
      
      ctx.stroke();
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
