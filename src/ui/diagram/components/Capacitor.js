import { BaseData } from '../../../circuit/models';
import { get2PointBoundingBox } from '../boundingBox.js';
import transforms from '../render/transforms';
import { getDragFunctionFor } from '../Utils.js';
import {
  BOUNDING_BOX_PADDING,
  GRID_SIZE
} from '../Constants.js';

const MIN_LENGTH = GRID_SIZE * 3;
const COMPONENT_SIZE = GRID_SIZE * 4;

const BaseCapacitorModel = BaseData.Capacitor;
const DEFAULT_CAPACITANCE = 10e-6;
const NUM_OF_CONNECTORS = 2;

const capacitorImage = new Image();
capacitorImage.src = './icons/capacitor.png';

// Add more detailed error handling
capacitorImage.onerror = (err) => {
  console.error('Failed to load capacitor image:', err);
  console.error('Image path:', capacitorImage.src);
  console.error('Current location:', window.location.href);
};

// Add load success handler
capacitorImage.onload = () => {
  console.log('Capacitor image loaded successfully');
};

export default {
  typeID: BaseCapacitorModel.typeID,

  numOfVoltages: 2,
  numOfCurrentPaths: 1,
  numOfConnectors: NUM_OF_CONNECTORS,

  width: COMPONENT_SIZE,
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

  getBoundingBox: get2PointBoundingBox(COMPONENT_SIZE),

  render: (ctx, props) => {
    // Draw connection points first
    const dotRadius = 3;
    ctx.fillStyle = props.colors[0];
    
   /* // Left connection point
    ctx.beginPath();
    ctx.arc(-COMPONENT_SIZE/2, 0, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Right connection point
    ctx.fillStyle = props.colors[1];
    ctx.beginPath();
    ctx.arc(COMPONENT_SIZE/2, 0, dotRadius, 0, Math.PI * 2);
    ctx.fill();
*/

    // Only try to draw the image if it's loaded successfully
    if (capacitorImage.complete && capacitorImage.naturalWidth !== 0) {
      try {
        ctx.drawImage(
          capacitorImage,
          -COMPONENT_SIZE/2,
          -COMPONENT_SIZE/2,
          COMPONENT_SIZE,
          COMPONENT_SIZE
        );
      } catch (err) {
        console.error('Error drawing capacitor:', err);
        
        // Draw a fallback shape if image fails
        ctx.strokeStyle = props.colors[0];
        ctx.strokeRect(
          -COMPONENT_SIZE/2,
          -COMPONENT_SIZE/2,
          COMPONENT_SIZE,
          COMPONENT_SIZE
        );
      }
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
