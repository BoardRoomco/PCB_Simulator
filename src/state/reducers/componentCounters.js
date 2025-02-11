import { ADDING_MOVED, DELETE_COMPONENT, LOAD_CIRCUIT } from '../actions';

const initialState = {
  Resistor: 0,
  Capacitor: 0,
  Inductor: 0,
  VoltageSource: 0,
  CurrentSource: 0,
  Diode: 0,
  Transistor: 0
};

export default function componentCountersReducer(state = initialState, action) {
  switch (action.type) {
    case ADDING_MOVED: {
      const { typeID } = action.addingComponent;
      if (state[typeID] !== undefined) {
        return {
          ...state,
          [typeID]: state[typeID] + 1
        };
      }
      return state;
    }

    case DELETE_COMPONENT: {
      // Note: We don't decrease counters on delete to maintain sequential naming
      return state;
    }

    case LOAD_CIRCUIT: {
      // Reset counters when loading a new circuit
      return initialState;
    }

    default:
      return state;
  }
} 