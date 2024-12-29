import numpy as np
import sympy as sp
from typing import List, Tuple, Optional

class MatrixSolver:
    def __init__(self, max_iterations: int = 100, tolerance: float = 1e-6):
        self.max_iterations = max_iterations
        self.tolerance = tolerance
        self.A_matrix = [['0', '0'], ['0', '0']]
        self.B_matrix = [['0'], ['0']]

    def inputJacobian(self, value: str, pos1: int, pos2: int) -> None:
        """Input value into the Jacobian matrix at specified positions"""
        if not (0 <= pos1 <= 1 and 0 <= pos2 <= 1):
            raise ValueError("Position indices must be 0 or 1")
        self.A_matrix[pos1][pos2] = value
        self.A_matrix[pos2][pos1] = f"-({value})"

    def inputanswer(self, value: str, row: int) -> None:
        """Input value into the answer matrix at specified row"""
        if not (0 <= row <= 1):
            raise ValueError("Row index must be 0 or 1")
        self.B_matrix[row][0] = value

    def create_symbolic_matrix(self, matrix_str: List[List[str]], vars_list: List[sp.Symbol]) -> sp.Matrix:
        """Convert string matrix to symbolic matrix"""
        return sp.Matrix([[sp.sympify(elem) for elem in row] for row in matrix_str])

    def evaluate_matrix(self, symbolic_matrix: sp.Matrix, x_values: np.ndarray, vars_list: List[sp.Symbol]) -> np.ndarray:
        """Evaluate symbolic matrix with given x values"""
        subs_dict = {var: val for var, val in zip(vars_list, x_values)}
        return np.array(symbolic_matrix.subs(subs_dict)).astype(np.float64)

    def compute_jacobian(self, A: sp.Matrix, B: sp.Matrix, vars_list: List[sp.Symbol]) -> sp.Matrix:
        """Compute the Jacobian matrix"""
        equation = A * sp.Matrix(vars_list) - B
        return sp.Matrix([[equation[i].diff(var) for var in vars_list] for i in range(len(equation))])

    def solvematrix(self) -> Tuple[Optional[np.ndarray], str]:
        """Solve the matrix equation using Newton-Raphson method"""
        x0 = np.array([1.0, 1.0])  # Initial guess is always [1, 1]
        vars_list = [sp.Symbol('Va'), sp.Symbol('Vb')]

        try:
            A = self.create_symbolic_matrix(self.A_matrix, vars_list)
            B = self.create_symbolic_matrix(self.B_matrix, vars_list)
            J = self.compute_jacobian(A, B, vars_list)

            x = x0.copy()

            for iteration in range(self.max_iterations):
                A_eval = self.evaluate_matrix(A, x, vars_list)
                B_eval = self.evaluate_matrix(B, x, vars_list)
                J_eval = self.evaluate_matrix(J, x, vars_list)

                F = A_eval @ x - B_eval.flatten()

                if abs(np.linalg.det(J_eval)) < 1e-10:
                    return None, "Singular Jacobian encountered"

                dx = np.linalg.solve(J_eval, -F)
                x = x + dx

                if np.linalg.norm(dx) < self.tolerance:
                    return x, "Converged successfully"

            return x, "Maximum iterations reached"

        except Exception as e:
            return None, f"Error: {str(e)}"