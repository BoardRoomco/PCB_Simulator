// node_quickstart/index.js
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://testnain:cat@boardroom.fmha7.mongodb.net/?retryWrites=true&w=majority&appName=BoardRoom";

const client = new MongoClient(uri);

async function saveCircuitChallenge(circuitState) {
  try {
    const database = client.db('pcb_challenges');
    const challenges = database.collection('challenges');

    const challenge = {
      name: "Circuit Debug Challenge",
      description: "Find the issues in this circuit",
      difficulty: "Medium",
      circuitState: {
        circuitGraph: circuitState.circuitGraph,
        components: circuitState.components,
        timestep: circuitState.timestep,
        simTimePerSec: circuitState.simTimePerSec
      },
      createdAt: new Date()
    };

    const result = await challenges.insertOne(challenge);
    console.log(`Saved challenge with id: ${result.insertedId}`);
    
    // Verify the saved data
    const savedChallenge = await challenges.findOne({ _id: result.insertedId });
    console.log('Saved circuit data:', JSON.stringify(savedChallenge, null, 2));
    
    return result.insertedId;
  } catch (error) {
    console.error('Error saving circuit:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Test function with sample circuit data
async function testSaveCircuit() {
  const testCircuit = {
    circuitGraph: {
      models: {
        "test-component-1": {
          type: "resistor",
          value: 100,
          position: { x: 100, y: 100 }
        }
      },
      nodes: [],
      numOfNodes: 1,
      numOfVSources: 0
    },
    components: {
      "test-component-1": {
        voltages: [0],
        currents: [0]
      }
    },
    timestep: 5e-6,
    simTimePerSec: 1/1000
  };

  try {
    console.log('Starting test save...');
    const id = await saveCircuitChallenge(testCircuit);
    console.log('Test save completed with ID:', id);
  } catch (error) {
    console.error('Test save failed:', error);
  }
}

// Export functions
module.exports = {
  saveCircuitChallenge,
  testSaveCircuit
};

// Run test if this file is run directly
if (require.main === module) {
  testSaveCircuit();
}