import { BesuNetwork, deleteNetwork, transaction } from ".";
import * as fs from "fs";

deleteNetwork("test", "../test");

// Create a new network
const network = new BesuNetwork("test", "172.16.0.0/16", 246800, "..", 1);

setTimeout(() => {
    const key = fs.readFileSync("../test/initialSigner1/key", {encoding: "utf-8"});
    network.getNode("rpc-node").sendTransaction(`0x${key}`, `0x${network.getNode("bootnode").address}`, "1");
}, 30000);