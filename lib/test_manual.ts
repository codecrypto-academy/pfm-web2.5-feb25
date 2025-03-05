import { BesuNetwork } from 'lib/index';

const besu = new BesuNetwork({ rpcUrl: 'http://localhost:9999' });

async function main() {

    const ini = await besu.reset("besu-testnet")

    //const creatNet = await besu.createNetwork("besu-testnet", "172.20.0.0/16");

    //const deleteNet = await besu.deleteNetwork("besu-testnet");

    //const createNodekeys = besu.generateBootnodeKeys("networks/besu-testnet/bootnode2"); IMPLEMENTADO EN addBootnode

    //const addBoot = besu.addBootnode("bootnode3","besu-testnet","9991", "networks/besu-testnet")

    //const createGenfile = besu.createGenesisFile("networks/besu-testnet", 180295, "0xb78c1ef156cc5ee5dcc04aa8fadf730e3095d217"); IMPLEMENTADO EN addBootnode

    //const createConfig = besu.createConfigFile("networks/besu-testnet","172.20.0.2","af82d5541b13686898e4685dcf7a9f002ae723f10a677a2a32cc0ca4a9180b23f65ffe7fe1f5a90ffc32c0745d02881d540b829ba3f62f939e0e2d09ae9d333a"); IMPLEMENTADO EN addBootnode

    //const newNode = await besu.addNode("nodeTesting1", "besu-testnet", "9994", "networks/besu-testnet");

    //const deleteNode = await besu.removeNode("nodeTesting3");

    /*const balance = await besu.getBalance("0x2b79d0a1ebf74d6bbb981210e93d8d5c93f89cf7");
    console.log("Balance:", balance, "ETH");*/
}

main().catch(console.error);
