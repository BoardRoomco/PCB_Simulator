// src/ui/diagram/tools/SaveButton.js
export const renderSaveButton = ({ ctx, theme }) => {
  const x = ctx.canvas.width - 110;
  const y = 10;
  const width = 100;
  const height = 30;

  // Draw button
  ctx.fillStyle = theme.buttonBackground || '#4CAF50';
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 4);
  ctx.fill();

  // Draw text
  ctx.fillStyle = theme.buttonText || 'white';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Save Challenge', x + width/2, y + height/2);

  // Return button info for click detection
  return {
    type: 'saveButton',
    bounds: { x, y, width, height }
  };
};

export const handleSaveButtonClick = async (store) => {
  const state = store.getState();
  const circuitState = {
    circuitGraph: state.circuit.circuitGraph,
    components: state.circuit.components,
    timestep: state.circuit.timestep,
    simTimePerSec: state.circuit.simTimePerSec
  };

  try {
    const { saveCircuitChallenge } = require('../../../../node_quickstart');
    await saveCircuitChallenge(circuitState);
    console.log('Circuit saved successfully!');
  } catch (error) {
    console.error('Failed to save circuit:', error);
  }
};