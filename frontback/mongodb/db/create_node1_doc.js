// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('besu_clique');

// Create a new document in the collection.
db.getCollection('nodes').insertOne({
    name: 'Node1',
    portJSON: 8545,
    portWS: 8546,
    portP2P: 30303,
    address: "",
    dockerId: "52fb0e7e65f42d575adc43a3c143ac54ac51b441d341e880f67c381e4861ddc0",
    dockerIP: "172.18.0.2",
    enode: "enode://f1b58523e94006e9c871d2bce8b4e0b89addc15d587f53e916aa65e73922500b96ccc352eb33d647fd4e5b8a4d113572978b8eda38fcddea541c25ce80f8d9ef@127.0.0.1:30303",
});
