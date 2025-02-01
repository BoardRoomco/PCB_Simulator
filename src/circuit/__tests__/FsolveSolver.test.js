const { FsolveSolver } = require('../FsolveSolver');
const { Arrays: Matrixy } = require('matrixy');

describe('FsolveSolver', () => {
  let solver;

  beforeEach(() => {
    solver = new FsolveSolver();
  });

  test('solves a simple voltage divider circuit', () => {
    // Create a simple voltage divider equation
    // Two 1kΩ resistors in series with 5V source
    const equation = {
      nodalAdmittances: [
        [0.002, -0.001],  // 1/R1 + 1/R2, -1/R2
        [-0.001, 0.001]   // -1/R2, 1/R2
      ],
      inputs: [
        [0.01],  // 5V * (1/R1)
        [0]
      ]
    };

    const solution = solver.solve(equation);
    
    // First node should be around 5V, second node around 2.5V
    expect(solution[0][0]).toBeCloseTo(5, 2);
    expect(solution[1][0]).toBeCloseTo(2.5, 2);
  });

  test('throws error for unsolvable circuit', () => {
    const equation = {
      nodalAdmittances: [
        [0, 0],
        [0, 0]
      ],
      inputs: [
        [1],
        [1]
      ]
    };

    expect(() => solver.solve(equation)).toThrow();
  });

  test('handles larger circuits', () => {
    // Create a 3-node circuit
    const equation = {
      nodalAdmittances: [
        [0.003, -0.001, -0.001],
        [-0.001, 0.002, -0.001],
        [-0.001, -0.001, 0.002]
      ],
      inputs: [
        [0.015],
        [0],
        [0]
      ]
    };

    const solution = solver.solve(equation);
    
    // Check that we get a solution with reasonable values
    expect(solution.length).toBe(3);
    expect(solution[0][0]).toBeGreaterThan(0);
    expect(solution[0][0]).toBeLessThan(10);
  });
}); 