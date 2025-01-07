import * as math from 'mathjs';

class MatrixSolver {
  constructor(maxIterations = 100, tolerance = 1e-6) {
    this.maxIterations = maxIterations;
    this.tolerance = tolerance;
    this.AMatrix = [['0', '0'], ['0', '0']];
    this.BMatrix = [['0'], ['0']];
  }

  inputJacobian(value, pos1, pos2) {
    if (pos1 < 0 || pos1 > 1 || pos2 < 0 || pos2 > 1) {
      throw new Error("Position indices must be 0 or 1");
    }
    this.AMatrix[pos1][pos2] = value;
    this.AMatrix[pos2][pos1] = `-(${value})`;
  }

  inputAnswer(value, row) {
    if (row < 0 || row > 1) {
      throw new Error("Row index must be 0 or 1");
    }
    this.BMatrix[row][0] = value;
  }

  createSymbolicMatrix(matrixStr, varsList) {
    return matrixStr.map(row => 
      row.map(elem => math.parse(elem))
    );
  }

  evaluateMatrix(symbolicMatrix, xValues, varsList) {
    const scope = {};
    varsList.forEach((variable, index) => {
      scope[variable.toString()] = xValues[index];
    });
    
    return symbolicMatrix.map(row =>
      row.map(expr => math.evaluate(expr.toString(), scope))
    );
  }

  computeJacobian(A, B, varsList) {
    const equation = math.subtract(
      math.multiply(A, varsList.map(v => math.parse(v.toString()))),
      B
    );
    
    return varsList.map(variable => 
      equation.map(expr => math.derivative(expr, variable))
    );
  }

  solveMatrix() {
    const x0 = [1.0, 1.0]; // Initial guess
    const varsList = ['Va', 'Vb'].map(v => math.parse(v));

    try {
      const A = this.createSymbolicMatrix(this.AMatrix, varsList);
      const B = this.createSymbolicMatrix(this.BMatrix, varsList);
      const J = this.computeJacobian(A, B, varsList);

      let x = [...x0];

      for (let iteration = 0; iteration < this.maxIterations; iteration++) {
        const AEval = this.evaluateMatrix(A, x, varsList);
        const BEval = this.evaluateMatrix(B, x, varsList);
        const JEval = this.evaluateMatrix(J, x, varsList);

        const F = math.subtract(
          math.multiply(AEval, x),
          math.flatten(BEval)
        );

        if (Math.abs(math.det(JEval)) < 1e-10) {
          return [null, "Singular Jacobian encountered"];
        }

        const dx = math.multiply(
          math.inv(JEval),
          math.multiply(-1, F)
        );
        
        x = math.add(x, dx);

        if (math.norm(dx) < this.tolerance) {
          return [x, "Converged successfully"];
        }
      }

      return [x, "Maximum iterations reached"];

    } catch (error) {
      return [null, `Error: ${error.message}`];
    }
  }
}

// Test cases
describe('MatrixSolver', () => {
  let solver;

  beforeEach(() => {
    solver = new MatrixSolver();
  });

  test('should initialize with default values', () => {
    expect(solver.maxIterations).toBe(100);
    expect(solver.tolerance).toBe(1e-6);
    expect(solver.AMatrix).toEqual([['0', '0'], ['0', '0']]);
    expect(solver.BMatrix).toEqual([['0'], ['0']]);
  });

  test('should input Jacobian values correctly', () => {
    solver.inputJacobian('2*Va', 0, 1);
    expect(solver.AMatrix[0][1]).toBe('2*Va');
    expect(solver.AMatrix[1][0]).toBe('-(2*Va)');
  });

  test('should solve a simple circuit equation', () => {
    // Example: Simple voltage divider
    solver.inputJacobian('1', 0, 0);
    solver.inputJacobian('-0.5', 0, 1);
    solver.inputAnswer('5', 0);
    solver.inputAnswer('0', 1);

    const [result, message] = solver.solveMatrix();
    
    expect(message).toBe('Converged successfully');
    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    
    // Check if voltages are reasonable (within expected range)
    expect(result[0]).toBeGreaterThan(0);
    expect(result[0]).toBeLessThan(5);
    expect(result[1]).toBeGreaterThan(0);
    expect(result[1]).toBeLessThan(5);
  });

  test('should handle singular matrix', () => {
    solver.inputJacobian('0', 0, 0);
    solver.inputJacobian('0', 0, 1);
    solver.inputAnswer('1', 0);
    
    const [result, message] = solver.solveMatrix();
    expect(message).toBe('Singular Jacobian encountered');
    expect(result).toBeNull();
  });

  test('should handle invalid input positions', () => {
    expect(() => solver.inputJacobian('1', 2, 0)).toThrow();
    expect(() => solver.inputAnswer('1', 2)).toThrow();
  });
});

export { MatrixSolver }; 