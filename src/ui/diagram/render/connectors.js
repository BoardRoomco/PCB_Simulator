import R from 'ramda';
import CircuitComponents from '../components';

const lookupComponent = viewProps => CircuitComponents[viewProps.typeID];

const TWO_PI = 2 * Math.PI;

const renderConnectors = (ctx) => (component) => {
  const ComponentType = lookupComponent(component);
  const { connectors, tConnectors } = component;  // Get both connectors and tConnectors

  // Draw transformed connectors (visual connectors) with transform
  ComponentType.transform.transformCanvas(ctx, component,
    () => {
      // Draw transformed connectors (visual connectors)
      tConnectors.forEach((c) => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, TWO_PI);
        ctx.fill();
      });
    }
  );

  // Draw actual snap points in purple without transform
  if (ComponentType.typeID === 'VoltageSource') {
    ctx.save();
    ctx.fillStyle = '#800080';  // Purple
    connectors.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4, 0, TWO_PI);
      ctx.fill();
    });
    ctx.restore();
  }
};

export default function ({ctx, theme, components}) {
  const renderWithCtx = renderConnectors(ctx);

  ctx.save();
  
  // Only render connectors for hovered components
  const hoveredComponents = R.filter(c => c.hovered, components);
  ctx.fillStyle = theme.COLORS.highlight;
  hoveredComponents.forEach(renderWithCtx);

  ctx.restore();
}
