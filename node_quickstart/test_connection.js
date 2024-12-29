const { MongoClient } = require("mongodb");

async function testConnection() {
    const uri = "mongodb+srv://testnain:cat@boardroom.fmha7.mongodb.net/?retryWrites=true&w=majority&appName=BoardRoom";
    const client = new MongoClient(uri);
    
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('Using connection string:', uri);
        await client.connect();
        console.log('Successfully connected to MongoDB!');

        const database = client.db('pcb_challenges');
        console.log('Using database:', database.databaseName);
        
        const collection = database.collection('circuits');
        console.log('Using collection:', collection.collectionName);

        // List all databases
        const dbs = await client.db().admin().listDatabases();
        console.log('\nAvailable databases:');
        dbs.databases.forEach(db => console.log(' -', db.name));

        // Test write operation
        const testDoc = { 
            test: true, 
            timestamp: new Date(),
            message: "Test document - please verify this appears in your database"
        };
        const result = await collection.insertOne(testDoc);
        console.log('\nTest document inserted with ID:', result.insertedId);

        // Test read operation
        const savedDoc = await collection.findOne({ _id: result.insertedId });
        console.log('Retrieved test document:', savedDoc);

        // List all documents in collection
        const allDocs = await collection.find({}).toArray();
        console.log('\nAll documents in collection:');
        allDocs.forEach(doc => console.log(' -', doc._id));

        // Don't delete the test document so we can verify it in the database
        console.log('\nTest document left in database for verification');

    } catch (error) {
        console.error('Error during MongoDB test:', error);
    } finally {
        await client.close();
        console.log('Connection closed');
    }
}

testConnection().catch(console.error); 