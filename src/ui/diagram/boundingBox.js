import R from 'ramda';
import inside from 'point-in-polygon';
import Vector from 'immutable-vector2d';

import CircuitComponents from './components';
import { BOUNDING_BOX_PADDING, DRAG_POINT_RADIUS } from './Constants.js';
import { getRectPointsBetween, distance } from '../utils/DrawingUtils.js';

const MIN_WIDTH = DRAG_POINT_RADIUS * 2;
const CONNECTOR_HOVER_RADIUS = 5; // Radius for connector hover detection

const sanitise = width => {
  width = width > MIN_WIDTH
    ? width
    : MIN_WIDTH;
  return width + 2 * BOUNDING_BOX_PADDING;
};

// Bounding box stuff

/*
 * A bounding box is represented e.g. [[1, 2], [3, 4], [5, 6], [7, 8]]
 */

export const get2PointBoundingBox = width => dragPoints => {
  const [p1, p2] = dragPoints;
  const fullWidth = sanitise(width);
  const rectanglePoints = getRectPointsBetween(p1, p2, fullWidth);
  return R.map(p => [p.x, p.y], rectanglePoints);
};

function isPointIn(p: Vector, polygon: Array<[number, number]>) {
  const point = [p.x, p.y];
  return inside(point, polygon);
}

const isPointInDragPoint = point => connectorPos => {
  return distance(point, connectorPos).length() < DRAG_POINT_RADIUS;
};

const isPointInConnector = point => connector => {
  return distance(point, connector).length() < CONNECTOR_HOVER_RADIUS;
};

export const hoverFor = (mousePos: Vector) => (typeID, dragPoints, connectors) => {
  const CircuitComp = CircuitComponents[typeID];

  // Only check for connector hovering, not drag points
  const hoveredConnectorIndex = connectors ? R.findIndex(isPointInConnector(mousePos), connectors) : -1;
  const isConnectorHovered = hoveredConnectorIndex >= 0;

  return {
    hovered: isPointIn(mousePos, CircuitComp.getBoundingBox(dragPoints)) || isConnectorHovered,
    dragPointIndex: false, // Never hover drag points
    connectorIndex: isConnectorHovered ? hoveredConnectorIndex : false
  };
};
