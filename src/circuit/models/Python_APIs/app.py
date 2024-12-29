from flask import Flask, request, jsonify
from flask_cors import CORS
from NR_method import MatrixSolver
import numpy as np
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB setup
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['circuit_simulator']
circuits_collection = db['circuits']

@app.route('/solve', methods=['POST'])
def solve_circuit():
    try:
        data = request.get_json()
        matrix_a = data.get('matrix_a')
        matrix_b = data.get('matrix_b')

        if not matrix_a or not matrix_b:
            return jsonify({
                'error': 'Missing matrix data',
                'result': None,
                'message': 'Invalid input'
            }), 400

        solver = MatrixSolver()
        
        # Set up matrices from request
        for i in range(2):
            for j in range(2):
                if matrix_a[i][j] != '0':
                    solver.inputJacobian(matrix_a[i][j], i, j)
        
        for i in range(2):
            if matrix_b[i][0] != '0':
                solver.inputAnswer(matrix_b[i][0], i)
        
        result, message = solver.solvematrix()
        
        # Convert numpy array to list if result exists
        result_list = result.tolist() if isinstance(result, np.ndarray) else None
        
        return jsonify({
            'result': result_list,
            'message': message
        })

    except Exception as e:
        return jsonify({
            'error': str(e),
            'result': None,
            'message': 'Server error'
        }), 500

@app.route('/save-circuit', methods=['POST'])
def save_circuit():
    try:
        circuit_data = request.get_json()
        
        # Insert the circuit into MongoDB
        result = circuits_collection.insert_one(circuit_data)
        
        return jsonify({
            'success': True,
            'message': 'Circuit saved successfully',
            'circuit_id': str(result.inserted_id)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to save circuit'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 