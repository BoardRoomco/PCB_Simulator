// node_quickstart/index.js
const express = require('express');
const cors = require('cors');
const { MongoClient } = require("mongodb");

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

        // Save exactly as received - this maintains the exact structure needed for re-rendering
        const result = await circuits.insertOne(req.body);
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

// Start server
const PORT = 3001;
app.listen(PORT, () => {
    console.log('===========================================');
    console.log(`Server running on port ${PORT}`);
    console.log('Test the server by visiting:');
    console.log(`http://localhost:${PORT}/`);
    console.log('===========================================');
});

