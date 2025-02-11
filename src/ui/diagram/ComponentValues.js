import React from 'react';
import { connect } from 'react-redux';
import CircuitComponents from './components';

const styles = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    zIndex: 1000,
    minWidth: '200px',
    display: 'none' // Hidden by default
  },
  visible: {
    display: 'block'
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '10px',
    borderBottom: '1px solid #444'
  },
  value: {
    fontSize: '14px',
    marginBottom: '5px'
  }
};

class ComponentValues extends React.Component {
  getComponentName(typeID, componentNumber) {
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
  }

  formatValue(component) {
    const { typeID, editables } = component;
    const componentType = CircuitComponents[typeID];
    if (!componentType || !componentType.labelWith || !editables[componentType.labelWith]) {
      return null;
    }

    const value = editables[componentType.labelWith].value;
    const unit = componentType.editablesSchema[componentType.labelWith].unit;

    switch (typeID) {
      case 'Resistor':
        return `${value} ${unit}`;
      case 'Capacitor':
        if (value >= 1e-6) return `${value * 1e6}µF`;
        if (value >= 1e-9) return `${value * 1e9}nF`;
        return `${value * 1e12}pF`;
      case 'Inductor':
        if (value >= 1) return `${value}H`;
        if (value >= 1e-3) return `${value * 1e3}mH`;
        return `${value * 1e6}µH`;
      case 'VoltageSource':
        const type = editables.type.value;
        const frequency = editables.frequency && editables.frequency.value;
        return `${value}${unit}${type === 'Sine' && frequency ? ` ${frequency}Hz` : ''}`;
      default:
        return `${value} ${unit}`;
    }
  }

  render() {
    const { selectedComponent, componentCounters } = this.props;
    const containerStyle = {
      ...styles.container,
      ...(selectedComponent ? styles.visible : {})
    };

    if (!selectedComponent) {
      return null;
    }

    const formattedValue = this.formatValue(selectedComponent);
    if (!formattedValue) {
      return null;
    }

    const componentName = this.getComponentName(
      selectedComponent.typeID,
      componentCounters[selectedComponent.typeID] || 0
    );

    return (
      <div style={containerStyle}>
        <div style={styles.title}>
          {componentName}
        </div>
        <div style={styles.value}>
          Value: {formattedValue}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  selectedComponent: state.selected ? state.views[state.selected] : null,
  componentCounters: state.componentCounters
});

export default connect(mapStateToProps)(ComponentValues); 