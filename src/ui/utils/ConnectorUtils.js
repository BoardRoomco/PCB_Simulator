import Vector from 'immutable-vector2d';
import Components from '../diagram/components';
import { GRID_SIZE } from '../diagram/Constants';
import R from 'ramda';

// Increased snap distance to make connections easier
const SNAP_DISTANCE = GRID_SIZE * 1.5;

export function findNearestConnectorToPoint(point, views, excludeComponentId) {
  // Handle both Vector objects and plain {x,y} objects
  const pointX = point.x || point.get('x');
  const pointY = point.y || point.get('y');

  // Get all connectors from other components only
  const otherComponentConnectors = R.pipe(
    R.values,
    R.filter(view => view.id !== excludeComponentId), // Only look at other components
    R.map(view => {
      // Use the actual connectors from the component
      return view.connectors.map(connector => ({
        position: connector,
        componentId: view.id
      }));
    }),
    R.flatten
  )(views);

  // Find the nearest connector within snap distance
  return R.reduce((nearest, connector) => {
    const connectorX = connector.position.x || connector.position.get('x');
    const connectorY = connector.position.y || connector.position.get('y');
    const dx = connectorX - pointX;
    const dy = connectorY - pointY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < nearest.distance && distance <= SNAP_DISTANCE) {
      return {
        distance,
        position: connector.position,
        componentId: connector.componentId
      };
    }
    return nearest;
  }, {
    distance: Infinity,
    position: null,
    componentId: null
  }, otherComponentConnectors);
} 