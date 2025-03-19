import R from 'ramda';
import Vector from 'immutable-vector2d';
import uuid from 'node-uuid';

import MODES from '../../Modes';
import { TIMESTEP } from '../../ui/diagram/loop';
import Components from '../../ui/diagram/components';
import createRender from '../../ui/diagram/render';

// Action types
export const CHANGE_MODE = 'CHANGE_MODE';

export const SAVE_CIRCUIT_CHALLENGE = 'SAVE_CIRCUIT_CHALLENGE';

export const SET_HOVERED_COMPONENT = 'SET_HOVERED_COMPONENT';
export const SELECT_HOVERED_COMPONENT = 'SELECT_HOVERED_COMPONENT';
export const UNSELECT_COMPONENT = 'UNSELECT_COMPONENT';

export const ADDING_START = 'ADDING_START';
export const ADDING_MOVED = 'ADDING_MOVED';
export const ADDING_FINISH = 'ADDING_FINISH';

export const MOVING_START = 'MOVING_START';
export const MOVING_MOVED = 'MOVING_MOVED';
export const MOVING_FINISH = 'MOVING_FINISH';

export const MOUSE_MOVED = 'MOUSE_MOVED';

export const SHOW_ADD_TOASTER = 'SHOW_ADD_TOASTER';
export const HIDE_ADD_TOASTER = 'HIDE_ADD_TOASTER';

// Multimeter Actions
export const TOGGLE_MULTIMETER = 'TOGGLE_MULTIMETER';
export const UPDATE_PROBE_POSITION = 'UPDATE_PROBE_POSITION';
export const UPDATE_MULTIMETER_MEASUREMENT = 'UPDATE_MULTIMETER_MEASUREMENT';
export const CHANGE_MULTIMETER_MODE = 'CHANGE_MULTIMETER_MODE';

export const TOGGLE_COMPETITION_MODE = 'TOGGLE_COMPETITION_MODE';

export const SUBMIT_ANSWER = 'SUBMIT_ANSWER';

export const START_SIMULATION = 'START_SIMULATION';
export const STOP_SIMULATION = 'STOP_SIMULATION';

export const COPY_COMPONENTS = 'COPY_COMPONENTS';
export const PASTE_COMPONENTS = 'PASTE_COMPONENTS';

// Action creators
export const saveCircuitAsChallenge = (correctAnswer) => {
  return function(dispatch, getState) {
    console.log('=== Save Circuit Action Triggered ===');
    
    // Get the exact state structure from Redux
    const state = getState();
    
    // Process views to ensure all required data is included
    const processedViews = Object.entries(state.views).reduce((acc, [id, view]) => {
      // Get the component type
      const ComponentType = Components[view.typeID];
      if (!ComponentType) {
        console.error(`Invalid component type: ${view.typeID}, skipping`);
        return acc;
      }

      // Get number of current paths for this component type
      const numPaths = ComponentType.numOfCurrentPaths || 1;

      // Convert dragPoints to plain objects for JSON serialization
      const dragPoints = (view.dragPoints || []).map(point => ({
        x: point.x,
        y: point.y
      }));

      // Ensure all required properties are present
      acc[id] = {
        ...view,
        id, // Ensure id is explicitly set
        typeID: view.typeID,
        dragPoints,
        connectors: view.connectors || [],
        tConnectors: view.tConnectors || [],
        currentOffsets: view.currentOffsets || R.repeat(0, numPaths),
        extraOffsets: view.extraOffsets || R.repeat(0, numPaths),
        props: view.props || {}
      };
      return acc;
    }, {});

    // Get annotations from the AnnotationManager
    let textAnnotations = [];
    if (window.circuitDiagram && window.circuitDiagram.state && window.circuitDiagram.state.annotationManager) {
      textAnnotations = window.circuitDiagram.state.annotationManager.getAnnotationsForSave();
    }

    const circuitState = {
      views: processedViews,
      circuit: state.circuit,
      correctAnswer,
      textAnnotations
    };

    console.log('Saving circuit state:', circuitState);

    fetch('http://localhost:3001/save-circuit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(circuitState)
    })
    .then(response => {
      console.log('Server response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('Server response data:', data);
      if (!data.success) {
        throw new Error(data.message || 'Failed to save circuit');
      }
      console.log('Circuit saved successfully!');
      dispatch({
        type: SAVE_CIRCUIT_CHALLENGE,
        success: true
      });
    })
    .catch(error => {
      console.error('Error in save circuit flow:', error);
      dispatch({
        type: SAVE_CIRCUIT_CHALLENGE,
        success: false,
        error: error.message
      });
    });
  };
};

export function canvasMouseEnter() {
  return function(dispatch, getState) {
    const { mode, views } = getState();

    if (mode.type === MODES.add && R.isEmpty(views)) {
      dispatch({
        type: SHOW_ADD_TOASTER
      });
    }
  };
}

export function canvasMouseLeave() {
  return {
    type: HIDE_ADD_TOASTER
  };
}

export function canvasMouseDown(coords) {
  return function(dispatch, getState) {
    const { mode } = getState();

    switch (mode.type) {
    case MODES.add:
      dispatch({
        type: CHANGE_MODE,
        name: MODES.adding,
        meta: mode.meta
      });
      dispatch({
        type: ADDING_START,
        typeID: mode.meta.typeID,
        id: uuid.v4(),
        coords
      });
      break;

    case MODES.selectOrMove:
      dispatch({
        type: CHANGE_MODE,
        name: MODES.selectOrMoveMouseDown
      });
      break;
    }
  };
}

export function canvasMouseMove(coords) {
  return function(dispatch, getState) {
    dispatch({
      type: MOUSE_MOVED,
      coords
    });

    const {
      mode,
      views,
      addingComponent,
      movingComponent
    } = getState();

    const hoveredComponent = R.find(c => c.hovered, R.values(views));

    switch (mode.type) {
    case MODES.adding:
      dispatch({
        type: ADDING_MOVED,
        coords,
        addingComponent
      });
      break;

    case MODES.selectOrMoveMouseDown:
      if (hoveredComponent) {
        dispatch({
          type: CHANGE_MODE,
          name: MODES.moving
        });
        dispatch({
          type: MOVING_START,
          mouseVector: Vector.fromObject(coords),
          component: hoveredComponent
        });
      }
      break;

    case MODES.moving:
      dispatch({
        type: MOVING_MOVED,
        mouseVector: Vector.fromObject(coords),
        hoveredComponent,
        movingComponent
      });
      break;
    }
  };
}

export function canvasMouseUp(coords) {
  return function(dispatch, getState) {
    const {
      mode,
      views
    } = getState();
    switch (mode.type) {
    case MODES.adding:
      dispatch({
        type: CHANGE_MODE,
        name: MODES.add,
        meta: mode.meta
      });
      dispatch({
        type: ADDING_FINISH,
        coords
      });
      dispatch({
        type: HIDE_ADD_TOASTER
      });
      break;

    case MODES.selectOrMoveMouseDown:
      dispatch({
        type: CHANGE_MODE,
        name: MODES.selectOrMove
      });
      dispatch({
        type: SELECT_HOVERED_COMPONENT,
        coords,
        views
      });
      break;

    case MODES.moving:
      dispatch({
        type: CHANGE_MODE,
        name: MODES.selectOrMove
      });
      dispatch({
        type: MOVING_FINISH,
        mouseVector: Vector.fromObject(coords)
      });
      break;
    }
  };
}

export const LOOP_BEGIN = 'LOOP_BEGIN';
export function loopBegin() {
  return function(dispatch, getState) {
    const { views, mousePos, mode } = getState();
    if (mode.type === MODES.selectOrMove) { // only hover highlight in move mode
      dispatch({
        type: SET_HOVERED_COMPONENT,
        views,
        mousePos,
        mode
      });
    }
    dispatch({
      type: LOOP_BEGIN,
      views,
      mode
    });
  };
}

export const LOOP_UPDATE = 'LOOP_UPDATE';
export function loopUpdate(delta) {
  return {
    type: LOOP_UPDATE,
    delta
  };
}

export const KEY_PRESS = 'KEY_PRESS';
export function keyPress(key) {
  return function(dispatch) {
    if (key.toLowerCase() === 'c') {
      dispatch(toggleCompetitionMode());
    }
    return {
      type: KEY_PRESS,
      key
    };
  };
}

export const CHANGE_MODE_BY_ID = 'CHANGE_MODE_BY_ID';
export function selectMode(buttonID) {
  return function(dispatch) {
    dispatch({
      type: CHANGE_MODE_BY_ID,
      meta: {
        id: buttonID
      }
    });
  };
}

export const DELETE_COMPONENT = 'DELETE_COMPONENT';
export function deleteComponent(id) {
  return function(dispatch, getState) {
    const { selected, views } = getState();
    const component = views[id];
    dispatch({
      type: UNSELECT_COMPONENT,
      id,
      selected
    });
    dispatch({
      type: DELETE_COMPONENT,
      id,
      component: {
        id,
        typeID: component.typeID
      }
    });
  };
}

export const EDIT_COMPONENT = 'EDIT_COMPONENT';
export const CHANGE_COMPONENT_FREQ = 'CHANGE_COMPONENT_FREQ';
export function editComponent(id, editable, value) {
  return function(dispatch, getState) {
    if (editable === 'frequency') { // special casing this for now - hopefully there's a better way
      const {circuit: {simTime}} = getState();
      dispatch({
        type: CHANGE_COMPONENT_FREQ,
        id,
        simTime
      });
    }
    dispatch({
      type: EDIT_COMPONENT,
      id,
      editable,
      value
    });
  };
}

export const CHANGE_CURRENT_SPEED = 'CHANGE_CURRENT_SPEED';
export function changeCurrentSpeed(speed) {
  return {
    type: CHANGE_CURRENT_SPEED,
    speed
  };
}

export const UPDATE_CURRENT_OFFSETS = 'UPDATE_CURRENT_OFFSETS';
export function updateCurrentOffsets(delta) {
  return function(dispatch, getState) {
    const { currentSpeed, circuit } = getState();
    dispatch({
      type: UPDATE_CURRENT_OFFSETS,
      delta,
      currentSpeed,
      componentStates: circuit.components
    });
  };
}

export const RATIONALISE_CURRENT_OFFSETS = 'RATIONALISE_CURRENT_OFFSETS';
export function rationaliseCurrentOffsets() {
  return function(dispatch, getState) {
    const { circuit } = getState();
    dispatch({
      type: RATIONALISE_CURRENT_OFFSETS,
      componentStates: circuit.components
    });
  };
}

export const LOAD_CIRCUIT = 'LOAD_CIRCUIT';
export function loadCircuit(circuitId, offset = { x: 0, y: 0 }) {
  return function(dispatch) {
    console.log('Loading circuit with ID:', circuitId);
    
    fetch(`http://localhost:3001/load-circuit/${circuitId}`)
      .then(response => response.json())
      .then(data => {
        if (!data.success) {
          console.error('Failed to load circuit:', data.message);
          return;
        }

        const { circuit } = data;
        console.log('Circuit loaded:', circuit);

        // Validate views data
        if (!circuit.views || typeof circuit.views !== 'object') {
          throw new Error('Invalid views data in loaded circuit');
        }

        // Process and validate each view
        const views = Object.entries(circuit.views).reduce((acc, [id, view]) => {
          if (!view.typeID) {
            console.error(`View ${id} missing typeID, skipping`);
            return acc;
          }

          // Validate component type exists
          const ComponentType = Components[view.typeID];
          if (!ComponentType) {
            console.error(`Invalid component type: ${view.typeID}, skipping`);
            return acc;
          }

          // Convert dragPoints back to Vector objects and apply offset
          const dragPoints = (view.dragPoints || []).map(point => {
            const offsetPoint = {
              x: point.x + offset.x,
              y: point.y + offset.y
            };
            return point instanceof Vector ? Vector.fromObject(offsetPoint) : Vector.fromObject(offsetPoint);
          });

          // Generate a new unique ID for each component
          const newId = uuid.v4();

          // Initialize current paths based on component type
          const numPaths = ComponentType.numOfCurrentPaths || 1;

          // Calculate connector positions with offset
          const tConnectors = ComponentType.transform.getTransformedConnectors(dragPoints);
          const connectors = ComponentType.transform.getConnectors(dragPoints);

          acc[newId] = {
            ...view,
            id: newId,
            typeID: view.typeID,
            dragPoints,
            connectors,
            tConnectors,
            currentOffsets: view.currentOffsets || R.repeat(0, numPaths),
            extraOffsets: view.extraOffsets || R.repeat(0, numPaths),
            props: view.props || {}
          };
          return acc;
        }, {});

        // Load text annotations if they exist
        if (circuit.textAnnotations && window.circuitDiagram && window.circuitDiagram.state && window.circuitDiagram.state.annotationManager) {
          // Apply offset to annotation positions
          const offsetAnnotations = circuit.textAnnotations.map(annotation => ({
            ...annotation,
            position: {
              x: annotation.position.x + offset.x,
              y: annotation.position.y + offset.y
            }
          }));
          window.circuitDiagram.state.annotationManager.loadAnnotations(offsetAnnotations);
        }

        dispatch({
          type: LOAD_CIRCUIT,
          circuit: {
            views,
            circuit: circuit.circuit
          },
          shouldMerge: true
        });
        
        dispatch(loopBegin());
        dispatch(loopUpdate(TIMESTEP));
      })
      .catch(error => {
        console.error('Error loading circuit:', error);
      });
  };
}

export const SAVE_AS_PDF = 'SAVE_AS_PDF';
export function saveAsPDF() {
  return function(dispatch, getState) {
    // Function to load jsPDF script
    const loadJSPDF = () => {
      return new Promise((resolve, reject) => {
        if (window.jspdf) {
          resolve(window.jspdf);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => resolve(window.jspdf);
        script.onerror = () => reject(new Error('Failed to load jsPDF'));
        document.head.appendChild(script);
      });
    };

    // Load jsPDF and then generate PDF
    loadJSPDF()
      .then(() => {
        const state = getState();
        
        // Create a temporary canvas for PDF rendering
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        const sidebarWidth = 240;
        const width = window.innerWidth - sidebarWidth;
        const height = window.innerHeight;
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        // Set PDF page size to match canvas size
        const pdf = new window.jspdf.jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [width, height]
        });
        
        // Add circuit model title and simulation parameters
        pdf.setFontSize(32);
        pdf.text('Circuit Model', 25, 45);
        pdf.setFontSize(16);
        pdf.text('Simulation Parameters', 25, 72);
        pdf.setFontSize(12);

        let yPos = 88;
        const params = {
          'Timestep': `${state.circuit.timestep} seconds`,
          'Simulation Time per Second': `${state.circuit.simTimePerSec} seconds`,
          'Number of Nodes': state.circuit.circuitGraph.numOfNodes,
          'Number of Voltage Sources': state.circuit.circuitGraph.numOfVSources
        };

        Object.entries(params).forEach(([key, value]) => {
          pdf.text(`${key}: ${value}`, 25, yPos);
          yPos += 15;
        });
        
        // Create a mock store object with getState
        const mockStore = {
          getState: () => state
        };
        
        // Create render function using the same logic as the main app
        const render = createRender(mockStore, ctx, {
          COLORS: {
            base: '#000000',
            highlight: '#000000',
            theme: '#000000'
          }
        });
        
        // Render the circuit
        render();

        // Convert model to png image then add to PDF
        const imgData = tempCanvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        
        // Add a new page for circuit information
        pdf.addPage('letter', 'portrait');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Add component information
        pdf.setFontSize(16);
        pdf.text('Circuit Components', 20, 20);
        pdf.setFontSize(12);

        yPos = 35;
        Object.entries(state.views).forEach(([id, component]) => {
          // Check if we need a new page 
          if (yPos > pdfHeight - 60) { 
            pdf.addPage('letter', 'portrait');
            yPos = 20;
          }

          // Component type and ID
          pdf.setFontSize(12);
          pdf.text(`${component.typeID} (${id})`, 20, yPos);
          
          // Component values
          pdf.setFontSize(10);
          if (component.editables) {
            Object.entries(component.editables).forEach(([key, value]) => {
              // Check if we need a new page
              if (yPos > pdfHeight - 60) {
                pdf.addPage('letter', 'portrait');
                yPos = 20;
              }
              yPos += 12;
              pdf.text(`${key}: ${value.value}`, 30, yPos);
            });
          }
          
          // Component connections
          if (component.connectors) {
            // Check if we need a new page
            if (yPos > pdfHeight - 60) {
              pdf.addPage('letter', 'portrait');
              yPos = 20;
            }
            yPos += 12;  // Increased from 10 to 12 for more line spacing
            pdf.text('Connections:', 30, yPos);
            component.connectors.forEach((connector, index) => {
              // Check if we need a new page
              if (yPos > pdfHeight - 60) {
                pdf.addPage('letter', 'portrait');
                yPos = 20;
              }
              yPos += 12;
              pdf.text(`Pin ${index + 1}: (${connector.x}, ${connector.y})`, 40, yPos);
            });
          }
          
          yPos += 20;
        });

        // Add a new page with circuit data for loading
        pdf.addPage('letter', 'portrait');
        pdf.setFontSize(16);
        pdf.text('Circuit Data (for loading)', 20, 20);
        
        // Convert circuit data to base64
        const circuitData = JSON.stringify({
          views: state.views,
          circuit: state.circuit,
          theme: state.theme
        });
        const base64Data = btoa(circuitData);
        
        // Set font size for base64 data first
        pdf.setFontSize(2);
        
        // Split base64 string into chunks that fit the page width
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        const charsPerLine = Math.floor(maxWidth / (pdf.getFontSize() * 0.6)); // Approximate chars per line
        const chunks = [];
        
        for (let i = 0; i < base64Data.length; i += charsPerLine) {
          chunks.push(base64Data.slice(i, i + charsPerLine));
        }
        
        // Add each chunk on a new line
        let base64YPos = 35;
        chunks.forEach(chunk => {
          // Check if we need a new page
          if (base64YPos > pdf.internal.pageSize.getHeight() - 20) {
            pdf.addPage('letter', 'portrait');
            base64YPos = 20;
          }
          pdf.text(chunk, margin, base64YPos);
          base64YPos += 2; // Line height
        });
        
        // Save the PDF
        pdf.save('circuit.pdf');
        console.log('Circuit saved as PDF successfully!');
        
        return {
          type: SAVE_AS_PDF
        };
      })
      .catch(error => {
        console.error('Error generating PDF:', error);
        return {
          type: SAVE_AS_PDF,
          error: error.message
        };
      });
  };
}

export function loadFromPDF(file, offset = { x: 0, y: 0 }) {
  return function(dispatch) {
    console.log('Starting PDF load process...');

    const reader = new FileReader();
    reader.onload = function() {
      console.log('File read successfully');
      const text = this.result;

      console.log('Text:', text);

      try {
        // Find the Circuit Data section
        const startMarker = 'for loading';
        const endMarker = 'endstream';
        
        const startIndex = text.indexOf(startMarker);
        if (startIndex === -1) {
          throw new Error('No circuit data section found in PDF');
        }

        const endIndex = text.indexOf(endMarker, startIndex);
        if (endIndex === -1) {
          throw new Error('No endstream marker found after circuit data');
        }

        // Extract the text between markers
        const circuitDataText = text.substring(startIndex + startMarker.length + 5, endIndex).trim();
        console.log('Extracted circuit data text:', circuitDataText);

        // Extract content within parentheses using regex
        const parenthesesContent = circuitDataText.match(/\((.*?)\)/g);
        
        if (!parenthesesContent) {
          throw new Error('No content found within parentheses');
        }

        // Remove the parentheses from each match
        const extractedStrings = parenthesesContent.map(str => 
          str.substring(1, str.length - 1)
        );

        // Combine all extracted strings into a single string
        const combinedString = extractedStrings.join('');

        // Convert base64 to JSON
        const jsonData = JSON.parse(atob(combinedString));
        console.log('JSON data:', jsonData);

        // Dispatch the load circuit action
        dispatch({
          type: LOAD_CIRCUIT,
          circuit: jsonData,
          shouldMerge: true,
          offset: offset
        });

        dispatch(loopBegin());
        dispatch(loopUpdate(TIMESTEP));

      } catch (error) {
        console.error('Error loading circuit from PDF:', error);
      }
    };

    reader.readAsText(file);
  };
}


export const PRINT_CIRCUIT = 'PRINT_CIRCUIT';
export function printCircuit() {
  return {
    type: PRINT_CIRCUIT
  };
}

export const toggleMultimeter = () => ({
  type: TOGGLE_MULTIMETER
});

export const updateProbePosition = (color, position) => ({
  type: UPDATE_PROBE_POSITION,
  payload: { color, position }
});

export const updateMultimeterMeasurement = (value, unit) => ({
  type: UPDATE_MULTIMETER_MEASUREMENT,
  payload: { value, unit }
});

export const changeMultimeterMode = (mode) => ({
  type: CHANGE_MULTIMETER_MODE,
  payload: { mode }
});

export const toggleCompetitionMode = () => {
  return function(dispatch) {
    // First toggle the competition mode
    dispatch({ type: TOGGLE_COMPETITION_MODE });
    
    // Load our specific circuit
    const circuitId = '67d97db0b4d93e32213429cf';
    dispatch(loadCircuit(circuitId));
    
    // Start simulation automatically in assessment mode
    setTimeout(() => {
      dispatch(startSimulation());
    }, 1000); // Wait 1 second for circuit to load
  };
};

export const submitAnswer = (answer) => {
  return function(dispatch, getState) {
    const state = getState();
    const circuitId = state.circuit.loadedCircuitId; // We'll need to track this

    if (!circuitId) {
      console.warn('No circuit loaded, cannot submit answer');
      return;
    }

    fetch('http://localhost:3001/submit-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        circuitId,
        submittedAnswer: answer
      })
    })
    .then(response => response.json())
    .then(data => {
      dispatch({
        type: SUBMIT_ANSWER,
        payload: {
          answer,
          isCorrect: data.isCorrect
        }
      });
    })
    .catch(error => {
      console.error('Error submitting answer:', error);
    });
  };
};

export const startSimulation = () => ({
  type: START_SIMULATION
});

export const stopSimulation = () => ({
  type: STOP_SIMULATION
});

export function copyComponents() {
  return function(dispatch, getState) {
    const { views } = getState();
    const selectedComponents = Object.values(views).filter(component => component.hovered);
    
    if (selectedComponents.length > 0) {
      // Store the components in the clipboard
      window.__CIRCUIT_CLIPBOARD__ = selectedComponents.map(component => ({
        ...component,
        id: undefined, // Clear ID so new ones will be generated on paste
        dragPoints: component.dragPoints.map(point => ({
          x: point.x,
          y: point.y
        }))
      }));
      
      console.log('Copied components to clipboard:', window.__CIRCUIT_CLIPBOARD__);
    }
    
    return {
      type: COPY_COMPONENTS,
      components: selectedComponents
    };
  };
}

export function pasteComponents() {
  return function(dispatch, getState) {
    const clipboard = window.__CIRCUIT_CLIPBOARD__;
    if (!clipboard || clipboard.length === 0) {
      return;
    }

    const { views } = getState();
    const offset = { x: GRID_SIZE * 2, y: GRID_SIZE * 2 }; // Offset pasted components

    const newComponents = clipboard.map(component => {
      const newId = uuid.v4();
      const newDragPoints = component.dragPoints.map(point => ({
        x: point.x + offset.x,
        y: point.y + offset.y
      }));

      const ComponentType = Components[component.typeID];
      const tConnectors = ComponentType.transform.getTransformedConnectors(newDragPoints);
      const connectors = ComponentType.transform.getConnectors(newDragPoints);

      return {
        ...component,
        id: newId,
        dragPoints: newDragPoints,
        tConnectors,
        connectors,
        hovered: false,
        dragPointIndex: undefined,
        connectorIndex: undefined
      };
    });

    return {
      type: PASTE_COMPONENTS,
      components: newComponents
    };
  };
}
