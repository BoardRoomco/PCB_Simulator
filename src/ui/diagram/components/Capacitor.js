import { BaseData } from '../../../circuit/models';
import { get2PointBoundingBox } from '../boundingBox.js';
import transforms from '../render/transforms';
import { getDragFunctionFor } from '../Utils.js';
import {
  BOUNDING_BOX_PADDING,
  CAPACITOR,
  GRID_SIZE
} from '../Constants.js';

const CAPACITOR_LENGTH = GRID_SIZE * 2;
const BOUNDING_BOX_WIDTH = CAPACITOR.WIDTH + BOUNDING_BOX_PADDING * 2;
const MIN_LENGTH = CAPACITOR_LENGTH + GRID_SIZE;

const BaseCapacitorModel = BaseData.Capacitor;
const DEFAULT_CAPACITANCE = 1e-6;
const NUM_OF_CONNECTORS = 2;
const WIRE_COLOR = '#90EE90';

const capacitorImage = new Image();
capacitorImage.src = 'icons/capacitor.png';

export default {
  typeID: BaseCapacitorModel.typeID,

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
      connectorIndex
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
    ctx.lineTo(-CAPACITOR_LENGTH / 2, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = WIRE_COLOR;
    ctx.lineWidth = 0.1;
    ctx.moveTo(c2.x, 0);
    ctx.lineTo(CAPACITOR_LENGTH / 2, 0);
    ctx.stroke();

    if (capacitorImage.complete) {
      const scale = 0.2;
      const imageWidth = CAPACITOR_LENGTH * 3 * scale;
      const imageHeight = CAPACITOR.WIDTH * 2 * scale;

      ctx.drawImage(
        capacitorImage,
        -imageWidth / 2,
        -imageHeight / 2,
        imageWidth,
        imageHeight
      );
    } else {
      ctx.beginPath();
      ctx.strokeStyle = colors[0];
      ctx.moveTo(-CAPACITOR_LENGTH / 2, -CAPACITOR.WIDTH / 2);
      ctx.lineTo(-CAPACITOR_LENGTH / 2, CAPACITOR.WIDTH / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = colors[1];
      ctx.moveTo(CAPACITOR_LENGTH / 2, -CAPACITOR.WIDTH / 2);
      ctx.lineTo(CAPACITOR_LENGTH / 2, CAPACITOR.WIDTH / 2);
      ctx.stroke();
    }

    if (connectorIndex !== undefined && connectorIndex !== false && voltages[connectorIndex] !== undefined) {
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      const voltage = voltages[connectorIndex];
      const connector = tConnectors[connectorIndex];
      ctx.fillText(`${voltage.toFixed(2)}V`, connector.x, connector.y - 10);
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
