const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://phil:WNhCmDPtbf7M6AlF@cluster0.u48pyr3.mongodb.net/kilo?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔄 Attempting to connect...');
    await client.connect();
    console.log('✅ Connected successfully to MongoDB!');
    
    // Test a simple operation
    await client.db("admin").command({ ping: 1 });
    console.log('✅ Ping successful!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.close();
    console.log('🔒 Connection closed');
  }
}

testConnection();
