import {Arrays as Matrixy} from 'matrixy';

// Interface for non-linear components
export class NonlinearComponent {
  // Evaluate the component's contribution to F(x)
  evaluate(x) {
    throw new Error('evaluate() must be implemented by subclass');
  }
  
  // Compute the component's contribution to the Jacobian
  jacobian(x) {
    throw new Error('jacobian() must be implemented by subclass');
  }
}

// Solve non-linear circuit equations using Newton-Raphson method
export function solveNonlinear(equation, options = {}) {
  const {
    maxIter = 1000,        // Increased max iterations
    tol = 1e-4,           // Relaxed tolerance
    minAlpha = 1e-6,      // Smaller minimum step size
    initialAlpha = 0.5,   // More conservative initial step
    alphaGrowth = 1.05,   // Slower step size growth
    alphaShrink = 0.7,    // Less aggressive step size reduction
    randomScale = 0.05,   // Smaller random perturbations
    stabilityEps = 1e-6,  // Increased minimum conductance
    maxRestarts = 20      // More restart attempts
  } = options;
  
  // Create F(x) function that combines linear and non-linear parts
  const F = x => {
    // Add larger conductance to ground for numerical stability
    const gmin = 1e-9;  // 1 nS conductance to ground
    const Ax = Matrixy.multiply(equation.nodalAdmittances, x);
    const b = equation.inputs.map(row => row[0]);
    
    // For voltage nodes, use KCL equations
    // For voltage sources, use voltage constraint equations
    const f = Ax.map((axi, i) => {
      if (i < equation.numOfNodes - 1) {
        // KCL equation for voltage nodes
        return axi - b[i] + gmin * x[i];
      } else {
        // Voltage source equation: v+ - v- = V
        return axi - b[i];  // Already stamped correctly in admittance matrix
      }
    });
    
    // Add non-linear contributions only to KCL equations
    for (const component of equation.nonlinearComponents) {
      const contribution = component.evaluate(x);
      console.log('Non-linear contribution:', contribution);
      for (let i = 0; i < equation.numOfNodes - 1; i++) {
        f[i] += contribution[i] || 0;
      }
    }
    
    console.log('F(x):', f);
    return f;
  };
  
  // Create J(x) function that combines linear and non-linear parts
  const J = x => {
    // Start with linear part (nodal admittance matrix)
    const J = Matrixy.copy(equation.nodalAdmittances);
    console.log('Linear admittance matrix:', J);
    
    // Add larger conductance to ground for numerical stability
    const gmin = 1e-9;  // 1 nS conductance to ground
    for (let i = 0; i < equation.numOfNodes - 1; i++) {
      J[i][i] += gmin;
    }
    
    // Add non-linear contributions only to KCL equations
    for (const component of equation.nonlinearComponents) {
      const nonlinearJ = component.jacobian(x);
      console.log('Non-linear Jacobian contribution:', nonlinearJ);
      for (let i = 0; i < equation.numOfNodes - 1; i++) {
        for (let j = 0; j < x.length; j++) {
          if (nonlinearJ[i] && nonlinearJ[i][j]) {
            J[i][j] += nonlinearJ[i][j];
          }
        }
      }
    }
    
    // Add small values to diagonal for stability if needed
    for (let i = 0; i < x.length; i++) {
      if (Math.abs(J[i][i]) < stabilityEps) {
        J[i][i] += stabilityEps;
      }
    }
    
    console.log('Full Jacobian:', J);
    return J;
  };

  // Initial guess: use voltage source values for voltage nodes,
  // and small values for currents and other nodes
  const x0 = equation.inputs.map((row, i) => {
    if (i < equation.numOfNodes - 1) {
      // For voltage nodes, use a fraction of the voltage source value
      return row[0] * 0.5;  // Start with half the voltage source value
    } else {
      // For currents, use small initial values
      return 0.0001;
    }
  });
  
  console.log('Initial guess x0:', x0);
  console.log('Number of nodes:', equation.numOfNodes);
  console.log('Number of voltage sources:', equation.numOfVSources);
  
  // Try different initial guesses if needed
  for (let restart = 0; restart < maxRestarts; restart++) {
    try {
      // On restart, perturb the initial guess
      let x = restart === 0 ? x0 : x0.map(xi => {
        const scale = Math.abs(xi || 0.1);  // Use existing value scale or 0.1V
        return xi + (Math.random() - 0.5) * scale * randomScale;
      });
      let alpha = initialAlpha;
      let bestError = Infinity;
      let bestX = x;
      
      console.log(`\nRestart ${restart}, initial x:`, x);
      
      for (let iter = 0; iter < maxIter; iter++) {
        console.log(`\nIteration ${iter}`);
        console.log('Current x:', x);
        
        // Evaluate F(x)
        const fx = F(x);
        
        // Check convergence
        const error = Math.sqrt(fx.reduce((sum, fi) => sum + fi * fi, 0));
        console.log('Error:', error);
        
        // Keep track of best solution
        if (error < bestError) {
          bestError = error;
          bestX = [...x];
        }
        
        if (error < tol) {
          console.log('Converged! Final x:', x);
          return x;
        }
        
        // Compute Jacobian and solve J(x)Δx = -F(x)
        const Jx = J(x);
        const negF = fx.map(f => [-f]); // Convert to column vector
        
        try {
          const dx = Matrixy.solve(Jx, negF).map(row => row[0]);
          console.log('Raw dx:', dx);
          
          // Limit the maximum voltage step to 0.5V and current step to 0.05A
          const limitedDx = dx.map((dxi, i) => {
            const isVoltageNode = i < equation.numOfNodes - 1;
            const maxStep = isVoltageNode ? 0.5 : 0.05;
            return Math.max(-maxStep, Math.min(maxStep, dxi));
          });
          console.log('Limited dx:', limitedDx);
          
          // Line search with backtracking
          let newX = x.map((xi, i) => xi + alpha * limitedDx[i]);
          let newError = Math.sqrt(F(newX).reduce((sum, fi) => sum + fi * fi, 0));
          console.log('Alpha:', alpha, 'New error:', newError);
          
          // If error increased, reduce step size
          while (newError > error && alpha > minAlpha) {
            alpha *= alphaShrink;
            newX = x.map((xi, i) => xi + alpha * limitedDx[i]);
            newError = Math.sqrt(F(newX).reduce((sum, fi) => sum + fi * fi, 0));
            console.log('Reduced alpha:', alpha, 'New error:', newError);
          }
          
          // If step size got too small, randomize the solution a bit
          if (alpha <= minAlpha) {
            x = x.map(xi => xi + (Math.random() - 0.5) * Math.abs(xi || 0.1) * randomScale);
            alpha = initialAlpha;
            console.log('Step too small, randomized x:', x);
          } else {
            x = newX;
            alpha = Math.min(initialAlpha, alpha * alphaGrowth);
            console.log('Updated x:', x, 'New alpha:', alpha);
          }
        } catch (e) {
          console.log('Matrix solve failed:', e);
          // If matrix solve fails, try a different initial guess
          break;
        }
      }
      
      // If we've exhausted iterations but have a decent solution, use it
      if (bestError < tol * 10) {
        console.log('Using best solution found:', bestX, 'with error:', bestError);
        return bestX;
      }
    } catch (e) {
      console.log('Restart failed:', e);
      if (restart === maxRestarts - 1) throw e;
      // Otherwise try again with a different initial guess
    }
  }
  
  throw new Error('Newton-Raphson failed to converge');
} 