import sympy as sp
import numpy as np
from typing import Tuple, Optional, List
import math
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import spsolve

def parse_expression(expr: str, x: np.ndarray) -> float:
    """Parse and evaluate mathematical expressions safely"""
    try:
        safe_dict = {
            'exp': math.exp, 'sin': math.sin, 'cos': math.cos,
            'tan': math.tan, 'log': math.log, 'abs': abs,
            'np': np, 'pi': math.pi, 'e': math.e,
            'pow': pow, 'sqrt': math.sqrt
        }

        modified_expr = expr
        for i in range(len(x)):
            modified_expr = modified_expr.replace(f'x{i}', str(x[i]))

        if '^' in modified_expr:
            modified_expr = modified_expr.replace('^', '**')

        result = eval(modified_expr, {"__builtins__": {}}, safe_dict)
        return float(np.clip(result, -1e308, 1e308))
    except Exception:
        return 0.0

def newton_solver(size: int, matrix_elements: List[List[str]], b_vector: List[str]) -> Tuple[Optional[np.ndarray], str]:
    """
    Solve a system of non-linear equations using an optimized numerical approach
    with fallback strategies for better convergence.
    """
    try:
        # For small systems (size <= 4), use symbolic approach
        if size <= 4:
            variables = [sp.Symbol(f'x{i}') for i in range(size)]
            equations = []

            for i in range(size):
                lhs = sum(sp.sympify(matrix_elements[i][j]) * variables[j]
                         for j in range(size)
                         if i < len(matrix_elements) and j < len(matrix_elements[i]))

                if i < len(b_vector):
                    rhs_expr = b_vector[i]
                    for j, var in enumerate(variables):
                        rhs_expr = rhs_expr.replace(f'x{j}', str(var))
                    rhs = sp.sympify(rhs_expr)
                    equations.append(sp.Eq(lhs, rhs))

            try:
                solution = sp.nsolve(equations, variables, [0.1] * size,
                                   verify=False, maxsteps=100)
                return np.array([float(x) for x in solution]), "Converged successfully"
            except:
                pass

        # For larger systems, use optimized numerical approach
        def evaluate_system(x: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
            F = np.zeros(size)
            J = lil_matrix((size, size))  # Use sparse matrix for Jacobian

            for i in range(size):
                # Evaluate matrix terms
                for j in range(size):
                    if i < len(matrix_elements) and j < len(matrix_elements[i]):
                        coeff = parse_expression(matrix_elements[i][j], x)
                        F[i] += coeff * x[j]
                        J[i,j] = coeff

                # Evaluate RHS
                if i < len(b_vector):
                    rhs_val = parse_expression(b_vector[i], x)
                    F[i] -= rhs_val

                    # Optimized Jacobian calculation
                    if 'x' in b_vector[i]:  # Only calculate if expression contains variables
                        h = max(1e-8, abs(x[i]) * 1e-8)  # Adaptive step size
                        for j in range(size):
                            if f'x{j}' in b_vector[i]:  # Only perturb if variable appears
                                x_plus_h = x.copy()
                                x_plus_h[j] += h
                                df = (parse_expression(b_vector[i], x_plus_h) - rhs_val) / h
                                if abs(df) > 1e-10:  # Only store significant elements
                                    J[i,j] -= df

            return F, J.tocsr()  # Convert to CSR format for efficient solving

        # Strategic initial guesses
        initial_guesses = [
            np.zeros(size),
            np.ones(size) * 0.1,
            np.linspace(-1, 1, size)
        ]

        best_residual = float('inf')
        best_solution = None
        max_iterations = min(50, size * 2)  # Adaptive iteration limit

        for x0 in initial_guesses:
            x = x0.copy()
            prev_residual = float('inf')
            stagnation_count = 0

            for iteration in range(max_iterations):
                F, J = evaluate_system(x)
                residual = np.linalg.norm(F)

                # Update best solution if improved
                if residual < best_residual:
                    best_residual = residual
                    best_solution = x.copy()

                # Check convergence
                if residual < 1e-6:
                    return x, "Converged successfully"

                # Check for stagnation
                if abs(residual - prev_residual) < 1e-10:
                    stagnation_count += 1
                    if stagnation_count > 3:
                        break
                else:
                    stagnation_count = 0

                try:
                    dx = spsolve(J, -F)  # Use sparse solver
                    if np.linalg.norm(dx) < 1e-10:
                        break

                    # Adaptive step size
                    alpha = 1.0
                    while alpha > 1e-4:
                        x_new = x + alpha * dx
                        new_residual = np.linalg.norm(evaluate_system(x_new)[0])
                        if new_residual < residual:
                            x = x_new
                            break
                        alpha *= 0.5

                    if alpha <= 1e-4:
                        break

                    prev_residual = residual
                except:
                    break

        if best_solution is not None:
            return best_solution, f"Partial convergence (residual: {best_residual:.2e})"

        return None, "Failed to converge"

    except Exception as e:
        return None, f"Error: {str(e)}"
