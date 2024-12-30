// Test file to verify connection with Python solver API

async function testSolverConnection() {
    // Test case 1: Simple linear system
    const simpleTest = {
        size: 2,
        matrix_a: [
            ['1', '-0.5'],
            ['-0.5', '1']
        ],
        matrix_b: [
            '5',
            '0'
        ]
    };

    // Test case 2: Nonlinear diode system
    const nonlinearTest = {
        size: 3,
        matrix_a: [
            ['1', '0', '0'],
            ['0', '1e-3 + (1e-12/(0.026))*(exp((x1-x2)/0.026))', '-1e-12/(0.026)*(exp((x1-x2)/0.026))'],
            ['0', '-1e-12/(0.026)*(exp((x1-x2)/0.026))', '1e-3 + 1e-12/(0.026)*(exp((x1-x2)/0.026))']
        ],
        matrix_b: [
            '5',
            '1e-3*x1 - 1e-12*(exp((x1-x2)/0.026) - 1)',
            '1e-3*x2 + 1e-12*(exp((x1-x2)/0.026) - 1)'
        ]
    };

    async function runTest(testData, name) {
        console.log(`\nRunning ${name}...`);
        try {
            const response = await fetch('http://localhost:5000/solve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });

            const result = await response.json();
            console.log('Status:', response.status);
            console.log('Response:', result);

            if (response.status === 200 && result.result) {
                console.log('\nSuccess!');
                console.log('Solution vector:', result.result);
                console.log('Message:', result.message);
                
                console.log('\nNode Voltages:');
                result.result.forEach((v, i) => {
                    console.log(`Node ${i}: ${v.toFixed(3)}V`);
                });
            } else {
                console.log('\nError solving matrix');
                console.log('Error:', result.error);
                console.log('Message:', result.message);
            }
        } catch (error) {
            console.error('\nError:', error.message);
        }
    }

    try {
        // First check if server is healthy
        const healthResponse = await fetch('http://localhost:5000/health');
        console.log('Health check response:', await healthResponse.json());

        // Run test cases
        await runTest(simpleTest, "Simple Linear System");
        await runTest(nonlinearTest, "Nonlinear Diode System");

    } catch (error) {
        console.error('\nError:', error.message);
        if (error.message.includes('Failed to fetch')) {
            console.error('Make sure the Flask server is running on port 5000');
        }
    }
}

// Run the test
testSolverConnection(); 