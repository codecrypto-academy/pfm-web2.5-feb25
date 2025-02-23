import { ethers } from "ethers";

class BesuAdministration {
  private provider: ethers.JsonRpcProvider;

  constructor(private rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
  }

  // Add a peer node to the network
  async addPeer(enode: string): Promise<boolean> {
    try {
      return await this.provider.send("admin_addPeer", [enode]);
    } catch (error) {
      throw new Error("Error adding peer: " + error);
    }
  }

  // Remove a peer node from the network
  async removePeer(enode: string): Promise<boolean> {
    try {
      return await this.provider.send("admin_removePeer", [enode]);
    } catch (error) {
      throw new Error("Error removing peer: " + error);
    }
  }

  // Get the list of connected peers
  async listPeers(): Promise<any[]> {
    try {
      return await this.provider.send("admin_peers", []);
    } catch (error) {
      throw new Error("Error fetching peer list: " + error);
    }
  }

  // Create a new account
  async createAccount(password: string): Promise<string> {
    try {
      return await this.provider.send("personal_newAccount", [password]);
    } catch (error) {
      throw new Error("Error creating account: " + error);
    }
  }

  // Unlock an account for a specific duration (in seconds)
  async unlockAccount(address: string, password: string, duration: number): Promise<boolean> {
    try {
      return await this.provider.send("personal_unlockAccount", [address, password, duration]);
    } catch (error) {
      throw new Error("Error unlocking account: " + error);
    }
  }

  // Get the list of available accounts
  async listAccounts(): Promise<string[]> {
    try {
      return await this.provider.send("eth_accounts", []);
    } catch (error) {
      throw new Error("Error fetching accounts: " + error);
    }
  }
}

export default BesuAdministration;
