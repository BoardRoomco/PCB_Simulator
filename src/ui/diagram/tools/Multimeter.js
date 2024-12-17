import { LINE_WIDTH } from '../Constants';

// Constants for probe appearance
const PROBE_RADIUS = 5;
const LEAD_LENGTH = 50;

// Initial state for the multimeter
export const initialMultimeterState = {
  active: false,
  mode: 'voltage', // voltage, current, resistance
  probes: {
    redProbe: { x: 100, y: 100 },
    blackProbe: { x: 200, y: 100 }
  },
  probeTargets: {
    red: null,
    black: null
  },
  measurement: {
    value: null,
    unit: 'V'
  }
};

// Render function for the multimeter
export const renderMultimeter = ({ctx, theme, multimeter}) => {
  if (!multimeter || !multimeter.active) return;

  const { redProbe, blackProbe } = multimeter.probes;
  
  ctx.save();
  ctx.lineWidth = LINE_WIDTH;

  // Draw red probe
  ctx.beginPath();
  ctx.fillStyle = theme.voltageColor || 'red';
  ctx.strokeStyle = theme.voltageColor || 'red';
  // Probe tip
  ctx.arc(redProbe.x, redProbe.y, PROBE_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  // Probe lead
  ctx.beginPath();
  ctx.moveTo(redProbe.x, redProbe.y);
  ctx.lineTo(redProbe.x, redProbe.y + LEAD_LENGTH);
  ctx.stroke();

  // Draw black probe
  ctx.beginPath();
  ctx.fillStyle = theme.groundColor || 'black';
  ctx.strokeStyle = theme.groundColor || 'black';
  // Probe tip
  ctx.arc(blackProbe.x, blackProbe.y, PROBE_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  // Probe lead
  ctx.beginPath();
  ctx.moveTo(blackProbe.x, blackProbe.y);
  ctx.lineTo(blackProbe.x, blackProbe.y + LEAD_LENGTH);
  ctx.stroke();

  // Draw measurement display if we have a value
  if (multimeter.measurement && multimeter.measurement.value !== null) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeStyle = '#00ff00';
    ctx.font = '16px monospace';
    
    // Position the display between the probes
    const displayX = (redProbe.x + blackProbe.x) / 2;
    const displayY = Math.min(redProbe.y, blackProbe.y) - 20;
    
    const text = `${multimeter.measurement.value.toFixed(2)}${multimeter.measurement.unit}`;
    const metrics = ctx.measureText(text);
    const padding = 10;
    
    // Draw background
    ctx.fillRect(
      displayX - metrics.width/2 - padding,
      displayY - 16 - padding,
      metrics.width + padding * 2,
      32
    );
    
    // Draw text
    ctx.fillStyle = '#00ff00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, displayX, displayY);
    ctx.restore();
  }

  ctx.restore();
};

// Helper function to update probe position
export const updateProbePosition = (multimeter, color, position) => {
  return {
    ...multimeter,
    probes: {
      ...multimeter.probes,
      [color === 'red' ? 'redProbe' : 'blackProbe']: position
    }
  };
};

// Helper function to update measurement
export const updateMeasurement = (multimeter, value, unit) => {
  return {
    ...multimeter,
    measurement: {
      value,
      unit
    }
  };
};

// Helper function to toggle multimeter active state
export const toggleMultimeter = (multimeter) => {
  return {
    ...multimeter,
    active: !multimeter.active
  };
};

// Helper function to change multimeter mode
export const changeMultimeterMode = (multimeter, mode) => {
  const units = {
    voltage: 'V',
    current: 'A',
    resistance: 'Ω'
  };

  return {
    ...multimeter,
    mode,
    measurement: {
      value: null,
      unit: units[mode]
    }
  };
}; 