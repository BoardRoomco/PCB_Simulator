import {combineReducers} from 'redux';

import addingComponent from './reducers/addingComponent';
import movingComponent from './reducers/moveComponent';
import mode from './reducers/modes';
import mousePos from './reducers/mousePosition';
import selected from './reducers/selectComponent';
import circuit from './reducers/mainLoop';
import showAddToaster from './reducers/toaster';
import views from './reducers/views';
import currentSpeed from './reducers/currentSpeed';
import tools from './reducers/tools';
import componentCounters from './reducers/componentCounters';

export default combineReducers({
  mode,
  mousePos,
  showAddToaster,
  addingComponent,
  movingComponent,
  selected,
  tools,
  componentCounters,

  // used to render canvas
  views,
  circuit,
  currentSpeed
});
