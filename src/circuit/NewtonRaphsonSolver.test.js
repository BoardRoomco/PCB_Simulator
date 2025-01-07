const { expect } = require('chai');
const { NewtonRaphsonSolver } = require('./NewtonRaphsonSolver');

describe('NewtonRaphsonSolver', () => {
  it('solves diode circuit', () => {
    const solver = new NewtonRaphsonSolver();
    
    // Test matrix for diode circuit with linear approximation
    // Using conductance G = 1/R where R = 1kΩ
    const G = 1e-3;  // Conductance in siemens
    
    // Create matrices for a simple voltage divider
    const A = [
      [G, -G, 0],
      [-G, 2*G, -G],
      [0, -G, G]
    ];
    
    // Input vector with 5V source
    const b = [
      [5*G],  // Current at node A (5V source)
      [0],    // No external current at node B
      [0]     // No external current at node C (ground)
    ];
    
    // Solve using our Newton-Raphson solver
    const result = solver.solve(A, b);
    
    // Log results for debugging
    console.log('Solution:', result);
    
    // The solution should give us reasonable voltages for a voltage divider
    expect(result[0][0]).to.be.closeTo(5, 0.1);    // VA should be close to 5V
    expect(result[1][0]).to.be.closeTo(2.5, 0.1);  // VB should be around 2.5V
    expect(result[2][0]).to.be.closeTo(0, 0.1);    // VC should be close to 0V
  });
}); 