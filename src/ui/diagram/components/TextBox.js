import { BaseData } from '../../../circuit/models';
import { get2PointBoundingBox } from '../boundingBox.js';
import transforms from '../render/transforms';
import { getDragFunctionFor } from '../Utils.js';
import {
  BOUNDING_BOX_PADDING,
  GRID_SIZE
} from '../Constants.js';

const TEXT_BOX_WIDTH = GRID_SIZE * 4;
const BOUNDING_BOX_WIDTH = TEXT_BOX_WIDTH + BOUNDING_BOX_PADDING * 2;
const MIN_LENGTH = TEXT_BOX_WIDTH;

export default {
  typeID: 'TextBox',

  // No electrical properties
  numOfVoltages: 0,
  numOfCurrentPaths: 0,
  numOfConnectors: 0,

  width: BOUNDING_BOX_WIDTH,
  editablesSchema: {
    text: {
      type: 'text',
      label: 'Text'
    },
    fontSize: {
      type: 'number',
      label: 'Font Size',
      unit: 'px'
    }
  },
  defaultEditables: {
    text: {
      value: 'Text Box'
    },
    fontSize: {
      value: 14
    }
  },

  dragPoint: getDragFunctionFor(MIN_LENGTH),
  transform: transforms.identity,

  getBoundingBox: get2PointBoundingBox(BOUNDING_BOX_WIDTH),

  render(ctx, props) {
    const {
      dragPoints,
      editables = {},
      colors
    } = props;

    if (!dragPoints || !colors) {
      console.error('Missing required props for render');
      return;
    }

    const text = editables.text && editables.text.value ? editables.text.value : 'Text Box';
    const fontSize = editables.fontSize && editables.fontSize.value ? editables.fontSize.value : 14;

    ctx.save();
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = colors[0];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Get position from first drag point
    const position = dragPoints[0];
    ctx.fillText(text, position.x, position.y);
    ctx.restore();
  }
}; 