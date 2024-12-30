import numpy as np
from scipy.optimize import fsolve, root
from typing import Tuple, Optional, List
import math

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
    Solve a system of non-linear equations using scipy.optimize.fsolve.
    Enhanced version with better handling of nonlinear cases.
    
    Args:
        size: Size of the system (number of equations/unknowns)
        matrix_elements: Matrix A as list of lists of strings, each element can be an expression
        b_vector: Vector b as list of strings, each element can be an expression
    
    Returns:
        Tuple of (solution array, message string)
    """
    try:
        def system_equations(x: np.ndarray) -> np.ndarray:
            """Define the system of equations F(x) = 0"""
            F = np.zeros(size)
            
            for i in range(size):
                # Matrix A * x terms
                for j in range(size):
                    if i < len(matrix_elements) and j < len(matrix_elements[i]):
                        coeff = parse_expression(matrix_elements[i][j], x)
                        F[i] += coeff * x[j]
                
                # Subtract b vector terms
                if i < len(b_vector):
                    rhs_val = parse_expression(b_vector[i], x)
                    F[i] -= rhs_val
            
            return F

        # Enhanced initial guesses
        voltage_scale = max(abs(parse_expression(b, np.zeros(size))) for b in b_vector if b.replace('.', '').isdigit())
        voltage_scale = max(1.0, voltage_scale)  # Ensure non-zero scale

        initial_guesses = [
            np.zeros(size),  # Start at origin
            np.ones(size) * 0.1,  # Small positive values
            np.linspace(-1, 1, size),  # Linear spread
            np.ones(size) * voltage_scale * 0.5,  # Half of max voltage
            np.ones(size) * 0.7,  # Typical diode voltage
            np.random.uniform(-voltage_scale, voltage_scale, size),  # Random within voltage range
            np.array([0.7 if i % 2 == 0 else -0.7 for i in range(size)])  # Alternating diode drops
        ]

        best_solution = None
        best_residual = float('inf')
        success_message = "Failed to converge"

        # Try different solver methods
        methods = ['hybr', 'lm', 'broyden1']
        
        for x0 in initial_guesses:
            for method in methods:
                try:
                    # First try root with different methods
                    result = root(system_equations, x0, method=method, options={
                        'maxfev': 1000,  # Increase max function evaluations
                        'xtol': 1e-8,    # Tighter tolerance
                        'factor': 0.1     # Smaller initial step size
                    })
                    
                    if result.success:
                        residual = np.linalg.norm(system_equations(result.x))
                        if residual < best_residual:
                            best_residual = residual
                            best_solution = result.x
                            
                            if residual < 1e-6:
                                success_message = "Converged successfully"
                            else:
                                success_message = f"Partial convergence (residual: {residual:.2e})"
                            
                            if residual < 1e-6:
                                return best_solution, success_message
                    
                    # If root didn't converge well, try fsolve
                    solution, infodict, ier, mesg = fsolve(system_equations, x0, full_output=True, xtol=1e-8, maxfev=1000)
                    
                    if ier == 1:
                        residual = np.linalg.norm(system_equations(solution))
                        if residual < best_residual:
                            best_residual = residual
                            best_solution = solution
                            
                            if residual < 1e-6:
                                success_message = "Converged successfully"
                            else:
                                success_message = f"Partial convergence (residual: {residual:.2e})"
                            
                            if residual < 1e-6:
                                return best_solution, success_message

                except Exception:
                    continue

        if best_solution is not None:
            return best_solution, success_message
        else:
            return None, "Failed to find solution with any initial guess"

    except Exception as e:
        return None, f"Error: {str(e)}"
