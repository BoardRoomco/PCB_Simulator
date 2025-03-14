// node_quickstart/index.js
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(cors());  // Enable CORS for all routes
app.use(express.json());  // Parse JSON bodies

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

const uri = "mongodb+srv://testnain:cat@boardroom.fmha7.mongodb.net/?retryWrites=true&w=majority&appName=BoardRoom";
let client = null;

// Function to get MongoDB client
async function getClient() {
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
        console.log('Connected to MongoDB');
    }
    return client;
}

// Simple test endpoint
app.get('/', (req, res) => {
    console.log('Root endpoint hit');
    res.json({ message: 'Server is running!' });
});

// Save circuit endpoint
app.post('/save-circuit', async (req, res) => {
    console.log('=== Save Circuit Request Received ===');
    let currentClient = null;
    
    try {
        // Basic validation
        if (!req.body || !req.body.views || !req.body.circuit) {
            console.error('Missing required circuit data');
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required circuit data (views or circuit)' 
            });
        }

        // Connect to MongoDB
        currentClient = await getClient();
        const database = currentClient.db('pcb_challenges');
        const circuits = database.collection('circuits');

        // Add timestamp and answers array to track submissions
        const circuitData = {
            ...req.body,
            createdAt: new Date(),
            answers: [], // Array to store submitted answers
            correctAnswer: req.body.correctAnswer // Store the correct answer
        };

        // Save exactly as received - this maintains the exact structure needed for re-rendering
        const result = await circuits.insertOne(circuitData);
        console.log('Circuit saved to MongoDB with ID:', result.insertedId);

        // Verify the save
        const savedCircuit = await circuits.findOne({ _id: result.insertedId });
        if (!savedCircuit) {
            throw new Error('Failed to verify circuit save');
        }

        res.json({ 
            success: true, 
            message: 'Circuit saved to database!',
            circuitId: result.insertedId
        });
    } catch (error) {
        console.error('Error saving circuit:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Get circuit endpoint
app.get('/load-circuit/:id', async (req, res) => {
    console.log('=== Load Circuit Request Received ===');
    let currentClient = null;
    
    try {
        const circuitId = req.params.id;
        console.log('Loading circuit with ID:', circuitId);

        // Connect to MongoDB
        currentClient = await getClient();
        const database = currentClient.db('pcb_challenges');
        const circuits = database.collection('circuits');

        // Find the circuit by ID
        const circuit = await circuits.findOne({ _id: new ObjectId(circuitId) });
        
        if (!circuit) {
            return res.status(404).json({
                success: false,
                message: 'Circuit not found'
            });
        }

        // Remove correctAnswer from the response to prevent cheating
        const { correctAnswer, ...circuitWithoutAnswer } = circuit;

        res.json({
            success: true,
            circuit: circuitWithoutAnswer
        });
    } catch (error) {
        console.error('Error loading circuit:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Submit answer endpoint
app.post('/submit-answer', async (req, res) => {
    console.log('=== Submit Answer Request Received ===');
    let currentClient = null;
    
    try {
        const { circuitId, submittedAnswer } = req.body;
        
        if (!circuitId || submittedAnswer === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required data (circuitId or answer)'
            });
        }

        // Connect to MongoDB
        currentClient = await getClient();
        const database = currentClient.db('pcb_challenges');
        const circuits = database.collection('circuits');

        // Find the circuit
        const circuit = await circuits.findOne({ _id: new ObjectId(circuitId) });
        
        if (!circuit) {
            return res.status(404).json({
                success: false,
                message: 'Circuit not found'
            });
        }

        // Compare answer (case-insensitive)
        const isCorrect = submittedAnswer.toString().toLowerCase() === 
                         circuit.correctAnswer.toString().toLowerCase();

        // Store the submission
        await circuits.updateOne(
            { _id: new ObjectId(circuitId) },
            { 
                $push: { 
                    answers: {
                        answer: submittedAnswer,
                        isCorrect,
                        submittedAt: new Date()
                    }
                }
            }
        );

        res.json({
            success: true,
            isCorrect,
            message: isCorrect ? 'Correct answer!' : 'Incorrect answer, try again.'
        });
    } catch (error) {
        console.error('Error submitting answer:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Set active assessment endpoint
app.post('/set-active-assessment', async (req, res) => {
    console.log('=== Set Active Assessment Request Received ===');
    let currentClient = null;
    
    try {
        const { circuitId } = req.body;
        
        if (!circuitId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required data (circuitId)'
            });
        }

        // Connect to MongoDB
        currentClient = await getClient();
        const database = currentClient.db('pcb_challenges');
        const assessments = database.collection('assessments');
        const circuits = database.collection('circuits');

        // Verify the circuit exists
        const circuit = await circuits.findOne({ _id: new ObjectId(circuitId) });
        if (!circuit) {
            return res.status(404).json({
                success: false,
                message: 'Circuit not found'
            });
        }

        // Deactivate any currently active assessment
        await assessments.updateMany(
            { isActive: true },
            { $set: { isActive: false } }
        );

        // Create new active assessment
        const result = await assessments.insertOne({
            circuitId: new ObjectId(circuitId),
            isActive: true,
            activatedAt: new Date()
        });

        res.json({
            success: true,
            message: 'Assessment activated successfully',
            assessmentId: result.insertedId
        });
    } catch (error) {
        console.error('Error setting active assessment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get active assessment endpoint
app.get('/get-active-assessment', async (req, res) => {
    console.log('=== Get Active Assessment Request Received ===');
    let currentClient = null;
    
    try {
        // Connect to MongoDB
        currentClient = await getClient();
        const database = currentClient.db('pcb_challenges');
        const assessments = database.collection('assessments');

        // Find the active assessment
        const activeAssessment = await assessments.findOne({ isActive: true });
        
        if (!activeAssessment) {
            return res.status(404).json({
                success: false,
                message: 'No active assessment found'
            });
        }

        res.json({
            success: true,
            circuitId: activeAssessment.circuitId,
            activatedAt: activeAssessment.activatedAt
        });
    } catch (error) {
        console.error('Error getting active assessment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
    console.log('===========================================');
    console.log(`Server running on port ${PORT}`);
    console.log('Test the server by visiting:');
    console.log(`http://localhost:${PORT}/`);
    console.log('===========================================');
});

