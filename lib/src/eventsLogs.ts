import { ethers } from "ethers";

class BesuEventsLogs {
  private provider: ethers.JsonRpcProvider;

  constructor(private rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
  }

  // Get logs based on a filter
  async getLogs(filter: any): Promise<any[]> {
    try {
      return await this.provider.send("eth_getLogs", [filter]);
    } catch (error) {
      throw new Error("Error fetching logs: " + error);
    }
  }

  // Watch for events from a smart contract
  watchEvent(contractAddress: string, abi: any[], eventName: string, callback: (log: any) => void): void {
    const contract = new ethers.Contract(contractAddress, abi, this.provider);
    contract.on(eventName, (event) => {
      callback(event);
    });
  }
}

export default BesuEventsLogs;
