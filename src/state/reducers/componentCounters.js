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
        // Find the next available number
        const existingComponents = Object.values(action.components || {})
          .filter(c => c.typeID === typeID)
          .map(c => parseInt(c.id.replace(typeID, ''), 10))
          .sort((a, b) => a - b);

        let nextNumber = 1;
        for (const num of existingComponents) {
          if (num !== nextNumber) {
            break;
          }
          nextNumber++;
        }

        return {
          ...state,
          [typeID]: Math.max(nextNumber, state[typeID] + 1)
        };
      }
      return state;
    }

    case DELETE_COMPONENT: {
      // Keep the counter as is to maintain sequential naming
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