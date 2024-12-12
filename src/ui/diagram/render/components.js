import R from 'ramda';
import CircuitComponents from '../components';

const lookupComponent = viewProps => CircuitComponents[viewProps.typeID];

export default function({ctx, theme, volts2RGB, circuitState, components}) {
  components.forEach((component) => {
    const ComponentType = lookupComponent(component);

    const colors = component.hovered
      ? R.repeat(theme.COLORS.highlight, ComponentType.numOfVoltages || 1)
      : R.repeat(theme.COLORS.base, ComponentType.numOfVoltages || 1);

    const props = {
      ...component,
      voltages: circuitState[component.id].voltages,
      colors
    };

    ComponentType.transform.transformCanvas(ctx, props,
      () => ComponentType.render(ctx, props)
    );
  });
}
