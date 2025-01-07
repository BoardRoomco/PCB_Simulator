import { combineReducers } from 'redux';
import mainLoop from './mainLoop';
import views from './views';
import hover from './hover';
import mode from './mode';
import selected from './selected';
import showAddToaster from './showAddToaster';
import currentSpeed from './currentSpeed';
import tools from './tools';

export default combineReducers({
  circuit: mainLoop,
  views,
  hover,
  mode,
  selected,
  showAddToaster,
  currentSpeed,
  tools
}); 