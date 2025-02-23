import { ethers } from "ethers";

class BesuNetworkInfo {
  private provider: ethers.JsonRpcProvider;

  constructor(private rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
  }

  // Get node information
  async getNodeInfo(): Promise<any> {
    try {
      return await this.provider.send("admin_nodeInfo", []);
    } catch (error) {
      throw new Error("Error fetching node info: " + error);
    }
  }

  // Get Ethereum protocol version
  async getProtocolVersion(): Promise<string> {
    try {
      return await this.provider.send("eth_protocolVersion", []);
    } catch (error) {
      throw new Error("Error fetching protocol version: " + error);
    }
  }

  // Get current gas price in wei
  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.provider.send("eth_gasPrice", []);
      return gasPrice.toString();
    } catch (error) {
      throw new Error("Error fetching gas price: " + error);
    }
  }
}

export default BesuNetworkInfo;
