import R from 'ramda';
import Vector from 'immutable-vector2d';

import Components from '../../ui/diagram/components';
import { diff } from '../../ui/utils/DrawingUtils.js';
import { snapToGrid } from '../../ui/diagram/Utils.js';
import { hoverFor } from '../../ui/diagram/boundingBox';
import { CURRENT } from '../../ui/diagram/Constants';
import { findNearestConnectorToPoint } from '../../ui/utils/ConnectorUtils.js';

import {
  LOAD_CIRCUIT,
  PRINT_CIRCUIT,
  ADDING_MOVED,
  MOVING_MOVED,
  DELETE_COMPONENT,
  EDIT_COMPONENT,
  CHANGE_COMPONENT_FREQ,
  SET_HOVERED_COMPONENT,
  UPDATE_CURRENT_OFFSETS,
  RATIONALISE_CURRENT_OFFSETS,
  COPY_COMPONENTS,
  PASTE_COMPONENTS
} from '../actions';

const STANDING_OFFSET = CURRENT.DOT_DISTANCE / 2;

const zip3 = (a, b, c) => R.zipWith(R.prepend, a, R.zip(b, c));
const moreThanOne = R.pipe(
  R.length,
  R.gt(R.__, 1)
);
const mergeOverWith = R.partial(R.merge, [R.__]);

const isHovered = component => component.hovered;

function moveSingleDragPoint(views, action) {
  const { id, dragPointIndex, origDragPoints } = action.movingComponent;

  const view = views[id];
  const Component = Components[view.typeID];
  const fixedPointIndex = dragPointIndex === 0 ? 1 : 0;

  // First calculate the raw new drag point
  const newDragPoint = Component.dragPoint(action.mouseVector, {
    fixed: origDragPoints[fixedPointIndex],
    component: view,
    transform: Component.transform
  });

  // Calculate what the connectors would be at this position
  const testDragPoints = R.update(dragPointIndex, newDragPoint, origDragPoints);
  const testConnectors = Component.transform.getConnectors(testDragPoints);

  // Find nearest connector from other components to snap to
  const nearestConnector = findNearestConnectorToPoint(testConnectors[dragPointIndex], views, id);

  // If we found a nearby connector, adjust the drag point to align with it
  let finalDragPoints = testDragPoints;
  if (nearestConnector.position) {
    const snapPoint = nearestConnector.position;
    const offset = snapPoint.subtract(testConnectors[dragPointIndex]);
    finalDragPoints = R.update(dragPointIndex, newDragPoint.add(offset), origDragPoints);
  }

  // Calculate final connector positions
  const tConnectors = Component.transform.getTransformedConnectors(finalDragPoints);
  const connectors = Component.transform.getConnectors(finalDragPoints);

  return {
    ...views,
    [id]: {
      ...view,
      dragPoints: finalDragPoints,
      tConnectors,
      connectors
    }
  };
}

function moveWholeComponent(views, action) {
  const { id, from, origDragPoints } = action.movingComponent;

  const view = views[id];
  const Component = Components[view.typeID];

  // Calculate raw movement
  const diffVector = diff(from, action.mouseVector);
  const testDragPoints = R.map(v => snapToGrid(v.subtract(diffVector)), origDragPoints);
  
  // Calculate what the connectors would be at this position
  const testConnectors = Component.transform.getConnectors(testDragPoints);
  
  // Find nearest connector from other components to snap to
  let finalDragPoints = testDragPoints;
  for (let i = 0; i < testConnectors.length; i++) {
    const nearestConnector = findNearestConnectorToPoint(testConnectors[i], views, id);
    if (nearestConnector.position) {
      // If we found a connector to snap to, adjust the whole component
      const snapPoint = nearestConnector.position;
      const offset = snapPoint.subtract(testConnectors[i]);
      finalDragPoints = R.map(dp => dp.add(offset), finalDragPoints);
      break; // Only snap to one connector
    }
  }

  // Calculate final connector positions
  const tConnectors = Component.transform.getTransformedConnectors(finalDragPoints);
  const connectors = Component.transform.getConnectors(finalDragPoints);

  return {
    ...views,
    [id]: {
      ...view,
      dragPoints: finalDragPoints,
      tConnectors,
      connectors
    }
  };
}

/*
 * view = {
 *  typeID - type of view e.g. Resistor
 *  id - UID
 *  editables - e.g. {voltage: {value: 5Ω}}
 *  dragPoints - real coordinates of the two drag points
 *  tConnectors - coordinates of the connectors in the transformed canvas (used for rendering)
 *  connectors - coordinates of the connectors in the real canvas
 *
 *  currentOffsets - keeps track of current flow
 *  extraOffsets - to be added to currentOffsets next render
 * }
 */
export default function viewsReducer(views = {}, action) {
  switch (action.type) {
  case LOAD_CIRCUIT: {
    const { circuit, shouldMerge } = action;
    const setInitialCurrentPositions = (view) => {
      const ComponentType = Components[view.typeID];
      if (!ComponentType) {
        console.error(`Invalid component type: ${view.typeID}`);
        return view;
      }
      const numPaths = ComponentType.numOfCurrentPaths || 1;
      return {
        ...view,
        currentOffsets: R.repeat(STANDING_OFFSET, numPaths),
        extraOffsets: R.repeat(0, numPaths)
      };
    };
    const vectoriseDragPoints = (view) => {
      if (!view.dragPoints || !Array.isArray(view.dragPoints)) {
        console.error(`View ${view.id} missing dragPoints array, using empty array`);
        return {
          ...view,
          dragPoints: []
        };
      }
      return {
        ...view,
        dragPoints: R.map(Vector.fromObject, view.dragPoints)
      };
    };
    const setConnectorPositions = (view) => {
      const ComponentType = Components[view.typeID];
      if (!ComponentType) {
        console.error(`Invalid component type: ${view.typeID}`);
        return view;
      }
      if (!view.dragPoints || !Array.isArray(view.dragPoints)) {
        console.error(`View ${view.id} missing dragPoints array, using empty array`);
        return {
          ...view,
          dragPoints: [],
          tConnectors: [],
          connectors: []
        };
      }
      return {
        ...view,
        tConnectors: ComponentType.transform.getTransformedConnectors(view.dragPoints),
        connectors: ComponentType.transform.getConnectors(view.dragPoints)
      };
    };

    // Ensure we're working with an array of views
    const viewsArray = circuit.views ? Object.values(circuit.views) : [];

    // Group components by type to assign numbers
    const componentsByType = {};
    viewsArray.forEach(view => {
      if (!componentsByType[view.typeID]) {
        componentsByType[view.typeID] = [];
      }
      componentsByType[view.typeID].push(view);
    });

    // Process each view and assign component numbers
    const processedViews = viewsArray.map(view => {
      const typeComponents = componentsByType[view.typeID];
      const componentNumber = typeComponents.indexOf(view) + 1;
      return {
        ...view,
        componentNumber
      };
    });

    const loadedViews = R.pipe(
      R.map(setInitialCurrentPositions),
      R.map(vectoriseDragPoints),
      R.map(setConnectorPositions),
      R.groupBy(R.prop('id')),
      R.map(R.head)
    )(processedViews);
    
    // If shouldMerge is true, merge with existing views, otherwise replace them
    return shouldMerge ? { ...views, ...loadedViews } : loadedViews;
  }
  case PRINT_CIRCUIT: {
    const output = R.pipe(
      R.values,
      R.map(R.pick(['typeID', 'id', 'editables', 'dragPoints']))
    )(views);
    console.log(JSON.stringify(output)); // eslint-disable-line no-console
    return views;
  }
  case ADDING_MOVED: {
    const {start, id, typeID} = action.addingComponent,

          startPoint = snapToGrid(Vector.fromObject(start)),
          mousePos = Vector.fromObject(action.coords);

    if (snapToGrid(mousePos).equals(startPoint)) {
      return views; // prevent zero size views
    }

    const Component = Components[typeID],
          dragPoint = Component.dragPoint(mousePos, {fixed: startPoint}),
          dragPoints = [startPoint, dragPoint];

    const tConnectors = Component.transform.getTransformedConnectors(dragPoints);
    const connectors = Component.transform.getConnectors(dragPoints);

    // Count existing components of this type to determine number
    const existingComponents = Object.values(views).filter(v => v.typeID === typeID);
    const componentNumber = existingComponents.length + 1;

    const newView = {
      typeID,
      id,
      componentNumber,
      editables: Component.defaultEditables,
      dragPoints,
      tConnectors,
      connectors,
      currentOffsets: R.repeat(STANDING_OFFSET, Component.numOfCurrentPaths),
      extraOffsets: R.repeat(0, Component.numOfCurrentPaths)
    };

    return {
      ...views,
      [id]: newView
    };
  }

  case MOVING_MOVED: {
    const { hoveredComponent } = action,
          { dragPointIndex } = hoveredComponent;
    if (R.is(Number, dragPointIndex) && dragPointIndex >= 0) {
      return moveSingleDragPoint(views, action);
    } else {
      return moveWholeComponent(views, action);
    }
  }

  case DELETE_COMPONENT: {
    return R.dissoc(action.id, views);
  }

  case EDIT_COMPONENT: {
    const {id, editable, value} = action;
    const view = views[id];
    return {
      ...views,
      [id]: R.assocPath(['editables', editable, 'value'], value, view)
    };
  }

  case CHANGE_COMPONENT_FREQ: {
    const {id, simTime} = action;
    const view = views[id];

    return {
      ...views,
      [id]: R.assocPath(['editables', 'frequency', 'zeroTime'], simTime, view)
    };
  }

  case SET_HOVERED_COMPONENT: {
    const mousePos = action.mousePos;
    return R.mapObjIndexed((view) => {
      const hover = hoverFor(mousePos)(view.typeID, view.dragPoints, view.connectors);
      return {
        ...view,
        hovered: hover.hovered,
        dragPointIndex: hover.dragPointIndex,
        connectorIndex: hover.connectorIndex
      };
    }, views);
  }

  case UPDATE_CURRENT_OFFSETS: {
    const {
      delta, // milliseconds
      currentSpeed,
      componentStates
    } = action;

    // Shamelessly stolen from Paul Falstad. I really wish I knew where these numbers came from.
    const currentMultiplier = 1.7 * delta * Math.exp(currentSpeed / 3.5 - 14.2);

    const updateExtraOffsets = view => {
      const addExtra = (current, prevExtra) => (current * currentMultiplier) + prevExtra;

      const Type = Components[view.typeID];
      const componentState = componentStates[view.id];
      const currents = Type.getCurrents(view, componentState);
      const extraOffsets = R.zipWith(addExtra, currents, view.extraOffsets);

      return {
        ...view,
        extraOffsets
      };
    };
    return R.map(updateExtraOffsets, views);
  }

  case RATIONALISE_CURRENT_OFFSETS: {
    const {
      componentStates
    } = action;

    const updateOffsets = view => {
      const addOffsets = ([current, prevOffset, additionalOffset]) => {
        if (current !== 0 && Math.abs(additionalOffset) <= .05) {
          // TODO fade out or get smaller as currents get slower than this
          // move slowly
          additionalOffset = Math.sign(additionalOffset) * .05;
        }
        else if (Math.abs(additionalOffset) > CURRENT.DOT_DISTANCE / 2) {
          // cap max offset so we don't get 'spinning wheel' problem
          additionalOffset = Math.sign(additionalOffset) * CURRENT.DOT_DISTANCE / 2;
        }

        let offset = (prevOffset + additionalOffset) % CURRENT.DOT_DISTANCE;
        if (offset < 0) {
          offset += CURRENT.DOT_DISTANCE;
        }
        return offset;
      };

      const Type = Components[view.typeID];
      const componentState = componentStates[view.id];
      const currents = Type.getCurrents(view, componentState);

      const thing = zip3(currents, view.currentOffsets, view.extraOffsets);
      const offsets = R.map(addOffsets, thing);

      return {
        ...view,
        currentOffsets: offsets,
        extraOffsets: R.repeat(0, Type.numOfCurrentPaths)
      };
    };
    return R.map(updateOffsets, views);
  }

  case COPY_COMPONENTS:
    return views; // No state change needed, copying is handled in action

  case PASTE_COMPONENTS: {
    const newViews = { ...views };
    action.components.forEach(component => {
      newViews[component.id] = component;
    });
    return newViews;
  }

  default: return views;
  }
}
