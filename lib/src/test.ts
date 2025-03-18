import { BesuNetwork, deleteNetwork, transaction } from ".";
import * as fs from "fs";

deleteNetwork("test", "../test");

// Create a new network
const network = new BesuNetwork("test", "172.16.0.0/16", 246800, "..", 1);

setTimeout(() => {
    const key = fs.readFileSync("../test/initialSigner1/key", {encoding: "utf-8"});
    const rpcNode = network.getNode("rpc-node");
    const bootNode = network.getNode("bootnode");
    if (rpcNode && bootNode) {
        rpcNode.sendTransaction(`0x${key}`, `0x${bootNode.address}`, "1");
    } else {
        console.error("One or both nodes are undefined");
    }
}, 30000);