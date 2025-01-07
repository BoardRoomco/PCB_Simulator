import {
  TOGGLE_MULTIMETER,
  UPDATE_PROBE_POSITION,
  UPDATE_MULTIMETER_MEASUREMENT,
  CHANGE_MULTIMETER_MODE,
  TOGGLE_COMPETITION_MODE
} from '../actions';

import {
  initialMultimeterState,
  updateProbePosition,
  updateMeasurement,
  changeMultimeterMode
} from '../../ui/diagram/tools/Multimeter';

const initialState = {
  multimeter: initialMultimeterState,
  competitionMode: false
};

export default function toolsReducer(state = initialState, action) {
  switch (action.type) {
    case TOGGLE_COMPETITION_MODE:
      return {
        ...state,
        competitionMode: !state.competitionMode
      };

    case TOGGLE_MULTIMETER:
      return {
        ...state,
        multimeter: {
          ...state.multimeter,
          active: !state.multimeter.active
        }
      };

    case UPDATE_PROBE_POSITION:
      return {
        ...state,
        multimeter: updateProbePosition(
          state.multimeter,
          action.payload.color,
          action.payload.position
        )
      };

    case UPDATE_MULTIMETER_MEASUREMENT:
      return {
        ...state,
        multimeter: updateMeasurement(
          state.multimeter,
          action.payload.value,
          action.payload.unit
        )
      };

    case CHANGE_MULTIMETER_MODE:
      return {
        ...state,
        multimeter: changeMultimeterMode(
          state.multimeter,
          action.payload.mode
        )
      };

    default:
      return state;
  }
} 