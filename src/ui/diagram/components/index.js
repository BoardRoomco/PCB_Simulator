import R from 'ramda';

import CurrentSource from './CurrentSource';
import VoltageSource from './VoltageSource';
import Ground from './Ground';

import Wire from './Wire';

import Resistor from './Resistor';
import Capacitor from './Capacitor';
import Inductor from './Inductor';

import Silicon from './Silicon'; 
import Diode from './Diode';
import Transistor from './Transistor';

const VIEWS = [
  CurrentSource,
  VoltageSource,
  Ground,
  Capacitor,
  Inductor,
  Resistor,
  Wire,
  Silicon,
  Diode,
  Transistor
];

function toKVPair(component) {
  return [component.typeID, component];
}

// Map from typeID to component
export default R.pipe(
  R.map(toKVPair),
  R.fromPairs
)(VIEWS);
