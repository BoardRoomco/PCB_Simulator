import R from 'ramda';

import {
  getCircuitInfo,
  checkForProblems,
  stampStaticEquation,
  stampDynamicEquation,
  solveEquation,
  blankSolutionForCircuit
} from '../../circuit/Solver';
import {
  getCircuitState,
  setNodesInModels,
  setVoltSrcNums,
  toNodes,
  toModels
} from '../../circuit/CircuitUpdater';
import { clone } from '../../circuit/equation';
import { connectDisconnectedCircuits } from '../../circuit/Paths';
import { createVolts2RGB } from '../../utils/volts2RGB.js';

import {
  LOOP_BEGIN,
  LOOP_UPDATE,
  EDIT_COMPONENT,
  DELETE_COMPONENT,
  ADDING_MOVED,
  MOVING_MOVED,
  LOAD_CIRCUIT,
  SAVE_CIRCUIT_CHALLENGE
} from '../actions';

const INITIAL_STATE = {
  circuitGraph: {
    models: {},
    nodes: [],
    numOfNodes: 0,
    numOfVSources: 0
  },
  components: {},
  staticEquation: null,
  ...createVolts2RGB(1, 1),
  circuitChanged: false,
  error: false,
  remainingDelta: 0,
  simTime: 0,
  timestep: 5e-6,
  simTimePerSec: 1 / 1000,
  isSimulationRunning: false
};

// Initialize a component with default values
const initializeComponent = (model) => ({
  voltages: Array(model.nodes.length).fill(0),
  currents: Array(model.nodes.length).fill(0)
});

const zeroed = (circuit, error) => {
  const { circuitGraph } = circuit;
  const solution = blankSolutionForCircuit(circuitGraph);
  const blankCircuitState = getCircuitState(circuitGraph, solution);

  // Initialize all components with default values
  const initializedComponents = Object.keys(circuitGraph.models).reduce((acc, id) => {
    acc[id] = initializeComponent(circuitGraph.models[id]);
    return acc;
  }, {});

  return {
    ...circuit,
    components: initializedComponents,
    remainingDelta: 0,
    error: error || circuit.error
  };
};

// Decouple real timestep (delta) from stuff like:
// - simulation timestep (time simulated per analysis)
// - simuation speed (time simulated per frame (or update))
// - current speed
//
// Simulation timestep defaults to 5μs and should rarely need to be changed
//  (except possibly in response to stablity issues)
// Time to be simulated per second should be user-controllable to view high- or low-frequency circuits
// Current timestep should be user-controllable to view high- or low-current circuits

export const START_SIMULATION = 'START_SIMULATION';
export const STOP_SIMULATION = 'STOP_SIMULATION';

export function startSimulation() {
  return {
    type: START_SIMULATION
  };
}

export function stopSimulation() {
  return {
    type: STOP_SIMULATION
  };
}

export default function mainLoopReducer(circuit = INITIAL_STATE, action) {
  switch (action.type) {
  case LOOP_BEGIN: {
    const { views } = action;

    if (R.isEmpty(views)) {
      return {
        ...circuit,
        circuitGraph: INITIAL_STATE.circuitGraph,
        staticEquation: INITIAL_STATE.staticEquation,
        circuitChanged: false,
        error: 'No circuit'
      };
    }

    if (circuit.circuitChanged) {
      const nodes = toNodes(views);
      const models = setVoltSrcNums(setNodesInModels(toModels(views), nodes));
      const circuitMeta = getCircuitInfo({models, nodes});
      const circuitGraph = {
        models,
        nodes,
        ...circuitMeta
      };

      const error = checkForProblems(circuitGraph);
      if (error) { console.warn(error); }

      let staticEquation = null;
      if (!error) {
        staticEquation = stampStaticEquation(circuitGraph);
        connectDisconnectedCircuits(circuitGraph, staticEquation);
      }

      // Initialize components with default values
      const initializedComponents = Object.keys(models).reduce((acc, id) => {
        acc[id] = initializeComponent(models[id]);
        return acc;
      }, {});

      return {
        ...circuit,
        circuitGraph,
        staticEquation,
        components: initializedComponents,
        circuitChanged: false,
        error
      };
    }

    return circuit;
  }

  case LOOP_UPDATE: {
    if (circuit.error) {
      return zeroed(circuit);
    }

    if (!circuit.isSimulationRunning) {
      return circuit;
    }

    const {
      staticEquation,
      circuitGraph,
      components: previousCircuitState,

      simTime,
      remainingDelta, // seconds
      timestep, // seconds
      simTimePerSec,

      voltageRange: prevVoltageRange
    } = circuit;

    let {
      delta // milliseconds
    } = action;

    delta /= 1000; // convert from milliseconds to seconds

    /* eslint-disable indent */ // SIGH need to deal with this shit
    let fullSolution = [],
        currentCalculators = {},
        circuitState = previousCircuitState,
        timeToSimulate = (delta * simTimePerSec) + remainingDelta,
        timeLeft = timeToSimulate;
    /* eslint-enable indent */

    if (timeToSimulate < timestep) {
      return { ...circuit, remainingDelta: timeToSimulate };
    }

    try {
      for (
        ;
        timeLeft >= timestep;
        timeLeft -= timestep
      ) {
        const fullEquation = clone(staticEquation);
        currentCalculators = stampDynamicEquation(
          circuitGraph,
          fullEquation, // this gets mutated!
          timestep,
          simTime,
          circuitState
        );

        const solution = solveEquation(fullEquation);
        fullSolution = [0, ...solution]; // add 0 volt ground node

        circuitState = getCircuitState(circuitGraph, fullSolution, currentCalculators);
      }
    } catch (e) {
      console.warn(e); // eslint-disable-line no-console
      console.warn(e.stack); // eslint-disable-line no-console
      return zeroed(circuit, e);
    }

    // TODO factor this out
    const voltages = R.take(circuitGraph.numOfNodes, fullSolution);
    const maxVoltage = R.pipe(
      R.map(Math.abs),
      R.reduce(R.max, 0),
    )(voltages);
    const {
      voltageRange,
      volts2RGB
    } = createVolts2RGB(maxVoltage, prevVoltageRange);

    return {
      ...circuit,
      error: false,
      components: circuitState,
      remainingDelta: timeLeft,
      simTime: simTime + timeToSimulate - timeLeft,

      volts2RGB,
      voltageRange
    };
  }

  case SAVE_CIRCUIT_CHALLENGE:
    // Just return the state, saving is handled in the action creator
    return circuit;

  case EDIT_COMPONENT:
  case DELETE_COMPONENT:
  case ADDING_MOVED:
  case MOVING_MOVED:
  case LOAD_CIRCUIT:
    return {
      ...circuit,
      circuitChanged: true
    };

  case START_SIMULATION:
    return {
      ...circuit,
      isSimulationRunning: true
    };
  
  case STOP_SIMULATION:
    return {
      ...circuit,
      isSimulationRunning: false
    };

  default:
    return circuit;
  }
}
