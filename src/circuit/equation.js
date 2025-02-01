const { Arrays: Matrixy } = require('matrixy');
const assert = require('assert');
const { FsolveSolver } = require('./FsolveSolver');

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

const solver = new FsolveSolver(1e-6, 100);
const solve = equation => solver.solve(equation);

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
