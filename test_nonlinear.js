const assert = require('assert');
const { solveNonlinear, NonlinearComponent } = require('./src/circuit/NonlinearSolver');
const { createBlankEquation } = require('./src/circuit/equation');
const { Arrays: Matrixy } = require('matrixy');

// Simple test component with known non-linear behavior: i = v^2
class TestNonlinearComponent extends NonlinearComponent {
    constructor(nodeA, nodeB) {
        super();
        this.nodeA = nodeA;
        this.nodeB = nodeB;
    }

    getNonlinearContributions(solution) {
        const v = solution[this.nodeA] - solution[this.nodeB];
        const i = v * v;  // Non-linear current: i = v^2
        const dIdV = 2 * v;  // Derivative of current wrt voltage: di/dv = 2v

        // Create and fill Jacobian matrix
        const size = solution.length;
        const jacobian = Matrixy.createBlank(size);
        
        // Stamp the derivatives
        if (this.nodeA !== 0) {
            jacobian[this.nodeA - 1][this.nodeA - 1] += dIdV;
        }
        if (this.nodeB !== 0) {
            jacobian[this.nodeB - 1][this.nodeB - 1] += dIdV;
        }
        if (this.nodeA !== 0 && this.nodeB !== 0) {
            jacobian[this.nodeA - 1][this.nodeB - 1] -= dIdV;
            jacobian[this.nodeB - 1][this.nodeA - 1] -= dIdV;
        }

        // Create and fill residual vector
        const residual = new Array(size).fill(0);
        if (this.nodeA !== 0) {
            residual[this.nodeA - 1] = i;
        }
        if (this.nodeB !== 0) {
            residual[this.nodeB - 1] = -i;
        }

        return { jacobian, residual };
    }
}

// Create a simple circuit with:
// - Voltage source of 5V between nodes 0 (ground) and 1
// - Non-linear component (i = v^2) between nodes 1 and 2
// - 1 ohm resistor between node 2 and ground (node 0)

// Create equation with 2 nodes (plus ground) and 1 voltage source
const equation = createBlankEquation({ numOfNodes: 3, numOfVSources: 1 });

// Stamp voltage source (5V)
equation.nodalAdmittances[2][0] = 1;  // node 1
equation.nodalAdmittances[0][2] = 1;  // node 1
equation.inputs[2][0] = 5;  // 5V source

// Stamp 1 ohm resistor
equation.nodalAdmittances[1][1] = 1;  // 1/R = 1 for R = 1 ohm

// Create non-linear component
const nonlinearComponent = new TestNonlinearComponent(1, 2);

// Solve the system
console.log('Solving non-linear circuit...');
const solution = solveNonlinear(equation, [nonlinearComponent]);

// Check results
console.log('Solution:', solution);
assert(Math.abs(solution[0] - 5) < 0.0001, 'Node 1 should be at 5V');
assert(Math.abs(solution[1] - 2.236) < 0.001, 'Node 2 should be at ~2.236V');

console.log('All tests passed!'); 