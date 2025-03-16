// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('besu_clique');

// Create a new document in the collection.
db.getCollection('network_data').insertOne({
  networkName: 'besu_clique',
  networkId: '9424247ec103'
});
