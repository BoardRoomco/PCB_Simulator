const { Arrays: Matrixy } = require('matrixy');

class NewtonRaphsonSolver {
  constructor() {
    this.maxIterations = 100;
    this.tolerance = 1e-6;
  }

  solve(A, b) {
    // Initial guess - start with reasonable values
    let x = [
      [5],   // VA = 5V (voltage source)
      [0.7], // VB = 0.7V (typical diode drop)
      [0]    // VC = 0V (ground)
    ];
    
    // Keep original A and b for reference
    const originalA = A.map(row => [...row]);
    const originalB = b.map(row => [...row]);
    
    for (let iter = 0; iter < this.maxIterations; iter++) {
      // Solve Ax = b using Gaussian elimination
      const solution = this.gaussianElimination(originalA, originalB);
      
      // Check for convergence
      const error = this.calculateError(originalA, solution, originalB);
      console.log(`Iteration ${iter}:`, {x: solution.map(row => row[0]), error});
      
      if (error < this.tolerance) {
        return solution;
      }
      
      // Update solution for next iteration with damping
      const alpha = 0.5; // Damping factor
      x = x.map((xi, i) => [xi[0] + alpha * solution[i][0]]);
    }
    
    throw new Error('Failed to converge');
  }
  
  gaussianElimination(A, b) {
    const n = A.length;
    const augmentedMatrix = A.map((row, i) => [...row, b[i][0]]);
    
    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxEl = Math.abs(augmentedMatrix[i][i]);
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmentedMatrix[k][i]) > maxEl) {
          maxEl = Math.abs(augmentedMatrix[k][i]);
          maxRow = k;
        }
      }
      
      // Swap maximum row with current row
      [augmentedMatrix[i], augmentedMatrix[maxRow]] = [augmentedMatrix[maxRow], augmentedMatrix[i]];
      
      // Make all rows below this one 0 in current column
      for (let k = i + 1; k < n; k++) {
        const c = -augmentedMatrix[k][i] / augmentedMatrix[i][i];
        for (let j = i; j <= n; j++) {
          if (i === j) {
            augmentedMatrix[k][j] = 0;
          } else {
            augmentedMatrix[k][j] += c * augmentedMatrix[i][j];
          }
        }
      }
    }
    
    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = augmentedMatrix[i][n] / augmentedMatrix[i][i];
      for (let k = i - 1; k >= 0; k--) {
        augmentedMatrix[k][n] -= augmentedMatrix[k][i] * x[i];
      }
    }
    
    return x.map(val => [val]);
  }
  
  calculateError(A, x, b) {
    // Calculate Ax
    const Ax = A.map(row => [
      row.reduce((sum, aij, j) => sum + aij * x[j][0], 0)
    ]);
    
    // Calculate ||Ax - b||
    return Math.sqrt(
      Ax.reduce((sum, row, i) => 
        sum + Math.pow(row[0] - b[i][0], 2), 0)
    );
  }
}

// Create a singleton instance
const solver = new NewtonRaphsonSolver();

function solveEquation(equation) {
  try {
    // Extract A and b matrices from equation
    const A = equation.nodalAdmittances;
    const b = equation.inputs;

    // Solve using Newton-Raphson
    return solver.solve(A, b);
  } catch (e) {
    console.error('Solver error:', e);
    throw e;
  }
}

module.exports = {
  NewtonRaphsonSolver,
  solveEquation
}; 