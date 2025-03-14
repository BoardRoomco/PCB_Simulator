import { CHANGE_MODE } from '../actions';
import MODES from '../../Modes';

const initialState = {
  type: MODES.selectOrMove,
  meta: {}
};

export default function modeReducer(state = initialState, action) {
  switch (action.type) {
    case CHANGE_MODE:
      return {
        type: action.name,
        meta: action.meta || {}
      };
    default:
      return state;
  }
} 