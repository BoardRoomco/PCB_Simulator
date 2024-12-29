import requests
import json

def test_solver_api():
    url = 'http://localhost:5000/solve'
    
    # Test case: Simple voltage divider
    test_data = {
        'matrix_a': [
            ['1', '-0.5'],
            ['-0.5', '1']
        ],
        'matrix_b': [
            ['5'],
            ['0']
        ]
    }
    
    try:
        # First check if server is healthy
        health_response = requests.get('http://localhost:5000/health')
        print('Health check:', health_response.json())
        
        # Send solve request
        response = requests.post(url, json=test_data)
        result = response.json()
        
        print('\nTest Results:')
        print('Status Code:', response.status_code)
        print('Response:', json.dumps(result, indent=2))
        
        if response.status_code == 200 and result['result']:
            print('\nSuccess! Circuit solved.')
            print('Voltages:', result['result'])
            print('Message:', result['message'])
        else:
            print('\nError solving circuit')
            print('Error:', result.get('error'))
            print('Message:', result.get('message'))
            
    except requests.exceptions.ConnectionError:
        print('\nError: Could not connect to server. Make sure the Flask server is running.')
    except Exception as e:
        print('\nError:', str(e))

if __name__ == '__main__':
    test_solver_api() 