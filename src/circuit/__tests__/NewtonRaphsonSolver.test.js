import { NewtonRaphsonSolver } from '../NewtonRaphsonSolver';

describe('NewtonRaphsonSolver', () => {
  test('solves simple diode circuit', () => {
    const solver = new NewtonRaphsonSolver();
    
    // Test matrix for diode circuit
    const A = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
    
    const b = [
      [5],  // Node A voltage (5V source)
      [0],  // Node B voltage
      [0]   // Node C voltage (ground)
    ];
    
    const result = solver.solve(A, b);
    
    // Log results for debugging
    console.log('Solution:', result);
    
    // Check that voltages are reasonable
    expect(result[0][0]).toBeCloseTo(5, 1);  // Node A should be close to 5V
    expect(result[1][0]).toBeCloseTo(0.7, 1); // Node B should be close to 0.7V (diode drop)
    expect(result[2][0]).toBeCloseTo(0, 1);   // Node C should be close to 0V (ground)
  });
}); 