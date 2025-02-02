import { midPoint } from '../../utils/DrawingUtils.js';
import R from 'ramda';
import Vector from 'immutable-vector2d';

const length = dps => {
  return dps[1].subtract(dps[0]).length();
};

/*
 * Translate and rotate the canvas so (0, 0) is at the mid-point
 * between the two drag points, and the drag points are on the
 * x-axis, left-to-right.
 */
const centerMid = (ctx, props, next) => {
  const { dragPoints: [dp1, dp2] } = props;

  const mid = midPoint(dp1, dp2);
  const s = dp2.subtract(dp1);
  const angle = Math.atan2(s.y, s.x);

  ctx.save();
  ctx.translate(mid.x, mid.y);
  ctx.rotate(angle);

  next();

  ctx.restore();
};

/*
 * Translate and rotate the canvas so the first drag point is
 * (0, 0) and the second drag point is on the positive x-axis.
 */

const centerFirstDP = (ctx, props, next) => {
  const { dragPoints: [dp1, dp2] } = props;

  const s = dp2.subtract(dp1);
  const angle = Math.atan2(s.y, s.x);

  ctx.save();
  ctx.translate(dp1.x, dp1.y);
  ctx.rotate(angle);

  next();

  ctx.restore();
};

/*
 * Tranformers for canvas context, and vectors in the canvas coordinate space.
 *
 * transformCanvas() transforms the canvas context using the position of the component's drag points.
 * This makes rendering easier.
 *
 * getTransformedConnectors() gets the connector positions in the transformed canvas coordinate space,
 * given the drag points.
 *
 * transformers[numOfConnectors] = {
 *  transformCanvas
 *  getTransformedConnectors
 *  getConnectors
 * }
 */
export default {
  1: {
    transformCanvas: centerFirstDP,
    getTransformedConnectors() {
      return [{x: 0, y: 0}];
    },
    getConnectors(dragPoints) {
      return [dragPoints[0]];
    }
  },
  2: {
    transformCanvas: centerMid,
    getTransformedConnectors(dragPoints) {
      let half = length(dragPoints) / 2;
      half = Math.round(half); // better to give the Canvas integer coords
      return [{x: -half, y: 0}, {x: half, y: 0}];
    },
    getConnectors(dragPoints) {
      const [dp1, dp2] = dragPoints;
      const mid = midPoint(dp1, dp2);
      const dir = dp2.subtract(dp1).normalize();
      const horz = new Vector(dir.x, dir.y);
      
      let half = length(dragPoints) / 2;
      half = Math.round(half);
      
      // Calculate points in real space by moving half-length along the direction vector
      return [
        mid.add(horz.multiply(-half)),
        mid.add(horz.multiply(half))
      ];
    }
  },
  "2-voltage": {  // New transform specifically for voltage sources
    transformCanvas: centerMid,
    getTransformedConnectors(dragPoints) {
      let half = length(dragPoints) / 2;
      half = Math.round(half);
      // Position connectors further apart for voltage sources
      return [{x: half * 1.5, y: 9}, {x: half * 1.5, y: -9}];
    },
    getConnectors(dragPoints) {
      const [dp1, dp2] = dragPoints;
      const mid = midPoint(dp1, dp2);
      const dir = dp2.subtract(dp1).normalize();
      const perp = new Vector(-dir.y, dir.x);
      const horz = new Vector(dir.x, dir.y);
      
      let half = length(dragPoints) / 2;
      half = Math.round(half);
      const horzOffset = half * 1.5;
      
      // Calculate points in real space matching the transformed coordinates
      return [
        mid.add(horz.multiply(horzOffset)).add(perp.multiply(9)),
        mid.add(horz.multiply(horzOffset)).add(perp.multiply(-9))
      ];
    }
  },
  3: {
    transformCanvas: centerMid,
    getTransformedConnectors(dragPoints) {
      let half = length(dragPoints) / 2;
      half = Math.round(half);
      return [
        {x: -half, y: -half/2},  // V+
        {x: -half, y: half/2},   // V-
        {x: half, y: 0}          // Vout
      ];
    },
    getConnectors(dragPoints) {
      const [dp1, dp2] = dragPoints;
      const mid = midPoint(dp1, dp2);
      const dir = dp2.subtract(dp1).normalize();
      const perp = new Vector(-dir.y, dir.x);
      const horz = new Vector(dir.x, dir.y);
      
      let half = length(dragPoints) / 2;
      half = Math.round(half);
      
      // Calculate points in real space matching the transformed coordinates
      return [
        mid.add(horz.multiply(-half)).add(perp.multiply(-half/2)),  // V+
        mid.add(horz.multiply(-half)).add(perp.multiply(half/2)),   // V-
        mid.add(horz.multiply(half))                                // Vout
      ];
    }
  },
  "3-mosfet": {  // Transform for MOSFETs
    transformCanvas: centerMid,
    getTransformedConnectors(dragPoints) {
      let half = length(dragPoints) / 2;
      half = Math.round(half);
      // Position connectors to start at the pins
      return [
        {x: -half/3, y: -8},    // Drain (starts at left top pin)
        {x: half/3, y: 0},      // Gate (starts at right pin)
        {x: -half/3, y: 8}      // Source (starts at left bottom pin)
      ];
    },
    getConnectors(dragPoints) {
      const [dp1, dp2] = dragPoints;
      const mid = midPoint(dp1, dp2);
      const dir = dp2.subtract(dp1).normalize();
      const perp = new Vector(-dir.y, dir.x);
      const horz = new Vector(dir.x, dir.y);
      
      let half = length(dragPoints) / 2;
      half = Math.round(half);
      
      // Calculate points in real space matching the transformed coordinates
      return [
        mid.add(horz.multiply(-half/3)).add(perp.multiply(-8)),  // Drain
        mid.add(horz.multiply(half/3)),                          // Gate
        mid.add(horz.multiply(-half/3)).add(perp.multiply(8))    // Source
      ];
    }
  },
  identity: {
    transformCanvas: (ctx, props, render) => { render(props); },
    getTransformedConnectors: R.identity,
    getConnectors: R.identity
  }
};
