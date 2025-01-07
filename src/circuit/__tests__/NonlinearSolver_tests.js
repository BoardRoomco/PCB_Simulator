const chai = require('chai');
const expect = chai.expect;

// Simple non-linear solver using Newton-Raphson method
function solveNonlinear(F, J, x0, options = {}) {
  const {
    maxIter = 100,
    tol = 1e-6,
    minAlpha = 1e-6,
    initialAlpha = 1.0,
    alphaGrowth = 1.1,
    alphaShrink = 0.5,
    randomScale = 0.1,
    stabilityEps = 1e-6,
    maxRestarts = 5
  } = options;
  
  // Try different initial guesses if needed
  for (let restart = 0; restart < maxRestarts; restart++) {
    try {
      let x = restart === 0 ? x0 : x0.map(xi => (Math.random() - 0.5) * 4); // Random values between -2 and 2
      let alpha = initialAlpha;
      
      for (let iter = 0; iter < maxIter; iter++) {
        // Evaluate F(x)
        const fx = F(x);
        
        // Check convergence
        const error = Math.sqrt(fx.reduce((sum, fi) => sum + fi * fi, 0));
        if (error < tol) {
          return x;
        }
        
        // Compute Jacobian and solve J(x)Δx = -F(x)
        const Jx = J(x);
        const dx = solveLinear(Jx, fx.map(f => -f), stabilityEps);
        
        // Line search with backtracking
        let newX = x.map((xi, i) => xi + alpha * dx[i]);
        let newError = Math.sqrt(F(newX).reduce((sum, fi) => sum + fi * fi, 0));
        
        // If error increased, reduce step size
        while (newError > error && alpha > minAlpha) {
          alpha *= alphaShrink;
          newX = x.map((xi, i) => xi + alpha * dx[i]);
          newError = Math.sqrt(F(newX).reduce((sum, fi) => sum + fi * fi, 0));
        }
        
        // If step size got too small, randomize the solution a bit
        if (alpha <= minAlpha) {
          x = x.map(xi => xi + (Math.random() - 0.5) * Math.abs(xi || 1) * randomScale);
          alpha = initialAlpha;
        } else {
          x = newX;
          alpha = Math.min(initialAlpha, alpha * alphaGrowth);
        }
      }
    } catch (e) {
      if (restart === maxRestarts - 1) throw e;
      // Otherwise try again with a different initial guess
    }
  }
  
  throw new Error('Newton-Raphson failed to converge');
}

// Simple linear solver for 2x2 systems
function solveLinear(A, b, eps) {
  // Add small values to diagonal for stability
  const A1 = [
    [A[0][0] + eps, A[0][1]],
    [A[1][0], A[1][1] + eps]
  ];
  
  const det = A1[0][0] * A1[1][1] - A1[0][1] * A1[1][0];
  return [
    (A1[1][1] * b[0] - A1[0][1] * b[1]) / det,
    (-A1[1][0] * b[0] + A1[0][0] * b[1]) / det
  ];
}

describe('NonlinearSolver', () => {
  it('should solve a simple non-linear system from different starting points', () => {
    // Test system:
    // Original equations:
    // f1(x,y) = x^2 + y - 2 = 0
    // f2(x,y) = x + y - 2 = 0
    //
    // Reformulated as:
    // f1(x,y) = x^2 - y = 0     (like v^2 - i = 0)
    // f2(x,y) = x + y - 2 = 0   (like voltage constraint)
    //
    // This system has two solutions:
    // 1) x = 1, y = 1
    // 2) x = -2, y = 4
    
    const F = ([x, y]) => [
      x*x - y,    // Non-linear equation
      x + y - 2   // Linear constraint
    ];
    
    const J = ([x, y]) => [
      [2*x, -1],  // Like the circuit Jacobian
      [1, 1]
    ];
    
    // Test different initial guesses
    const startingPoints = [
      [1, 1],    // Close to first solution
      [0, 0],    // Origin
      [10, 10],  // Far from solutions
      [-5, -5],  // Negative values
      [0.1, 0.1] // Small values
    ];
    
    // Use same parameters as circuit system
    const options = {
      maxIter: 100,
      tol: 1e-6,
      minAlpha: 1e-4,
      initialAlpha: 1.0,
      alphaGrowth: 1.2,
      alphaShrink: 0.5,
      randomScale: 0.2,
      stabilityEps: 1e-6,
      maxRestarts: 5
    };
    
    for (const x0 of startingPoints) {
      const solution = solveNonlinear(F, J, x0, options);
      
      // Check if solution matches either (1,1) or (-2,4)
      const isFirstSolution = 
        Math.abs(solution[0] - 1) < 1e-6 && 
        Math.abs(solution[1] - 1) < 1e-6;
      
      const isSecondSolution = 
        Math.abs(solution[0] - (-2)) < 1e-6 && 
        Math.abs(solution[1] - 4) < 1e-6;
      
      expect(isFirstSolution || isSecondSolution).to.be.true;
      
      // Verify that it's actually a solution
      const fx = F(solution);
      expect(Math.abs(fx[0])).to.be.below(1e-6);
      expect(Math.abs(fx[1])).to.be.below(1e-6);
    }
  });

  it('should solve a circuit with a non-linear resistor from different starting points', () => {
    // Circuit equations for:
    // - 5V voltage source between nodes 0 and 1
    // - Non-linear resistor (I = V^2) between nodes 1 and 0
    //
    // Variables: x = [v1, i]
    // where v1 is node 1 voltage, i is voltage source current
    //
    // Equations:
    // f1(v1,i) = v1^2 - i = 0  (KCL at node 1)
    // f2(v1,i) = v1 - 5 = 0    (voltage source)
    
    const F = ([v1, i]) => [
      v1*v1 - i,  // KCL at node 1: i_nonlinear = i
      v1 - 5      // Voltage source equation
    ];
    
    const J = ([v1, i]) => [
      [2*v1, -1], // d/dv1 = 2v1, d/di = -1
      [1, 0]      // d/dv1 = 1, d/di = 0
    ];
    
    // Test different initial guesses
    const startingPoints = [
      [5, 25],     // Perfect guess
      [0, 0],      // All zero
      [1, 1],      // Small values
      [10, 100],   // Too large
      [-5, -25]    // Negative values
    ];
    
    // Use more aggressive parameters for this problem
    const options = {
      maxIter: 100,
      tol: 1e-6,
      minAlpha: 1e-4,
      initialAlpha: 1.0,
      alphaGrowth: 1.2,
      alphaShrink: 0.5,
      randomScale: 0.2,
      stabilityEps: 1e-6,
      maxRestarts: 5
    };
    
    for (const x0 of startingPoints) {
      const solution = solveNonlinear(F, J, x0, options);
      expect(solution[0]).to.be.closeTo(5, 1e-6);  // v1 = 5V
      expect(solution[1]).to.be.closeTo(25, 1e-6); // i = 25A
    }
  });
}); 