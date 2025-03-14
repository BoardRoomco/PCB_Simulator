import fetch from 'node-fetch';

const circuitId = '67d25fa0eee5fa125b081ad8';

async function setAssessmentCircuit() {
    try {
        const response = await fetch('http://localhost:3001/assessment-settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ circuitId })
        });
        
        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

setAssessmentCircuit(); 