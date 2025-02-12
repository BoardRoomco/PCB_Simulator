import { LINE_WIDTH } from '../Constants';

// Constants for probe appearance and multimeter body
const PROBE_RADIUS = 5;
const LEAD_LENGTH = 50;
const DISPLAY_WIDTH = 120;
const DISPLAY_HEIGHT = 80;
const DISPLAY_BORDER = 4;
const MULTIMETER_WIDTH = 160;
const MULTIMETER_HEIGHT = 200;
const MULTIMETER_RADIUS = 10;

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
  if (!multimeter || !multimeter.active) {
    return;
  }

  const { redProbe, blackProbe } = multimeter.probes;
  
  ctx.save();
  ctx.lineWidth = LINE_WIDTH;

  // Draw multimeter body
  const multimeterX = 50;  // Fixed position for multimeter body
  const multimeterY = 150;  // Changed from 50 to 150 to move it down

  // Draw main body (rounded rectangle)
  ctx.fillStyle = '#8B8B00';  // Dark yellow for multimeter body
  ctx.beginPath();
  ctx.moveTo(multimeterX + MULTIMETER_RADIUS, multimeterY);
  ctx.lineTo(multimeterX + MULTIMETER_WIDTH - MULTIMETER_RADIUS, multimeterY);
  ctx.arcTo(multimeterX + MULTIMETER_WIDTH, multimeterY, multimeterX + MULTIMETER_WIDTH, multimeterY + MULTIMETER_RADIUS, MULTIMETER_RADIUS);
  ctx.lineTo(multimeterX + MULTIMETER_WIDTH, multimeterY + MULTIMETER_HEIGHT - MULTIMETER_RADIUS);
  ctx.arcTo(multimeterX + MULTIMETER_WIDTH, multimeterY + MULTIMETER_HEIGHT, multimeterX + MULTIMETER_WIDTH - MULTIMETER_RADIUS, multimeterY + MULTIMETER_HEIGHT, MULTIMETER_RADIUS);
  ctx.lineTo(multimeterX + MULTIMETER_RADIUS, multimeterY + MULTIMETER_HEIGHT);
  ctx.arcTo(multimeterX, multimeterY + MULTIMETER_HEIGHT, multimeterX, multimeterY + MULTIMETER_HEIGHT - MULTIMETER_RADIUS, MULTIMETER_RADIUS);
  ctx.lineTo(multimeterX, multimeterY + MULTIMETER_RADIUS);
  ctx.arcTo(multimeterX, multimeterY, multimeterX + MULTIMETER_RADIUS, multimeterY, MULTIMETER_RADIUS);
  ctx.closePath();
  ctx.fill();

  // Draw display screen
  const screenX = multimeterX + (MULTIMETER_WIDTH - DISPLAY_WIDTH) / 2;
  const screenY = multimeterY + 20;
  
  // Screen border
  ctx.fillStyle = '#8B8B00';  // Dark yellow background
  ctx.fillRect(
    screenX - DISPLAY_BORDER,
    screenY - DISPLAY_BORDER,
    DISPLAY_WIDTH + DISPLAY_BORDER * 2,
    DISPLAY_HEIGHT + DISPLAY_BORDER * 2
  );
  
  // Screen background
  ctx.fillStyle = '#90EE90';  // Light green LCD screen
  ctx.fillRect(
    screenX,
    screenY,
    DISPLAY_WIDTH,
    DISPLAY_HEIGHT
  );

  // Draw measurement if we have a value
  if (multimeter.measurement && multimeter.measurement.value !== null) {
    const text = `${multimeter.measurement.value.toFixed(2)}${multimeter.measurement.unit}`;
    ctx.fillStyle = '#000000';  // Black text
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, screenX + DISPLAY_WIDTH/2, screenY + DISPLAY_HEIGHT/2);
    
    // Draw mode indicator
    ctx.font = '14px monospace';
    ctx.fillText(multimeter.mode.toUpperCase(), screenX + DISPLAY_WIDTH/2, screenY + 20);
  }

  // Draw mode selector dial (circle with pointer)
  const dialX = multimeterX + MULTIMETER_WIDTH/2;
  const dialY = multimeterY + MULTIMETER_HEIGHT - 50;
  const dialRadius = 30;
  
  ctx.beginPath();
  ctx.fillStyle = '#666666';
  ctx.arc(dialX, dialY, dialRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Dial pointer
  const angle = multimeter.mode === 'voltage' ? 0 : multimeter.mode === 'current' ? Math.PI/3 : 2*Math.PI/3;
  ctx.beginPath();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.moveTo(dialX, dialY);
  ctx.lineTo(
    dialX + Math.cos(angle) * (dialRadius - 5),
    dialY + Math.sin(angle) * (dialRadius - 5)
  );
  ctx.stroke();

  // Draw probe leads (thicker wires from multimeter to probes)
  ctx.beginPath();
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 3;
  ctx.moveTo(multimeterX + 20, multimeterY + MULTIMETER_HEIGHT);  // Red probe socket
  ctx.lineTo(redProbe.x, redProbe.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 3;
  ctx.moveTo(multimeterX + MULTIMETER_WIDTH - 20, multimeterY + MULTIMETER_HEIGHT);  // Black probe socket
  ctx.lineTo(blackProbe.x, blackProbe.y);
  ctx.stroke();

  // Draw probe tips
  // Red probe
  ctx.beginPath();
  ctx.fillStyle = theme.voltageColor || 'red';
  ctx.strokeStyle = theme.voltageColor || 'red';
  ctx.arc(redProbe.x, redProbe.y, PROBE_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Black probe
  ctx.beginPath();
  ctx.fillStyle = theme.groundColor || 'black';
  ctx.strokeStyle = theme.groundColor || 'black';
  ctx.arc(blackProbe.x, blackProbe.y, PROBE_RADIUS, 0, Math.PI * 2);
  ctx.fill();

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