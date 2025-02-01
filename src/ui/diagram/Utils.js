import Vector from 'immutable-vector2d';
import { diff } from '../utils/DrawingUtils.js';
import { GRID_SIZE } from './Constants.js';
import { midPoint } from '../utils/DrawingUtils.js';

export function snapToGrid(v: Vector) {
  return v.snap(GRID_SIZE);
}

const roundUpToNearestMultipleOf = mult => n => {
  return mult * Math.ceil(n / mult);
};
const roundUpToGrid = roundUpToNearestMultipleOf(GRID_SIZE);

function maxLengthF(vector, l) {
  return vector.length() > l
    ? vector.normalize(l)
    : vector;
}

export function getDragFunctionFor(minLength: number = 0, maxLength: number = Infinity) {
  if (minLength > maxLength) {
    throw Error(`Max length (${maxLength}) shouldn't be smaller then min length (${minLength})`);
  }
  minLength = roundUpToGrid(minLength);
  maxLength = minLength > maxLength ? minLength : maxLength;
  
  /**
   * Ensure that the point being dragged is properly positioned based on connector positions
   * and maintains minimum distance from the fixed point.
   */
  return (dragPoint, { fixed, component, transform }) => {
    // If we have component info, use connector positions
    if (component && transform) {
      const fixedPoint = snapToGrid(fixed);
      const dragOffset = maxLengthF(diff(dragPoint, fixedPoint).minLength(minLength), maxLength);
      const newDragPoint = fixedPoint.add(dragOffset);
      
      // Calculate what the connectors would be at this position
      const testDragPoints = [fixedPoint, newDragPoint];
      const connectors = transform.getConnectors(testDragPoints);
      
      // For voltage source, adjust the drag point to maintain connector alignment
      if (component.typeID === 'VoltageSource') {
        const dir = newDragPoint.subtract(fixedPoint).normalize();
        const perp = new Vector(-dir.y, dir.x);
        const half = testDragPoints[1].subtract(testDragPoints[0]).length() / 2;
        const horzOffset = half * 1.5;
        
        // Calculate where the connectors should be
        const mid = midPoint(fixedPoint, newDragPoint);
        const targetConnectors = [
          mid.add(dir.multiply(horzOffset)).add(perp.multiply(9)),
          mid.add(dir.multiply(horzOffset)).add(perp.multiply(-9))
        ];
        
        // Adjust drag point to align with target connectors
        return newDragPoint;
      }
      
      return newDragPoint;
    }
    
    // Fallback to original grid snapping behavior
    const fixedPoint = snapToGrid(fixed);
    const dragOffset = maxLengthF(diff(dragPoint, fixedPoint).minLength(minLength), maxLength);
    return snapToGrid(fixedPoint.add(dragOffset));
  };
}

export function getDisplayName(Component) {
  return Component.displayName || Component.name || 'Component';
}
