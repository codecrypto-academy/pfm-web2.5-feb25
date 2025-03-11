const { ethers } = require("ethers");

const args = process.argv.slice(2);

async function main() {
  const rpc_port = 1002;
  const senderPriv = "0xadf216fecdb47469aa68f43dfa0d2c25509c79c5f5111f02f273c961f706d77c";
  const reciverAddress = "0x1e591cdbcd78d967282f77175d0333858a9f5e69";
  const amount = "5";
  const provider = new ethers.JsonRpcProvider(`http://localhost:${rpc_port}/`, {
    chainId: 2467,
    name: "private"
  });
  const signer = new ethers.Wallet(senderPriv);
  const signerConnected = signer.connect(provider);

  const balanceReciverBefore = await provider.getBalance(reciverAddress);

  const tx = await signerConnected.sendTransaction({
    to: reciverAddress,
    value: ethers.parseEther("10"), // 0.1 ETH
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
  return "hello";
}

main();
