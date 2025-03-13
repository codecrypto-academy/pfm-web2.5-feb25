export interface NetworkConfigInterface {
  // Node configuration
  nodes: {
    // Number of validator nodes
    validators: number;
    // Number of full nodes (non-validators)
    fullnodes: number;
  };

  // Network configuration
  network: {
    // Docker network name
    networkName: string;
    // Base port for HTTP API (will be incremented for each node)
    basePort: number;
  };

  // Technical specifications
  tech: {
    // Docker image to use
    dockerImage: string;
    // Wait time for validator startup (seconds)
    validatorStartupTime: number;
  };

  // Chain configuration (genesis)
  chain: {
    // Chain ID
    chainId: number;
    // Block at which London upgrade is activated
    londonBlock: number;
    // Gas limit
    gasLimit: string;
    // Initial difficulty
    difficulty: string;
    // Clique consensus algorithm configuration
    clique: {
      // Block time in seconds
      blockPeriodSeconds: number;
      // Epoch length
      epochLength: number;
      // Whether to create empty blocks
      createEmptyBlocks: boolean;
    };
  };

  // Test transaction configuration
  transaction: {
    // Destination address for test transaction
    to: string;
    // Amount of ETH to send
    amount: string;
    // Whether to perform a test transaction
    perform: boolean;
  };
}