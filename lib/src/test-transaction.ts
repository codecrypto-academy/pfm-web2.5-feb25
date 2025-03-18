import { BesuNetwork, deleteNetwork } from ".";
import * as fs from "fs";

// Delete the network if it exists
if (fs.existsSync("../test")){
    deleteNetwork("test", "../test");
}

// Create a new network
const network = new BesuNetwork("test", "172.16.0.0/24", 246800, "..", 1);

// The 30 second time delay is necessary to allow the network to start
setTimeout(() => {
    // Send a transaction from the initial validator to the bootnode
    // The validator key is read from the file system
    const key = fs.readFileSync("../test/initialValidator1/key", {encoding: "utf-8"});
    // Get the rpc node and bootnode
    const rpcNode = network.getNode("rpc-node");
    const bootNode = network.getNode("bootnode");

    // If both nodes are defined, send the transaction
    if (rpcNode && bootNode) {
        rpcNode.sendTransaction(`0x${key}`, `0x${bootNode.address}`, "1").then((result) => {;
            console.log("Reciever address: ", result.reciverAddress);
            console.log("💰 Reciever initial balance: ", result.balanceReciverBefore);
            console.log("💸 Reciever final balance: ", parseInt(result.balanceReciverAfter.toString())/ 10**18 );
            console.log("🧾 Transaction reciept: ",JSON.stringify(result.reciept, null, 4));
        });
    } else {
        console.error("One or both nodes are undefined");
    }
}, 30000);