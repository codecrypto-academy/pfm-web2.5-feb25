const Web3 = require('web3').default;

async function main() {
  const args = process.argv.slice(2);
  const RPC_PORT = args[0];
  const PRIVATE_KEY = args[1];
  const RECIPIENT_ADDRESS = args[2];
  const web3 = new Web3(`http://localhost:${RPC_PORT}`);  // Besu RPC URL

  // Set up the account and private key
  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY).address;

  const tx = {
    from: account,
    to: RECIPIENT_ADDRESS,
    value: web3.utils.toWei('0.1', 'ether'), // Convert to Wei
    gas: 21000, // Standard gas limit for ETH transfer
    gasPrice: web3.utils.toWei('20', 'gwei'), // Gas price
    nonce: await web3.eth.getTransactionCount(account), // Nonce for the account
  };

  // Sign the transaction
  const signedTx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);

  // Raw signed transaction (you can send this using a method like curl or any other HTTP request)
  const rawTx = signedTx.rawTransaction;

  console.log('Signed Transaction:', rawTx);

  // Send the transaction via RPC
  const receipt = await web3.eth.sendSignedTransaction(rawTx);
  console.log("Transaction Hash:", receipt.transactionHash);
  console.log("Transaction Confirmed in Block:", receipt.blockNumber);
}

main().catch(console.error);
