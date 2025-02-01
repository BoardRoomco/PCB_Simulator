const { Arrays: Matrixy } = require('matrixy');

class FsolveSolver {
  solve(equation) {
    const { nodalAdmittances, inputs } = equation;
    return Matrixy.solve(nodalAdmittances, inputs);
  }
}

module.exports = { FsolveSolver }; 