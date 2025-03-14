import { SELECT_HOVERED_COMPONENT, UNSELECT_COMPONENT } from '../actions';

export default function selectedReducer(state = null, action) {
  switch (action.type) {
    case SELECT_HOVERED_COMPONENT:
      return action.component ? action.component.id : null;
    case UNSELECT_COMPONENT:
      return null;
    default:
      return state;
  }
} 