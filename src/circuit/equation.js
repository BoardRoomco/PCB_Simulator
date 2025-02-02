const { Arrays: Matrixy } = require('matrixy');
const assert = require('assert');
const newtonRaphson = require('newton-raphson-method');

const MIN_NUM_OF_NODES = 2;

const createBlankEquation = ({numOfNodes, numOfVSources}) => {
  assert(numOfNodes >= MIN_NUM_OF_NODES, `Number of nodes must be >= ${MIN_NUM_OF_NODES}, was: ${numOfNodes}`);

  const size = numOfNodes + numOfVSources - 1;
  return {
    nodalAdmittances: Matrixy.createBlank(size),
    inputs: Matrixy.createBlank(size, 1),
    numOfVSourcesStamped: 0,
    numOfVSources,
    numOfNodes
  };
};

const clone = equation => {
  return {
    numOfVSourcesStamped: equation.numOfVSourcesStamped,
    numOfVSources: equation.numOfVSources,
    numOfNodes: equation.numOfNodes,
    nodalAdmittances: Matrixy.copy(equation.nodalAdmittances),
    inputs: Matrixy.copy(equation.inputs)
  };
};

// Create the system of equations function Ax - b
const createSystemFunction = (A, b) => {
  return (x) => {
    // Convert input to array if it's a single number
    const xArray = Array.isArray(x) ? x : [x];
    
    // Convert to column vector format and validate
    const xVector = xArray.map(val => [Number(val) || 0]); // Default to 0 if invalid
    
    // Manual matrix multiplication to avoid undefined issues
    const Ax = A.map(row => {
      const sum = row.reduce((acc, aij, j) => {
        return acc + (aij || 0) * (xVector[j] ? xVector[j][0] : 0);
      }, 0);
      return [sum];
    });
    
    // Manual matrix subtraction
    const residuals = Ax.map((row, i) => {
      return [row[0] - (b[i] ? b[i][0] : 0)];
    });
    
    // Return residuals in array format
    return residuals.map(row => row[0]);
  };
};

const solve = equation => {
  const { nodalAdmittances, inputs } = equation;
  
  // Validate matrices before proceeding
  if (!nodalAdmittances || !inputs) {
    console.error('Missing matrices:', { nodalAdmittances: !!nodalAdmittances, inputs: !!inputs });
    return Array(equation.numOfNodes + equation.numOfVSources - 1).fill([0]);
  }

  // Log matrix dimensions
  console.log('Matrix dimensions:', {
    admittance: nodalAdmittances.map(row => row.length),
    inputs: inputs.map(row => row.length),
    numNodes: equation.numOfNodes,
    numVSources: equation.numOfVSources
  });

  const size = nodalAdmittances.length;
  
  // Create system function
  const f = createSystemFunction(nodalAdmittances, inputs);
  
  // Initial guess
  const x0 = Array(size).fill(0.1);

  try {
    // Configure Newton-Raphson options
    const tolerance = 1e-6;
    const maxIterations = 100;
    
    // Custom Newton-Raphson implementation
    let x = x0;
    let iteration = 0;
    let error = Infinity;
    
    while (iteration < maxIterations && error > tolerance) {
      const fx = f(x);
      error = Math.sqrt(fx.reduce((sum, val) => sum + val * val, 0));
      
      if (error < tolerance) {
        break;
      }
      
      // Compute Jacobian numerically
      const h = 1e-7;
      const J = [];
      for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
          const xPlusH = [...x];
          xPlusH[j] += h;
          const fxPlusH = f(xPlusH);
          row.push((fxPlusH[i] - fx[i]) / h);
        }
        J.push(row);
      }
      
      // Solve J * dx = -f(x)
      const negF = fx.map(val => [-val]);
      const dx = Matrixy.solve(J, negF).map(row => row[0]);
      
      // Update x with damping
      const alpha = 0.5;
      x = x.map((val, i) => val + alpha * dx[i]);
      
      iteration++;
    }
    
    if (iteration === maxIterations) {
      console.warn('Newton-Raphson reached max iterations');
    }
    
    // Convert result to column vector format
    return x.map(val => [val]);
  } catch (error) {
    console.error('Solver error:', error);
    return Array(size).fill([0]);
  }
};

// NOTE: All functions below mutate the equation.

const 
stampNodalAdmittanceMatrix = equation => (row, col, x) => {
  if (row !== 0 && col !== 0) { // ignore ground node
    row--;
    col--;
    equation.nodalAdmittances[row][col] += x;
  }
};

const stampInputVector = equation => (row, x) => {
  if (row !== 0) {
    row--;
    equation.inputs[row][0] += x;
  }
};

const stampConductance = equation => (conductance, node1, node2) => {
  stampNodalAdmittanceMatrix(equation)(node1, node1, conductance);
  stampNodalAdmittanceMatrix(equation)(node2, node2, conductance);
  stampNodalAdmittanceMatrix(equation)(node1, node2, -conductance);
  stampNodalAdmittanceMatrix(equation)(node2, node1, -conductance);
};

const stampResistor = equation => (resistance, node1, node2) => {
  assert(resistance > 0, 'Resistance must be > 0, was: ' + resistance);

  const conductance = 1 / resistance;
  stampConductance(equation)(conductance, node1, node2);
};

const stampVoltageSource = equation => (voltage, fromNode, toNode, vNum) => {
  const {numOfVSources, numOfVSourcesStamped} = equation;
  assert(numOfVSourcesStamped < numOfVSources, `Already stamped declared number of voltage sources (${numOfVSources})`);

  const vIndex = equation.numOfNodes + vNum;
  equation.numOfVSourcesStamped++;
  stampNodalAdmittanceMatrix(equation)(vIndex, fromNode, -1);
  stampNodalAdmittanceMatrix(equation)(vIndex, toNode, 1);
  stampNodalAdmittanceMatrix(equation)(fromNode, vIndex, 1);
  stampNodalAdmittanceMatrix(equation)(toNode, vIndex, -1);
  stampInputVector(equation)(vIndex, voltage);
  return vIndex;
};

const stampCurrentSource = equation => (current, fromNode, toNode) => {
  stampInputVector(equation)(fromNode, -current);
  stampInputVector(equation)(toNode, current);
};

const stampVCVS = equation => (gain, outNode1, outNode2, inNode1, inNode2, vNum) => {
  const {numOfVSources, numOfVSourcesStamped} = equation;
  assert(numOfVSourcesStamped < numOfVSources, `Already stamped declared number of voltage sources (${numOfVSources})`);

  const vIndex = equation.numOfNodes + vNum;
  equation.numOfVSourcesStamped++;

  // Stamp the output voltage source
  stampNodalAdmittanceMatrix(equation)(vIndex, outNode1, 1);
  stampNodalAdmittanceMatrix(equation)(vIndex, outNode2, -1);
  stampNodalAdmittanceMatrix(equation)(outNode1, vIndex, 1);
  stampNodalAdmittanceMatrix(equation)(outNode2, vIndex, -1);

  // Stamp the controlling voltage
  stampNodalAdmittanceMatrix(equation)(vIndex, inNode1, -gain);
  stampNodalAdmittanceMatrix(equation)(vIndex, inNode2, gain);
};

module.exports = {
  createBlankEquation,
  clone,
  solve,
  stampConductance,
  stampResistor,
  stampVoltageSource,
  stampCurrentSource,
  stampVCVS
};
