from flask import Flask, request, jsonify
from flask_cors import CORS
from SciPy_method import newton_solver

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/solve', methods=['POST'])
def solve():
    try:
        data = request.get_json()
        size = data.get('size')
        matrix_a = data.get('matrix_a')
        matrix_b = data.get('matrix_b')

        if not all([size, matrix_a, matrix_b]):
            return jsonify({'error': 'Missing required parameters'}), 400

        result, message = newton_solver(size, matrix_a, matrix_b)
        
        if result is not None:
            return jsonify({'result': result.tolist(), 'message': message})
        else:
            return jsonify({'error': 'Failed to solve system', 'message': message}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 