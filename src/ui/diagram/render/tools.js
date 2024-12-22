import { renderMultimeter } from '../tools/Multimeter';

const updateMultimeterMeasurement = (store, multimeter) => {
  if (!multimeter || !multimeter.active) return;

  const state = store.getState();
  const { views, circuit } = state;

  // Helper function to get voltage at a position
  const getVoltageAtPosition = (position) => {
    if (!position) return null;

    // Find nearest connector
    let nearestConnector = null;
    let minDistance = 20; // Same as SNAP_DISTANCE

    Object.values(views).forEach(component => {
      if (!component.connectors) return;
      
      component.connectors.forEach((connector, index) => {
        const dx = connector.x - position.x;
        const dy = connector.y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestConnector = {
            component,
            connectorIndex: index
          };
        }
      });
    });

    if (!nearestConnector) return null;

    // Get voltage from circuit state
    const componentState = circuit.components[nearestConnector.component.id];
    if (!componentState || !componentState.voltages) return null;

    return componentState.voltages[nearestConnector.connectorIndex];
  };

  // Get voltages at both probes
  const redVoltage = getVoltageAtPosition(multimeter.probes.redProbe);
  const blackVoltage = getVoltageAtPosition(multimeter.probes.blackProbe);

  // Update measurement if we have both voltages
  if (redVoltage !== null && blackVoltage !== null) {
    const voltageDiff = redVoltage - blackVoltage;
    store.dispatch({
      type: 'UPDATE_MULTIMETER_MEASUREMENT',
      payload: { value: voltageDiff, unit: 'V' }
    });
  }
};

export default function renderTools({ctx, theme, tools, store}) {
  // Save the canvas state
  ctx.save();

  // Update and render multimeter if it exists
  if (tools && tools.multimeter) {
    updateMultimeterMeasurement(store, tools.multimeter);
    renderMultimeter({
      ctx,
      theme,
      multimeter: tools.multimeter
    });
  }

  // Restore the canvas state
  ctx.restore();
} 