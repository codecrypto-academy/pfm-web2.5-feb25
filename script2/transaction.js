const { ethers } = require("ethers");

const args = process.argv.slice(2);

async function main() {
  const rpc_port = args[0];
  const senderPriv = args[1];
  const reciverAddress = args[2];
  const amount = args[3];
  const provider = new ethers.JsonRpcProvider(`http://localhost:${rpc_port}/`, {
    chainId: 246800,
    name: "private"
  });
  const signer = new ethers.Wallet(senderPriv);
  const signerConnected = signer.connect(provider);

  const balanceReciverBefore = await provider.getBalance(reciverAddress);

  const tx = await signerConnected.sendTransaction({
    to: reciverAddress,
    value: ethers.parseEther(amount), // 0.1 ETH
    gasLimit: 21000,
    gasPrice: (provider.getFeeData()).gasPrice
  });

  console.log(tx);
  const reciept = await tx.wait();

  const balanceReciverAfter = await provider.getBalance(reciverAddress);
  console.log({
    reciverAddress,
    balanceReciverBefore,
    balanceReciverAfter,
    amount,
    reciept,
  });
}

main();
