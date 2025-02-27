import { ethers } from 'ethers';

async function test() {
  console.log('Hello, ethers!');
  const provider = new ethers.JsonRpcProvider("http://localhost:9999");
  const blockNumber = await provider.getBlockNumber();
  console.log(`Latest block number: ${blockNumber}`);
}

test();
