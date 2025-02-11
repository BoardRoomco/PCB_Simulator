import React from 'react';
import Vector from 'immutable-vector2d';
import MODES from '../../Modes';

import {
  canvasMouseDown,
  canvasMouseMove,
  canvasMouseUp,
  canvasMouseEnter,
  canvasMouseLeave,
  toggleMultimeter,
  updateProbePosition,
  updateMultimeterMeasurement,
  loopBegin,
  loopUpdate,
  updateCurrentOffsets,
  rationaliseCurrentOffsets,
  saveCircuitAsChallenge,
  loadCircuit,
  toggleCompetitionMode,
  submitAnswer
} from '../../state/actions';
import resize from '../Resize';
import {relMouseCoords} from '../utils/DrawingUtils';
import createLoop from './loop';
import createRender from './render';
import SimulationControl from './SimulationControl';
import AnswerBar from './AnswerBar';

const SNAP_DISTANCE = 20; // Distance in pixels to snap to connectors

const setupLoop = (store, ctx, theme) => {
  const begin = () => {
    store.dispatch(loopBegin());
  };
  const update = (delta) => {
    store.dispatch(loopUpdate(delta));
    store.dispatch(updateCurrentOffsets(delta));
  };
  const render = createRender(store, ctx, theme);
  const draw = () => {
    store.dispatch(rationaliseCurrentOffsets());
    render();
  };

  return createLoop(begin, update, draw);
};

class CircuitDiagram extends React.Component {
  constructor(props) {
    super(props);
    this.onMouse = this.onMouse.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.state = {
      draggingProbe: null // 'red' or 'black' or null
    };
  }

  shouldComponentUpdate(nextProps) {
    const {width, height} = this.props;
    return width !== nextProps.width
      || height !== nextProps.height;
  }

  componentDidMount() {
    this.loop = setupLoop(this.context.store, this.canvas.getContext('2d'), this.context.theme);
    this.loop.start();
    window.addEventListener('keydown', this.handleKeyPress);
  }

  componentWillUnmount() {
    this.loop.stop();
    window.removeEventListener('keydown', this.handleKeyPress);
  }

  handleKeyPress(event) {
    const { store } = this.context;
    
    if (event.key.toLowerCase() === 'm') {
      store.dispatch(toggleMultimeter());
    } else if (event.key.toLowerCase() === 's') {
      const correctAnswer = prompt('What is the correct answer for this circuit?');
      if (correctAnswer) {
        store.dispatch(saveCircuitAsChallenge(correctAnswer));
      }
    } else if (event.key.toLowerCase() === 'l') {
      const circuitId = prompt('Enter the circuit ID to load:');
      if (circuitId) {
        const offsetX = parseInt(prompt('Enter X offset (or leave empty for 0):', '0')) || 0;
        const offsetY = parseInt(prompt('Enter Y offset (or leave empty for 0):', '0')) || 0;
        store.dispatch(loadCircuit(circuitId, { x: offsetX, y: offsetY }));
      }
    } else if (event.key.toLowerCase() === 'c') {
      store.dispatch(toggleCompetitionMode());
    }
  }

  isProbeAtPosition(probe, coords, tools) {
    if (!tools.multimeter || !tools.multimeter.probes) return false;
    const probePos = tools.multimeter.probes[probe === 'red' ? 'redProbe' : 'blackProbe'];
    const dx = probePos.x - coords.x;
    const dy = probePos.y - coords.y;
    return Math.sqrt(dx * dx + dy * dy) < 10; // 10px radius for probe hit detection
  }

  findNearestConnector(coords, views) {
    let nearestConnector = null;
    let minDistance = SNAP_DISTANCE;
    let connectorIndex = -1;

    Object.values(views).forEach(component => {
      if (!component.connectors) return;
      
      component.connectors.forEach((connector, index) => {
        const dx = connector.x - coords.x;
        const dy = connector.y - coords.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestConnector = {
            position: connector,
            component: component,
            connectorIndex: index
          };
        }
      });
    });

    return nearestConnector;
  }

  getVoltageAtProbe(probe, state) {
    const { views, circuit } = state;
    const probePos = probe.position;
    
    // Find the component and connector this probe is connected to
    const connector = this.findNearestConnector(probePos, views);
    if (!connector) return null;

    // Get the voltage from the circuit state
    const componentState = circuit.components[connector.component.id];
    if (!componentState || !componentState.voltages) return null;

    // Return the voltage at this connector
    return componentState.voltages[connector.connectorIndex];
  }

  updateProbePosition(color, coords, views) {
    const { store } = this.context;
    const nearestConnector = this.findNearestConnector(coords, views);
    
    if (nearestConnector) {
      // Snap to connector
      store.dispatch(updateProbePosition(color, nearestConnector.position));
      
      // Update measurement if both probes are connected
      const state = store.getState();
      const { tools: { multimeter } } = state;
      if (multimeter && multimeter.probes) {
        const redProbePos = color === 'red' ? coords : multimeter.probes.redProbe;
        const blackProbePos = color === 'black' ? coords : multimeter.probes.blackProbe;

        // Get voltages at both probes
        const redVoltage = this.getVoltageAtProbe({ position: redProbePos }, state);
        const blackVoltage = this.getVoltageAtProbe({ position: blackProbePos }, state);

        // Calculate voltage difference if we have both voltages
        if (redVoltage !== null && blackVoltage !== null) {
          const voltageDiff = redVoltage - blackVoltage;
          store.dispatch(updateMultimeterMeasurement(voltageDiff, 'V'));
        }
      }
    } else {
      // No nearby connector, just update position
      store.dispatch(updateProbePosition(color, coords));
    }
  }

  onMouse(event) {
    event.preventDefault();
    const { store } = this.context;
    const coords = relMouseCoords(event, this.canvas);
    const { tools, views } = store.getState();

    switch (event.type) {
      case 'mousedown':
      case 'touchstart':
        // Check if clicking on a probe
        if (this.isProbeAtPosition('red', coords, tools)) {
          this.setState({ draggingProbe: 'red' });
        } else if (this.isProbeAtPosition('black', coords, tools)) {
          this.setState({ draggingProbe: 'black' });
        } else {
          const mode = store.getState().mode;
          console.log('Current mode:', mode); // Debug log
          
          if (mode.type === MODES.autoGenerate && mode.meta && mode.meta.generateCircuit) {
            console.log('Auto-generating circuit...'); // Debug log
            try {
              const generateCircuit = mode.meta.generateCircuit;
              const components = generateCircuit();
              console.log('Generated components:', components); // Debug log
              
              if (Array.isArray(components)) {
                const clickPos = new Vector(coords.x, coords.y);
                console.log('Click position:', clickPos); // Debug log
                
                components.forEach((component, index) => {
                  console.log(`Processing component ${index}:`, component); // Debug log
                  
                  // Ensure dragPoints is an array
                  if (!Array.isArray(component.dragPoints)) {
                    console.error('Invalid dragPoints for component:', component);
                    return;
                  }
                  
                  // Adjust all drag points relative to click position
                  const adjustedDragPoints = component.dragPoints.map(dp => {
                    const newPoint = dp.add(clickPos);
                    console.log('Adjusted drag point:', newPoint); // Debug log
                    return newPoint;
                  });
                  
                  const action = {
                    type: 'ADDING_MOVED',
                    addingComponent: {
                      ...component,
                      start: clickPos,
                      dragPoints: adjustedDragPoints
                    },
                    coords: clickPos
                  };
                  
                  console.log('Dispatching action:', action); // Debug log
                  store.dispatch(action);
                });
                
                // Switch back to select mode after generating
                store.dispatch({
                  type: 'CHANGE_MODE',
                  name: MODES.selectOrMove
                });
              } else {
                console.error('generateCircuit did not return an array:', components);
              }
            } catch (error) {
              console.error('Error generating circuit:', error);
            }
          } else {
            store.dispatch(canvasMouseDown(coords));
          }
        }
        break;

      case 'mousemove':
      case 'touchmove':
        // If dragging a probe, update its position
        if (this.state.draggingProbe) {
          this.updateProbePosition(this.state.draggingProbe, coords, views);
        } else {
          store.dispatch(canvasMouseMove(coords));
        }
        break;

      case 'mouseup':
      case 'touchend':
      case 'touchcancel':
        if (this.state.draggingProbe) {
          this.setState({ draggingProbe: null });
        } else {
          store.dispatch(canvasMouseUp(coords));
        }
        break;
    }
  }

  handleClick = (event) => {
    const { mode } = this.props;
    
    if (mode.type === MODES.autoGenerate) {
      const components = mode.meta.generateCircuit();
      components.forEach(component => {
        this.props.onAddComponent(component);
      });
      // Switch back to select mode after generating
      this.props.onModeChange(MODES.selectOrMove);
    }
  }

  render() {
    const { width, height } = this.props;
    const { store } = this.context;
    return (
      <div>
        <SimulationControl />
        <canvas
          ref={c => (this.canvas = c)}
          width={width}
          height={height}
          style={{
            padding: 0,
            margin: 0,
            border: 0,
            display: 'block',
            backgroundColor: this.context.theme.COLORS.canvasBackground
          }}
          tabIndex={0}
          onMouseDown={this.onMouse}
          onMouseMove={this.onMouse}
          onMouseUp={this.onMouse}
          onMouseEnter={() => store.dispatch(canvasMouseEnter())}
          onMouseLeave={() => store.dispatch(canvasMouseLeave())}
          onTouchStart={this.onMouse}
          onTouchMove={this.onMouse}
          onTouchEnd={this.onMouse}
          onTouchCancel={this.onMouse}
        />
        <AnswerBar onSubmitAnswer={(answer) => store.dispatch(submitAnswer(answer))} />
      </div>
    );
  }
}

CircuitDiagram.propTypes = {
  width: React.PropTypes.number.isRequired,
  height: React.PropTypes.number.isRequired
};

CircuitDiagram.contextTypes = {
  store: React.PropTypes.shape({
    getState: React.PropTypes.func.isRequired,
    dispatch: React.PropTypes.func.isRequired
  }).isRequired,
  theme: React.PropTypes.object.isRequired
};

export default resize(CircuitDiagram);
