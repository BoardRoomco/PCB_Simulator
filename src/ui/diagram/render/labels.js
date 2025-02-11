import Vector from 'immutable-vector2d';
import {formatSI} from 'format-si-prefix';
import { connect } from 'react-redux';

import { LINE_WIDTH } from '../Constants';

import { midPoint, direction } from '../../utils/DrawingUtils.js';

import CircuitComponents from '../components';
const lookupComponent = viewProps => CircuitComponents[viewProps.typeID];

const FONT_SIZE = 10;
const FONT = `${FONT_SIZE}px "Arial"`;

const getComponentName = (typeID, componentNumber) => {
  const prefixMap = {
    Resistor: 'R',
    Capacitor: 'C',
    Inductor: 'L',
    VoltageSource: 'V',
    CurrentSource: 'I',
    Diode: 'D',
    Transistor: 'Q'
  };

  const prefix = prefixMap[typeID] || typeID[0];
  return `${prefix}${componentNumber + 1}`;
};

const formatValue = (component) => {
  const { typeID, editables } = component;
  const componentType = lookupComponent(component);
  if (!componentType || !componentType.labelWith || !editables[componentType.labelWith]) {
    return null;
  }

  const value = editables[componentType.labelWith].value;
  const unit = componentType.editablesSchema[componentType.labelWith].unit;

  switch (typeID) {
    case 'Resistor':
      return `${formatSI(value)}${unit}`;
    case 'Capacitor':
      if (value >= 1e-6) return `${formatSI(value * 1e6)}µF`;
      if (value >= 1e-9) return `${formatSI(value * 1e9)}nF`;
      return `${formatSI(value * 1e12)}pF`;
    case 'Inductor':
      if (value >= 1) return `${formatSI(value)}H`;
      if (value >= 1e-3) return `${formatSI(value * 1e3)}mH`;
      return `${formatSI(value * 1e6)}µH`;
    case 'VoltageSource':
      const type = editables.type.value;
      const frequency = editables.frequency && editables.frequency.value;
      return `${formatSI(value)}${unit}${type === 'Sine' && frequency ? ` ${frequency}Hz` : ''}`;
    default:
      return `${formatSI(value)}${unit}`;
  }
};

const renderLabel = (ctx, componentCounters) => (component) => {
  if (!component.hovered) {
    return;
  }

  const ComponentType = lookupComponent(component);
  const {dragPoints} = component;

  const formattedValue = formatValue(component);
  if (!formattedValue) {
    return;
  }

  const componentName = getComponentName(
    component.typeID,
    componentCounters[component.typeID] || 0
  );

  const label = `${componentName}: ${formattedValue}`;

  const mid = midPoint(...dragPoints),
        dir = direction(...dragPoints),
        offsetDir = dir.perpendicular().invert(),
        offsetAngle = dir.angle(),
        offsetLength = (ComponentType.width / 2) + LINE_WIDTH + 5,
        edge = offsetDir.multiply(offsetLength),

        textWidth = ctx.measureText(label).width,
        extraX = Math.sin(offsetAngle) * (textWidth / 2),
        extraY = -Math.cos(offsetAngle) * (FONT_SIZE / 2),

        offset = edge.add(new Vector(extraX, extraY)),
        textPos = mid.add(offset);

  // Draw background for better readability
  const padding = 4;
  const bgHeight = FONT_SIZE + padding * 2;
  const bgWidth = textWidth + padding * 2;
  
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillRect(
    textPos.x - bgWidth/2,
    textPos.y - bgHeight/2,
    bgWidth,
    bgHeight
  );
  
  ctx.fillStyle = '#000';
  ctx.fillText(label, textPos.x, textPos.y);
  ctx.restore();
};

export default function({ ctx, theme, components, componentCounters }) {
  ctx.save();
  ctx.font = FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  components.forEach(renderLabel(ctx, componentCounters));

  ctx.restore();
}
