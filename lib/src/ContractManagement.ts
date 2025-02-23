import { ethers } from "ethers";

class BesuContractManagement {
  private provider: ethers.JsonRpcProvider;

  constructor(private rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
  }

  // Deploy a smart contract
  async deployContract(privateKey: string, bytecode: string, abi: any[], args: any[]): Promise<string> {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const factory = new ethers.ContractFactory(abi, bytecode, wallet);
      const contract = await factory.deploy(...args);
      await contract.waitForDeployment();
      return contract.target.toString();
    } catch (error) {
      throw new Error("Error deploying contract: " + error);
    }
  }

  // Call a contract method (read-only)
  async callContractMethod(contractAddress: string, abi: any[], method: string, args: any[], from?: string): Promise<any> {
    try {
      const contract = new ethers.Contract(contractAddress, abi, this.provider);
      return await contract[method](...args, { from });
    } catch (error) {
      throw new Error("Error calling contract method: " + error);
    }
  }
}

export default BesuContractManagement;
