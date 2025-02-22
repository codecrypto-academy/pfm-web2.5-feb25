import { ethers } from "ethers";

class BesuNetwork {
  private provider: ethers.JsonRpcProvider;

  // Constructor to initialize the provider with the given RPC URL
  constructor(private rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
  }

  // Method to get the network status (network ID and sync status)
  async getNetworkStatus(): Promise<any> {
    try {
      const networkId = (await this.provider.getNetwork()).chainId;
      const isSyncing = await this.provider.send("eth_syncing", []); // Custom RPC call for sync status
      return { networkId, isSyncing };
    } catch (error) {
      throw new Error("Error fetching network status: " + error);
    }
  }

  // Method to get the latest block number
  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      throw new Error("Error fetching block number: " + error);
    }
  }

  // Method to get the balance of an address in Ether
  async getBalance(address: string): Promise<string> {
    try {
      const balanceWei = await this.provider.getBalance(address);
      return ethers.formatEther(balanceWei); // Convert Wei to Ether
    } catch (error) {
      throw new Error("Error fetching balance: " + error);
    }
  }

  // Method to send a transaction from one address to another
  async sendTransaction(privateKey: string, to: string, amount: string): Promise<string> {
    try {
      // Create a wallet instance from the private key
      const wallet = new ethers.Wallet(privateKey, this.provider);

      // Get the current nonce for the sender's address
      const nonce = await this.provider.getTransactionCount(wallet.address, "pending");

      // Get the current gas price
      const gasPrice = await this.provider.getFeeData().then((data) => data.gasPrice);

      // Define the transaction object
      const tx = {
        to,
        value: ethers.parseEther(amount), // Convert Ether to Wei
        gasPrice: gasPrice!, // Use the fetched gas price
        gasLimit: 21000, // Standard gas limit for Ether transfers
        nonce, // Include the nonce to prevent replay attacks
      };

      // Sign and send the transaction
      const txResponse = await wallet.sendTransaction(tx);

      // Return the transaction hash
      return txResponse.hash;
    } catch (error) {
      throw new Error("Error sending transaction: " + error);
    }
  }
}

export default BesuNetwork;