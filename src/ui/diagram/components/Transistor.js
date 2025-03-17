import { BaseData } from '../../../circuit/models';
import { get2PointBoundingBox } from '../boundingBox.js';
import transforms from '../render/transforms';
import { getDragFunctionFor } from '../Utils.js';
import {
  BOUNDING_BOX_PADDING,
  TRANSISTOR,
  GRID_SIZE
} from '../Constants.js';

const TRANSISTOR_LENGTH = GRID_SIZE * 2;
const BOUNDING_BOX_WIDTH = TRANSISTOR.WIDTH + BOUNDING_BOX_PADDING * 2;
const MIN_LENGTH = TRANSISTOR_LENGTH + GRID_SIZE;

const BaseTransistorModel = BaseData.Transistor;
const NUM_OF_CONNECTORS = 3;
const WIRE_COLOR = '#90EE90';

const transistorImage = new Image();
transistorImage.src = 'icons/mosfet.png';

export default {
  typeID: BaseTransistorModel.typeID,

  numOfVoltages: 3,
  numOfCurrentPaths: 2,
  numOfConnectors: NUM_OF_CONNECTORS,

  width: BOUNDING_BOX_WIDTH,
  editablesSchema: {
    type: {
      type: 'type-select',
      options: {
        NMOS: [],
        PMOS: []
      }
    },
    reflection: {
      type: 'type-select',
      options: {
        'Normal': [],
        'Flipped': []
      }
    },
    W: {
      type: 'number',
      unit: 'μm'
    },
    L: {
      type: 'number',
      unit: 'μm'
    }
  },
  defaultEditables: {
    type: {
      value: 'NMOS'
    },
    reflection: {
      value: 'Normal'
    },
    W: {
      value: 10
    },
    L: {
      value: 1
    }
  },
  labelWith: 'type',

  dragPoint: getDragFunctionFor(MIN_LENGTH),
  transform: transforms["3-mosfet"],

  getBoundingBox: get2PointBoundingBox(BOUNDING_BOX_WIDTH),

  render: (ctx, props) => {
    const {
      tConnectors,
      colors,
      voltages = [],
      connectorIndex,
      editables = {}
    } = props;

    if (!tConnectors || !colors) {
      console.error('Missing required props for render');
      return;
    }

    const [drain, gate, source] = tConnectors;
    const scale = 0.4;
    const symbolWidth = TRANSISTOR_LENGTH * 4 * scale;
    const symbolHeight = symbolWidth * 1.2;
    const isFlipped = editables.reflection && editables.reflection.value === 'Flipped';

    // Save the current context state
    ctx.save();
    
    // Apply vertical reflection if needed
    if (isFlipped) {
      ctx.scale(1, -1);
    }

    if (transistorImage.complete) {
      const imageWidth = symbolWidth * 2;
      const imageHeight = symbolHeight * 2;

      ctx.drawImage(
        transistorImage,
        -imageWidth/2,
        -imageHeight/2,
        imageWidth,
        imageHeight
      );
    } else {
      // Draw gate line (vertical)
      ctx.beginPath();
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 2;
      ctx.moveTo(0, -symbolHeight/2);
      ctx.lineTo(0, symbolHeight/2);
      ctx.stroke();

      // Draw drain-source channel (horizontal)
      ctx.beginPath();
      ctx.moveTo(0, -symbolHeight/3);
      ctx.lineTo(symbolWidth/2, -symbolHeight/3);
      ctx.moveTo(0, symbolHeight/3);
      ctx.lineTo(symbolWidth/2, symbolHeight/3);
      ctx.stroke();

      // Draw source terminal
      ctx.beginPath();
      ctx.moveTo(symbolWidth/2, -symbolHeight/3);
      ctx.lineTo(symbolWidth/2, symbolHeight/3);
      ctx.stroke();

      // Draw gate arrow (for NMOS) or circle (for PMOS)
      const isNMOS = editables.type && editables.type.value === 'NMOS';
      if (isNMOS) {
        // Draw arrow pointing in
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(symbolWidth/4, -symbolHeight/6);
        ctx.lineTo(symbolWidth/4, symbolHeight/6);
        ctx.closePath();
        ctx.fillStyle = colors[0];
        ctx.fill();
      } else {
        // Draw circle for PMOS
        ctx.beginPath();
        ctx.arc(symbolWidth/4, 0, symbolHeight/6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Restore context before drawing wires and connectors
    ctx.restore();

    // Draw connecting wires with thinner lines
    ctx.lineWidth = 0.1;
    ctx.strokeStyle = WIRE_COLOR;

    // Draw connecting wires to match the pins in the image
    // Gate connection (right pin)
    ctx.beginPath();
    ctx.moveTo(symbolWidth/3, 0);          // Start at right pin
    ctx.lineTo(gate.x, gate.y);            // End at purple connector
    ctx.stroke();

    // Drain connection (left top pin)
    ctx.beginPath();
    ctx.moveTo(-symbolWidth/3, isFlipped ? 8 : -8);        // Adjust y-coordinate based on reflection
    ctx.lineTo(drain.x, drain.y);          // End at purple connector
    ctx.stroke();

    // Source connection (left bottom pin)
    ctx.beginPath();
    ctx.moveTo(-symbolWidth/3, isFlipped ? -8 : 8);        // Adjust y-coordinate based on reflection
    ctx.lineTo(source.x, source.y);        // End at purple connector
    ctx.stroke();

    // Draw connector points
    const connectorRadius = 3;
    tConnectors.forEach((connector, i) => {
      // Only draw connectors if this connector is being hovered over
      if (i === connectorIndex) {
        ctx.beginPath();
        ctx.strokeStyle = colors[0];  // Use default color from theme
        ctx.fillStyle = colors[0];    // Use default color from theme
        ctx.arc(connector.x, connector.y, connectorRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });

    // Show voltage for hovered connector
    if (connectorIndex !== undefined && connectorIndex !== false && voltages[connectorIndex] !== undefined) {
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      const voltage = voltages[connectorIndex];
      const connector = tConnectors[connectorIndex];
      const label = ['D', 'G', 'S'][connectorIndex];
      ctx.fillText(`${label}: ${voltage.toFixed(2)}V`, connector.x - 20, connector.y - 10);
    }
  },

  getCurrents: (props, state) => {
    const {
      voltages: [vd, vg, vs] = [0, 0, 0],
      currents = [0, 0]
    } = state;

    return currents;
  },

  renderCurrent: (props, state, renderBetween) => {
    const {
      tConnectors: [drain, gate, source],
      currentOffsets: [drainOffset, gateOffset]
    } = props;
    
    // Render drain-source current
    renderBetween(drain, source, drainOffset);
    // Render gate current
    renderBetween(gate, source, gateOffset);
  }
}; 