import { SET_HOVERED_COMPONENT } from '../actions';

export default function hoverReducer(state = null, action) {
  switch (action.type) {
    case SET_HOVERED_COMPONENT:
      return action.component;
    default:
      return state;
  }
} 